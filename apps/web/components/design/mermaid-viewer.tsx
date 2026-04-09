'use client'

import { useEffect, useRef, useState } from 'react'

interface MermaidViewerProps {
  code: string
  theme?: 'default' | 'dark' | 'forest' | 'neutral'
}

/**
 * Renders a Mermaid diagram client-side. Mermaid is dynamically
 * imported so it never bloats the server bundle or SSR path.
 *
 * FR-06-02 — 테마 전환은 `theme` prop으로 지원. 테마가 바뀌면
 * mermaid.initialize를 다시 호출한다.
 */
export function MermaidViewer({ code, theme = 'default' }: MermaidViewerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)

    void (async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({ startOnLoad: false, theme, securityLevel: 'strict' })
        const id = `m-${Math.random().toString(36).slice(2)}`
        const { svg } = await mermaid.render(id, code)
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      } catch (err) {
        if (!cancelled) setError((err as Error).message)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [code, theme])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700 font-mono whitespace-pre-wrap">
        {error}
      </div>
    )
  }

  return <div ref={ref} className="bg-white border rounded p-4 overflow-auto" />
}
