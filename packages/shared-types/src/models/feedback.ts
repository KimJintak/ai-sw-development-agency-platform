import { FeedbackSource, FeedbackStatus, FeedbackType, Priority } from './enums'

export interface Feedback {
  id: string
  projectId: string
  workItemId?: string
  source: FeedbackSource
  type?: FeedbackType
  severity?: Priority
  title: string
  body: string
  status: FeedbackStatus
  sentryEventId?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}
