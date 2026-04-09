import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * Payload that the Orchestrator forwards on `task:complete` events.
 * `success=false` + `errorLog` marks the AgentTask as FAILED; otherwise
 * it is marked COMPLETED with the provided `result`.
 */
export class TaskCompleteDto {
  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  success?: boolean

  @ApiProperty({ required: false, type: Object })
  @IsObject()
  @IsOptional()
  result?: Record<string, unknown>

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  errorLog?: string

  @ApiProperty({ required: false, description: 'Agent identifier injected by Orchestrator' })
  @IsString()
  @IsOptional()
  agent_id?: string
}
