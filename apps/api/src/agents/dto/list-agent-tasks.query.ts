import { IsEnum, IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { AgentTaskStatusDto } from './task-update.dto'
import { AgentTypeDto } from './create-agent-task.dto'

export class ListAgentTasksQuery {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectId?: string

  @ApiPropertyOptional({ enum: AgentTaskStatusDto })
  @IsEnum(AgentTaskStatusDto)
  @IsOptional()
  status?: AgentTaskStatusDto

  @ApiPropertyOptional({ enum: AgentTypeDto })
  @IsEnum(AgentTypeDto)
  @IsOptional()
  agentType?: AgentTypeDto
}
