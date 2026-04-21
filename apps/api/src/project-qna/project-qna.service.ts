import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Priority, QnaStatus } from '@prisma/client'

@Injectable()
export class ProjectQnaService {
  constructor(private readonly prisma: PrismaService) {}

  list(projectId: string, status?: QnaStatus) {
    return this.prisma.projectQna.findMany({
      where: { projectId, ...(status ? { status } : {}) },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })
  }

  create(input: {
    projectId: string
    question: string
    priority?: Priority
    tags?: string[]
    askedBy?: string
    askedByName?: string
  }) {
    return this.prisma.projectQna.create({
      data: {
        projectId: input.projectId,
        question: input.question,
        priority: input.priority ?? 'P2',
        tags: input.tags ?? [],
        askedBy: input.askedBy,
        askedByName: input.askedByName,
        status: QnaStatus.OPEN,
      },
    })
  }

  async answer(
    id: string,
    input: { answer: string; answeredBy?: string; answeredByName?: string },
  ) {
    await this.findOrFail(id)
    return this.prisma.projectQna.update({
      where: { id },
      data: {
        answer: input.answer,
        answeredBy: input.answeredBy,
        answeredByName: input.answeredByName,
        answeredAt: new Date(),
        status: QnaStatus.ANSWERED,
      },
    })
  }

  async updateStatus(id: string, status: QnaStatus) {
    await this.findOrFail(id)
    return this.prisma.projectQna.update({ where: { id }, data: { status } })
  }

  async update(
    id: string,
    input: Partial<{ question: string; priority: Priority; tags: string[] }>,
  ) {
    await this.findOrFail(id)
    return this.prisma.projectQna.update({ where: { id }, data: input })
  }

  async remove(id: string) {
    await this.findOrFail(id)
    return this.prisma.projectQna.delete({ where: { id } })
  }

  private async findOrFail(id: string) {
    const row = await this.prisma.projectQna.findUnique({ where: { id } })
    if (!row) throw new NotFoundException(`ProjectQna ${id} not found`)
    return row
  }
}
