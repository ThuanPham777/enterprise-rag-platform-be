import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUID } from '../common/utils/uuid.util';
import { CreateRoleRequestDto } from './dto/request/create-role-request.dto';
import { CreateRoleResponseDto } from './dto/response/create-role-response.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) { }

  async findAll(): Promise<CreateRoleResponseDto[]> {
    const roles = await this.prisma.roles.findMany({
      include: {
        role_permissions: true,
      },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description || '',
    }));
  }

  async create(dto: CreateRoleRequestDto): Promise<CreateRoleResponseDto> {
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

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
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
