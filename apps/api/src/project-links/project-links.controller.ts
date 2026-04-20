import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ProjectLinkCategory } from '@prisma/client'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { ProjectLinksService } from './project-links.service'

@ApiTags('Project Links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectLinksController {
  constructor(private readonly service: ProjectLinksService) {}

  @Get('projects/:projectId/links')
  @ApiOperation({ summary: '프로젝트 외부 링크 목록' })
  list(@Param('projectId') projectId: string) {
    return this.service.list(projectId)
  }

  @Post('projects/:projectId/links')
  @ApiOperation({ summary: '링크 추가 (Figma / Prototype / WBS / Staging 등)' })
  create(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      category: ProjectLinkCategory
      label: string
      url: string
      description?: string
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.service.create({
      projectId,
      ...body,
      createdBy: user.id,
    })
  }

  @Patch('project-links/:id')
  @ApiOperation({ summary: '링크 수정' })
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      category: ProjectLinkCategory
      label: string
      url: string
      description: string | null
      sortOrder: number
    }>,
  ) {
    return this.service.update(id, body)
  }

  @Delete('project-links/:id')
  @ApiOperation({ summary: '링크 삭제' })
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }

  @Post('projects/:projectId/links/reorder')
  @ApiOperation({ summary: '링크 순서 변경 (orderedIds 배열 순서대로 sortOrder 부여)' })
  reorder(
    @Param('projectId') projectId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.service.reorder(projectId, body.orderedIds)
  }
}
