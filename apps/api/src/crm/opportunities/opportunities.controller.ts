import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { OpportunitiesService } from './opportunities.service'
import { CreateOpportunityDto, UpdateOpportunityDto, UpdateStageDto } from './dto/opportunity.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('CRM - Opportunities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private service: OpportunitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all opportunities' })
  findAll() { return this.service.findAll() }

  @Get(':id')
  @ApiOperation({ summary: 'Get opportunity detail' })
  findOne(@Param('id') id: string) { return this.service.findOne(id) }

  @Post()
  @ApiOperation({ summary: 'Create opportunity' })
  create(@Body() dto: CreateOpportunityDto) { return this.service.create(dto) }

  @Patch(':id')
  @ApiOperation({ summary: 'Update opportunity' })
  update(@Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    return this.service.update(id, dto)
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Update opportunity stage' })
  updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    return this.service.updateStage(id, dto)
  }
}
