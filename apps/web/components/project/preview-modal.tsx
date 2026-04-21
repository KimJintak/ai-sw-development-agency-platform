'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react'

interface PreviewModalProps {
  open: boolean
  url: string
  label: string
  category: string
  onClose: () => void
}

/**
 * Inline iframe preview for project links (Figma site, prototype,
 * staging, etc.). Many sites (GitHub, Google Docs, Notion) send
 * `X-Frame-Options: DENY` or CSP `frame-ancestors`, in which case the
 * iframe renders blank — we can't detect that cross-origin, so we
 * show a soft notice with a fallback "새 탭에서 열기" button.
 */
export function PreviewModal({ open, url, label, category, onClose }: PreviewModalProps) {
  const [loaded, setLoaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoaded(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const isSafeUrl = /^https?:\/\//i.test(url) && url !== '#'

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden ${
          fullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[85vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {category}
              </span>
              <span className="font-medium text-sm truncate">{label}</span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
              {url}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="h-8 px-2.5 inline-flex items-center gap-1 text-xs rounded-md border hover:bg-muted"
              title="새 탭에서 열기"
            >
              <ExternalLink size={12} /> 새 탭
            </a>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-muted"
              title={fullscreen ? '기본 크기' : '전체화면'}
            >
              {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-muted"
              title="닫기 (Esc)"
            >
              <X size={14} />
            </button>
          </div>
        </header>

        <div className="flex-1 relative bg-white dark:bg-slate-950">
          {isSafeUrl ? (
            <>
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  로딩 중...
                </div>
              )}
              <iframe
                src={url}
                title={label}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setLoaded(true)}
              />
              <div className="absolute bottom-2 right-2 pointer-events-none">
                <div className="text-[10px] px-2 py-1 rounded bg-amber-500/90 text-amber-950 shadow flex items-center gap-1">
                  <AlertTriangle size={10} />
                  일부 사이트는 iframe 임베드를 차단합니다 — 표시 안 되면 "새 탭"을 이용하세요
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-sm text-muted-foreground p-8">
              <AlertTriangle size={24} className="text-amber-600" />
              <div>유효한 URL이 아니거나 미리보기를 지원하지 않는 링크입니다.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
