import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUID } from '../common/utils/uuid.util';
import { CreateRoleRequestDto } from './dto/request/create-role-request.dto';
import { UpdateRoleRequestDto } from './dto/request/update-role-request.dto';
import { CreateRoleResponseDto } from './dto/response/create-role-response.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<CreateRoleResponseDto[]> {
    const roles = await this.prisma.roles.findMany({
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions: role.role_permissions.map((rp) => ({
        id: rp.permissions.id,
        code: rp.permissions.code,
        description: rp.permissions.description || '',
      })),
    }));
  }

  async findById(id: string): Promise<CreateRoleResponseDto> {
    const role = await this.prisma.roles.findUnique({
      where: { id },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions: role.role_permissions.map((rp) => ({
        id: rp.permissions.id,
        code: rp.permissions.code,
        description: rp.permissions.description || '',
      })),
    };
  }

  async create(dto: CreateRoleRequestDto): Promise<CreateRoleResponseDto> {
    // Check if role name already exists
    const existingRole = await this.prisma.roles.findUnique({
      where: { name: dto.name },
    });

    if (existingRole) {
      throw new BadRequestException('Role with this name already exists');
    }

    const role = await this.prisma.roles.create({
      data: {
        id: generateUUID(),
        name: dto.name,
        description: dto.description,
      },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description || '',
    };
  }

  async update(
    id: string,
    dto: UpdateRoleRequestDto,
  ): Promise<CreateRoleResponseDto> {
    const role = await this.prisma.roles.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if new name conflicts with existing role
    if (dto.name && dto.name !== role.name) {
      const existingRole = await this.prisma.roles.findUnique({
        where: { name: dto.name },
      });

      if (existingRole) {
        throw new BadRequestException('Role with this name already exists');
      }
    }

    const updated = await this.prisma.roles.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || '',
      permissions: updated.role_permissions.map((rp) => ({
        id: rp.permissions.id,
        code: rp.permissions.code,
        description: rp.permissions.description || '',
      })),
    };
  }

  async delete(id: string): Promise<void> {
    const role = await this.prisma.roles.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if any users have this role
    const usersWithRole = await this.prisma.user_roles.count({
      where: { role_id: id },
    });

    if (usersWithRole > 0) {
      throw new BadRequestException(
        `Cannot delete role: ${usersWithRole} user(s) have this role assigned`,
      );
    }

    // Delete role permissions first
    await this.prisma.role_permissions.deleteMany({
      where: { role_id: id },
    });

    // Delete role
    await this.prisma.roles.delete({
      where: { id },
    });
  }

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    // Verify role exists
    const role = await this.prisma.roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permissions.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permissions not found');
    }

    await this.prisma.role_permissions.deleteMany({
      where: { role_id: roleId },
    });

    await this.prisma.role_permissions.createMany({
      data: permissionIds.map((pid) => ({
        role_id: roleId,
        permission_id: pid,
      })),
    });
  }
}
