import { Module, forwardRef } from '@nestjs/common'
import { FeedbackService } from './feedback.service'
import { FeedbackController } from './feedback.controller'
import { SimilarityService } from './similarity.service'
import { ChatModule } from '../chat/chat.module'

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [FeedbackController],
  providers: [FeedbackService, SimilarityService],
  exports: [FeedbackService, SimilarityService],
})
export class FeedbackModule {}
