import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ContractsService } from './contracts.service'
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('CRM - Contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private service: ContractsService) {}

  @Get()
  @ApiOperation({ summary: 'List all contracts' })
  findAll() { return this.service.findAll() }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract detail' })
  findOne(@Param('id') id: string) { return this.service.findOne(id) }

  @Post()
  @ApiOperation({ summary: 'Create contract' })
  create(@Body() dto: CreateContractDto) { return this.service.create(dto) }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contract' })
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.service.update(id, dto)
  }
}
