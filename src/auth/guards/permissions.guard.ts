import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    if (!required) return true;

    const user = context.switchToHttp().getRequest().user;
    return required.every((p) => user.permissions.includes(p));
  }
}
