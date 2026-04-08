import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { WorkItemsService } from './work-items.service'
import { CreateWorkItemDto, UpdateWorkItemDto, UpdateWorkItemStatusDto } from './dto/work-item.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@ApiTags('Work Items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/work-items')
export class WorkItemsController {
  constructor(private service: WorkItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List work items (hierarchy) for a project' })
  findAll(@Param('projectId') projectId: string) {
    return this.service.findAllByProject(projectId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work item detail' })
  findOne(@Param('id') id: string) { return this.service.findOne(id) }

  @Post()
  @ApiOperation({ summary: 'Create work item' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateWorkItemDto) {
    return this.service.create({ ...dto, projectId })
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update work item' })
  update(@Param('id') id: string, @Body() dto: UpdateWorkItemDto) {
    return this.service.update(id, dto)
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update work item status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateWorkItemStatusDto) {
    return this.service.updateStatus(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete work item' })
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
