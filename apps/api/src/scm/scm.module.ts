import { Module, forwardRef } from '@nestjs/common'
import { GitHubService } from './github.service'
import { ScmController } from './scm.controller'
import { GitHubWebhookController } from './webhook.controller'
import { AgentScmController } from './agent-scm.controller'
import { ChatModule } from '../chat/chat.module'

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [ScmController, GitHubWebhookController, AgentScmController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class ScmModule {}
