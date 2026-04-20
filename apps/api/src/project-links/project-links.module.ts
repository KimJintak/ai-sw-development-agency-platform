import { Module } from '@nestjs/common'
import { ProjectLinksService } from './project-links.service'
import { ProjectLinksController } from './project-links.controller'

@Module({
  controllers: [ProjectLinksController],
  providers: [ProjectLinksService],
  exports: [ProjectLinksService],
})
export class ProjectLinksModule {}
