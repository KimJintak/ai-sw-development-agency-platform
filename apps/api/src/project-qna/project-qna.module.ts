import { Module } from '@nestjs/common'
import { ProjectQnaService } from './project-qna.service'
import { ProjectQnaController } from './project-qna.controller'

@Module({
  controllers: [ProjectQnaController],
  providers: [ProjectQnaService],
  exports: [ProjectQnaService],
})
export class ProjectQnaModule {}
