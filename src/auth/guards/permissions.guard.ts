import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      ctx.getHandler(),
    );

    if (!requiredPermissions) return true;

    const req = ctx.switchToHttp().getRequest();
    const userId = req.user.userId;

    const permissions = await this.prisma.role_permissions.findMany({
      where: {
        roles: {
          user_roles: { some: { user_id: userId } },
        },
      },
      include: { permissions: true },
    });

    const userPermissionCodes = permissions.map((p) => p.permissions.code);

    return requiredPermissions.every((p) => userPermissionCodes.includes(p));
  }
}
