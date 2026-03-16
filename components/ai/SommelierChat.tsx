'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { SommelierResponse } from '@/lib/ai/types'

interface Message {
  role: 'user' | 'sommelier'
  content: string
  suggestedWines?: SommelierResponse['suggestedWines']
}

const WELCOME_MESSAGE: Message = {
  role: 'sommelier',
  content:
    'Benvenuto. I\'m here to guide you through the Terra Trionfo portfolio — whether you\'re looking for the perfect food pairing, exploring Italian regions, or searching for a new favourite. What would you like to know?',
}

const SUGGESTION_PROMPTS = [
  'What wine should I try tonight?',
  'What pairs with pasta carbonara?',
  'Tell me about Barolo',
  'How is Franciacorta made?',
]

export default function SommelierChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open, messages])

  async function sendMessage(text?: string) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    setHasInteracted(true)
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data: SommelierResponse = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'sommelier',
          content: data.answer,
          suggestedWines: data.suggestedWines,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'sommelier',
          content: 'I apologise — something went wrong. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* ── Floating trigger button ──────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close wine guide' : 'Open wine guide'}
        title="Explore Italian Wines"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-olive-900 hover:bg-olive-800 text-parchment-100 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 border border-olive-700/50"
      >
        {open ? (
          /* Close × */
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          /* Wine glass — bowl, stem, base */
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10l-2.5 7a4.5 4.5 0 0 1-5 0L7 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 19h7" />
          </svg>
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-[4.5rem] right-6 z-50 w-80 sm:w-[22rem] bg-white border border-olive-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(72vh, 560px)' }}
        >
          {/* Header */}
          <div className="bg-olive-900 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <svg className="w-3.5 h-3.5 text-amber-400/70" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10l-2.5 7a4.5 4.5 0 0 1-5 0L7 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 19h7" />
              </svg>
              <div>
                <p className="text-[8px] uppercase tracking-[0.22em] text-amber-400/50 leading-none mb-0.5">
                  Terra Trionfo
                </p>
                <p className="text-parchment-100 font-serif font-semibold text-sm leading-none">
                  Wine Guide
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-parchment-400/50 hover:text-parchment-100 transition-colors p-1 -mr-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] text-sm leading-relaxed px-3.5 py-2.5 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-olive-800 text-parchment-100 rounded-br-sm'
                      : 'bg-parchment-50 text-olive-800 border border-olive-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content}

                  {/* Suggested portfolio wines */}
                  {msg.suggestedWines && msg.suggestedWines.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-olive-200 space-y-1">
                      <p className="text-[9px] uppercase tracking-wider text-olive-400">From the Portfolio</p>
                      {msg.suggestedWines.map((w) => (
                        <Link
                          key={w.id}
                          href={`/products/${w.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center justify-between hover:text-olive-900 text-olive-600 transition-colors"
                        >
                          <span className="text-xs font-medium">{w.displayName}</span>
                          <span className="text-xs ml-2 flex-shrink-0">${w.price.toFixed(0)}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-parchment-50 border border-olive-100 rounded-xl rounded-bl-sm px-3.5 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 bg-olive-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Suggestion prompts (before first interaction) */}
            {!hasInteracted && (
              <div className="pt-1">
                <p className="text-[9px] uppercase tracking-wider text-olive-400 mb-2">
                  Try asking
                </p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTION_PROMPTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      disabled={loading}
                      className="text-left text-xs border border-olive-200 text-olive-600 px-3 py-1.5 hover:border-olive-500 hover:text-olive-900 hover:bg-olive-50 transition-all disabled:opacity-40 rounded"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-olive-200 p-3 flex gap-2 flex-shrink-0 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about Italian wine…"
              maxLength={400}
              disabled={loading}
              className="flex-1 text-sm border border-olive-300 px-3 py-2 text-olive-900 placeholder:text-olive-400 focus:outline-none focus:border-olive-600 bg-parchment-50 rounded disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="px-3 py-2 bg-olive-800 text-parchment-100 hover:bg-olive-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
