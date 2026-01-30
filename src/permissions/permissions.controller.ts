import {
  Controller,
  Get,
  Post,
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
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';
import { ErrorResponseDto } from 'src/common/dtos/error-response.dto';
import { CreatePermissionRequestDto } from './dto/request/create-permission-request.dto';
import { CreatePermissionResponseDto } from './dto/response/create-permission-response.dto';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) { }

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
  async getPermissions(): Promise<ApiResponseDto<CreatePermissionResponseDto[]>> {
    const data = await this.permissionsService.findAll();
    return ApiResponseDto.success(data);
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
}
