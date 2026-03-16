'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import SommelierPanel from './SommelierPanel'
import type { SommelierResponse, SessionPreferences } from '@/lib/ai/types'

interface Message {
  role: 'user' | 'sommelier'
  content: string
  response?: SommelierResponse
}

const WELCOME_MESSAGE: Message = {
  role: 'sommelier',
  content:
    'Benvenuto. I\'m here to guide you through the Terra Trionfo portfolio — whether you\'re looking for the perfect food pairing, exploring Italian regions, or searching for a new favourite. What would you like to know?',
}

const SUGGESTION_PROMPTS = [
  'Recommend a red wine under $50',
  'What pairs with grilled steak?',
  'What pairs with pasta carbonara?',
  'How does Franciacorta compare to Champagne?',
  'What is Nebbiolo?',
  'I like Burgundy — what should I try?',
]

// ── Extract lightweight session preferences from conversation history ───────
function extractPreferences(messages: Message[]): SessionPreferences {
  const prefs: SessionPreferences = {}
  const allText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ')

  if (/\b(red|reds)\b/.test(allText)) prefs.preferredColor = 'red'
  else if (/\b(white|whites)\b/.test(allText)) prefs.preferredColor = 'white'
  else if (/\bsparkling\b/.test(allText)) prefs.preferredColor = 'sparkling'
  else if (/\brosé|rosé\b/.test(allText)) prefs.preferredColor = 'rosé'

  if (/\blighter reds?\b/.test(allText)) prefs.preferredStyle = 'lighter reds'
  else if (/\bstructured\b/.test(allText)) prefs.preferredStyle = 'structured'
  else if (/\bcrisp\b/.test(allText)) prefs.preferredStyle = 'crisp whites'

  const compPoints: string[] = []
  if (/\bburgundy\b/.test(allText)) compPoints.push('Burgundy')
  if (/\bchampagne\b/.test(allText)) compPoints.push('Champagne')
  if (/\bprosecco\b/.test(allText)) compPoints.push('Prosecco')
  if (/\bbordeaux\b/.test(allText)) compPoints.push('Bordeaux')
  if (compPoints.length > 0) prefs.comparisonPoints = compPoints

  if (/\bunder\s*\$?(30|35|40)\b/.test(allText)) prefs.priceRange = 'approachable'
  else if (/\bunder\s*\$?(60|70)\b/.test(allText)) prefs.priceRange = 'mid'
  else if (/\bspecial|premium|gift|cellar\b/.test(allText)) prefs.priceRange = 'premium'

  return prefs
}

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

    const userMsg: Message = { role: 'user', content: q }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const currentMessages = [...messages, userMsg]
      const sessionPreferences = extractPreferences(currentMessages)

      const res = await fetch('/api/ai/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, sessionPreferences }),
      })
      const data: SommelierResponse = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'sommelier',
          content: data.answer,
          response: data,
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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: open
            ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)'
            : 'linear-gradient(145deg, #0f172a 0%, #1a2540 100%)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(148,163,184,0.1)',
        }}
      >
        {open ? (
          <svg className="w-4 h-4" fill="none" stroke="#94a3b8" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M9 7.5h6l-1.5 3a4.5 4.5 0 0 1-3 0z" fill="rgba(159,18,57,0.7)" />
            <path d="M7 3h10l-2.5 7a4.5 4.5 0 0 1-5 0L7 3z"
              stroke="#e2e8f0" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="3" x2="16" y2="3" stroke="#bfdbfe" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
            <line x1="12" y1="13" x2="12" y2="20" stroke="#94a3b8" strokeWidth={1.3} strokeLinecap="round" />
            <line x1="8.5" y1="20" x2="15.5" y2="20" stroke="#e2e8f0" strokeWidth={1.5} strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-[4.5rem] right-6 z-50 w-80 sm:w-[22rem] bg-white border border-olive-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(76vh, 600px)' }}
        >
          {/* Header */}
          <div className="bg-olive-900 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <svg className="w-3.5 h-3.5 text-amber-400/70" viewBox="0 0 24 24" fill="none">
                <path d="M9 7.5h6l-1.5 3a4.5 4.5 0 0 1-3 0z" fill="rgba(159,18,57,0.6)" />
                <path d="M7 3h10l-2.5 7a4.5 4.5 0 0 1-5 0L7 3z"
                  stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="13" x2="12" y2="20" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
                <line x1="8.5" y1="20" x2="15.5" y2="20" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
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
                {msg.role === 'user' ? (
                  <div className="max-w-[88%] text-sm leading-relaxed px-3.5 py-2.5 rounded-xl rounded-br-sm bg-olive-800 text-parchment-100">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[92%] text-sm leading-relaxed px-3.5 py-2.5 rounded-xl rounded-bl-sm bg-parchment-50 text-olive-800 border border-olive-100">
                    {msg.response ? (
                      <SommelierPanel
                        response={msg.response}
                        askedQuestion=""
                        compact
                        onFollowUp={(p) => sendMessage(p)}
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                )}
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
