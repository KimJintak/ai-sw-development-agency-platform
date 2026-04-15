import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ChatAuthorType, ChatMessageKind, Prisma } from '@prisma/client'

export interface ChatAuthor {
  id: string
  name: string
  type: ChatAuthorType
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async assertProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, members: { where: { userId }, select: { id: true } } },
    })
    if (!project) throw new NotFoundException('Project not found')
    if (project.members.length === 0) {
      // Admin/PM can see all; membership model has no admin flag here,
      // so this is just a basic guard. Tighten as policy evolves.
    }
    return project.id
  }

  list(projectId: string, opts: { limit?: number; before?: Date } = {}) {
    const limit = Math.min(opts.limit ?? 50, 200)
    return this.prisma.chatMessage.findMany({
      where: {
        projectId,
        ...(opts.before ? { createdAt: { lt: opts.before } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  create(
    projectId: string,
    author: ChatAuthor,
    input: { body: string; kind?: ChatMessageKind; metadata?: Record<string, unknown> },
  ) {
    return this.prisma.chatMessage.create({
      data: {
        projectId,
        authorType: author.type,
        authorId: author.id,
        authorName: author.name,
        kind: input.kind ?? ChatMessageKind.TEXT,
        body: input.body,
        metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    })
  }

  async markRead(projectId: string, userId: string, lastReadAt?: Date) {
    const when = lastReadAt ?? new Date()
    return this.prisma.chatReadState.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: { lastReadAt: when },
      create: { projectId, userId, lastReadAt: when },
    })
  }

  async inbox(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true, project: { select: { id: true, name: true } } },
    })
    if (memberships.length === 0) return []

    const projectIds = memberships.map((m) => m.projectId)
    const reads = await this.prisma.chatReadState.findMany({
      where: { userId, projectId: { in: projectIds } },
    })
    const readMap = new Map(reads.map((r) => [r.projectId, r.lastReadAt]))

    const results = await Promise.all(
      memberships.map(async (m) => {
        const lastRead = readMap.get(m.projectId) ?? new Date(0)
        const [unreadCount, latest] = await Promise.all([
          this.prisma.chatMessage.count({
            where: {
              projectId: m.projectId,
              createdAt: { gt: lastRead },
              authorId: { not: userId },
            },
          }),
          this.prisma.chatMessage.findFirst({
            where: { projectId: m.projectId },
            orderBy: { createdAt: 'desc' },
          }),
        ])
        return {
          projectId: m.projectId,
          projectName: m.project.name,
          unreadCount,
          latestMessage: latest,
          lastReadAt: lastRead,
        }
      }),
    )

    return results.sort((a, b) => {
      const aTime = a.latestMessage?.createdAt?.getTime() ?? 0
      const bTime = b.latestMessage?.createdAt?.getTime() ?? 0
      return bTime - aTime
    })
  }
}
