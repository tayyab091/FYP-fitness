'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ChatConversationPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/chat?conversation=${id}`)
    }
  }, [id, router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
