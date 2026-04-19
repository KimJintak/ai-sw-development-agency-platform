import { Injectable, NotFoundException } from '@nestjs/common'
import { DocumentCategory, DocumentKind } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

interface CreateDocInput {
  projectId: string
  title: string
  category: DocumentCategory
  kind: DocumentKind
  body: string
  createdById?: string
  createdBy?: string
}

interface UpdateDocInput {
  title?: string
  category?: DocumentCategory
  kind?: DocumentKind
  body?: string
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(projectId: string, category?: DocumentCategory) {
    return this.prisma.projectDocument.findMany({
      where: { projectId, ...(category ? { category } : {}) },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { attachments: true } },
      },
    })
  }

  async findOne(id: string) {
    const doc = await this.prisma.projectDocument.findUnique({
      where: { id },
      include: {
        attachments: {
          select: { id: true, filename: true, mimeType: true, sizeBytes: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!doc) throw new NotFoundException(`Document ${id} not found`)
    return doc
  }

  create(input: CreateDocInput) {
    return this.prisma.projectDocument.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        category: input.category,
        kind: input.kind,
        body: input.body,
        createdById: input.createdById ?? null,
        createdBy: input.createdBy ?? null,
      },
    })
  }

  async update(id: string, input: UpdateDocInput) {
    await this.findOne(id)
    return this.prisma.projectDocument.update({
      where: { id },
      data: input,
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.projectDocumentAttachment.deleteMany({ where: { documentId: id } })
    await this.prisma.projectDocument.delete({ where: { id } })
  }

  async addAttachments(
    documentId: string,
    files: { filename: string; mimeType: string; sizeBytes: number; dataUrl: string }[],
  ) {
    await this.findOne(documentId)
    const MAX_PER_FILE = 10 * 1024 * 1024
    const MAX_COUNT = 10
    if (files.length === 0) return []
    if (files.length > MAX_COUNT) {
      throw new Error(`파일은 최대 ${MAX_COUNT}개까지 첨부할 수 있습니다.`)
    }
    for (const f of files) {
      if (f.sizeBytes > MAX_PER_FILE) {
        throw new Error(`${f.filename}: 10MB를 초과했습니다.`)
      }
      if (!f.dataUrl.startsWith('data:')) {
        throw new Error(`${f.filename}: 잘못된 파일 형식입니다.`)
      }
    }
    return this.prisma.$transaction(
      files.map((f) =>
        this.prisma.projectDocumentAttachment.create({
          data: { documentId, ...f },
          select: { id: true, filename: true, mimeType: true, sizeBytes: true, createdAt: true },
        }),
      ),
    )
  }

  async getAttachment(attId: string) {
    const att = await this.prisma.projectDocumentAttachment.findUnique({ where: { id: attId } })
    if (!att) throw new NotFoundException(`Attachment ${attId} not found`)
    return att
  }

  async deleteAttachment(attId: string) {
    await this.getAttachment(attId)
    await this.prisma.projectDocumentAttachment.delete({ where: { id: attId } })
  }
}
