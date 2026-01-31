import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { CreatePositionRequestDto } from './dto/request/create-position-request.dto';
import { UpdatePositionRequestDto } from './dto/request/update-position-request.dto';
import { PositionResponseDto } from './dto/response/position-response.dto';

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<PositionResponseDto[]> {
    const positions = await this.prisma.positions.findMany({
      orderBy: [{ level: 'desc' }, { name: 'asc' }],
    });

    return positions.map((p) => ({
      id: p.id,
      name: p.name,
      level: p.level,
    }));
  }

  async findById(id: string): Promise<PositionResponseDto> {
    const position = await this.prisma.positions.findUnique({
      where: { id },
    });

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    return {
      id: position.id,
      name: position.name,
      level: position.level,
    };
  }

  async create(dto: CreatePositionRequestDto): Promise<PositionResponseDto> {
    const position = await this.prisma.positions.create({
      data: {
        id: randomUUID(),
        name: dto.name,
        level: dto.level,
      },
    });

    return {
      id: position.id,
      name: position.name,
      level: position.level,
    };
  }

  async update(
    id: string,
    dto: UpdatePositionRequestDto,
  ): Promise<PositionResponseDto> {
    const position = await this.prisma.positions.findUnique({
      where: { id },
    });

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    const updated = await this.prisma.positions.update({
      where: { id },
      data: {
        name: dto.name,
        level: dto.level,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      level: updated.level,
    };
  }

  async delete(id: string): Promise<void> {
    const position = await this.prisma.positions.findUnique({
      where: { id },
    });

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    await this.prisma.positions.delete({
      where: { id },
    });
  }
}
