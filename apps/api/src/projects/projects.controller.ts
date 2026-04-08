import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ProjectsService } from './projects.service'
import { CreateProjectDto, UpdateProjectDto, UpdateOrchestrationDslDto } from './dto/project.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private service: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  findAll() { return this.service.findAll() }

  @Get(':id')
  @ApiOperation({ summary: 'Get project detail' })
  findOne(@Param('id') id: string) { return this.service.findOne(id) }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get project progress (work item completion rate)' })
  getProgress(@Param('id') id: string) { return this.service.getProgress(id) }

  @Post()
  @ApiOperation({ summary: 'Create project' })
  create(@Body() dto: CreateProjectDto) { return this.service.create(dto) }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto)
  }

  @Patch(':id/orchestration')
  @ApiOperation({ summary: 'Update orchestration DSL' })
  updateDsl(@Param('id') id: string, @Body() dto: UpdateOrchestrationDslDto) {
    return this.service.updateOrchestrationDsl(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
