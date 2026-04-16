import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CrmNotificationsService } from './crm-notifications.service'

@ApiTags('CRM Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/notifications')
export class CrmNotificationsController {
  constructor(private readonly service: CrmNotificationsService) {}

  @Get()
  @ApiOperation({ summary: '최근 7일 CRM 알림 (새 영업기회 + 계약 만료 예정)' })
  recent() {
    return this.service.getRecentAlerts()
  }

  @Get('check-expiring')
  @ApiOperation({ summary: '계약 만료 체크 수동 트리거 (테스트용)' })
  checkNow() {
    return this.service.checkExpiringContracts()
  }
}
