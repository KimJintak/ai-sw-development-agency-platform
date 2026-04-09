import { IsEnum, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum AgentTaskStatusDto {
  SUBMITTED = 'SUBMITTED',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Payload that the Orchestrator forwards on `task:update` events from
 * agents. Every field is optional; service code merges only the fields
 * that were provided.
 */
export class TaskUpdateDto {
  @ApiProperty({ enum: AgentTaskStatusDto, required: false })
  @IsEnum(AgentTaskStatusDto)
  @IsOptional()
  status?: AgentTaskStatusDto

  @ApiProperty({ required: false, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  message?: string

  @ApiProperty({ required: false, type: Object })
  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>

  @ApiProperty({ required: false, description: 'Agent identifier injected by Orchestrator' })
  @IsString()
  @IsOptional()
  agent_id?: string
}
