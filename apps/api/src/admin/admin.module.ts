import { Module } from '@nestjs/common'
import { AdminOpsController } from './admin-ops.controller'
import { AdminOpsService } from './admin-ops.service'
import { AdminAuditService } from './admin-audit.service'
import { WatchlistService } from './watchlist.service'

@Module({
  controllers: [AdminOpsController],
  providers: [AdminOpsService, AdminAuditService, WatchlistService],
  exports: [AdminAuditService, WatchlistService],
})
export class AdminModule {}
