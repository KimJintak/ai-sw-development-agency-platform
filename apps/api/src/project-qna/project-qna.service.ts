import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationType, Priority, QnaStatus, WorkItemStatus, WorkItemType } from '@prisma/client'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class ProjectQnaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list(projectId: string, status?: QnaStatus) {
    return this.prisma.projectQna.findMany({
      where: { projectId, ...(status ? { status } : {}) },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })
  }

  create(input: {
    projectId: string
    question: string
    priority?: Priority
    tags?: string[]
    askedBy?: string
    askedByName?: string
  }) {
    return this.prisma.projectQna.create({
      data: {
        projectId: input.projectId,
        question: input.question,
        priority: input.priority ?? 'P2',
        tags: input.tags ?? [],
        askedBy: input.askedBy,
        askedByName: input.askedByName,
        status: QnaStatus.OPEN,
      },
    })
  }

  async answer(
    id: string,
    input: { answer: string; answeredBy?: string; answeredByName?: string },
  ) {
    const qna = await this.findOrFail(id)
    const updated = await this.prisma.projectQna.update({
      where: { id },
      data: {
        answer: input.answer,
        answeredBy: input.answeredBy,
        answeredByName: input.answeredByName,
        answeredAt: new Date(),
        status: QnaStatus.ANSWERED,
      },
    })

    // 질문 등록자에게 답변 알림 (포털 유저인 경우)
    if (qna.askedBy) {
      const portalUser = await this.prisma.portalUser.findUnique({
        where: { id: qna.askedBy },
        select: { id: true },
      })
      if (portalUser) {
        await this.notifications
          .createPortal(
            portalUser.id,
            NotificationType.QNA_ANSWERED,
            'Q&A 답변이 등록되었습니다',
            qna.question.slice(0, 80),
            `/portal/${qna.projectId}`,
          )
          .catch(() => null)
      }
    }

    return updated
  }

  async updateStatus(id: string, status: QnaStatus) {
    await this.findOrFail(id)
    return this.prisma.projectQna.update({ where: { id }, data: { status } })
  }

  async update(
    id: string,
    input: Partial<{ question: string; priority: Priority; tags: string[] }>,
  ) {
    await this.findOrFail(id)
    return this.prisma.projectQna.update({ where: { id }, data: input })
  }

  async remove(id: string) {
    await this.findOrFail(id)
    return this.prisma.projectQna.delete({ where: { id } })
  }

  /**
   * Promote a Q&A into an actionable WorkItem — used when a client question
   * turns into a change request. Creates the WorkItem in the same project,
   * copies the question text into the title + description, maps QnA priority
   * to WorkItem priority, and records workItemId back on the Q&A for
   * bidirectional traceability.
   */
  async promoteToWorkItem(id: string, overrides?: { type?: WorkItemType; title?: string }) {
    const qna = await this.findOrFail(id)
    if (qna.workItemId) {
      throw new BadRequestException(`이미 Work Item #${qna.workItemId} 에 연결되어 있습니다.`)
    }

    const title = overrides?.title?.trim() || qna.question.slice(0, 120)
    const description = [
      `## 원본 질문`,
      qna.question,
      qna.answer ? `\n## 답변\n${qna.answer}` : '',
      `\n---\n*Q&A #${qna.id} 에서 승격됨*`,
    ].join('\n')

    const workItem = await this.prisma.workItem.create({
      data: {
        projectId: qna.projectId,
        title,
        description,
        type: overrides?.type ?? WorkItemType.STORY,
        status: WorkItemStatus.BACKLOG,
        priority: qna.priority,
      },
    })

    await this.prisma.projectQna.update({
      where: { id },
      data: { workItemId: workItem.id, status: QnaStatus.RESOLVED },
    })

    return { workItem, qnaId: id }
  }

  private async findOrFail(id: string) {
    const row = await this.prisma.projectQna.findUnique({ where: { id } })
    if (!row) throw new NotFoundException(`ProjectQna ${id} not found`)
    return row
  }
}
