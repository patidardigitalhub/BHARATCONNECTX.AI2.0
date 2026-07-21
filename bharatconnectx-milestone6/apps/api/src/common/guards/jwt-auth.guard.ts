import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Lightweight JWT guard — reads `Authorization: Bearer <token>`, verifies
 * it, and attaches the decoded payload (userId, businessId, role) to
 * `request.user`. Every module-scoped controller (CRM, Booking,
 * Marketing) should apply this guard so requests are always scoped to
 * the caller's business_id — see section 10 of the spec (field-level
 * access control / multi-tenant isolation).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length);

    try {
      request.user = this.jwt.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
