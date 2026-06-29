import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type { Env } from '../config/env';

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  costCents: number;
}

type Effort = 'low' | 'medium' | 'high';

// USD per 1M tokens (input/output), used to estimate per-call cost.
const PRICES: Record<string, { in: number; out: number }> = {
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-sonnet-4-6': { in: 3, out: 15 },
};

/**
 * Thin wrapper over the official Anthropic SDK. Defaults to Claude:
 * `AI_MODEL_SMART` (claude-opus-4-8) for reasoning-heavy features and
 * `AI_MODEL_FAST` (claude-sonnet-4-6) for content. All calls are gated on
 * ANTHROPIC_API_KEY and report token usage + estimated cost for AiInteraction
 * logging.
 */
@Injectable()
export class AnthropicProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly client?: Anthropic;
  readonly smart: string;
  readonly fast: string;

  constructor(config: ConfigService<Env, true>) {
    const apiKey = config.get('ANTHROPIC_API_KEY', { infer: true });
    this.smart = config.get('AI_MODEL_SMART', { infer: true });
    this.fast = config.get('AI_MODEL_FAST', { infer: true });
    if (apiKey) this.client = new Anthropic({ apiKey });
  }

  get isConfigured(): boolean {
    return !!this.client;
  }

  private require(): Anthropic {
    if (!this.client) {
      throw new ServiceUnavailableException('AI not configured (ANTHROPIC_API_KEY)');
    }
    return this.client;
  }

  private cost(model: string, inTok: number, outTok: number): number {
    const p = PRICES[model] ?? PRICES['claude-sonnet-4-6']!;
    return Math.round(((inTok / 1e6) * p.in + (outTok / 1e6) * p.out) * 100);
  }

  /** Free-text completion (used for agent copilot / content). */
  async complete(params: {
    model: string;
    system: string;
    prompt: string;
    maxTokens?: number;
    effort?: Effort;
  }): Promise<{ text: string; usage: AiUsage }> {
    const client = this.require();
    const res = await client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 1024,
      system: params.system,
      messages: [{ role: 'user', content: params.prompt }],
      ...(params.model === this.smart
        ? { thinking: { type: 'adaptive' as const } }
        : {}),
      ...(params.effort ? { output_config: { effort: params.effort } } : {}),
    } as Anthropic.MessageCreateParamsNonStreaming);

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return { text, usage: this.usage(params.model, res.usage) };
  }

  /**
   * Schema-constrained completion (used for campaign optimization). The model is
   * constrained to `jsonSchema` via output_config.format; the returned text is
   * then validated by the caller's `parse` function (our zod v3 schema). We hand
   * the JSON schema in directly rather than using the SDK's zod helper, which
   * requires zod v4 while the monorepo standardizes on zod v3.
   */
  async completeJSON<T>(params: {
    model: string;
    system: string;
    prompt: string;
    jsonSchema: Record<string, unknown>;
    parse: (value: unknown) => T;
    maxTokens?: number;
    effort?: Effort;
  }): Promise<{ data: T; usage: AiUsage }> {
    const client = this.require();
    const res = await client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 1024,
      system: params.system,
      messages: [{ role: 'user', content: params.prompt }],
      ...(params.model === this.smart
        ? { thinking: { type: 'adaptive' as const } }
        : {}),
      output_config: {
        format: { type: 'json_schema', schema: params.jsonSchema },
        ...(params.effort ? { effort: params.effort } : {}),
      },
    } as Anthropic.MessageCreateParamsNonStreaming);

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return {
      data: params.parse(JSON.parse(text)),
      usage: this.usage(params.model, res.usage),
    };
  }

  private usage(model: string, u: Anthropic.Usage): AiUsage {
    const inputTokens = u.input_tokens ?? 0;
    const outputTokens = u.output_tokens ?? 0;
    return {
      inputTokens,
      outputTokens,
      costCents: this.cost(model, inputTokens, outputTokens),
    };
  }
}
