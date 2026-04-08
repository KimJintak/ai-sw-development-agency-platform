import { IsArray, IsEnum, IsJSON, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Platform } from '@prisma/client'

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  customerId: string

  @ApiProperty()
  @IsString()
  name: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ enum: Platform, isArray: true })
  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms: Platform[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  githubRepo?: string
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class UpdateOrchestrationDslDto {
  @ApiProperty({ description: 'Orchestration pipeline JSON DSL' })
  dsl: Record<string, unknown>
}
