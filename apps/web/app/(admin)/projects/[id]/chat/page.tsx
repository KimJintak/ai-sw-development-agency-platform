'use client'

import { use } from 'react'
import { ChatRoom } from '@/components/chat/chat-room'

export default function ProjectChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <div className="h-[calc(100vh-3rem)] -m-6">
      <ChatRoom projectId={id} />
    </div>
  )
}
