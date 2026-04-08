import { Platform, RequirementStatus } from './enums'

export interface Requirement {
  id: string
  projectId: string
  title: string
  featureFile: string
  platforms: Platform[]
  status: RequirementStatus
  version: number
  approvedAt?: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
}

export interface RequirementVersion {
  id: string
  requirementId: string
  version: number
  featureFile: string
  changedBy: string
  changeNote?: string
  createdAt: string
}
