import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum AgentTypeDto {
  CRM = 'CRM',
  PM = 'PM',
  ARCHITECTURE = 'ARCHITECTURE',
  UX = 'UX',
  MAC_DEV = 'MAC_DEV',
  WINDOWS_DEV = 'WINDOWS_DEV',
  AWS_DEV = 'AWS_DEV',
  TEST = 'TEST',
  DEPLOY = 'DEPLOY',
  REPORT = 'REPORT',
  TRIAGE = 'TRIAGE',
  QA = 'QA',
}

export class CreateAgentTaskDto {
  @ApiProperty({ enum: AgentTypeDto })
  @IsEnum(AgentTypeDto)
  @IsNotEmpty()
  agentType!: AgentTypeDto

  @ApiProperty({ example: 'generate_design' })
  @IsString()
  @IsNotEmpty()
  taskType!: string

  @ApiProperty({ type: Object })
  @IsObject()
  payload!: Record<string, unknown>

  @ApiProperty({
    description:
      'Required for dispatch: the Orchestrator routes tasks per project_id.',
  })
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  workItemId?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userId?: string

  @ApiProperty({ required: false, default: 3 })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxRetries?: number
}
