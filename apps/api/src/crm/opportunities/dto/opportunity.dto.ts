import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { OpportunityStage } from '@prisma/client'

export class CreateOpportunityDto {
  @ApiProperty()
  @IsString()
  customerId: string

  @ApiProperty()
  @IsString()
  title: string

  @ApiPropertyOptional({ enum: OpportunityStage })
  @IsOptional()
  @IsEnum(OpportunityStage)
  stage?: OpportunityStage

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedValue?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string
}

export class UpdateOpportunityDto extends PartialType(CreateOpportunityDto) {}

export class UpdateStageDto {
  @ApiProperty({ enum: OpportunityStage })
  @IsEnum(OpportunityStage)
  stage: OpportunityStage
}
