import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Portal Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portal/notifications')
export class PortalNotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List portal notifications for current portal user' })
  list(@CurrentUser() user: { id: string }, @Query('unread') unread?: string) {
    return this.svc.findForPortalUser(user.id, unread === 'true')
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread portal notification count' })
  async unreadCount(@CurrentUser() user: { id: string }) {
    const count = await this.svc.portalUnreadCount(user.id)
    return { count }
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a portal notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.markPortalRead(id, user.id)
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all portal notifications as read' })
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.svc.markAllPortalRead(user.id)
  }
}
