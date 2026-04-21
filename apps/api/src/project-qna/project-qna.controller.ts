import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Priority, QnaStatus } from '@prisma/client'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { ProjectQnaService } from './project-qna.service'

interface AuthUser {
  id: string
  email: string
  name?: string
}

@ApiTags('Project Q&A')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectQnaController {
  constructor(private readonly service: ProjectQnaService) {}

  @Get('projects/:projectId/qna')
  @ApiOperation({ summary: 'Q&A 목록 (status 필터 가능)' })
  list(
    @Param('projectId') projectId: string,
    @Query('status') status?: QnaStatus,
  ) {
    return this.service.list(projectId, status)
  }

  @Post('projects/:projectId/qna')
  @ApiOperation({ summary: '질문 등록' })
  create(
    @Param('projectId') projectId: string,
    @Body() body: { question: string; priority?: Priority; tags?: string[] },
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create({
      projectId,
      ...body,
      askedBy: user.id,
      askedByName: user.name ?? user.email,
    })
  }

  @Post('project-qna/:id/answer')
  @ApiOperation({ summary: '답변 작성 (status → ANSWERED)' })
  answer(
    @Param('id') id: string,
    @Body() body: { answer: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.answer(id, {
      answer: body.answer,
      answeredBy: user.id,
      answeredByName: user.name ?? user.email,
    })
  }

  @Patch('project-qna/:id/status')
  @ApiOperation({ summary: '상태 변경 (OPEN/ANSWERED/RESOLVED/PARKED)' })
  status(@Param('id') id: string, @Body() body: { status: QnaStatus }) {
    return this.service.updateStatus(id, body.status)
  }

  @Patch('project-qna/:id')
  @ApiOperation({ summary: '질문/우선순위/태그 수정' })
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ question: string; priority: Priority; tags: string[] }>,
  ) {
    return this.service.update(id, body)
  }

  @Delete('project-qna/:id')
  @ApiOperation({ summary: 'Q&A 삭제' })
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
