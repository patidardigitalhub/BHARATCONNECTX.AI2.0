import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  sub: string; // user id
  businessId: string;
  role: 'OWNER' | 'STAFF';
  phone: string;
}

/**
 * Every module-scoped controller reads businessId off this decorator
 * instead of trusting a query param or body field — this is the
 * multi-tenant isolation boundary (spec section 10: role-based
 * field-level access control). A request can never read or write
 * another business's data because businessId always comes from the
 * verified JWT, never from client input.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
