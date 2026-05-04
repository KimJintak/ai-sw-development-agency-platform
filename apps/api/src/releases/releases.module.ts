import { Module, forwardRef } from '@nestjs/common'
import { ReleasesService } from './releases.service'
import { ReleasesController } from './releases.controller'
import { DeployPipelineService } from './deploy-pipeline.service'
import { BuildGateway } from './build.gateway'
import { ChatModule } from '../chat/chat.module'
import { PresignedUrlService } from '../common/services/presigned-url.service'

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [ReleasesController],
  providers: [ReleasesService, DeployPipelineService, PresignedUrlService, BuildGateway],
  exports: [ReleasesService, PresignedUrlService, BuildGateway],
})
export class ReleasesModule {}
