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
import { UserProfilesService } from './user-profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';
import { ErrorResponseDto } from 'src/common/dtos/error-response.dto';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { CreateUserProfileRequestDto } from './dto/request/create-user-profile-request.dto';
import { UpdateUserProfileRequestDto } from './dto/request/update-user-profile-request.dto';
import { UserProfileResponseDto } from './dto/response/user-profile-response.dto';

@ApiTags('User Profiles')
@ApiBearerAuth('access-token')
@Controller('user-profiles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserProfilesController {
  constructor(private userProfilesService: UserProfilesService) { }

  @Permissions('MANAGE_USER_PROFILES')
  @Get()
  @ApiOperation({
    summary: 'List all user profiles',
    description: 'Retrieve all user profiles with department and position information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profiles retrieved successfully',
    type: UserProfileResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getUserProfiles(): Promise<ApiResponseDto<UserProfileResponseDto[]>> {
    const profiles = await this.userProfilesService.findAll();
    return ApiResponseDto.success(profiles);
  }

  @Permissions('MANAGE_USER_PROFILES')
  @Get(':userId')
  @ApiOperation({
    summary: 'Get user profile by user ID',
    description: 'Retrieve a specific user profile by user ID',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getUserProfile(
    @Param('userId') userId: string,
  ): Promise<ApiResponseDto<UserProfileResponseDto>> {
    const profile = await this.userProfilesService.findByUserId(userId);
    return ApiResponseDto.success(profile);
  }

  @Permissions('MANAGE_USER_PROFILES')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create user profile',
    description: 'Create a new user profile with department and position',
  })
  @ApiBody({ type: CreateUserProfileRequestDto })
  @ApiResponse({
    status: 201,
    description: 'User profile created successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User, department, or position not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User profile already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async createUserProfile(
    @Body() dto: CreateUserProfileRequestDto,
  ): Promise<ApiResponseDto<UserProfileResponseDto>> {
    const profile = await this.userProfilesService.create(dto);
    return ApiResponseDto.success(profile, 'User profile created');
  }

  @Permissions('MANAGE_USER_PROFILES')
  @Put(':userId')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update an existing user profile',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateUserProfileRequestDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User profile, department, or position not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserProfileRequestDto,
  ): Promise<ApiResponseDto<UserProfileResponseDto>> {
    const profile = await this.userProfilesService.update(userId, dto);
    return ApiResponseDto.success(profile, 'User profile updated');
  }

  @Permissions('MANAGE_USER_PROFILES')
  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user profile',
    description: 'Delete a user profile by user ID',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile deleted successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deleteUserProfile(
    @Param('userId') userId: string,
  ): Promise<ApiResponseDto<null>> {
    await this.userProfilesService.delete(userId);
    return ApiResponseDto.success(null, 'User profile deleted');
  }
}
