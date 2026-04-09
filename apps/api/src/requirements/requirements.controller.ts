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
import { RequirementsService } from './requirements.service'
import {
  ApproveRequirementDto,
  CreateRequirementDto,
  LinkWorkItemDto,
  UpdateRequirementDto,
} from './dto/requirement.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Requirements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requirements')
export class RequirementsController {
  constructor(private readonly service: RequirementsService) {}

  @Get()
  @ApiOperation({ summary: 'List requirements by projectId' })
  list(@Query('projectId') projectId: string) {
    return this.service.findByProject(projectId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get requirement with versions and linked work items' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List all versions of a requirement' })
  listVersions(@Param('id') id: string) {
    return this.service.listVersions(id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a requirement (initial version v1)' })
  create(@Body() dto: CreateRequirementDto, @CurrentUser() user: { id: string }) {
    return this.service.create(dto, user.id)
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update a requirement. Feature/title edits snapshot a new version; status/platform edits do not.',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRequirementDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.update(id, dto, user.id)
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a requirement (PENDING_APPROVAL → APPROVED)' })
  approve(@Param('id') id: string, @Body() dto: ApproveRequirementDto) {
    return this.service.approve(id, dto)
  }

  @Post(':id/links')
  @ApiOperation({ summary: 'Link a work item to a requirement' })
  link(@Param('id') id: string, @Body() dto: LinkWorkItemDto) {
    return this.service.linkWorkItem(id, dto)
  }

  @Delete(':id/links/:workItemId')
  @ApiOperation({ summary: 'Unlink a work item from a requirement' })
  unlink(@Param('id') id: string, @Param('workItemId') workItemId: string) {
    return this.service.unlinkWorkItem(id, workItemId)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a requirement and all its versions/links' })
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
