import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUID } from '../common/utils/uuid.util';
import { CreatePermissionRequestDto } from './dto/request/create-permission-request.dto';
import { UpdatePermissionRequestDto } from './dto/request/update-permission-request.dto';
import { CreatePermissionResponseDto } from './dto/response/create-permission-response.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<CreatePermissionResponseDto[]> {
    const permissions = await this.prisma.permissions.findMany({
      orderBy: { code: 'asc' },
    });

    return permissions.map((p) => ({
      id: p.id,
      code: p.code,
      description: p.description || '',
    }));
  }

  async findById(id: string): Promise<CreatePermissionResponseDto> {
    const permission = await this.prisma.permissions.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return {
      id: permission.id,
      code: permission.code,
      description: permission.description || '',
    };
  }

  async findByCode(code: string): Promise<CreatePermissionResponseDto> {
    const permission = await this.prisma.permissions.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return {
      id: permission.id,
      code: permission.code,
      description: permission.description || '',
    };
  }

  async create(
    dto: CreatePermissionRequestDto,
  ): Promise<CreatePermissionResponseDto> {
    const code = dto.code.toUpperCase();

    // Check if permission code already exists
    const existingPermission = await this.prisma.permissions.findUnique({
      where: { code },
    });

    if (existingPermission) {
      throw new BadRequestException('Permission with this code already exists');
    }

    const permission = await this.prisma.permissions.create({
      data: {
        id: generateUUID(),
        code,
        description: dto.description,
      },
    });

    return {
      id: permission.id,
      code: permission.code,
      description: permission.description || '',
    };
  }

  async update(
    id: string,
    dto: UpdatePermissionRequestDto,
  ): Promise<CreatePermissionResponseDto> {
    const permission = await this.prisma.permissions.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Check if new code conflicts with existing permission
    if (dto.code) {
      const newCode = dto.code.toUpperCase();
      if (newCode !== permission.code) {
        const existingPermission = await this.prisma.permissions.findUnique({
          where: { code: newCode },
        });

        if (existingPermission) {
          throw new BadRequestException(
            'Permission with this code already exists',
          );
        }
      }
    }

    const updated = await this.prisma.permissions.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase() : undefined,
        description: dto.description,
      },
    });

    return {
      id: updated.id,
      code: updated.code,
      description: updated.description || '',
    };
  }

  async delete(id: string): Promise<void> {
    const permission = await this.prisma.permissions.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Check if any roles have this permission
    const rolesWithPermission = await this.prisma.role_permissions.count({
      where: { permission_id: id },
    });

    if (rolesWithPermission > 0) {
      throw new BadRequestException(
        `Cannot delete permission: ${rolesWithPermission} role(s) have this permission assigned`,
      );
    }

    await this.prisma.permissions.delete({
      where: { id },
    });
  }
}
