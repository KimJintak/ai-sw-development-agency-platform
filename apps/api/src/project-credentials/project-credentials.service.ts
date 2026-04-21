import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CredentialCryptoService } from './crypto.service'

export interface CreateCredentialInput {
  projectId: string
  role: string
  label: string
  email: string
  password: string
  loginUrl?: string
  note?: string
  createdBy?: string
}

export interface PublicCredential {
  id: string
  projectId: string
  role: string
  label: string
  email: string
  loginUrl: string | null
  note: string | null
  lastRotatedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

@Injectable()
export class ProjectCredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CredentialCryptoService,
  ) {}

  /** Safe listing — never returns the decrypted password */
  async list(projectId: string): Promise<PublicCredential[]> {
    const rows = await this.prisma.projectCredential.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map((r) => this.toPublic(r))
  }

  async create(input: CreateCredentialInput): Promise<PublicCredential> {
    const { ciphertext, iv, tag } = this.crypto.encrypt(input.password)
    const row = await this.prisma.projectCredential.create({
      data: {
        projectId: input.projectId,
        role: input.role,
        label: input.label,
        email: input.email,
        encryptedPassword: ciphertext,
        encryptionIv: iv,
        encryptionTag: tag,
        loginUrl: input.loginUrl,
        note: input.note,
        createdBy: input.createdBy,
      },
    })
    return this.toPublic(row)
  }

  async update(
    id: string,
    input: Partial<Pick<CreateCredentialInput, 'role' | 'label' | 'email' | 'loginUrl' | 'note'>> & {
      password?: string
    },
  ): Promise<PublicCredential> {
    const current = await this.findOrFail(id)
    const data: Record<string, unknown> = {
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.loginUrl !== undefined ? { loginUrl: input.loginUrl } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
    }
    if (input.password) {
      const { ciphertext, iv, tag } = this.crypto.encrypt(input.password)
      data.encryptedPassword = ciphertext
      data.encryptionIv = iv
      data.encryptionTag = tag
      data.lastRotatedAt = new Date()
    }
    const row = await this.prisma.projectCredential.update({ where: { id }, data })
    void current
    return this.toPublic(row)
  }

  async remove(id: string) {
    await this.findOrFail(id)
    await this.prisma.projectCredential.delete({ where: { id } })
    return { id }
  }

  /**
   * Returns the plaintext password for a single credential.
   * Caller must log access audit separately — this method is intentionally
   * write-only wrt logs (keeps service pure). RBAC enforced at controller.
   */
  async reveal(id: string): Promise<{ id: string; password: string }> {
    const row = await this.findOrFail(id)
    const password = this.crypto.decrypt(row.encryptedPassword, row.encryptionIv, row.encryptionTag)
    return { id: row.id, password }
  }

  private async findOrFail(id: string) {
    const row = await this.prisma.projectCredential.findUnique({ where: { id } })
    if (!row) throw new NotFoundException(`ProjectCredential ${id} not found`)
    return row
  }

  private toPublic(r: {
    id: string
    projectId: string
    role: string
    label: string
    email: string
    loginUrl: string | null
    note: string | null
    lastRotatedAt: Date | null
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
  }): PublicCredential {
    return {
      id: r.id,
      projectId: r.projectId,
      role: r.role,
      label: r.label,
      email: r.email,
      loginUrl: r.loginUrl,
      note: r.note,
      lastRotatedAt: r.lastRotatedAt?.toISOString() ?? null,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }
  }
}
