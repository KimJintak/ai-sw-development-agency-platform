import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { NotificationType, Platform, Prisma, RequirementStatus, WorkItemStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import {
  ApproveRequirementDto,
  CreateRequirementDto,
  LinkWorkItemDto,
  UpdateRequirementDto,
} from './dto/requirement.dto'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class RequirementsService {
  private readonly logger = new Logger(RequirementsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findByProject(projectId: string) {
    return this.prisma.requirement.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { versions: true, requirementLinks: true } },
      },
    })
  }

  async findOne(id: string) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: 'desc' } },
        requirementLinks: {
          include: {
            workItem: { select: { id: true, title: true, status: true, type: true } },
          },
        },
      },
    })
    if (!requirement) throw new NotFoundException(`Requirement ${id} not found`)
    return requirement
  }

  async create(dto: CreateRequirementDto, createdBy: string) {
    // Creates the Requirement and its initial version (v1) in one
    // transaction so the versions table always has a row per live
    // Requirement.
    return this.prisma.$transaction(async (tx) => {
      const requirement = await tx.requirement.create({
        data: {
          projectId: dto.projectId,
          title: dto.title,
          featureFile: dto.featureFile,
          platforms: dto.platforms as Platform[],
          status: RequirementStatus.DRAFT,
          version: 1,
        },
      })

      await tx.requirementVersion.create({
        data: {
          requirementId: requirement.id,
          version: 1,
          featureFile: dto.featureFile,
          changedBy: createdBy,
          changeNote: 'Initial draft',
        },
      })

      await this.autoCreateWorkItem(tx, requirement)

      return requirement
    })
  }

  private async autoCreateWorkItem(
    tx: Prisma.TransactionClient,
    req: { id: string; projectId: string; title: string; featureFile: string; platforms: Platform[] },
  ) {
    try {
      const scenarios = this.parseScenariosFromFeature(req.featureFile)
      if (scenarios.length === 0) scenarios.push(req.title)

      for (const scenarioTitle of scenarios) {
        const workItem = await tx.workItem.create({
          data: {
            projectId: req.projectId,
            title: scenarioTitle,
            description: `Auto-generated from requirement: ${req.title}`,
            type: 'STORY',
            status: WorkItemStatus.BACKLOG,
            priority: 'P2',
            platform: req.platforms[0] ?? null,
          },
        })
        await tx.requirementLink.create({
          data: { requirementId: req.id, workItemId: workItem.id },
        })
      }
      this.logger.log(`Auto-created ${scenarios.length} WorkItem(s) from requirement ${req.id}`)
    } catch (err) {
      this.logger.warn(`Auto-create WorkItems failed for req ${req.id}: ${(err as Error).message}`)
    }
  }

  private parseScenariosFromFeature(featureFile: string): string[] {
    const lines = featureFile.split('\n')
    return lines
      .filter((l) => /^\s*Scenario:/i.test(l))
      .map((l) => l.replace(/^\s*Scenario:\s*/i, '').trim())
      .filter(Boolean)
  }

  /**
   * Editing the feature file content creates a new RequirementVersion
   * (FR-03-04 — 버전 이력 보존). Non-content edits (status change,
   * platform retagging) do NOT increment the version.
   */
  async update(id: string, dto: UpdateRequirementDto, changedBy: string) {
    const current = await this.findOne(id)

    const contentChanged =
      (dto.featureFile !== undefined && dto.featureFile !== current.featureFile) ||
      (dto.title !== undefined && dto.title !== current.title)

    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.RequirementUpdateInput = {}

      if (dto.title !== undefined) updateData.title = dto.title
      if (dto.platforms !== undefined) updateData.platforms = { set: dto.platforms as Platform[] }
      if (dto.status !== undefined) updateData.status = dto.status as RequirementStatus

      if (contentChanged) {
        const nextVersion = current.version + 1
        updateData.version = nextVersion
        if (dto.featureFile !== undefined) updateData.featureFile = dto.featureFile

        await tx.requirementVersion.create({
          data: {
            requirementId: id,
            version: nextVersion,
            featureFile: dto.featureFile ?? current.featureFile,
            changedBy,
            changeNote: dto.changeNote ?? null,
          },
        })
      }

      const updated = await tx.requirement.update({
        where: { id },
        data: updateData,
      })

      if (dto.status === RequirementStatus.PENDING_APPROVAL) {
        await this.notifyPortalUsersOnApprovalRequest(updated.projectId, updated.title, updated.id).catch(
          (err) => this.logger.warn(`notify portal failed: ${(err as Error).message}`),
        )
      }

      return updated
    })
  }

  private async notifyPortalUsersOnApprovalRequest(projectId: string, reqTitle: string, reqId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { customerId: true },
    })
    if (!project?.customerId) return

    const portalUsers = await this.prisma.portalUser.findMany({
      where: { customerId: project.customerId },
      select: { id: true },
    })
    await Promise.all(
      portalUsers.map((u) =>
        this.notifications.createPortal(
          u.id,
          NotificationType.REQUIREMENT_PENDING,
          '요구사항 승인 요청',
          reqTitle,
          `/portal/${projectId}`,
        ),
      ),
    )
  }

  async approve(id: string, dto: ApproveRequirementDto) {
    await this.findOne(id)
    return this.prisma.requirement.update({
      where: { id },
      data: {
        status: RequirementStatus.APPROVED,
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
      },
    })
  }

  listVersions(id: string) {
    return this.prisma.requirementVersion.findMany({
      where: { requirementId: id },
      orderBy: { version: 'desc' },
    })
  }

  async linkWorkItem(id: string, dto: LinkWorkItemDto) {
    await this.findOne(id)
    return this.prisma.requirementLink.create({
      data: { requirementId: id, workItemId: dto.workItemId },
    })
  }

  async unlinkWorkItem(id: string, workItemId: string) {
    return this.prisma.requirementLink.delete({
      where: {
        requirementId_workItemId: { requirementId: id, workItemId },
      },
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    // RequirementVersion / RequirementLink rows must go first to
    // satisfy FK constraints; Prisma doesn't cascade automatically
    // for these relations.
    return this.prisma.$transaction([
      this.prisma.requirementLink.deleteMany({ where: { requirementId: id } }),
      this.prisma.requirementVersion.deleteMany({ where: { requirementId: id } }),
      this.prisma.requirement.delete({ where: { id } }),
    ])
  }
}
