import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';
import { ErrorResponseDto } from 'src/common/dtos/error-response.dto';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { AssignRolesRequestDto } from './dto/request/assign-roles-request.dto';
import { UpdateUserStatusRequestDto } from './dto/request/update-user-status-request.dto';
import { UserResponseDto } from './dto/response/user-response.dto';
import { GetUserResponseDto } from './dto/response/get-user-response.dto';
import { UpdateUserStatusResponseDto } from './dto/response/update-user-status-response.dto';
import { UserStatus } from './enums/user-status.enum';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Permissions('MANAGE_USERS')
  @Get()
  @ApiOperation({
    summary: 'List all users',
    description: 'Retrieve all users with their roles and permissions',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: UserResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getUsers(): Promise<ApiResponseDto<UserResponseDto[]>> {
    const users = await this.usersService.findAll();
    return ApiResponseDto.success(users);
  }

  @Permissions('MANAGE_USERS')
  @Get(':id')
  @ApiOperation({
    summary: 'Get user detail',
    description: 'Retrieve a specific user by ID with roles and permissions',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: GetUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getUser(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<GetUserResponseDto>> {
    const user = await this.usersService.findById(id);
    return ApiResponseDto.success(user);
  }

  @Permissions('MANAGE_USERS')
  @Post(':id/roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign roles to user',
    description: 'Assign one or more roles to a user',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: AssignRolesRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Roles assigned successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async assignRoles(
    @Param('id') userId: string,
    @Body() dto: AssignRolesRequestDto,
  ): Promise<ApiResponseDto<null>> {
    await this.usersService.assignRoles(userId, dto.roleIds);
    return ApiResponseDto.success(null, 'Roles assigned successfully');
  }

  @Permissions('MANAGE_USERS')
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update user status',
    description: `Update user status. Available statuses: ${Object.values(UserStatus).join(', ')}`,
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateUserStatusRequestDto })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    type: UpdateUserStatusResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async updateStatus(
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusRequestDto,
  ): Promise<ApiResponseDto<UpdateUserStatusResponseDto>> {
    const user = await this.usersService.updateStatus(userId, dto.status);
    return ApiResponseDto.success(user, 'User status updated');
  }
}
