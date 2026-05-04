import { Module } from '@nestjs/common'
import { QaService } from './qa.service'
import { QaController } from './qa.controller'
import { QaAgentService } from './qa-agent.service'

@Module({
  controllers: [QaController],
  providers: [QaService, QaAgentService],
  exports: [QaService, QaAgentService],
})
export class QaModule {}
