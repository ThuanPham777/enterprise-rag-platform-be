import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserProfileRequestDto } from './dto/request/create-user-profile-request.dto';
import { UpdateUserProfileRequestDto } from './dto/request/update-user-profile-request.dto';
import { UserProfileResponseDto } from './dto/response/user-profile-response.dto';

@Injectable()
export class UserProfilesService {
    constructor(private prisma: PrismaService) { }

    async findAll(): Promise<UserProfileResponseDto[]> {
        const profiles = await this.prisma.user_profiles.findMany({
            include: {
                departments: true,
                positions: true,
            },
            orderBy: { user_id: 'asc' },
        });

        return profiles.map((p) => this.mapToResponseDto(p));
    }

    async findByUserId(userId: string): Promise<UserProfileResponseDto> {
        const profile = await this.prisma.user_profiles.findUnique({
            where: { user_id: userId },
            include: {
                departments: true,
                positions: true,
            },
        });

        if (!profile) {
            throw new NotFoundException('User profile not found');
        }

        return this.mapToResponseDto(profile);
    }

    async create(
        dto: CreateUserProfileRequestDto,
    ): Promise<UserProfileResponseDto> {
        // Check if user exists
        const user = await this.prisma.users.findUnique({
            where: { id: dto.userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if profile already exists
        const existingProfile = await this.prisma.user_profiles.findUnique({
            where: { user_id: dto.userId },
        });

        if (existingProfile) {
            throw new ConflictException('User profile already exists');
        }

        // Validate department if provided
        if (dto.departmentId) {
            const department = await this.prisma.departments.findUnique({
                where: { id: dto.departmentId },
            });
            if (!department) {
                throw new NotFoundException('Department not found');
            }
        }

        // Validate position if provided
        if (dto.positionId) {
            const position = await this.prisma.positions.findUnique({
                where: { id: dto.positionId },
            });
            if (!position) {
                throw new NotFoundException('Position not found');
            }
        }

        const profile = await this.prisma.user_profiles.create({
            data: {
                user_id: dto.userId,
                department_id: dto.departmentId || null,
                position_id: dto.positionId || null,
                joined_at: dto.joinedAt ? new Date(dto.joinedAt) : null,
            },
            include: {
                departments: true,
                positions: true,
            },
        });

        return this.mapToResponseDto(profile);
    }

    async update(
        userId: string,
        dto: UpdateUserProfileRequestDto,
    ): Promise<UserProfileResponseDto> {
        const profile = await this.prisma.user_profiles.findUnique({
            where: { user_id: userId },
        });

        if (!profile) {
            throw new NotFoundException('User profile not found');
        }

        // Validate department if provided
        if (dto.departmentId) {
            const department = await this.prisma.departments.findUnique({
                where: { id: dto.departmentId },
            });
            if (!department) {
                throw new NotFoundException('Department not found');
            }
        }

        // Validate position if provided
        if (dto.positionId) {
            const position = await this.prisma.positions.findUnique({
                where: { id: dto.positionId },
            });
            if (!position) {
                throw new NotFoundException('Position not found');
            }
        }

        const updated = await this.prisma.user_profiles.update({
            where: { user_id: userId },
            data: {
                department_id: dto.departmentId !== undefined ? dto.departmentId : profile.department_id,
                position_id: dto.positionId !== undefined ? dto.positionId : profile.position_id,
                joined_at: dto.joinedAt ? new Date(dto.joinedAt) : profile.joined_at,
            },
            include: {
                departments: true,
                positions: true,
            },
        });

        return this.mapToResponseDto(updated);
    }

    async delete(userId: string): Promise<void> {
        const profile = await this.prisma.user_profiles.findUnique({
            where: { user_id: userId },
        });

        if (!profile) {
            throw new NotFoundException('User profile not found');
        }

        await this.prisma.user_profiles.delete({
            where: { user_id: userId },
        });
    }

    private mapToResponseDto(profile: any): UserProfileResponseDto {
        return {
            userId: profile.user_id,
            department: profile.departments
                ? {
                    id: profile.departments.id,
                    name: profile.departments.name,
                    description: profile.departments.description || undefined,
                }
                : undefined,
            position: profile.positions
                ? {
                    id: profile.positions.id,
                    name: profile.positions.name,
                    level: profile.positions.level,
                }
                : undefined,
            joinedAt: profile.joined_at || undefined,
        };
    }
}
