import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';
import { ErrorResponseDto } from 'src/common/dtos/error-response.dto';
import { CreateRoleResponseDto } from './dto/response/create-role-response.dto';
import { CreateRoleRequestDto } from './dto/request/create-role-request.dto';
import { AssignPermissionsRequestDto } from './dto/request/assign-permission-request.dto';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private rolesService: RolesService) { }

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
    return ApiResponseDto.success(await this.rolesService.create(dto));
  }

  @Permissions('MANAGE_ROLES')
  @Post(':id/permissions')
  @ApiOperation({
    summary: 'Assign permissions',
    description: 'Assign permissions to a role',
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
