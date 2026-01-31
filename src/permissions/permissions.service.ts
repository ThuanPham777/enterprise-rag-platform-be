import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateUUID } from '../common/utils/uuid.util';
import { CreatePermissionRequestDto } from './dto/request/create-permission-request.dto';
import { CreatePermissionResponseDto } from './dto/response/create-permission-response.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) { }

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

  async create(
    dto: CreatePermissionRequestDto,
  ): Promise<CreatePermissionResponseDto> {
    const permission = await this.prisma.permissions.create({
      data: {
        id: generateUUID(),
        code: dto.code.toUpperCase(),
        description: dto.description,
      },
    });

    return {
      id: permission.id,
      code: permission.code,
      description: permission.description || '',
    };
  }
}
