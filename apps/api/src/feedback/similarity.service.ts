import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface SimilarFeedback {
  id: string
  title: string
  body: string
  similarity: number
}

@Injectable()
export class SimilarityService implements OnModuleInit {
  private readonly logger = new Logger(SimilarityService.name)
  private hasPgVector = false
  private hasTrgm = false

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.detectExtensions()
  }

  private async detectExtensions() {
    try {
      const exts: { extname: string }[] = await this.prisma.$queryRawUnsafe(
        `SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pg_trgm')`,
      )
      this.hasPgVector = exts.some((e) => e.extname === 'vector')
      this.hasTrgm = exts.some((e) => e.extname === 'pg_trgm')
      this.logger.log(
        `Similarity extensions: pgvector=${this.hasPgVector}, pg_trgm=${this.hasTrgm}`,
      )

      if (!this.hasTrgm) {
        try {
          await this.prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
          this.hasTrgm = true
          this.logger.log('pg_trgm extension created')
        } catch {
          this.logger.warn('Could not create pg_trgm extension')
        }
      }
    } catch (err) {
      this.logger.warn(`Extension detection failed: ${(err as Error).message}`)
    }
  }

  async findSimilar(
    projectId: string,
    text: string,
    opts: { limit?: number; threshold?: number } = {},
  ): Promise<SimilarFeedback[]> {
    const limit = opts.limit ?? 5
    const threshold = opts.threshold ?? 0.3

    if (this.hasTrgm) {
      return this.trgmSearch(projectId, text, limit, threshold)
    }

    return this.fallbackSearch(projectId, text, limit)
  }

  private async trgmSearch(
    projectId: string,
    text: string,
    limit: number,
    threshold: number,
  ): Promise<SimilarFeedback[]> {
    try {
      const results: SimilarFeedback[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, title, body,
                GREATEST(
                  similarity(title, $1),
                  similarity(body, $1)
                ) AS similarity
         FROM feedback
         WHERE project_id = $2
           AND GREATEST(similarity(title, $1), similarity(body, $1)) > $3
         ORDER BY similarity DESC
         LIMIT $4`,
        text,
        projectId,
        threshold,
        limit,
      )
      return results.map((r) => ({
        ...r,
        similarity: Number(r.similarity),
      }))
    } catch (err) {
      this.logger.warn(`trgm search failed: ${(err as Error).message}`)
      return this.fallbackSearch(projectId, text, limit)
    }
  }

  private async fallbackSearch(
    projectId: string,
    text: string,
    limit: number,
  ): Promise<SimilarFeedback[]> {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 10)

    if (words.length === 0) return []

    const conditions = words.map(
      (w) => `(LOWER(title) LIKE '%${w.replace(/'/g, "''")}%' OR LOWER(body) LIKE '%${w.replace(/'/g, "''")}%')`,
    )
    const matchExpr = conditions.join(' OR ')

    try {
      const results: (SimilarFeedback & { match_count: bigint })[] =
        await this.prisma.$queryRawUnsafe(
          `SELECT id, title, body,
                  (${conditions.map((c) => `CASE WHEN ${c} THEN 1 ELSE 0 END`).join(' + ')})::float / ${words.length} AS similarity
           FROM feedback
           WHERE project_id = '${projectId.replace(/'/g, "''")}'
             AND (${matchExpr})
           ORDER BY similarity DESC
           LIMIT ${limit}`,
        )
      return results.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        similarity: Number(r.similarity),
      }))
    } catch (err) {
      this.logger.warn(`fallback search failed: ${(err as Error).message}`)
      return []
    }
  }
}
