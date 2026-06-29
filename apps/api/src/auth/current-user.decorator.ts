import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from './auth.types';

/** Injects the authenticated principal: `@CurrentUser() user: AuthUser`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
