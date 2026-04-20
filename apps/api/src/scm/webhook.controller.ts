import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import * as crypto from 'crypto'
import { ChatMessageKind } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { ChatService } from '../chat/chat.service'
import { ChatGateway } from '../chat/chat.gateway'

interface PushPayload {
  ref: string
  repository: { full_name: string; html_url: string }
  pusher: { name: string }
  commits: { id: string; message: string; author: { name: string }; url: string }[]
  head_commit?: { id: string; message: string }
}

interface PullRequestPayload {
  action:
    | 'opened'
    | 'closed'
    | 'reopened'
    | 'ready_for_review'
    | 'synchronize'
    | 'edited'
    | 'review_requested'
  pull_request: {
    number: number
    title: string
    html_url: string
    merged: boolean
    user: { login: string }
    head: { ref: string }
    base: { ref: string }
    body: string | null
  }
  repository: { full_name: string }
}

interface ReviewPayload {
  action: 'submitted'
  review: { user: { login: string }; state: string; body: string | null; html_url: string }
  pull_request: { number: number; title: string; html_url: string }
  repository: { full_name: string }
}

@ApiTags('SCM Webhooks')
@Controller('webhooks/github')
export class GitHubWebhookController {
  private readonly logger = new Logger(GitHubWebhookController.name)
  private readonly secret: string | null

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly chat: ChatService,
    private readonly chatGw: ChatGateway,
  ) {
    this.secret = config.get<string>('GITHUB_WEBHOOK_SECRET') ?? null
    if (!this.secret) {
      this.logger.warn('GITHUB_WEBHOOK_SECRET unset — webhooks will accept unsigned payloads (dev only)')
    }
  }

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'GitHub webhook receiver (push / pull_request / pull_request_review)' })
  async receive(
    @Req() req: Request,
    @Headers('x-github-event') event: string | undefined,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() body: unknown,
  ) {
    if (this.secret) {
      const raw = JSON.stringify(body)
      if (!this.verifySignature(raw, signature)) {
        throw new BadRequestException('Invalid signature')
      }
    }

    if (!event) return { ok: true, reason: 'missing event header' }

    try {
      switch (event) {
        case 'push':
          await this.handlePush(body as PushPayload)
          break
        case 'pull_request':
          await this.handlePullRequest(body as PullRequestPayload)
          break
        case 'pull_request_review':
          await this.handleReview(body as ReviewPayload)
          break
        default:
          this.logger.debug(`Unhandled event: ${event}`)
      }
    } catch (err) {
      this.logger.error(`webhook ${event} failed: ${(err as Error).message}`)
    }

    return { ok: true }
  }

  private verifySignature(rawBody: string, signatureHeader: string | undefined): boolean {
    if (!signatureHeader || !this.secret) return false
    const [algo, sig] = signatureHeader.split('=')
    if (algo !== 'sha256' || !sig) return false
    const mac = crypto.createHmac('sha256', this.secret).update(rawBody).digest('hex')
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(mac))
    } catch {
      return false
    }
  }

  private async findProjectByRepo(fullName: string) {
    const projects = await this.prisma.project.findMany({
      where: { githubRepo: { not: null } },
      select: { id: true, name: true, githubRepo: true },
    })
    return projects.find((p) => {
      if (!p.githubRepo) return false
      const match = p.githubRepo.match(/([^/]+\/[^/\s]+?)(?:\.git)?$/)
      return match && match[1] === fullName
    })
  }

  private async postToProjectChat(projectId: string, body: string) {
    try {
      const msg = await this.chat.postSystem(projectId, {
        body: `[GitHub] ${body}`,
        kind: ChatMessageKind.STATUS,
      })
      this.chatGw.broadcastMessage(projectId, msg)
    } catch (err) {
      this.logger.warn(`chat post failed: ${(err as Error).message}`)
    }
  }

  private async handlePush(payload: PushPayload) {
    const project = await this.findProjectByRepo(payload.repository.full_name)
    if (!project) return
    const branch = payload.ref.replace(/^refs\/heads\//, '')
    const count = payload.commits.length
    const head = payload.head_commit?.message.split('\n')[0] ?? '—'
    await this.postToProjectChat(
      project.id,
      `push · ${payload.pusher.name} → ${branch} · ${count} commit(s) — "${head}"`,
    )
  }

  private async handlePullRequest(payload: PullRequestPayload) {
    const project = await this.findProjectByRepo(payload.repository.full_name)
    if (!project) return
    const pr = payload.pull_request
    let verb: string
    switch (payload.action) {
      case 'opened':
        verb = '🟢 열림'
        break
      case 'closed':
        verb = pr.merged ? '🟣 머지됨' : '🔴 닫힘'
        break
      case 'reopened':
        verb = '🟢 재오픈'
        break
      case 'ready_for_review':
        verb = '✅ 리뷰 대기'
        break
      case 'synchronize':
        verb = '🔄 업데이트'
        break
      default:
        return
    }
    await this.postToProjectChat(
      project.id,
      `PR #${pr.number} ${verb} — "${pr.title}" (${pr.head.ref} → ${pr.base.ref}) · ${pr.user.login}`,
    )
  }

  private async handleReview(payload: ReviewPayload) {
    const project = await this.findProjectByRepo(payload.repository.full_name)
    if (!project || payload.action !== 'submitted') return
    const state = payload.review.state
    const icon = state === 'approved' ? '✅' : state === 'changes_requested' ? '🛑' : '💬'
    await this.postToProjectChat(
      project.id,
      `PR #${payload.pull_request.number} 리뷰 ${icon} ${state} · ${payload.review.user.login}`,
    )
  }
}
