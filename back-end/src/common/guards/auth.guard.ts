import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SessionService } from '../../auth/session.service';
import { MockDataService } from '../../data/mock-data.service';

// Global guard (registered as APP_GUARD in AppModule). Every non-@Public() route needs
// an `Authorization: Bearer <token>` issued by POST /auth/login.
//
// The rest of the app reads the caller's identity from the `role`, `x-actor-id` and
// `x-actor-name` headers (RolesGuard, and @Headers(...) in most controllers). Those
// used to be whatever the client sent; this guard overwrites them with the values from
// the session's own employee record, so every existing check now runs on a
// server-verified identity and a client can no longer claim another role or user.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    private readonly dataStore: MockDataService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();

    // Strip any client-supplied identity up front, so a public route can never be fed
    // a spoofed actor either.
    delete request.headers['role'];
    delete request.headers['x-actor-id'];
    delete request.headers['x-actor-name'];

    const header = request.headers['authorization'];
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException('Authentication required.');
    }

    const empId = this.sessions.resolve(token);
    const employee = empId ? this.dataStore.getEmployees().find((e) => e.emp_id === empId) : null;
    if (!employee || (employee.status && employee.status !== 'ACTIVE')) {
      this.sessions.revoke(token);
      if (isPublic) return true;
      throw new UnauthorizedException('Your session has expired. Please log in again.');
    }

    request.headers['role'] = employee.role;
    request.headers['x-actor-id'] = employee.emp_id;
    request.headers['x-actor-name'] = employee.emp_name;
    request.sessionToken = token;
    return true;
  }
}
