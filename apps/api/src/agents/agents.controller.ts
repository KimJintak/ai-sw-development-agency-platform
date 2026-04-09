import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AgentsService } from './agents.service'
import { CreateAgentTaskDto } from './dto/create-agent-task.dto'
import { ListAgentTasksQuery } from './dto/list-agent-tasks.query'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly service: AgentsService) {}

  // NOTE: route declaration order matters in NestJS. The `tasks/*` routes
  // MUST be declared before `:id` so `/agents/tasks/list` isn't matched as
  // `findCard(id='tasks')`.

  @Get()
  @ApiOperation({ summary: 'List agent cards' })
  listCards() {
    return this.service.listCards()
  }

  @Get('tasks/list')
  @ApiOperation({ summary: 'List agent tasks (filter: projectId, status, agentType)' })
  listTasks(@Query() query: ListAgentTasksQuery) {
    return this.service.listTasks(query)
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Get agent task by id' })
  findTask(@Param('taskId') taskId: string) {
    return this.service.findTask(taskId)
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create an agent task (published to Redis stream)' })
  createTask(@Body() dto: CreateAgentTaskDto) {
    return this.service.createTask(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent card by id' })
  findCard(@Param('id') id: string) {
    return this.service.findCard(id)
  }
}
