import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto'

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.contract.findMany({
      include: {
        opportunity: { include: { customer: { select: { id: true, companyName: true } } } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { opportunity: { include: { customer: true } }, project: true },
    })
    if (!contract) throw new NotFoundException(`Contract ${id} not found`)
    return contract
  }

  create(dto: CreateContractDto) {
    const { opportunityId, projectId, startDate, deadlineDate, signedAt, ...rest } = dto
    return this.prisma.contract.create({
      data: {
        ...rest,
        opportunity: { connect: { id: opportunityId } },
        project: projectId ? { connect: { id: projectId } } : undefined,
        startDate: new Date(startDate),
        deadlineDate: new Date(deadlineDate),
        signedAt: signedAt ? new Date(signedAt) : undefined,
      },
    })
  }

  async update(id: string, dto: UpdateContractDto) {
    await this.findOne(id)
    const { opportunityId, projectId, startDate, deadlineDate, signedAt, ...rest } = dto
    return this.prisma.contract.update({
      where: { id },
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        deadlineDate: deadlineDate ? new Date(deadlineDate) : undefined,
        signedAt: signedAt ? new Date(signedAt) : undefined,
      },
    })
  }
}
