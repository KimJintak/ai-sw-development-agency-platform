import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import {
  FeedbackSource,
  FeedbackStatus,
  FeedbackType,
  Priority,
  Prisma,
  WorkItemStatus,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

export interface CreateFeedbackInput {
  projectId: string
  source: FeedbackSource
  title: string
  body: string
  sentryEventId?: string
}

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name)

  constructor(private readonly prisma: PrismaService) {}

  list(projectId: string, opts: { status?: FeedbackStatus; limit?: number } = {}) {
    return this.prisma.feedback.findMany({
      where: {
        projectId,
        ...(opts.status ? { status: opts.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(opts.limit ?? 100, 500),
    })
  }

  async findOne(id: string) {
    const fb = await this.prisma.feedback.findUnique({
      where: { id },
      include: { workItem: { select: { id: true, title: true, status: true } } },
    })
    if (!fb) throw new NotFoundException(`Feedback ${id} not found`)
    return fb
  }

  async create(input: CreateFeedbackInput) {
    const fb = await this.prisma.feedback.create({
      data: {
        projectId: input.projectId,
        source: input.source,
        title: input.title,
        body: input.body,
        sentryEventId: input.sentryEventId,
      },
    })
    return this.triage(fb.id)
  }

  async triage(id: string) {
    const fb = await this.findOne(id)
    const type = this.classifyType(fb.title, fb.body)
    const severity = this.classifySeverity(fb.title, fb.body, fb.source)

    const updated = await this.prisma.feedback.update({
      where: { id },
      data: { type, severity, status: FeedbackStatus.TRIAGED },
    })

    if ((severity === 'P0' || severity === 'P1') && !fb.workItemId) {
      await this.autoCreateWorkItem(updated)
    }

    return updated
  }

  async updateStatus(id: string, status: FeedbackStatus) {
    await this.findOne(id)
    return this.prisma.feedback.update({
      where: { id },
      data: {
        status,
        ...(status === FeedbackStatus.RESOLVED ? { resolvedAt: new Date() } : {}),
      },
    })
  }

  async listByCustomer(customerId: string) {
    return this.prisma.feedback.findMany({
      where: { project: { customerId } },
      include: {
        project: { select: { id: true, name: true } },
        workItem: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  private classifyType(title: string, body: string): FeedbackType {
    const text = `${title} ${body}`.toLowerCase()
    if (/crash|error|exception|bug|실패|오류|크래시/.test(text)) return FeedbackType.BUG
    if (/feature|기능|추가|신규/.test(text)) return FeedbackType.FEATURE
    if (/질문|문의|how|어떻게/.test(text)) return FeedbackType.QUESTION
    return FeedbackType.IMPROVEMENT
  }

  private classifySeverity(title: string, body: string, source: FeedbackSource): Priority {
    const text = `${title} ${body}`.toLowerCase()
    if (source === FeedbackSource.SENTRY || /crash|p0|긴급|critical/.test(text)) return 'P0'
    if (/높음|p1|urgent|important|블로커/.test(text)) return 'P1'
    if (/보통|p2|moderate/.test(text)) return 'P2'
    return 'P3'
  }

  private async autoCreateWorkItem(fb: {
    id: string
    projectId: string
    title: string
    body: string
    type: FeedbackType | null
    severity: Priority | null
  }) {
    try {
      const workItem = await this.prisma.workItem.create({
        data: {
          projectId: fb.projectId,
          title: `[${fb.type ?? 'FEEDBACK'}] ${fb.title}`,
          description: fb.body,
          type: fb.type === FeedbackType.BUG ? 'TASK' : 'STORY',
          status: WorkItemStatus.BACKLOG,
          priority: fb.severity ?? 'P2',
          platforms: [],
        },
      })
      await this.prisma.feedback.update({
        where: { id: fb.id },
        data: { workItemId: workItem.id, status: FeedbackStatus.IN_PROGRESS },
      })
      this.logger.log(`Auto-created WorkItem ${workItem.id} for feedback ${fb.id} (${fb.severity})`)
    } catch (err) {
      this.logger.error(`Auto-create WorkItem failed for feedback ${fb.id}: ${(err as Error).message}`)
    }
  }
}
