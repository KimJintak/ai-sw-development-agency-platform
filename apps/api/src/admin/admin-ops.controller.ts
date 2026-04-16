import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { ChatMessageKind, UserRole } from '@prisma/client'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AdminOpsService } from './admin-ops.service'
import { AdminAuditService } from './admin-audit.service'

interface AuthUser {
  id: string
  email: string
  role: UserRole
}

@ApiTags('Admin Ops')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminOpsController {
  constructor(
    private readonly ops: AdminOpsService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('ops/summary')
  @ApiOperation({ summary: '조직 전체 운영 요약 (활성 프로젝트 수, 24h 메시지, 활성 태스크)' })
  async summary(@CurrentUser() user: AuthUser, @Req() req: Request) {
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'admin.ops.summary',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    return this.ops.summary()
  }

  @Get('ops/feed')
  @ApiOperation({ summary: '크로스 프로젝트 채팅/에이전트 이벤트 피드 (시간 역순)' })
  async feed(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @Query('projectId') projectId?: string,
    @Query('kind') kind?: ChatMessageKind,
    @Query('q') q?: string,
  ) {
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'admin.ops.feed',
      resource: projectId,
      params: { kind, q, limit },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    return this.ops.feed({
      limit: limit ? Number(limit) : undefined,
      before: before ? new Date(before) : undefined,
      projectId,
      kind,
      q,
    })
  }

  @Get('ops/stalled')
  @ApiOperation({
    summary: '지연 레이더 — SUBMITTED/WORKING 상태로 N분 이상 완료되지 않은 태스크',
  })
  async stalled(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Query('minutes') minutes?: string,
  ) {
    const threshold = minutes ? Number(minutes) : 15
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'admin.ops.stalled',
      params: { threshold },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    return this.ops.stalledTasks(threshold)
  }

  @Get('audit')
  @ApiOperation({ summary: '관리자 활동 감사 로그 (관리자 본인도 이 목록에 기록됨)' })
  async auditList(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    const result = await this.audit.list({
      limit: limit ? Number(limit) : undefined,
      before: before ? new Date(before) : undefined,
      userId,
      action,
    })
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'admin.audit.list',
      params: { userId, action },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    return result
  }
}
