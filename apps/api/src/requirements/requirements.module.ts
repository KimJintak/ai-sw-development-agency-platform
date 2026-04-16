import { Module } from '@nestjs/common'
import { RequirementsService } from './requirements.service'
import { RequirementsController } from './requirements.controller'
import { PmAgentService } from './pm-agent.service'

@Module({
  controllers: [RequirementsController],
  providers: [RequirementsService, PmAgentService],
  exports: [RequirementsService, PmAgentService],
})
export class RequirementsModule {}
