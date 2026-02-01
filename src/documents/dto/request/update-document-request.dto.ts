import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateAccessRulesDto {
  @ApiPropertyOptional({
    example: ['role-uuid-hr'],
    description: 'Role IDs that can access this document',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiPropertyOptional({
    example: ['dept-uuid-hr'],
    description: 'Department IDs that can access this document',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departments?: string[];

  @ApiPropertyOptional({
    example: ['position-uuid-manager'],
    description: 'Position IDs that can access this document',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  positions?: string[];
}

export class UpdateDocumentRequestDto {
  @ApiPropertyOptional({
    example: 'Updated Leave Policy 2025',
    description: 'New document title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    type: UpdateAccessRulesDto,
    description: 'Updated access rules for the document',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateAccessRulesDto)
  @IsOptional()
  accessRules?: UpdateAccessRulesDto;
}
