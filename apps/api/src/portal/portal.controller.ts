import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { PortalService } from './portal.service'

interface PortalUser {
  id: string
  email: string
  customerId: string
}

@ApiTags('Client Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portal')
export class PortalController {
  constructor(private readonly service: PortalService) {}

  @Get('projects')
  @ApiOperation({ summary: '내 고객사 프로젝트 목록' })
  myProjects(@CurrentUser() user: PortalUser) {
    return this.service.myProjects(user.customerId)
  }

  @Get('projects/:id/progress')
  @ApiOperation({ summary: '프로젝트 진척률 + 최근 릴리스' })
  progress(@CurrentUser() user: PortalUser, @Param('id') id: string) {
    return this.service.projectProgress(user.customerId, id)
  }

  @Get('projects/:id/builds')
  @ApiOperation({ summary: '다운로드 가능한 빌드 목록' })
  builds(@CurrentUser() user: PortalUser, @Param('id') id: string) {
    return this.service.projectBuilds(user.customerId, id)
  }

  @Get('projects/:id/requirements')
  @ApiOperation({ summary: '요구사항 목록 (승인/반려 가능)' })
  requirements(@CurrentUser() user: PortalUser, @Param('id') id: string) {
    return this.service.projectRequirements(user.customerId, id)
  }

  @Post('requirements/:id/approve')
  @ApiOperation({ summary: '요구사항 승인' })
  approveRequirement(@CurrentUser() user: PortalUser, @Param('id') id: string) {
    return this.service.approveRequirement(user.customerId, id)
  }

  @Post('requirements/:id/reject')
  @ApiOperation({ summary: '요구사항 반려' })
  rejectRequirement(
    @CurrentUser() user: PortalUser,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.service.rejectRequirement(user.customerId, id, body.reason)
  }

  @Get('projects/:id/report')
  @ApiOperation({ summary: '납품 보고서 (진척 요약, 요구사항, 릴리스, 테스트, 빌드)' })
  report(@CurrentUser() user: PortalUser, @Param('id') id: string) {
    return this.service.deliveryReport(user.customerId, id)
  }
}
