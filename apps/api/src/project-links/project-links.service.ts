import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectLinkCategory } from '@prisma/client'

@Injectable()
export class ProjectLinksService {
  constructor(private readonly prisma: PrismaService) {}

  list(projectId: string) {
    return this.prisma.projectLink.findMany({
      where: { projectId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
  }

  create(input: {
    projectId: string
    category: ProjectLinkCategory
    label: string
    url: string
    description?: string
    createdBy?: string
  }) {
    return this.prisma.projectLink.create({
      data: {
        projectId: input.projectId,
        category: input.category,
        label: input.label,
        url: input.url,
        description: input.description,
        createdBy: input.createdBy,
      },
    })
  }

  async update(
    id: string,
    input: Partial<{
      category: ProjectLinkCategory
      label: string
      url: string
      description: string | null
      sortOrder: number
    }>,
  ) {
    await this.findOrFail(id)
    return this.prisma.projectLink.update({ where: { id }, data: input })
  }

  async remove(id: string) {
    await this.findOrFail(id)
    return this.prisma.projectLink.delete({ where: { id } })
  }

  async reorder(projectId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, idx) =>
        this.prisma.projectLink.update({
          where: { id },
          data: { sortOrder: idx },
        }),
      ),
    )
    return this.list(projectId)
  }

  private async findOrFail(id: string) {
    const row = await this.prisma.projectLink.findUnique({ where: { id } })
    if (!row) throw new NotFoundException(`ProjectLink ${id} not found`)
    return row
  }
}
