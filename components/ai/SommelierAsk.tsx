'use client'

import { useState } from 'react'
import SommelierPanel from './SommelierPanel'
import type {
  SommelierRequest,
  SommelierResponse,
  SessionPreferences,
} from '@/lib/ai/types'

interface SommelierAskProps {
  /** Quick-select suggestion chips displayed above the input */
  suggestions: string[]
  wineContext?: SommelierRequest['wineContext']
  regionContext?: SommelierRequest['regionContext']
  producerContext?: SommelierRequest['producerContext']
  sessionPreferences?: SessionPreferences
  /** Small label above the heading (default: "Ask the Sommelier") */
  sectionLabel?: string
  /** Main heading text */
  heading?: string
  /** Placeholder inside the text input */
  placeholder?: string
}

export default function SommelierAsk({
  suggestions,
  wineContext,
  regionContext,
  producerContext,
  sessionPreferences,
  sectionLabel = 'Ask the Sommelier',
  heading,
  placeholder = 'Ask anything about this wine…',
}: SommelierAskProps) {
  const [inputValue, setInputValue] = useState('')
  const [response, setResponse] = useState<SommelierResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [askedQuestion, setAskedQuestion] = useState('')

  async function ask(question: string) {
    const q = question.trim()
    if (!q || loading) return
    setLoading(true)
    setErrorMsg(null)
    setResponse(null)
    setAskedQuestion(q)
    try {
      const res = await fetch('/api/ai/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          wineContext,
          regionContext,
          producerContext,
          sessionPreferences,
        } as SommelierRequest),
      })
      const data: SommelierResponse = await res.json()
      if (!res.ok && !data.answer) {
        throw new Error(data.error ?? 'Unexpected error')
      }
      setResponse(data)
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    ask(inputValue)
  }

  return (
    <div className="border border-olive-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bg-olive-900 px-6 py-4 flex items-start gap-3">
        {/* Wine glass icon — cold palette with garnet fill */}
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
          <path d="M9 7.5h6l-1.5 3a4.5 4.5 0 0 1-3 0z" fill="rgba(159,18,57,0.65)" />
          <path d="M7 3h10l-2.5 7a4.5 4.5 0 0 1-5 0L7 3z"
            stroke="#e2e8f0" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="13" x2="12" y2="20" stroke="#94a3b8" strokeWidth={1.3} strokeLinecap="round" />
          <line x1="8.5" y1="20" x2="15.5" y2="20" stroke="#e2e8f0" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-amber-400/60 mb-0.5">
            {sectionLabel}
          </p>
          {heading && (
            <p className="text-parchment-100 text-sm font-serif font-semibold leading-snug">
              {heading}
            </p>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* ── Suggestion chips ────────────────────────────────────── */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                disabled={loading}
                className="text-xs border border-olive-300 text-olive-600 px-3 py-1.5 hover:border-olive-600 hover:text-olive-900 hover:bg-olive-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed leading-none"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Custom question input ────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            maxLength={400}
            disabled={loading}
            className="flex-1 text-sm border border-olive-300 px-3 py-2 text-olive-900 placeholder:text-olive-400 focus:outline-none focus:border-olive-600 bg-parchment-50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-4 py-2 bg-olive-800 text-parchment-100 text-xs font-medium hover:bg-olive-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Ask'
            )}
          </button>
        </form>

        {/* ── Loading indicator ────────────────────────────────── */}
        {loading && (
          <div className="mt-5 flex items-center gap-2.5 text-olive-500 text-sm">
            <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="italic text-sm">Consulting the cellar…</span>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────── */}
        {errorMsg && !loading && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded">
            {errorMsg}
          </div>
        )}

        {/* ── Response via SommelierPanel ──────────────────────── */}
        {response && !loading && (
          <SommelierPanel
            response={response}
            askedQuestion={askedQuestion}
            onFollowUp={(p) => ask(p)}
            onReset={() => {
              setResponse(null)
              setInputValue('')
              setAskedQuestion('')
            }}
          />
        )}
      </div>
    </div>
  )
}
