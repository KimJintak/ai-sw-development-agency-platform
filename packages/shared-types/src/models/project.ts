import { Platform, ProjectStatus } from './enums'

export interface Project {
  id: string
  customerId: string
  name: string
  description?: string
  status: ProjectStatus
  platforms: Platform[]
  orchestrationDsl?: Record<string, unknown>
  githubRepo?: string
  progress?: number
  createdAt: string
  updatedAt: string
}

export interface OrchestratorDsl {
  version: string
  stages: OrchestratorStage[]
}

export interface OrchestratorStage {
  id: string
  name: string
  parallel: boolean
  agents: string[]
  platformFilter?: boolean
  onSuccess: string
  onFailure: string
}
