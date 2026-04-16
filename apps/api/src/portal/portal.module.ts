import { Module, forwardRef } from '@nestjs/common'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'
import { ReportPdfService } from './report-pdf.service'
import { FeedbackModule } from '../feedback/feedback.module'
import { PresignedUrlService } from '../common/services/presigned-url.service'

@Module({
  imports: [forwardRef(() => FeedbackModule)],
  controllers: [PortalController],
  providers: [PortalService, ReportPdfService, PresignedUrlService],
})
export class PortalModule {}
