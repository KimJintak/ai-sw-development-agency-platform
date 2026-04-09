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
import { ArtifactType } from '@prisma/client'
import { DesignService } from './design.service'
import {
  CreateDesignArtifactDto,
  UpdateDesignArtifactDto,
} from './dto/design-artifact.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Design')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('design')
export class DesignController {
  constructor(private readonly service: DesignService) {}

  @Get()
  @ApiOperation({ summary: 'List design artifacts by projectId (optional type filter)' })
  list(
    @Query('projectId') projectId: string,
    @Query('type') type?: ArtifactType,
  ) {
    return this.service.findByProject(projectId, type)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a design artifact with its version history' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List all versions of a design artifact' })
  listVersions(@Param('id') id: string) {
    return this.service.listVersions(id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a design artifact (initial v1)' })
  create(
    @Body() dto: CreateDesignArtifactDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.create(dto, user.id)
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update a design artifact. Content changes snapshot the previous version (FR-06-05).',
  })
  update(@Param('id') id: string, @Body() dto: UpdateDesignArtifactDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete artifact and all its versions' })
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
