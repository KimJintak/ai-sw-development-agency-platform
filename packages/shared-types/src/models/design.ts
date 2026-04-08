import { ArtifactType } from './enums'

export interface DesignArtifact {
  id: string
  projectId: string
  type: ArtifactType
  title: string
  mermaidCode?: string
  figmaUrl?: string
  version: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface DesignArtifactVersion {
  id: string
  designArtifactId: string
  version: number
  mermaidCode?: string
  figmaUrl?: string
  createdAt: string
}
