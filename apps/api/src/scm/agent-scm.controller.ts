import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ChatMessageKind } from '@prisma/client'
import { GitHubService } from './github.service'
import { OrchestratorAuthGuard } from '../common/guards/orchestrator-auth.guard'
import { ChatService } from '../chat/chat.service'
import { ChatGateway } from '../chat/chat.gateway'

interface CommitFile {
  path: string
  content: string
  message?: string
}

/**
 * Internal endpoints used by agents/orchestrator to publish generated
 * code as a branch + PR in one call. Protected by Bearer
 * ORCHESTRATOR_SECRET so end users cannot hit them.
 */
@ApiTags('Internal SCM')
@UseGuards(OrchestratorAuthGuard)
@Controller('internal/scm')
export class AgentScmController {
  constructor(
    private readonly gh: GitHubService,
    private readonly chat: ChatService,
    private readonly chatGw: ChatGateway,
  ) {}

  @Post('projects/:id/commit-pr')
  @ApiOperation({
    summary:
      '에이전트가 생성한 파일들을 새 브랜치에 커밋 + PR 생성 (단일 호출)',
  })
  async commitAndPr(
    @Param('id') projectId: string,
    @Body()
    body: {
      branch: string
      baseBranch?: string
      files: CommitFile[]
      prTitle: string
      prBody: string
      draft?: boolean
      agentName?: string
    },
  ) {
    const result = await this.gh.commitAndPullRequest(projectId, body)

    const msg = await this.chat.postAgent(
      projectId,
      { id: 'agent-scm', name: body.agentName ?? 'SCM Bot' },
      {
        body: `PR #${result.pr.number} 자동 생성 — "${body.prTitle}" (${result.branch})\n${result.pr.htmlUrl}`,
        kind: ChatMessageKind.AGENT_UPDATE,
        metadata: {
          prNumber: result.pr.number,
          branch: result.branch,
          commitSha: result.commitSha,
          htmlUrl: result.pr.htmlUrl,
        },
      },
    )
    this.chatGw.broadcastMessage(projectId, msg)

    return result
  }
}
