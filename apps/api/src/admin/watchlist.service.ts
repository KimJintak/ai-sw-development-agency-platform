import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.watchKeyword.findMany({ orderBy: { createdAt: 'asc' } })
  }

  listActive() {
    return this.prisma.watchKeyword.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  async create(input: { keyword: string; color?: string; createdBy: string }) {
    const normalized = input.keyword.trim().toLowerCase()
    if (!normalized) throw new ConflictException('keyword must not be blank')
    try {
      return await this.prisma.watchKeyword.create({
        data: {
          keyword: normalized,
          color: input.color ?? 'yellow',
          createdBy: input.createdBy,
        },
      })
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'P2002') throw new ConflictException(`"${normalized}" already registered`)
      throw err
    }
  }

  async update(id: string, input: { color?: string; active?: boolean }) {
    await this.findOrFail(id)
    return this.prisma.watchKeyword.update({
      where: { id },
      data: {
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    })
  }

  async remove(id: string) {
    await this.findOrFail(id)
    return this.prisma.watchKeyword.delete({ where: { id } })
  }

  private async findOrFail(id: string) {
    const row = await this.prisma.watchKeyword.findUnique({ where: { id } })
    if (!row) throw new NotFoundException(`WatchKeyword ${id} not found`)
    return row
  }

  matchAll(text: string, keywords: { keyword: string; color: string }[]) {
    const lower = text.toLowerCase()
    return keywords.filter((kw) => lower.includes(kw.keyword))
  }
}
