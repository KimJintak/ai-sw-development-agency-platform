'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Terminal, Wifi, WifiOff } from 'lucide-react'

interface Props {
  buildId: string
  initialLog?: string | null
  initialStatus?: string
}

export default function BuildLogViewer({ buildId, initialLog, initialStatus }: Props) {
  const [lines, setLines] = useState<string[]>(
    initialLog ? initialLog.split('\n') : [],
  )
  const [status, setStatus] = useState(initialStatus ?? '')
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const socket = io(`${base}/builds`, {
      path: '/socket.io',
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('build:subscribe', { buildId })
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('build:log', (data: { buildId: string; chunk: string }) => {
      if (data.buildId !== buildId) return
      setLines((prev) => [...prev, ...data.chunk.split('\n')])
    })

    socket.on('build:status', (data: { buildId: string; status: string }) => {
      if (data.buildId !== buildId) return
      setStatus(data.status)
    })

    return () => {
      socket.emit('build:unsubscribe', { buildId })
      socket.disconnect()
    }
  }, [buildId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const isDone = status === 'SUCCESS' || status === 'FAILED'

  return (
    <div className="border rounded-lg bg-[#0d1117] text-green-400 text-xs font-mono overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-white/60" />
          <span className="text-white/60">빌드 로그</span>
          {status && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              status === 'SUCCESS' ? 'bg-emerald-900/60 text-emerald-400' :
              status === 'FAILED' ? 'bg-red-900/60 text-red-400' :
              status === 'BUILDING' ? 'bg-amber-900/60 text-amber-400' :
              'bg-white/10 text-white/60'
            }`}>
              {status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-white/40">
          {connected ? (
            <Wifi size={11} className="text-emerald-400" />
          ) : (
            <WifiOff size={11} />
          )}
          <span className="text-[10px]">{connected ? 'live' : 'offline'}</span>
        </div>
      </div>
      <div className="h-48 overflow-y-auto p-3 space-y-0.5">
        {lines.length === 0 ? (
          <span className="text-white/30">로그 대기 중...</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className={`leading-5 ${line.includes('error') || line.includes('Error') ? 'text-red-400' : ''}`}>
              {line || ' '}
            </div>
          ))
        )}
        {!isDone && connected && (
          <div className="flex items-center gap-1 text-white/40">
            <span className="animate-pulse">▌</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
