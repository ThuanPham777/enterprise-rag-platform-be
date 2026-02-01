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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { ErrorResponseDto } from '../common/dtos/error-response.dto';
import { CreatePermissionRequestDto } from './dto/request/create-permission-request.dto';
import { UpdatePermissionRequestDto } from './dto/request/update-permission-request.dto';
import { CreatePermissionResponseDto } from './dto/response/create-permission-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Permissions('MANAGE_PERMISSIONS')
  @Get()
  @ApiOperation({
    summary: 'List all permissions',
    description: 'Retrieve all permissions in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
    type: CreatePermissionResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getPermissions(): Promise<
    ApiResponseDto<CreatePermissionResponseDto[]>
  > {
    const data = await this.permissionsService.findAll();
    return ApiResponseDto.success(data);
  }

  @Permissions('MANAGE_PERMISSIONS')
  @Get(':id')
  @ApiOperation({
    summary: 'Get permission by ID',
    description: 'Retrieve a specific permission by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Permission ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission retrieved successfully',
    type: CreatePermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Permission not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getPermission(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<CreatePermissionResponseDto>> {
    const permission = await this.permissionsService.findById(id);
    return ApiResponseDto.success(permission);
  }

  @Permissions('MANAGE_PERMISSIONS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new permission',
    description: 'Create a new permission with a unique code',
  })
  @ApiBody({ type: CreatePermissionRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    type: CreatePermissionResponseDto,
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
  async createPermission(
    @Body() dto: CreatePermissionRequestDto,
  ): Promise<ApiResponseDto<CreatePermissionResponseDto>> {
    const permission = await this.permissionsService.create(dto);
    return ApiResponseDto.success(permission, 'Permission created');
  }

  @Permissions('MANAGE_PERMISSIONS')
  @Put(':id')
  @ApiOperation({
    summary: 'Update permission',
    description: 'Update an existing permission',
  })
  @ApiParam({
    name: 'id',
    description: 'Permission ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdatePermissionRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully',
    type: CreatePermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Permission not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionRequestDto,
  ): Promise<ApiResponseDto<CreatePermissionResponseDto>> {
    const permission = await this.permissionsService.update(id, dto);
    return ApiResponseDto.success(permission, 'Permission updated');
  }

  @Permissions('MANAGE_PERMISSIONS')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete permission',
    description: 'Delete a permission by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Permission ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Permission deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Permission not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete permission with assigned roles',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deletePermission(@Param('id') id: string): Promise<void> {
    await this.permissionsService.delete(id);
  }
}
