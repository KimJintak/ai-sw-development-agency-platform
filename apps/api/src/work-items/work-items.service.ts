import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWorkItemDto, UpdateWorkItemDto, UpdateWorkItemStatusDto } from './dto/work-item.dto'

@Injectable()
export class WorkItemsService {
  constructor(private prisma: PrismaService) {}

  findAllByProject(projectId: string) {
    return this.prisma.workItem.findMany({
      where: { projectId, parentId: null },
      include: {
        children: {
          include: {
            children: true,
            agentTask: { select: { id: true, status: true } },
          },
        },
        agentTask: { select: { id: true, status: true } },
      },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    })
  }

  async findOne(id: string) {
    const item = await this.prisma.workItem.findUnique({
      where: { id },
      include: {
        children: true,
        requirementLinks: { include: { requirement: true } },
        testCases: true,
        estimations: true,
        agentTask: true,
      },
    })
    if (!item) throw new NotFoundException(`WorkItem ${id} not found`)
    return item
  }

  create(dto: CreateWorkItemDto) {
    const { projectId, parentId, ...rest } = dto
    return this.prisma.workItem.create({
      data: {
        ...rest,
        project: { connect: { id: projectId } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
      },
    })
  }

  async update(id: string, dto: UpdateWorkItemDto) {
    await this.findOne(id)
    const { projectId, parentId, ...rest } = dto
    return this.prisma.workItem.update({ where: { id }, data: rest })
  }

  async updateStatus(id: string, dto: UpdateWorkItemStatusDto) {
    await this.findOne(id)
    return this.prisma.workItem.update({ where: { id }, data: { status: dto.status } })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.workItem.delete({ where: { id } })
  }
}
