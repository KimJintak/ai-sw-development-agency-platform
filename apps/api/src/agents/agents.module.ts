import { Module } from '@nestjs/common'
import { AgentsService } from './agents.service'
import { AgentsController } from './agents.controller'
import { InternalTasksController } from './internal-tasks.controller'

@Module({
  controllers: [AgentsController, InternalTasksController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
