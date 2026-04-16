import { Module } from '@nestjs/common'
import { AdminOpsController } from './admin-ops.controller'
import { AdminOpsService } from './admin-ops.service'
import { AdminAuditService } from './admin-audit.service'

@Module({
  controllers: [AdminOpsController],
  providers: [AdminOpsService, AdminAuditService],
  exports: [AdminAuditService],
})
export class AdminModule {}
