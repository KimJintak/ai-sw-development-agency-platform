import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { DocumentCategory, DocumentKind, UserRole } from '@prisma/client'
import { DocumentsService } from './documents.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get('projects/:projectId/documents')
  @ApiOperation({ summary: '프로젝트 문서 목록' })
  list(
    @Param('projectId') projectId: string,
    @Query('category') category?: DocumentCategory,
  ) {
    return this.service.list(projectId, category)
  }

  @Post('projects/:projectId/documents')
  @Roles(UserRole.ADMIN, UserRole.PM)
  @ApiOperation({ summary: '문서 생성' })
  create(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      title: string
      category: DocumentCategory
      kind: DocumentKind
      body: string
    },
    @CurrentUser() user: { id?: string; email?: string } | undefined,
  ) {
    return this.service.create({
      projectId,
      title: body.title,
      category: body.category,
      kind: body.kind,
      body: body.body,
      createdById: user?.id,
      createdBy: user?.email,
    })
  }

  @Get('documents/:id')
  @ApiOperation({ summary: '문서 상세 (첨부 포함)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch('documents/:id')
  @Roles(UserRole.ADMIN, UserRole.PM)
  @ApiOperation({ summary: '문서 수정' })
  update(
    @Param('id') id: string,
    @Body()
    body: { title?: string; category?: DocumentCategory; kind?: DocumentKind; body?: string },
  ) {
    return this.service.update(id, body)
  }

  @Delete('documents/:id')
  @Roles(UserRole.ADMIN, UserRole.PM)
  @ApiOperation({ summary: '문서 삭제' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id)
    return { ok: true }
  }

  @Post('documents/:id/attachments')
  @Roles(UserRole.ADMIN, UserRole.PM)
  @ApiOperation({ summary: '문서 파일 첨부 (data URL, 파일당 10MB · 최대 10개)' })
  addAttachments(
    @Param('id') id: string,
    @Body()
    body: {
      files: { filename: string; mimeType: string; sizeBytes: number; dataUrl: string }[]
    },
  ) {
    return this.service.addAttachments(id, body.files ?? [])
  }

  @Get('document-attachments/:attId')
  @ApiOperation({ summary: '첨부 다운로드' })
  async download(@Param('attId') attId: string, @Res() res: Response) {
    const att = await this.service.getAttachment(attId)
    const comma = att.dataUrl.indexOf(',')
    const base64 = comma >= 0 ? att.dataUrl.slice(comma + 1) : att.dataUrl
    const buf = Buffer.from(base64, 'base64')
    res.setHeader('Content-Type', att.mimeType)
    res.setHeader('Content-Length', String(buf.length))
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(att.filename)}"`,
    )
    res.end(buf)
  }

  @Delete('document-attachments/:attId')
  @Roles(UserRole.ADMIN, UserRole.PM)
  @ApiOperation({ summary: '첨부 삭제' })
  async deleteAttachment(@Param('attId') attId: string) {
    await this.service.deleteAttachment(attId)
    return { ok: true }
  }
}
