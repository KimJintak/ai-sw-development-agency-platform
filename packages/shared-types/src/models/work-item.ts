import { Platform, Priority, WorkItemStatus, WorkItemType } from './enums'

export interface WorkItem {
  id: string
  projectId: string
  parentId?: string
  type: WorkItemType
  title: string
  description?: string
  status: WorkItemStatus
  priority: Priority
  platform?: Platform
  assignedAgent?: string
  storyPoints?: number
  order: number
  children?: WorkItem[]
  createdAt: string
  updatedAt: string
}

export interface TaskEstimation {
  id: string
  workItemId: string
  optimistic: number
  mostLikely: number
  pessimistic: number
  pert: number
  variance: number
}

export interface WorkItemDependency {
  id: string
  workItemId: string
  dependsOnId: string
}
