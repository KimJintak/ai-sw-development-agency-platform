import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateOpportunityDto, UpdateOpportunityDto, UpdateStageDto } from './dto/opportunity.dto'

@Injectable()
export class OpportunitiesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.opportunity.findMany({
      include: { customer: { select: { id: true, companyName: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { id },
      include: { customer: true, contract: true },
    })
    if (!opp) throw new NotFoundException(`Opportunity ${id} not found`)
    return opp
  }

  create(dto: CreateOpportunityDto) {
    const { customerId, estimatedValue, expectedCloseDate, ...rest } = dto
    return this.prisma.opportunity.create({
      data: {
        ...rest,
        customer: { connect: { id: customerId } },
        estimatedValue: estimatedValue ? estimatedValue : undefined,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      },
    })
  }

  async update(id: string, dto: UpdateOpportunityDto) {
    await this.findOne(id)
    const { customerId, estimatedValue, expectedCloseDate, ...rest } = dto
    return this.prisma.opportunity.update({
      where: { id },
      data: {
        ...rest,
        estimatedValue: estimatedValue ?? undefined,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      },
    })
  }

  async updateStage(id: string, dto: UpdateStageDto) {
    await this.findOne(id)
    return this.prisma.opportunity.update({ where: { id }, data: { stage: dto.stage } })
  }
}
