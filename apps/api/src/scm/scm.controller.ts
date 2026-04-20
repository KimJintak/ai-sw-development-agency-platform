import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { GitHubService } from './github.service'

@ApiTags('Source Control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ScmController {
  constructor(private readonly gh: GitHubService) {}

  @Get('projects/:id/scm/repo')
  @ApiOperation({ summary: 'GitHub 저장소 메타데이터' })
  repo(@Param('id') id: string) {
    return this.gh.getRepo(id)
  }

  @Get('projects/:id/scm/branches')
  @ApiOperation({ summary: '브랜치 목록' })
  branches(@Param('id') id: string) {
    return this.gh.listBranches(id)
  }

  @Get('projects/:id/scm/commits')
  @ApiOperation({ summary: '커밋 목록 (브랜치 필터 가능)' })
  commits(@Param('id') id: string, @Query('branch') branch?: string) {
    return this.gh.listCommits(id, branch)
  }

  @Get('projects/:id/scm/pulls')
  @ApiOperation({ summary: 'PR 목록' })
  pulls(
    @Param('id') id: string,
    @Query('state') state: 'open' | 'closed' | 'all' = 'open',
  ) {
    return this.gh.listPullRequests(id, state)
  }

  @Get('projects/:id/scm/pulls/:number')
  @ApiOperation({ summary: 'PR 상세 (diff 파일, 리뷰 포함)' })
  pullDetail(
    @Param('id') id: string,
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.gh.getPullRequest(id, number)
  }

  @Post('projects/:id/scm/pulls')
  @ApiOperation({ summary: 'PR 생성' })
  createPull(
    @Param('id') id: string,
    @Body() body: { title: string; body: string; head: string; base?: string; draft?: boolean },
  ) {
    return this.gh.createPullRequest(id, body)
  }

  @Post('projects/:id/scm/pulls/:number/review')
  @ApiOperation({ summary: 'PR 리뷰 작성 (승인/변경요청/코멘트)' })
  review(
    @Param('id') id: string,
    @Param('number', ParseIntPipe) number: number,
    @Body() body: { event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'; body?: string },
  ) {
    return this.gh.createReview(id, number, body)
  }

  @Post('projects/:id/scm/pulls/:number/merge')
  @ApiOperation({ summary: 'PR squash-merge' })
  merge(
    @Param('id') id: string,
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.gh.mergePullRequest(id, number)
  }

  @Get('projects/:id/scm/status/:sha')
  @ApiOperation({ summary: 'CI 상태 (combined status for commit)' })
  status(@Param('id') id: string, @Param('sha') sha: string) {
    return this.gh.getCombinedStatus(id, sha)
  }
}
