import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

interface PertNode {
  id: string
  title: string
  type: string
  status: string
  pert: number
  variance: number
  // forward pass
  es: number
  ef: number
  // backward pass
  ls: number
  lf: number
  slack: number
  critical: boolean
  dependsOnIds: string[]
}

export interface PertResult {
  nodes: PertNode[]
  projectDuration: number
  criticalPath: string[]
}

export class UpsertEstimationDto {
  optimistic: number
  mostLikely: number
  pessimistic: number
}

@Injectable()
export class PertService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertEstimation(workItemId: string, dto: UpsertEstimationDto) {
    const pert = (dto.optimistic + 4 * dto.mostLikely + dto.pessimistic) / 6
    const variance = Math.pow((dto.pessimistic - dto.optimistic) / 6, 2)

    const existing = await this.prisma.taskEstimation.findFirst({ where: { workItemId } })
    if (existing) {
      return this.prisma.taskEstimation.update({
        where: { id: existing.id },
        data: { ...dto, pert, variance },
      })
    }
    return this.prisma.taskEstimation.create({
      data: { workItemId, ...dto, pert, variance },
    })
  }

  async calculateCriticalPath(projectId: string): Promise<PertResult> {
    const items = await this.prisma.workItem.findMany({
      where: { projectId },
      include: {
        estimations: true,
        dependencies: { select: { dependsOnId: true } },
      },
    })

    if (items.length === 0) return { nodes: [], projectDuration: 0, criticalPath: [] }

    const nodeMap = new Map<string, PertNode>()
    for (const item of items) {
      const est = item.estimations[0]
      nodeMap.set(item.id, {
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        pert: est?.pert ?? 1,
        variance: est?.variance ?? 0,
        es: 0,
        ef: 0,
        ls: 0,
        lf: 0,
        slack: 0,
        critical: false,
        dependsOnIds: item.dependencies.map((d) => d.dependsOnId),
      })
    }

    // topological sort (Kahn's algorithm)
    const inDegree = new Map<string, number>()
    const successors = new Map<string, string[]>()
    for (const node of nodeMap.values()) {
      if (!inDegree.has(node.id)) inDegree.set(node.id, 0)
      for (const dep of node.dependsOnIds) {
        if (!successors.has(dep)) successors.set(dep, [])
        successors.get(dep)!.push(node.id)
        inDegree.set(node.id, (inDegree.get(node.id) ?? 0) + 1)
      }
    }

    const queue: string[] = []
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id)
    }

    const order: string[] = []
    while (queue.length > 0) {
      const cur = queue.shift()!
      order.push(cur)
      for (const succ of successors.get(cur) ?? []) {
        const newDeg = (inDegree.get(succ) ?? 0) - 1
        inDegree.set(succ, newDeg)
        if (newDeg === 0) queue.push(succ)
      }
    }

    // forward pass — earliest start / finish
    for (const id of order) {
      const node = nodeMap.get(id)!
      const depFinishes = node.dependsOnIds.map((d) => nodeMap.get(d)?.ef ?? 0)
      node.es = depFinishes.length > 0 ? Math.max(...depFinishes) : 0
      node.ef = node.es + node.pert
    }

    const projectDuration = Math.max(...[...nodeMap.values()].map((n) => n.ef))

    // backward pass — latest start / finish
    for (const id of [...order].reverse()) {
      const node = nodeMap.get(id)!
      const succLatestStarts = (successors.get(id) ?? []).map((s) => nodeMap.get(s)?.ls ?? projectDuration)
      node.lf = succLatestStarts.length > 0 ? Math.min(...succLatestStarts) : projectDuration
      node.ls = node.lf - node.pert
      node.slack = Math.round((node.ls - node.es) * 100) / 100
      node.critical = node.slack <= 0.01
    }

    const criticalPath = order.filter((id) => nodeMap.get(id)!.critical)

    return {
      nodes: order.map((id) => nodeMap.get(id)!),
      projectDuration: Math.round(projectDuration * 100) / 100,
      criticalPath,
    }
  }
}
