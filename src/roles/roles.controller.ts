import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { CreateRoleResponseDto } from './dto/response/create-role-response.dto';
import { CreateRoleRequestDto } from './dto/request/create-role-request.dto';
import { UpdateRoleRequestDto } from './dto/request/update-role-request.dto';
import { AssignPermissionsRequestDto } from './dto/request/assign-permission-request.dto';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Permissions('MANAGE_ROLES')
  @Get()
  @ApiOperation({
    summary: 'List roles',
    description: 'Retrieve all roles with permissions',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    type: CreateRoleResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getRoles(): Promise<ApiResponseDto<CreateRoleResponseDto[]>> {
    return ApiResponseDto.success(await this.rolesService.findAll());
  }

  @Permissions('MANAGE_ROLES')
  @Get(':id')
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Retrieve a specific role by ID with its permissions',
  })
  @ApiParam({
    name: 'id',
    description: 'Role ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    type: CreateRoleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getRole(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CreateRoleResponseDto>> {
    return ApiResponseDto.success(await this.rolesService.findById(id));
  }

  @Permissions('MANAGE_ROLES')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create role',
    description: 'Create a new role',
  })
  @ApiBody({ type: CreateRoleRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: CreateRoleResponseDto,
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
  async createRole(
    @Body() dto: CreateRoleRequestDto,
  ): Promise<ApiResponseDto<CreateRoleResponseDto>> {
    return ApiResponseDto.success(
      await this.rolesService.create(dto),
      'Role created successfully',
    );
  }

  @Permissions('MANAGE_ROLES')
  @Put(':id')
  @ApiOperation({
    summary: 'Update role',
    description: 'Update an existing role',
  })
  @ApiParam({
    name: 'id',
    description: 'Role ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateRoleRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: CreateRoleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleRequestDto,
  ): Promise<ApiResponseDto<CreateRoleResponseDto>> {
    return ApiResponseDto.success(
      await this.rolesService.update(id, dto),
      'Role updated successfully',
    );
  }

  @Permissions('MANAGE_ROLES')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete role',
    description: 'Delete a role by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Role ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Role deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete role with assigned users',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deleteRole(@Param('id') id: string): Promise<void> {
    await this.rolesService.delete(id);
  }

  @Permissions('MANAGE_ROLES')
  @Post(':id/permissions')
  @ApiOperation({
    summary: 'Assign permissions',
    description: 'Assign permissions to a role',
  })
  @ApiParam({
    name: 'id',
    description: 'Role ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: AssignPermissionsRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully',
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
  async assignPermissions(
    @Param('id') roleId: string,
    @Body() dto: AssignPermissionsRequestDto,
  ): Promise<ApiResponseDto<null>> {
    await this.rolesService.assignPermissions(roleId, dto.permissionIds);
    return ApiResponseDto.success(null, 'Permissions assigned');
  }
}
