import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ArtifactType, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateDesignArtifactDto,
  UpdateDesignArtifactDto,
} from './dto/design-artifact.dto'

@Injectable()
export class DesignService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lists artifacts of a project, optionally filtered by type so the
   * Design Hub tabs (Architecture / ERD / Wireframe / ...) can each
   * load only their own set.
   */
  findByProject(projectId: string, type?: ArtifactType) {
    return this.prisma.designArtifact.findMany({
      where: { projectId, ...(type ? { type } : {}) },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { versions: true } } },
    })
  }

  async findOne(id: string) {
    const artifact = await this.prisma.designArtifact.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: 'desc' } } },
    })
    if (!artifact) throw new NotFoundException(`DesignArtifact ${id} not found`)
    return artifact
  }

  async create(dto: CreateDesignArtifactDto, createdBy: string) {
    this.assertContentProvided(dto)
    return this.prisma.$transaction(async (tx) => {
      const artifact = await tx.designArtifact.create({
        data: {
          projectId: dto.projectId,
          type: dto.type as ArtifactType,
          title: dto.title,
          mermaidCode: dto.mermaidCode,
          figmaUrl: dto.figmaUrl,
          createdBy,
          version: 1,
        },
      })

      await tx.designArtifactVersion.create({
        data: {
          designArtifactId: artifact.id,
          version: 1,
          mermaidCode: dto.mermaidCode,
          figmaUrl: dto.figmaUrl,
        },
      })

      return artifact
    })
  }

  /**
   * FR-06-05 — 저장 시 이전 버전이 보존되어야 한다 (덮어쓰기 금지).
   * Any update to mermaidCode/figmaUrl snapshots the PREVIOUS state
   * into a new DesignArtifactVersion row BEFORE updating the head,
   * and bumps the version counter.
   */
  async update(id: string, dto: UpdateDesignArtifactDto) {
    const current = await this.findOne(id)

    const contentChanged =
      (dto.mermaidCode !== undefined && dto.mermaidCode !== current.mermaidCode) ||
      (dto.figmaUrl !== undefined && dto.figmaUrl !== current.figmaUrl)

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.DesignArtifactUpdateInput = {}
      if (dto.title !== undefined) data.title = dto.title

      if (contentChanged) {
        const nextVersion = current.version + 1
        data.version = nextVersion
        if (dto.mermaidCode !== undefined) data.mermaidCode = dto.mermaidCode
        if (dto.figmaUrl !== undefined) data.figmaUrl = dto.figmaUrl

        await tx.designArtifactVersion.create({
          data: {
            designArtifactId: id,
            version: nextVersion,
            mermaidCode: dto.mermaidCode ?? current.mermaidCode,
            figmaUrl: dto.figmaUrl ?? current.figmaUrl,
          },
        })
      }

      return tx.designArtifact.update({ where: { id }, data })
    })
  }

  listVersions(id: string) {
    return this.prisma.designArtifactVersion.findMany({
      where: { designArtifactId: id },
      orderBy: { version: 'desc' },
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.$transaction([
      this.prisma.designArtifactVersion.deleteMany({
        where: { designArtifactId: id },
      }),
      this.prisma.designArtifact.delete({ where: { id } }),
    ])
  }

  private assertContentProvided(dto: CreateDesignArtifactDto) {
    if (!dto.mermaidCode && !dto.figmaUrl) {
      throw new BadRequestException(
        'mermaidCode or figmaUrl must be provided when creating a design artifact',
      )
    }
  }
}
