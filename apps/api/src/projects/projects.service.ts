import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProjectDto, UpdateProjectDto, UpdateOrchestrationDslDto } from './dto/project.dto'

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({
      include: {
        customer: { select: { id: true, companyName: true } },
        _count: { select: { workItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        contract: true,
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      },
    })
    if (!project) throw new NotFoundException(`Project ${id} not found`)
    return project
  }

  async getProgress(id: string) {
    await this.findOne(id)
    const [total, done] = await Promise.all([
      this.prisma.workItem.count({ where: { projectId: id } }),
      this.prisma.workItem.count({ where: { projectId: id, status: 'DONE' } }),
    ])
    return { total, done, progress: total === 0 ? 0 : Math.round((done / total) * 100) }
  }

  create(dto: CreateProjectDto) {
    const { customerId, ...rest } = dto
    return this.prisma.project.create({
      data: { ...rest, customer: { connect: { id: customerId } } },
    })
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id)
    const { customerId, ...rest } = dto
    return this.prisma.project.update({ where: { id }, data: rest })
  }

  async updateOrchestrationDsl(id: string, dto: UpdateOrchestrationDslDto) {
    await this.findOne(id)
    return this.prisma.project.update({ where: { id }, data: { orchestrationDsl: dto.dsl as any } })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.project.delete({ where: { id } })
  }
}
