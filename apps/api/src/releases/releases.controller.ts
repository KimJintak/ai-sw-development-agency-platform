import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { BuildStatus, Platform, ReleaseStatus } from '@prisma/client'
import { ReleasesService } from './releases.service'
import { DeployPipelineService } from './deploy-pipeline.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@ApiTags('Releases & Builds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReleasesController {
  constructor(
    private readonly service: ReleasesService,
    private readonly pipeline: DeployPipelineService,
  ) {}

  @Get('projects/:projectId/releases')
  @ApiOperation({ summary: '프로젝트 릴리스 목록' })
  list(@Param('projectId') projectId: string) {
    return this.service.listByProject(projectId)
  }

  @Post('projects/:projectId/releases')
  @ApiOperation({ summary: '릴리스 생성' })
  create(
    @Param('projectId') projectId: string,
    @Body() body: { version: string; title?: string; platforms: Platform[] },
  ) {
    return this.service.create({ projectId, ...body })
  }

  @Get('releases/:id')
  @ApiOperation({ summary: '릴리스 상세 (Work Items, Builds, Test Runs)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch('releases/:id/status')
  @ApiOperation({ summary: '릴리스 상태 전이 (DRAFT→TESTING→APPROVED→DEPLOYING→DEPLOYED|ROLLED_BACK)' })
  transition(@Param('id') id: string, @Body() body: { status: ReleaseStatus }) {
    return this.service.transition(id, body.status)
  }

  @Post('releases/:id/approve')
  @ApiOperation({ summary: '릴리스 승인 (테스트 통과 검증 후)' })
  approve(@Param('id') id: string) {
    return this.service.approve(id)
  }

  @Post('releases/:id/items')
  @ApiOperation({ summary: '릴리스에 Work Item 추가' })
  addItems(@Param('id') id: string, @Body() body: { workItemIds: string[] }) {
    return this.service.addWorkItems(id, body.workItemIds)
  }

  @Delete('releases/:releaseId/items/:workItemId')
  @ApiOperation({ summary: '릴리스에서 Work Item 제거' })
  removeItem(
    @Param('releaseId') releaseId: string,
    @Param('workItemId') workItemId: string,
  ) {
    return this.service.removeWorkItem(releaseId, workItemId)
  }

  @Post('releases/:id/builds')
  @ApiOperation({ summary: '빌드 트리거 (플랫폼별)' })
  triggerBuild(@Param('id') id: string, @Body() body: { platform: Platform }) {
    return this.service.triggerBuild(id, body.platform)
  }

  @Patch('builds/:id')
  @ApiOperation({ summary: '빌드 상태 업데이트 (내부/에이전트)' })
  updateBuild(
    @Param('id') id: string,
    @Body()
    body: {
      status?: BuildStatus
      buildLog?: string
      s3Key?: string
      cloudfrontUrl?: string
    },
  ) {
    return this.service.updateBuild(id, body)
  }

  @Post('releases/:id/deploy')
  @ApiOperation({ summary: '배포 파이프라인 실행 (테스트 검증 → 빌드 → S3 → 배포)' })
  deploy(@Param('id') id: string) {
    return this.pipeline.runPipeline(id)
  }

  @Post('releases/:id/rollback')
  @ApiOperation({ summary: '배포 롤백' })
  rollback(@Param('id') id: string) {
    return this.pipeline.rollback(id)
  }

  @Get('projects/:projectId/deploy-history')
  @ApiOperation({ summary: '배포 이력' })
  deployHistory(@Param('projectId') projectId: string) {
    return this.service.deployHistory(projectId)
  }
}
