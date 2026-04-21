import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationType } from '@prisma/client'

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findForUser(userId: string, onlyUnread = false) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId, ...(onlyUnread ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { recipientId: userId, read: false } })
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { read: true },
    })
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId: userId, read: false },
      data: { read: true },
    })
  }

  async create(
    recipientId: string,
    type: NotificationType,
    title: string,
    body: string,
    link?: string,
  ) {
    return this.prisma.notification.create({
      data: { recipientId, type, title, body, link },
    })
  }

  // ── Portal ──

  async findForPortalUser(portalUserId: string, onlyUnread = false) {
    return this.prisma.portalNotification.findMany({
      where: { portalUserId, ...(onlyUnread ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async portalUnreadCount(portalUserId: string) {
    return this.prisma.portalNotification.count({ where: { portalUserId, read: false } })
  }

  async markPortalRead(id: string, portalUserId: string) {
    return this.prisma.portalNotification.updateMany({
      where: { id, portalUserId },
      data: { read: true },
    })
  }

  async markAllPortalRead(portalUserId: string) {
    return this.prisma.portalNotification.updateMany({
      where: { portalUserId, read: false },
      data: { read: true },
    })
  }

  async createPortal(
    portalUserId: string,
    type: NotificationType,
    title: string,
    body: string,
    link?: string,
  ) {
    return this.prisma.portalNotification.create({
      data: { portalUserId, type, title, body, link },
    })
  }
}
