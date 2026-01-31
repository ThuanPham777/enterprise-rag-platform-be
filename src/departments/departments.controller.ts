import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
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
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';
import { ErrorResponseDto } from 'src/common/dtos/error-response.dto';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { CreateDepartmentRequestDto } from './dto/request/create-department-request.dto';
import { UpdateDepartmentRequestDto } from './dto/request/update-department-request.dto';
import { DepartmentResponseDto } from './dto/response/department-response.dto';

@ApiTags('Departments')
@ApiBearerAuth('access-token')
@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Permissions('MANAGE_DEPARTMENTS')
  @Get()
  @ApiOperation({
    summary: 'List all departments',
    description: 'Retrieve all departments in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Departments retrieved successfully',
    type: DepartmentResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getDepartments(): Promise<ApiResponseDto<DepartmentResponseDto[]>> {
    const departments = await this.departmentsService.findAll();
    return ApiResponseDto.success(departments);
  }

  @Permissions('MANAGE_DEPARTMENTS')
  @Get(':id')
  @ApiOperation({
    summary: 'Get department by ID',
    description: 'Retrieve a specific department by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Department ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Department retrieved successfully',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getDepartment(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<DepartmentResponseDto>> {
    const department = await this.departmentsService.findById(id);
    return ApiResponseDto.success(department);
  }

  @Permissions('MANAGE_DEPARTMENTS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new department',
    description: 'Create a new department',
  })
  @ApiBody({ type: CreateDepartmentRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Department created successfully',
    type: DepartmentResponseDto,
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
  async createDepartment(
    @Body() dto: CreateDepartmentRequestDto,
  ): Promise<ApiResponseDto<DepartmentResponseDto>> {
    const department = await this.departmentsService.create(dto);
    return ApiResponseDto.success(department, 'Department created');
  }

  @Permissions('MANAGE_DEPARTMENTS')
  @Put(':id')
  @ApiOperation({
    summary: 'Update department',
    description: 'Update an existing department',
  })
  @ApiParam({
    name: 'id',
    description: 'Department ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateDepartmentRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Department updated successfully',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentRequestDto,
  ): Promise<ApiResponseDto<DepartmentResponseDto>> {
    const department = await this.departmentsService.update(id, dto);
    return ApiResponseDto.success(department, 'Department updated');
  }

  @Permissions('MANAGE_DEPARTMENTS')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete department',
    description: 'Delete a department by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Department ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Department deleted successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deleteDepartment(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.departmentsService.delete(id);
    return ApiResponseDto.success(null, 'Department deleted');
  }
}
