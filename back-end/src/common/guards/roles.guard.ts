import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const userRole = request.headers['role'];

    if (!userRole) {
      throw new ForbiddenException('Role header is missing');
    }

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(`Insufficient permissions. Required one of: ${requiredRoles.join(', ')}`);
    }

    // Embed role into request if needed down the line
    request.userRole = userRole;

    return true;
  }
}
