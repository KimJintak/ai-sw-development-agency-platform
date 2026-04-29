import { Module, forwardRef } from '@nestjs/common'
import { GitHubService } from './github.service'
import { ScmController } from './scm.controller'
import { GitHubWebhookController } from './webhook.controller'
import { AgentScmController } from './agent-scm.controller'
import { ScmGenerateService } from './scm-generate.service'
import { ChatModule } from '../chat/chat.module'
import { LlmModule } from '../llm/llm.module'

@Module({
  imports: [forwardRef(() => ChatModule), LlmModule],
  controllers: [ScmController, GitHubWebhookController, AgentScmController],
  providers: [GitHubService, ScmGenerateService],
  exports: [GitHubService],
})
export class ScmModule {}
