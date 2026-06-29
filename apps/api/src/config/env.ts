import { z } from 'zod';

/**
 * Environment contract. Validated once at boot so the app fails fast on
 * misconfiguration rather than at first use of a missing secret.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  WEB_PUBLIC_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2_592_000),

  AI_PROVIDER: z.enum(['anthropic', 'gemini']).default('anthropic'),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL_SMART: z.string().default('claude-opus-4-8'),
  AI_MODEL_FAST: z.string().default('claude-sonnet-4-6'),
  GEMINI_API_KEY: z.string().optional(),

  PLATFORM_FEE_BPS: z.coerce.number().int().min(0).max(10_000).default(0),

  // Payment provider secrets are optional at boot (validated lazily by each
  // provider when first used) so local dev without them still starts.
  MPESA_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_B2C_INITIATOR: z.string().optional(),
  MPESA_B2C_SECURITY_CREDENTIAL: z.string().optional(),
  MPESA_CALLBACK_BASE_URL: z.string().optional(),

  FLW_PUBLIC_KEY: z.string().optional(),
  FLW_SECRET_KEY: z.string().optional(),
  FLW_WEBHOOK_HASH: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_GROWTH: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
