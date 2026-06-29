import { Module } from '@nestjs/common';
import { AnthropicProvider } from './anthropic.provider';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [AnthropicProvider, AiService],
  exports: [AiService],
})
export class AiModule {}
