import type { UserRole } from '@prisma/client';

/** JWT access-token payload. */
export interface JwtPayload {
  sub: string;
  role: UserRole;
}

/**
 * The authenticated principal attached to each request. Pre-resolves the
 * caller's tenant scope (owned businesses / agent identity) so guards and
 * services don't re-query on every request.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  agentId: string | null;
  businessIds: string[];
}
