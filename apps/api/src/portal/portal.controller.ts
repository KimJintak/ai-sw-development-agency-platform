import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { PortalService } from './portal.service'
import { ReportPdfService, type ReportData } from './report-pdf.service'
import { FeedbackService } from '../feedback/feedback.service'

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
  constructor(
    private readonly service: PortalService,
    private readonly feedback: FeedbackService,
    private readonly pdf: ReportPdfService,
  ) {}

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

  @Get('feedback')
  @ApiOperation({ summary: '내 피드백 처리 현황' })
  myFeedback(@CurrentUser() user: PortalUser) {
    return this.feedback.listByCustomer(user.customerId)
  }

  @Get('projects/:id/report')
  @ApiOperation({ summary: '납품 보고서 (JSON)' })
  report(@CurrentUser() user: PortalUser, @Param('id') id: string) {
    return this.service.deliveryReport(user.customerId, id)
  }

  @Get('projects/:id/report/pdf')
  @ApiOperation({ summary: '납품 보고서 (PDF 다운로드)' })
  async reportPdf(
    @CurrentUser() user: PortalUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const data = (await this.service.deliveryReport(user.customerId, id)) as unknown as ReportData
    const buffer = await this.pdf.generate(data)
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${id}.pdf"`,
      'Content-Length': buffer.length,
    })
    res.end(buffer)
  }

  @Get('projects/:id/qna')
  @ApiOperation({ summary: '내 프로젝트 Q&A 목록 (고객사 뷰)' })
  listQna(@CurrentUser() user: PortalUser, @Param('id') id: string) {
    return this.service.listQna(user.customerId, id)
  }

  @Post('projects/:id/qna')
  @ApiOperation({ summary: '질문 등록 (고객사 작성, 자동 태그 from-portal)' })
  createQna(
    @CurrentUser() user: PortalUser & { name?: string },
    @Param('id') id: string,
    @Body() body: { question: string; priority?: 'P0' | 'P1' | 'P2' | 'P3' },
  ) {
    return this.service.createQna(user.customerId, id, body, {
      id: user.id,
      name: user.name ?? user.email,
    })
  }
}
