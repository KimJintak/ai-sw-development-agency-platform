import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { FeedbackSource, FeedbackStatus } from '@prisma/client'
import { FeedbackService } from './feedback.service'
import { ChatService } from '../chat/chat.service'
import { ChatGateway } from '../chat/chat.gateway'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class FeedbackController {
  constructor(
    private readonly service: FeedbackService,
    private readonly chat: ChatService,
    private readonly chatGw: ChatGateway,
  ) {}

  @Get('projects/:projectId/feedback')
  @ApiOperation({ summary: '프로젝트 피드백 목록' })
  list(
    @Param('projectId') projectId: string,
    @Query('status') status?: FeedbackStatus,
    @Query('limit') limit?: string,
  ) {
    return this.service.list(projectId, {
      status,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @Get('feedback/:id')
  @ApiOperation({ summary: '피드백 상세' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post('projects/:projectId/feedback')
  @ApiOperation({ summary: '피드백 제출 (자동 분류 + P0/P1 시 Work Item 자동 생성)' })
  async create(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      source: FeedbackSource
      title: string
      body: string
      sentryEventId?: string
    },
  ) {
    const fb = await this.service.create({ projectId, ...body })

    try {
      const msg = await this.chat.postSystem(projectId, {
        body: `새 피드백 [${fb.type ?? '?'}/${fb.severity ?? '?'}] — ${fb.title}${
          fb.workItemId ? ' → WorkItem 자동 생성됨' : ''
        }`,
        kind: 'STATUS',
      })
      this.chatGw.broadcastMessage(projectId, msg)
    } catch {}

    return fb
  }

  @Patch('feedback/:id/status')
  @ApiOperation({ summary: '피드백 상태 변경' })
  updateStatus(@Param('id') id: string, @Body() body: { status: FeedbackStatus }) {
    return this.service.updateStatus(id, body.status)
  }

  @Post('feedback/:id/retriage')
  @ApiOperation({ summary: '재분류 (type/severity 재계산)' })
  retriage(@Param('id') id: string) {
    return this.service.triage(id)
  }
}
