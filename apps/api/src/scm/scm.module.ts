import { Module } from '@nestjs/common'
import { GitHubService } from './github.service'
import { ScmController } from './scm.controller'

@Module({
  controllers: [ScmController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class ScmModule {}
