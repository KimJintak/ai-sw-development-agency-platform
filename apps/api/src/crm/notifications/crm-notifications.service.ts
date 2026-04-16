import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { ChatService } from '../../chat/chat.service'
import { ChatGateway } from '../../chat/chat.gateway'
import { ChatMessageKind } from '@prisma/client'

export interface CrmAlert {
  type: 'new_opportunity' | 'contract_expiring'
  title: string
  detail: string
  projectId?: string | null
}

@Injectable()
export class CrmNotificationsService {
  private readonly logger = new Logger(CrmNotificationsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly chat: ChatService,
    private readonly chatGw: ChatGateway,
  ) {}

  async onNewOpportunity(oppId: string) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { id: oppId },
      include: { customer: { select: { companyName: true } } },
    })
    if (!opp) return

    const alert: CrmAlert = {
      type: 'new_opportunity',
      title: `새 영업 기회: ${opp.title}`,
      detail: `고객: ${opp.customer.companyName} | 예상 금액: ${opp.estimatedValue ?? '미정'} | 마감: ${
        opp.expectedCloseDate ? opp.expectedCloseDate.toLocaleDateString('ko-KR') : '미정'
      }`,
    }

    await this.broadcastToAllPmProjects(alert)
    this.logger.log(`CRM alert: new opportunity ${oppId}`)
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringContracts() {
    const now = new Date()
    const thresholds = [
      { days: 30, label: '30일 후' },
      { days: 7, label: '7일 후' },
      { days: 1, label: '내일' },
    ]

    for (const { days, label } of thresholds) {
      const target = new Date(now)
      target.setDate(target.getDate() + days)
      const dayStart = new Date(target.getFullYear(), target.getMonth(), target.getDate())
      const dayEnd = new Date(dayStart.getTime() + 86400000)

      const expiring = await this.prisma.contract.findMany({
        where: { deadlineDate: { gte: dayStart, lt: dayEnd } },
        include: {
          opportunity: { include: { customer: { select: { companyName: true } } } },
          project: { select: { id: true, name: true } },
        },
      })

      for (const c of expiring) {
        const alert: CrmAlert = {
          type: 'contract_expiring',
          title: `계약 만료 예정 (${label})`,
          detail: `고객: ${c.opportunity.customer.companyName} | 금액: ${c.amount} ${c.currency} | 만료일: ${c.deadlineDate.toLocaleDateString('ko-KR')}`,
          projectId: c.project?.id,
        }

        if (c.project?.id) {
          await this.postProjectChat(c.project.id, alert)
        }
        await this.broadcastToAllPmProjects(alert)
        this.logger.log(`CRM alert: contract ${c.id} expiring in ${days} days`)
      }
    }
  }

  async getRecentAlerts(): Promise<CrmAlert[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)

    const [newOpps, expiringContracts] = await Promise.all([
      this.prisma.opportunity.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        include: { customer: { select: { companyName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.contract.findMany({
        where: {
          deadlineDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) },
        },
        include: {
          opportunity: { include: { customer: { select: { companyName: true } } } },
        },
        orderBy: { deadlineDate: 'asc' },
        take: 10,
      }),
    ])

    const alerts: CrmAlert[] = [
      ...newOpps.map((o) => ({
        type: 'new_opportunity' as const,
        title: `새 영업 기회: ${o.title}`,
        detail: `고객: ${o.customer.companyName}`,
      })),
      ...expiringContracts.map((c) => ({
        type: 'contract_expiring' as const,
        title: `계약 만료 예정`,
        detail: `${c.opportunity.customer.companyName} — ${c.deadlineDate.toLocaleDateString('ko-KR')}`,
        projectId: c.projectId,
      })),
    ]
    return alerts
  }

  private async postProjectChat(projectId: string, alert: CrmAlert) {
    try {
      const msg = await this.chat.postSystem(projectId, {
        body: `[CRM] ${alert.title}\n${alert.detail}`,
        kind: ChatMessageKind.STATUS,
      })
      this.chatGw.broadcastMessage(projectId, msg)
    } catch {}
  }

  private async broadcastToAllPmProjects(alert: CrmAlert) {
    const projects = await this.prisma.project.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
      take: 10,
    })
    for (const p of projects) {
      await this.postProjectChat(p.id, alert)
    }
  }
}
