import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name)

  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    userId: string
    userEmail: string
    action: string
    resource?: string
    params?: Record<string, unknown>
    ip?: string
    userAgent?: string
  }) {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          userId: input.userId,
          userEmail: input.userEmail,
          action: input.action,
          resource: input.resource,
          params: (input.params ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          ip: input.ip,
          userAgent: input.userAgent,
        },
      })
    } catch (err) {
      this.logger.warn(`audit log write failed: ${(err as Error).message}`)
    }
  }

  list(opts: { limit?: number; before?: Date; userId?: string; action?: string } = {}) {
    const limit = Math.min(opts.limit ?? 100, 500)
    return this.prisma.adminAuditLog.findMany({
      where: {
        ...(opts.userId ? { userId: opts.userId } : {}),
        ...(opts.action ? { action: opts.action } : {}),
        ...(opts.before ? { createdAt: { lt: opts.before } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}
