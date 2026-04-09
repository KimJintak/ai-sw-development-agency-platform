import { Module } from '@nestjs/common'
import { AgentsService } from './agents.service'
import { AgentsController } from './agents.controller'
import { InternalTasksController } from './internal-tasks.controller'
import { OutboxWorker } from './outbox.worker'

@Module({
  controllers: [AgentsController, InternalTasksController],
  providers: [AgentsService, OutboxWorker],
  exports: [AgentsService],
})
export class AgentsModule {}
