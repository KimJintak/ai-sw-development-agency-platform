import { OpportunityStage, Platform } from './enums'

export interface Customer {
  id: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Opportunity {
  id: string
  customerId: string
  customer?: Customer
  title: string
  stage: OpportunityStage
  estimatedValue?: number
  description?: string
  expectedCloseDate?: string
  createdAt: string
  updatedAt: string
}

export interface Contract {
  id: string
  opportunityId: string
  projectId?: string
  amount: number
  currency: string
  startDate: string
  deadlineDate: string
  platforms: Platform[]
  signedAt?: string
  createdAt: string
  updatedAt: string
}
