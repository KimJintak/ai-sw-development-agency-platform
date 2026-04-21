import { Module, Global } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { PortalNotificationsController } from './portal-notifications.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Global()
@Module({
  imports: [PrismaModule],
  providers: [NotificationsService],
  controllers: [NotificationsController, PortalNotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
