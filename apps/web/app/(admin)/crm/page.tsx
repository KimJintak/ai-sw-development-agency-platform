'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import type { Customer, Opportunity } from 'shared-types'
import { OpportunityStage } from 'shared-types'
import { Loader2 } from 'lucide-react'

const STAGES = Object.values(OpportunityStage)

export default function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [tab, setTab] = useState<'customers' | 'pipeline'>('customers')

  const [showForm, setShowForm] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const loadCustomers = () =>
    apiClient.get('/api/customers').then((r) => setCustomers(r.data)).catch(() => {})

  useEffect(() => {
    loadCustomers()
    apiClient.get('/api/opportunities').then((r) => setOpportunities(r.data)).catch(() => {})
  }, [])

  const resetForm = () => {
    setCompanyName(''); setContactName(''); setEmail('')
    setPhone(''); setAddress(''); setNotes('')
    setSubmitError(null)
  }

  const submit = async () => {
    setSubmitError(null)
    if (!companyName.trim()) { setSubmitError('회사명을 입력하세요.'); return }
    if (!contactName.trim()) { setSubmitError('담당자명을 입력하세요.'); return }
    if (!email.trim()) { setSubmitError('이메일을 입력하세요.'); return }
    setSubmitting(true)
    try {
      await apiClient.post('/api/customers', {
        companyName,
        contactName,
        email,
        phone: phone || undefined,
        address: address || undefined,
        notes: notes || undefined,
      })
      resetForm()
      setShowForm(false)
      loadCustomers()
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : (msg ?? '고객사 등록에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">발주처관리</h1>
        {tab === 'customers' && (
          <button
            onClick={() => { resetForm(); setShowForm((v) => !v) }}
            className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90"
          >
            {showForm ? '취소' : '+ 고객사 등록'}
          </button>
        )}
      </div>

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

      {tab === 'customers' && showForm && (
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-sm">새 고객사 등록</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">회사명 <span className="text-red-500">*</span></label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                placeholder="(주)우주소프트" className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">담당자명 <span className="text-red-500">*</span></label>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)}
                placeholder="홍길동" className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">이메일 <span className="text-red-500">*</span></label>
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                type="email" placeholder="contact@company.com" className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">전화번호</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000" className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">주소</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="서울시 강남구..." className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">메모</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={2} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
          </div>
          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-3 py-2">
              {submitError}
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={submit} disabled={submitting}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? '등록 중...' : '고객사 등록'}
            </button>
          </div>
        </div>
      )}

      {tab === 'customers' && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {['회사명', '담당자', '이메일', '전화번호'].map((h) => (
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
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">등록된 고객사가 없습니다.</td></tr>
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
