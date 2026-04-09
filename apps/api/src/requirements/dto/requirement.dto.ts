import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum PlatformDto {
  MACOS = 'MACOS',
  WINDOWS = 'WINDOWS',
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
  LINUX = 'LINUX',
}

export enum RequirementStatusDto {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUPERSEDED = 'SUPERSEDED',
}

export class CreateRequirementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string

  @ApiProperty({
    description: 'Cucumber BDD Feature file contents (Given/When/Then).',
    example:
      "@web\nFeature: Login\n  Scenario: Valid credentials\n    Given I am on the login page\n    When I submit valid credentials\n    Then I see the dashboard",
  })
  @IsString()
  @IsNotEmpty()
  featureFile!: string

  @ApiProperty({ enum: PlatformDto, isArray: true })
  @IsArray()
  @IsEnum(PlatformDto, { each: true })
  platforms!: PlatformDto[]
}

export class UpdateRequirementDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  featureFile?: string

  @ApiPropertyOptional({ enum: PlatformDto, isArray: true })
  @IsArray()
  @IsEnum(PlatformDto, { each: true })
  @IsOptional()
  platforms?: PlatformDto[]

  @ApiPropertyOptional({ enum: RequirementStatusDto })
  @IsEnum(RequirementStatusDto)
  @IsOptional()
  status?: RequirementStatusDto

  @ApiPropertyOptional({
    description: 'Change note stored on the new RequirementVersion row.',
  })
  @IsString()
  @IsOptional()
  changeNote?: string
}

export class ApproveRequirementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  approvedBy!: string
}

export class LinkWorkItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workItemId!: string
}
