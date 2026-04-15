import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
  forwardRef,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ChatAuthorType, ChatMessageKind } from '@prisma/client'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { CreateChatMessageDto, MarkReadDto } from './dto/chat.dto'
import { parseTaskCommand } from './slash-commands'
import { AgentsService } from '../agents/agents.service'
import { AgentTypeDto } from '../agents/dto/create-agent-task.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

interface AuthUser {
  id: string
  email: string
  name?: string
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ChatController {
  constructor(
    private readonly service: ChatService,
    private readonly gateway: ChatGateway,
    @Inject(forwardRef(() => AgentsService))
    private readonly agents: AgentsService,
  ) {}

  @Get('chat/inbox')
  @ApiOperation({ summary: '통합 인박스 — 내가 속한 모든 프로젝트의 미읽음/최근 메시지' })
  inbox(@CurrentUser() user: AuthUser) {
    return this.service.inbox(user.id)
  }

  @Get('projects/:projectId/chat')
  @ApiOperation({ summary: '프로젝트 채팅 메시지 목록 (최신순, before 커서로 페이지네이션)' })
  async list(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    if (user) await this.service.assertProjectAccess(projectId, user.id)
    return this.service.list(projectId, {
      limit: limit ? Number(limit) : undefined,
      before: before ? new Date(before) : undefined,
    })
  }

  @Post('projects/:projectId/chat')
  @ApiOperation({ summary: '프로젝트 채팅 메시지 전송' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateChatMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.service.assertProjectAccess(projectId, user.id)
    const message = await this.service.create(
      projectId,
      { id: user.id, name: user.name ?? user.email, type: ChatAuthorType.USER },
      dto,
    )
    this.gateway.broadcastMessage(projectId, message)

    if (dto.kind === ChatMessageKind.COMMAND || dto.body.startsWith('/')) {
      void this.handleSlashCommand(projectId, user.id, dto.body)
    }

    return message
  }

  private async handleSlashCommand(projectId: string, userId: string, body: string) {
    const parsed = parseTaskCommand(body)
    if (!parsed) {
      const echo = await this.service.postSystem(projectId, {
        body: `알 수 없는 명령어입니다. 사용법: /task @AGENT_TYPE task_type [REF-ID]`,
        kind: ChatMessageKind.STATUS,
      })
      this.gateway.broadcastMessage(projectId, echo)
      return
    }
    try {
      if (!(parsed.agentType in AgentTypeDto)) {
        throw new Error(`알 수 없는 에이전트 타입: ${parsed.agentType}`)
      }
      const task = await this.agents.createTask({
        agentType: parsed.agentType as AgentTypeDto,
        taskType: parsed.taskType,
        projectId,
        userId,
        payload: parsed.ref ? { ref: parsed.ref } : {},
      })
      const echo = await this.service.postSystem(projectId, {
        body: `태스크 디스패치 완료 → @${parsed.agentType} · ${parsed.taskType}${
          parsed.ref ? ' · ' + parsed.ref : ''
        }`,
        kind: ChatMessageKind.STATUS,
        metadata: { taskId: task.id, agentType: parsed.agentType, ref: parsed.ref },
      })
      this.gateway.broadcastMessage(projectId, echo)
    } catch (err) {
      const echo = await this.service.postSystem(projectId, {
        body: `디스패치 실패: ${(err as Error).message}`,
        kind: ChatMessageKind.STATUS,
      })
      this.gateway.broadcastMessage(projectId, echo)
    }
  }

  @Post('projects/:projectId/chat/read')
  @ApiOperation({ summary: '프로젝트 채팅 미읽음 커서 업데이트' })
  async markRead(
    @Param('projectId') projectId: string,
    @Body() dto: MarkReadDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.service.assertProjectAccess(projectId, user.id)
    return this.service.markRead(
      projectId,
      user.id,
      dto.lastReadAt ? new Date(dto.lastReadAt) : undefined,
    )
  }
}
