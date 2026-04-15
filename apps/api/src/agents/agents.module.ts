import { Module, forwardRef } from '@nestjs/common'
import { AgentsService } from './agents.service'
import { AgentsController } from './agents.controller'
import { InternalTasksController } from './internal-tasks.controller'
import { OutboxWorker } from './outbox.worker'
import { ChatModule } from '../chat/chat.module'

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [AgentsController, InternalTasksController],
  providers: [AgentsService, OutboxWorker],
  exports: [AgentsService],
})
export class AgentsModule {}
