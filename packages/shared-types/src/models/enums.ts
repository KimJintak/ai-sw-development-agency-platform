export enum UserRole {
  ADMIN = 'ADMIN',
  PM = 'PM',
  CLIENT = 'CLIENT',
  AGENT = 'AGENT',
}

export enum Platform {
  MACOS = 'MACOS',
  WINDOWS = 'WINDOWS',
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
  LINUX = 'LINUX',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum WorkItemType {
  EPIC = 'EPIC',
  STORY = 'STORY',
  TASK = 'TASK',
}

export enum WorkItemStatus {
  BACKLOG = 'BACKLOG',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum Priority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

export enum OpportunityStage {
  LEAD = 'LEAD',
  NEGOTIATION = 'NEGOTIATION',
  CONTRACT = 'CONTRACT',
  COMPLETED = 'COMPLETED',
  LOST = 'LOST',
}

export enum RequirementStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum AgentType {
  CRM = 'CRM',
  PM = 'PM',
  ARCHITECTURE = 'ARCHITECTURE',
  UX = 'UX',
  MAC_DEV = 'MAC_DEV',
  WINDOWS_DEV = 'WINDOWS_DEV',
  AWS_DEV = 'AWS_DEV',
  TEST = 'TEST',
  DEPLOY = 'DEPLOY',
  REPORT = 'REPORT',
  TRIAGE = 'TRIAGE',
  QA = 'QA',
}

export enum AgentStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
}

export enum AgentTaskStatus {
  SUBMITTED = 'SUBMITTED',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum FeedbackSource {
  PORTAL = 'PORTAL',
  SENTRY = 'SENTRY',
  API = 'API',
}

export enum FeedbackType {
  BUG = 'BUG',
  FEATURE = 'FEATURE',
  IMPROVEMENT = 'IMPROVEMENT',
  QUESTION = 'QUESTION',
}

export enum FeedbackStatus {
  NEW = 'NEW',
  TRIAGED = 'TRIAGED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  DUPLICATE = 'DUPLICATE',
}

export enum ReleaseStatus {
  DRAFT = 'DRAFT',
  TESTING = 'TESTING',
  APPROVED = 'APPROVED',
  DEPLOYING = 'DEPLOYING',
  DEPLOYED = 'DEPLOYED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export enum BuildStatus {
  PENDING = 'PENDING',
  BUILDING = 'BUILDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum ArtifactType {
  ARCHITECTURE = 'ARCHITECTURE',
  ERD = 'ERD',
  WIREFRAME = 'WIREFRAME',
  FLOWCHART = 'FLOWCHART',
  SEQUENCE = 'SEQUENCE',
}
