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
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';
import { ErrorResponseDto } from 'src/common/dtos/error-response.dto';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { CreatePositionRequestDto } from './dto/request/create-position-request.dto';
import { UpdatePositionRequestDto } from './dto/request/update-position-request.dto';
import { PositionResponseDto } from './dto/response/position-response.dto';

@ApiTags('Positions')
@ApiBearerAuth('access-token')
@Controller('positions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PositionsController {
  constructor(private positionsService: PositionsService) { }

  @Permissions('MANAGE_POSITIONS')
  @Get()
  @ApiOperation({
    summary: 'List all positions',
    description: 'Retrieve all positions ordered by level (desc) and name',
  })
  @ApiResponse({
    status: 200,
    description: 'Positions retrieved successfully',
    type: PositionResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getPositions(): Promise<ApiResponseDto<PositionResponseDto[]>> {
    const positions = await this.positionsService.findAll();
    return ApiResponseDto.success(positions);
  }

  @Permissions('MANAGE_POSITIONS')
  @Get(':id')
  @ApiOperation({
    summary: 'Get position by ID',
    description: 'Retrieve a specific position by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Position ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Position retrieved successfully',
    type: PositionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Position not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getPosition(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<PositionResponseDto>> {
    const position = await this.positionsService.findById(id);
    return ApiResponseDto.success(position);
  }

  @Permissions('MANAGE_POSITIONS')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new position',
    description: 'Create a new position',
  })
  @ApiBody({ type: CreatePositionRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Position created successfully',
    type: PositionResponseDto,
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
  async createPosition(
    @Body() dto: CreatePositionRequestDto,
  ): Promise<ApiResponseDto<PositionResponseDto>> {
    const position = await this.positionsService.create(dto);
    return ApiResponseDto.success(position, 'Position created');
  }

  @Permissions('MANAGE_POSITIONS')
  @Put(':id')
  @ApiOperation({
    summary: 'Update position',
    description: 'Update an existing position',
  })
  @ApiParam({
    name: 'id',
    description: 'Position ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdatePositionRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Position updated successfully',
    type: PositionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Position not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async updatePosition(
    @Param('id') id: string,
    @Body() dto: UpdatePositionRequestDto,
  ): Promise<ApiResponseDto<PositionResponseDto>> {
    const position = await this.positionsService.update(id, dto);
    return ApiResponseDto.success(position, 'Position updated');
  }

  @Permissions('MANAGE_POSITIONS')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete position',
    description: 'Delete a position by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Position ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Position deleted successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Position not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deletePosition(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.positionsService.delete(id);
    return ApiResponseDto.success(null, 'Position deleted');
  }
}
