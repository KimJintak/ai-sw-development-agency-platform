import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/* ── Enums (mirror Prisma) ── */

export enum PlatformDto {
  MACOS = 'MACOS',
  WINDOWS = 'WINDOWS',
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
  LINUX = 'LINUX',
}

export enum TestRunStatusDto {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TestResultStatusDto {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

/* ── TestCase ── */

export class CreateTestCaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workItemId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string

  @ApiProperty({ description: 'Test scenario / steps description' })
  @IsString()
  @IsNotEmpty()
  scenario!: string

  @ApiPropertyOptional({ enum: PlatformDto })
  @IsEnum(PlatformDto)
  @IsOptional()
  platform?: PlatformDto
}

export class UpdateTestCaseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  scenario?: string

  @ApiPropertyOptional({ enum: PlatformDto })
  @IsEnum(PlatformDto)
  @IsOptional()
  platform?: PlatformDto
}

/* ── TestRun ── */

export class CreateTestRunDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  releaseId!: string

  @ApiProperty({ enum: PlatformDto })
  @IsEnum(PlatformDto)
  platform!: PlatformDto
}

export class UpdateTestRunDto {
  @ApiPropertyOptional({ enum: TestRunStatusDto })
  @IsEnum(TestRunStatusDto)
  @IsOptional()
  status?: TestRunStatusDto
}

/* ── TestResult ── */

export class RecordTestResultDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  testCaseId!: string

  @ApiProperty({ enum: TestResultStatusDto })
  @IsEnum(TestResultStatusDto)
  status!: TestResultStatusDto

  @ApiPropertyOptional({ description: 'Duration in milliseconds' })
  @IsInt()
  @Min(0)
  @IsOptional()
  duration?: number

  @ApiPropertyOptional({ description: 'Error log or failure message' })
  @IsString()
  @IsOptional()
  errorLog?: string
}

/* ── Query helpers ── */

export class ListTestCasesQuery {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workItemId!: string

  @ApiPropertyOptional({ enum: PlatformDto })
  @IsEnum(PlatformDto)
  @IsOptional()
  platform?: PlatformDto
}

export class ListTestRunsQuery {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  releaseId!: string

  @ApiPropertyOptional({ enum: TestRunStatusDto })
  @IsEnum(TestRunStatusDto)
  @IsOptional()
  status?: TestRunStatusDto
}
