import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { BuildStatus, ChatMessageKind, Platform, ReleaseStatus } from '@prisma/client'
import { ReleasesService } from './releases.service'
import { ChatService } from '../chat/chat.service'
import { ChatGateway } from '../chat/chat.gateway'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DeployPipelineService {
  private readonly logger = new Logger(DeployPipelineService.name)

  constructor(
    private readonly releases: ReleasesService,
    private readonly chat: ChatService,
    private readonly chatGw: ChatGateway,
    private readonly prisma: PrismaService,
  ) {}

  async runPipeline(releaseId: string) {
    const release = await this.releases.findOne(releaseId)
    if (release.status !== ReleaseStatus.APPROVED) {
      throw new BadRequestException(`Release must be APPROVED before deploy. Current: ${release.status}`)
    }

    await this.releases.transition(releaseId, ReleaseStatus.DEPLOYING)
    await this.postChat(release.projectId, `배포 파이프라인 시작 — ${release.version}`)

    const testsOk = await this.verifyTests(release)
    if (!testsOk) {
      await this.postChat(release.projectId, `배포 중단 ✗ — 테스트 미통과`)
      await this.releases.transition(releaseId, ReleaseStatus.ROLLED_BACK)
      return { success: false, reason: 'tests_not_passed' }
    }
    await this.postChat(release.projectId, `테스트 검증 통과 ✓`)

    const buildResults = await this.buildAllPlatforms(release.id, release.platforms, release.projectId)
    const failedBuilds = buildResults.filter((b) => !b.success)
    if (failedBuilds.length > 0) {
      await this.postChat(
        release.projectId,
        `빌드 실패 ✗ — ${failedBuilds.map((b) => b.platform).join(', ')}`,
      )
      return { success: false, reason: 'build_failed', failedBuilds }
    }
    await this.postChat(release.projectId, `전 플랫폼 빌드 성공 ✓ (${release.platforms.join(', ')})`)

    await this.releases.transition(releaseId, ReleaseStatus.DEPLOYED)
    await this.postChat(
      release.projectId,
      `${release.version} 배포 완료 ✓ — ${release.platforms.length}개 플랫폼`,
    )

    return { success: true, builds: buildResults }
  }

  async rollback(releaseId: string) {
    const release = await this.releases.findOne(releaseId)
    if (release.status !== ReleaseStatus.DEPLOYED && release.status !== ReleaseStatus.DEPLOYING) {
      throw new BadRequestException(`Rollback only from DEPLOYED or DEPLOYING. Current: ${release.status}`)
    }
    await this.releases.transition(releaseId, ReleaseStatus.ROLLED_BACK)
    await this.postChat(release.projectId, `${release.version} 롤백 완료 ↩`)
    return { success: true }
  }

  private async verifyTests(release: {
    testRuns: { status: string }[]
  }): Promise<boolean> {
    if (release.testRuns.length === 0) return true
    return release.testRuns.every((r) => r.status === 'COMPLETED')
  }

  private async buildAllPlatforms(
    releaseId: string,
    platforms: Platform[],
    projectId: string,
  ) {
    const results: { platform: Platform; success: boolean; buildId: string }[] = []

    for (const platform of platforms) {
      const build = await this.releases.triggerBuild(releaseId, platform)
      await this.releases.updateBuild(build.id, { status: BuildStatus.BUILDING })
      await this.postChat(projectId, `빌드 진행 중... [${platform}]`)

      // Simulated build — in production, DEPLOY agent would handle this
      const simSuccess = true
      const s3Key = `releases/${releaseId}/${platform}/${Date.now()}.zip`
      const cfUrl = `https://cdn.example.com/${s3Key}`

      await this.releases.updateBuild(build.id, {
        status: simSuccess ? BuildStatus.SUCCESS : BuildStatus.FAILED,
        s3Key: simSuccess ? s3Key : undefined,
        cloudfrontUrl: simSuccess ? cfUrl : undefined,
        buildLog: simSuccess ? `Build ${platform} completed successfully` : 'Build failed: timeout',
      })

      results.push({ platform, success: simSuccess, buildId: build.id })
    }

    return results
  }

  private async postChat(projectId: string, body: string) {
    try {
      const msg = await this.chat.postSystem(projectId, {
        body,
        kind: ChatMessageKind.STATUS,
      })
      this.chatGw.broadcastMessage(projectId, msg)
    } catch (err) {
      this.logger.warn(`deploy chat post failed: ${(err as Error).message}`)
    }
  }
}
