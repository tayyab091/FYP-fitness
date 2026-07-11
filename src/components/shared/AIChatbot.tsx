'use client'
import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }

export function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am your T.E.S.T. AI fitness coach 🤖 Ask me anything about workouts, nutrition, or fitness goals!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages })
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.reply || 'Sorry, I could not process that. Try again.' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-6 md:bottom-8 z-50 w-14 h-14 rounded-full bg-[#00ff87] text-black flex items-center justify-center text-2xl shadow-lg shadow-[#00ff87]/30 hover:scale-110 transition-transform"
        aria-label="AI Fitness Coach">
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div className="fixed bottom-44 right-6 md:bottom-28 z-50 w-80 md:w-96 rounded-2xl border border-[#2a2a2a] bg-[#111] shadow-2xl flex flex-col overflow-hidden" style={{ height: '420px' }}>
          <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00ff87]/20 flex items-center justify-center text-base">🤖</div>
            <div>
              <div className="text-sm font-bold">T.E.S.T. AI Coach</div>
              <div className="text-[10px] text-[#00ff87]">● Online</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#00ff87] text-black font-medium rounded-br-sm'
                    : 'bg-[#1a1a1a] text-white rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-[#a0a0a0] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 border-t border-[#1a1a1a] flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about fitness, nutrition..."
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-[#555] outline-none focus:border-[#00ff87] transition-colors"
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-[#00ff87] text-black flex items-center justify-center disabled:opacity-40 hover:bg-[#00cc6a] transition-colors text-sm font-bold">
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}
