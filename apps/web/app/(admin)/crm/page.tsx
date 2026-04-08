'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import type { Customer, Opportunity } from 'shared-types'
import { OpportunityStage } from 'shared-types'

const STAGES = Object.values(OpportunityStage)

export default function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [tab, setTab] = useState<'customers' | 'pipeline'>('customers')

  useEffect(() => {
    apiClient.get('/api/customers').then((r) => setCustomers(r.data))
    apiClient.get('/api/opportunities').then((r) => setOpportunities(r.data))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">CRM</h1>

      <div className="flex gap-2 border-b">
        {(['customers', 'pipeline'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'customers' ? 'Customers' : 'Sales Pipeline'}
          </button>
        ))}
      </div>

      {tab === 'customers' && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {['Company', 'Contact', 'Email', 'Phone'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{c.companyName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.contactName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? '—'}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No customers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="grid grid-cols-5 gap-3 min-w-max">
          {STAGES.map((stage) => {
            const items = opportunities.filter((o) => o.stage === stage)
            return (
              <div key={stage} className="w-52">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                  {stage.replace('_', ' ')} ({items.length})
                </div>
                <div className="space-y-2">
                  {items.map((o) => (
                    <div key={o.id} className="bg-card border rounded-md p-3 text-sm shadow-sm">
                      <p className="font-medium truncate">{o.title}</p>
                      {o.estimatedValue && (
                        <p className="text-muted-foreground text-xs mt-1">
                          ₩{Number(o.estimatedValue).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
