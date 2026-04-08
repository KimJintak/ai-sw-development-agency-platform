import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Platform, Priority, WorkItemStatus, WorkItemType } from '@prisma/client'

export class CreateWorkItemDto {
  @ApiProperty()
  @IsString()
  projectId: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string

  @ApiProperty({ enum: WorkItemType })
  @IsEnum(WorkItemType)
  type: WorkItemType

  @ApiProperty()
  @IsString()
  title: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority

  @ApiPropertyOptional({ enum: Platform })
  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  storyPoints?: number
}

export class UpdateWorkItemDto extends PartialType(CreateWorkItemDto) {}

export class UpdateWorkItemStatusDto {
  @ApiProperty({ enum: WorkItemStatus })
  @IsEnum(WorkItemStatus)
  status: WorkItemStatus
}
