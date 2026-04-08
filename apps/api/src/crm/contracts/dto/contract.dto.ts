import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Platform } from '@prisma/client'

export class CreateContractDto {
  @ApiProperty()
  @IsString()
  opportunityId: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string

  @ApiProperty()
  @IsNumber()
  amount: number

  @ApiPropertyOptional({ default: 'KRW' })
  @IsOptional()
  @IsString()
  currency?: string

  @ApiProperty()
  @IsDateString()
  startDate: string

  @ApiProperty()
  @IsDateString()
  deadlineDate: string

  @ApiProperty({ enum: Platform, isArray: true })
  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms: Platform[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  signedAt?: string
}

export class UpdateContractDto extends PartialType(CreateContractDto) {}
