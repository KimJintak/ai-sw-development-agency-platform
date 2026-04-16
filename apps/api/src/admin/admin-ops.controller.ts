import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { WatchlistService } from './watchlist.service'

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
    private readonly watchlist: WatchlistService,
  ) {}

  @Get('ops/summary')
  @ApiOperation({ summary: '조직 전체 운영 요약' })
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
  @ApiOperation({ summary: '크로스 프로젝트 피드 + 와치리스트 매칭 정보' })
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

    const [messages, keywords] = await Promise.all([
      this.ops.feed({
        limit: limit ? Number(limit) : undefined,
        before: before ? new Date(before) : undefined,
        projectId,
        kind,
        q,
      }),
      this.watchlist.listActive(),
    ])

    return messages.map((msg) => {
      const matched = this.watchlist.matchAll(
        msg.body,
        keywords.map((k) => ({ keyword: k.keyword, color: k.color })),
      )
      return {
        ...msg,
        watchMatches: matched.length > 0 ? matched : undefined,
      }
    })
  }

  @Get('ops/stalled')
  @ApiOperation({ summary: '지연 레이더' })
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
  @ApiOperation({ summary: '감사 로그' })
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

  // ── Watchlist CRUD ─────────────────────────────

  @Get('watchlist')
  @ApiOperation({ summary: '와치리스트 전체 목록' })
  async watchlistList(@CurrentUser() user: AuthUser, @Req() req: Request) {
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'admin.watchlist.list',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    return this.watchlist.list()
  }

  @Post('watchlist')
  @ApiOperation({ summary: '키워드 등록' })
  async watchlistCreate(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Body() body: { keyword: string; color?: string },
  ) {
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'admin.watchlist.create',
      params: { keyword: body.keyword, color: body.color },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    return this.watchlist.create({
      keyword: body.keyword,
      color: body.color,
      createdBy: user.id,
    })
  }

  @Patch('watchlist/:id')
  @ApiOperation({ summary: '키워드 수정 (색상/활성)' })
  async watchlistUpdate(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Body() body: { color?: string; active?: boolean },
  ) {
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'admin.watchlist.update',
      resource: id,
      params: body,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    return this.watchlist.update(id, body)
  }

  @Delete('watchlist/:id')
  @ApiOperation({ summary: '키워드 삭제' })
  async watchlistDelete(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'admin.watchlist.delete',
      resource: id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    return this.watchlist.remove(id)
  }
}
