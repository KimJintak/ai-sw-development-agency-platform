import { Module } from '@nestjs/common'
import { DesignService } from './design.service'
import { DesignController } from './design.controller'
import { UxAgentService } from './ux-agent.service'

@Module({
  controllers: [DesignController],
  providers: [DesignService, UxAgentService],
  exports: [DesignService, UxAgentService],
})
export class DesignModule {}
