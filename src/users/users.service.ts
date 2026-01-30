import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/response/user-response.dto';
import { GetUserResponseDto } from './dto/response/get-user-response.dto';
import { UpdateUserStatusResponseDto } from './dto/response/update-user-status-response.dto';
import { UserStatus, DEFAULT_USER_STATUS } from './enums/user-status.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.users.findMany({
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: { permissions: true },
                },
              },
            },
          },
        },
      },
    });

    return users.map((user) => this.mapToUserResponseDto(user));
  }

  async findById(id: string): Promise<GetUserResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: { id },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: { permissions: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserResponseDto(user);
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    // Check if user exists
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove old roles
    await this.prisma.user_roles.deleteMany({
      where: { user_id: userId },
    });

    // Assign new roles
    if (roleIds.length > 0) {
      await this.prisma.user_roles.createMany({
        data: roleIds.map((roleId) => ({
          user_id: userId,
          role_id: roleId,
        })),
      });
    }
  }

  async updateStatus(
    userId: string,
    status: UserStatus,
  ): Promise<UpdateUserStatusResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: { status },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.full_name || undefined,
      status: (updatedUser.status as UserStatus) || DEFAULT_USER_STATUS,
      created_at: updatedUser.created_at || undefined,
      updated_at: updatedUser.updated_at || undefined,
    };
  }

  private mapToUserResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name || undefined,
      status: user.status || undefined,
      created_at: user.created_at || undefined,
      updated_at: user.updated_at || undefined,
      user_roles: user.user_roles.map((ur: any) => ({
        roles: {
          id: ur.roles.id,
          name: ur.roles.name,
          description: ur.roles.description || undefined,
          role_permissions: ur.roles.role_permissions.map((rp: any) => ({
            permissions: {
              id: rp.permissions.id,
              code: rp.permissions.code,
              description: rp.permissions.description || undefined,
            },
          })),
        },
      })),
    };
  }
}
