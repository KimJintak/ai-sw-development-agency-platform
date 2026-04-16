import { Module, forwardRef } from '@nestjs/common'
import { ReleasesService } from './releases.service'
import { ReleasesController } from './releases.controller'
import { DeployPipelineService } from './deploy-pipeline.service'
import { ChatModule } from '../chat/chat.module'
import { PresignedUrlService } from '../common/services/presigned-url.service'

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [ReleasesController],
  providers: [ReleasesService, DeployPipelineService, PresignedUrlService],
  exports: [ReleasesService, PresignedUrlService],
})
export class ReleasesModule {}
