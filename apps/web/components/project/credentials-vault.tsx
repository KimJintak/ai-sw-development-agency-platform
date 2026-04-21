'use client'

import { useEffect, useState, useCallback } from 'react'
import apiClient from '@/lib/api-client'
import { useCurrentUser, hasRole } from '@/lib/auth/current-user-context'
import {
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  Plus,
  X,
  Trash2,
  RefreshCw,
  ExternalLink,
  Check,
  Lock,
  User as UserIcon,
} from 'lucide-react'

interface Credential {
  id: string
  projectId: string
  role: string
  label: string
  email: string
  loginUrl: string | null
  note: string | null
  lastRotatedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export function CredentialsVault({ projectId }: { projectId: string }) {
  const { user } = useCurrentUser()
  const canView = hasRole(user, 'ADMIN', 'PM')
  const canEdit = hasRole(user, 'ADMIN')
  const [creds, setCreds] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    role: '',
    label: '',
    email: '',
    password: '',
    loginUrl: '',
    note: '',
  })

  const load = useCallback(() => {
    if (!canView) { setLoading(false); return }
    apiClient
      .get<Credential[]>(`/api/projects/${projectId}/credentials`)
      .then((r) => setCreds(r.data))
      .catch((err: { response?: { status?: number } }) => {
        if (err.response?.status === 403) setForbidden(true)
      })
      .finally(() => setLoading(false))
  }, [projectId, canView])

  useEffect(() => { load() }, [load])

  if (!canView) return null
  if (loading) return null
  if (forbidden) return null

  const submit = async () => {
    if (!form.role.trim() || !form.email.trim() || !form.password.trim()) return
    await apiClient.post(`/api/projects/${projectId}/credentials`, {
      role: form.role.trim(),
      label: form.label.trim() || form.role.trim(),
      email: form.email.trim(),
      password: form.password,
      loginUrl: form.loginUrl.trim() || undefined,
      note: form.note.trim() || undefined,
    })
    setForm({ role: '', label: '', email: '', password: '', loginUrl: '', note: '' })
    setAdding(false)
    load()
  }

  const toggleReveal = async (id: string) => {
    if (revealed[id]) {
      const next = { ...revealed }
      delete next[id]
      setRevealed(next)
      return
    }
    try {
      const res = await apiClient.post<{ password: string }>(`/api/project-credentials/${id}/reveal`)
      setRevealed({ ...revealed, [id]: res.data.password })
    } catch {
      alert('비밀번호 조회 권한이 없거나 서버 오류입니다.')
    }
  }

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500)
    } catch {}
  }

  const copyPassword = async (id: string) => {
    try {
      const res = await apiClient.post<{ password: string }>(`/api/project-credentials/${id}/reveal`)
      await copy(`${id}-pwd`, res.data.password)
    } catch {
      alert('비밀번호 복사 실패')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('이 계정을 삭제할까요?')) return
    await apiClient.delete(`/api/project-credentials/${id}`)
    load()
  }

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <KeyRound size={14} className="text-amber-600" />
          <span className="font-semibold text-sm">테스트 계정</span>
          <span className="text-xs text-muted-foreground">{creds.length}</span>
          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 inline-flex items-center gap-1">
            <Lock size={9} /> 암호화 저장
          </span>
        </div>
        {canEdit && (
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted"
          >
            {adding ? <X size={12} /> : <Plus size={12} />}
            {adding ? '취소' : '계정 추가'}
          </button>
        )}
      </header>

      {canEdit && adding && (
        <div className="p-3 border-b border-border bg-muted/30 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="역할 (예: Super Admin)"
              className="px-2 py-1.5 text-sm border rounded bg-background"
            />
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="라벨 (선택)"
              className="px-2 py-1.5 text-sm border rounded bg-background"
            />
          </div>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="이메일"
            className="w-full px-2 py-1.5 text-sm border rounded bg-background"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="비밀번호 (AES-GCM 암호화 저장)"
            className="w-full px-2 py-1.5 text-sm border rounded bg-background font-mono"
          />
          <input
            value={form.loginUrl}
            onChange={(e) => setForm({ ...form, loginUrl: e.target.value })}
            placeholder="로그인 URL (선택, 예: https://staging.example.com/login)"
            className="w-full px-2 py-1.5 text-sm border rounded bg-background"
          />
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="메모 (선택)"
            className="w-full px-2 py-1.5 text-sm border rounded bg-background"
          />
          <button
            onClick={submit}
            disabled={!form.role.trim() || !form.email.trim() || !form.password.trim()}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
          >
            저장
          </button>
        </div>
      )}

      {creds.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground italic">
          등록된 테스트 계정이 없습니다.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {creds.map((c) => {
            const pwd = revealed[c.id]
            return (
              <li key={c.id} className="p-3 hover:bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <UserIcon size={14} />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[140px_1fr_1fr] gap-2 items-baseline">
                    <div>
                      <div className="font-medium text-sm truncate">{c.role}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{c.label}</div>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-mono truncate">{c.email}</span>
                      <button
                        onClick={() => copy(`${c.id}-email`, c.email)}
                        className="opacity-60 hover:opacity-100 shrink-0"
                        title="이메일 복사"
                      >
                        {copiedId === `${c.id}-email` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-mono truncate">
                        {pwd ?? '••••••••'}
                      </span>
                      <button
                        onClick={() => toggleReveal(c.id)}
                        className="opacity-60 hover:opacity-100 shrink-0"
                        title={pwd ? '숨기기' : '표시'}
                      >
                        {pwd ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                      <button
                        onClick={() => copyPassword(c.id)}
                        className="opacity-60 hover:opacity-100 shrink-0"
                        title="비밀번호 복사"
                      >
                        {copiedId === `${c.id}-pwd` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.loginUrl && (
                      <a
                        href={c.loginUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
                        title="로그인 페이지"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => remove(c.id)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                        title="삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {(c.note || c.lastRotatedAt) && (
                  <div className="ml-12 mt-1.5 flex gap-3 text-[10px] text-muted-foreground">
                    {c.note && <span>📝 {c.note}</span>}
                    {c.lastRotatedAt && (
                      <span className="flex items-center gap-1">
                        <RefreshCw size={9} /> 재발급 {new Date(c.lastRotatedAt).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
