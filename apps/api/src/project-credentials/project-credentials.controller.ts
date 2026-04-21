import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { UserRole } from '@prisma/client'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { ProjectCredentialsService } from './project-credentials.service'
import { AdminAuditService } from '../admin/admin-audit.service'

interface AuthUser {
  id: string
  email: string
  role: UserRole
}

@ApiTags('Project Credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ProjectCredentialsController {
  constructor(
    private readonly service: ProjectCredentialsService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('projects/:projectId/credentials')
  @Roles(UserRole.ADMIN, UserRole.PM)
  @ApiOperation({ summary: '프로젝트 테스트 계정 목록 (암호는 숨김)' })
  list(@Param('projectId') projectId: string) {
    return this.service.list(projectId)
  }

  @Post('projects/:projectId/credentials')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '테스트 계정 등록 (ADMIN)' })
  create(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      role: string
      label: string
      email: string
      password: string
      loginUrl?: string
      note?: string
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create({ projectId, ...body, createdBy: user.id })
  }

  @Patch('project-credentials/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '테스트 계정 수정 (password 포함 시 rotate 처리)' })
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      role: string
      label: string
      email: string
      password: string
      loginUrl: string
      note: string
    }>,
  ) {
    return this.service.update(id, body)
  }

  @Delete('project-credentials/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '테스트 계정 삭제' })
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }

  @Post('project-credentials/:id/reveal')
  @Roles(UserRole.ADMIN, UserRole.PM)
  @ApiOperation({
    summary: '비밀번호 평문 조회 (감사 로그에 기록됨)',
  })
  async reveal(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    await this.audit.record({
      userId: user.id,
      userEmail: user.email,
      action: 'project.credential.reveal',
      resource: id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    return this.service.reveal(id)
  }
}
