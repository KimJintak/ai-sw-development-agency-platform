import { BuildStatus, Platform, ReleaseStatus } from './enums'

export interface Release {
  id: string
  projectId: string
  version: string
  title?: string
  status: ReleaseStatus
  platforms: Platform[]
  approvedAt?: string
  deployedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Build {
  id: string
  releaseId: string
  platform: Platform
  status: BuildStatus
  s3Key?: string
  cloudfrontUrl?: string
  buildLog?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}
