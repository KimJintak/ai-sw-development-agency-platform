import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ChatAuthorType } from '@prisma/client'
import { ChatService } from './chat.service'
import { CreateChatMessageDto, MarkReadDto } from './dto/chat.dto'
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
  constructor(private readonly service: ChatService) {}

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
    return this.service.create(
      projectId,
      { id: user.id, name: user.name ?? user.email, type: ChatAuthorType.USER },
      dto,
    )
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
