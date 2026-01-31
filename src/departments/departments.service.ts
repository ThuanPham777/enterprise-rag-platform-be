import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { CreateDepartmentRequestDto } from './dto/request/create-department-request.dto';
import { UpdateDepartmentRequestDto } from './dto/request/update-department-request.dto';
import { DepartmentResponseDto } from './dto/response/department-response.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<DepartmentResponseDto[]> {
    const departments = await this.prisma.departments.findMany({
      orderBy: { name: 'asc' },
    });

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description || undefined,
    }));
  }

  async findById(id: string): Promise<DepartmentResponseDto> {
    const department = await this.prisma.departments.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return {
      id: department.id,
      name: department.name,
      description: department.description || undefined,
    };
  }

  async create(
    dto: CreateDepartmentRequestDto,
  ): Promise<DepartmentResponseDto> {
    const department = await this.prisma.departments.create({
      data: {
        id: randomUUID(),
        name: dto.name,
        description: dto.description,
      },
    });

    return {
      id: department.id,
      name: department.name,
      description: department.description || undefined,
    };
  }

  async update(
    id: string,
    dto: UpdateDepartmentRequestDto,
  ): Promise<DepartmentResponseDto> {
    const department = await this.prisma.departments.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const updated = await this.prisma.departments.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || undefined,
    };
  }

  async delete(id: string): Promise<void> {
    const department = await this.prisma.departments.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    await this.prisma.departments.delete({
      where: { id },
    });
  }
}
