import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { LoggingInterceptor } from './common/logging.interceptor';
import type { Env } from './config/env';

async function bootstrap(): Promise<void> {
  // rawBody is required to verify Stripe webhook signatures.
  const app = await NestFactory.create(AppModule, {
    bufferLogs: false,
    rawBody: true,
  });
  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());

  const origins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  // Validation is handled per-route via zod pipes (see ZodValidationPipe).
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`ReferraIOS API listening on :${port}`, 'Bootstrap');
}

void bootstrap();
