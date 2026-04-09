import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AgentsService } from './agents.service'
import { TaskUpdateDto } from './dto/task-update.dto'
import { TaskCompleteDto } from './dto/task-complete.dto'
import { OrchestratorAuthGuard } from '../common/guards/orchestrator-auth.guard'

/**
 * Internal callback endpoints invoked by the Phoenix Orchestrator when
 * agents emit task:update / task:complete events. Not exposed to end
 * users — protected by OrchestratorAuthGuard (Bearer ORCHESTRATOR_SECRET).
 */
@ApiTags('Internal Tasks')
@UseGuards(OrchestratorAuthGuard)
@Controller('internal/tasks')
export class InternalTasksController {
  constructor(private readonly service: AgentsService) {}

  @Post(':id/updates')
  @ApiOperation({ summary: 'Receive task update from Orchestrator' })
  update(@Param('id') id: string, @Body() dto: TaskUpdateDto) {
    return this.service.applyUpdate(id, dto)
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Receive task completion from Orchestrator' })
  complete(@Param('id') id: string, @Body() dto: TaskCompleteDto) {
    return this.service.markComplete(id, dto)
  }
}
