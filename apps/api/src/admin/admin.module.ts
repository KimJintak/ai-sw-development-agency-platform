import { Module } from '@nestjs/common'
import { AdminOpsController } from './admin-ops.controller'
import { AdminOpsService } from './admin-ops.service'
import { AdminAuditService } from './admin-audit.service'
import { WatchlistService } from './watchlist.service'
import { DashboardStatsController } from './dashboard-stats.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [AdminOpsController, DashboardStatsController],
  providers: [AdminOpsService, AdminAuditService, WatchlistService],
  exports: [AdminAuditService, WatchlistService],
})
export class AdminModule {}
