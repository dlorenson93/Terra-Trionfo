'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SommelierRequest, SommelierResponse } from '@/lib/ai/types'

interface SommelierAskProps {
  /** Quick-select suggestion chips displayed above the input */
  suggestions: string[]
  wineContext?: SommelierRequest['wineContext']
  regionContext?: SommelierRequest['regionContext']
  producerContext?: SommelierRequest['producerContext']
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
        {/* Wine glass icon */}
        <svg
          className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
          />
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

        {/* ── Response ────────────────────────────────────────── */}
        {response && !loading && (
          <div className="mt-5">
            <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-olive-400 mb-2.5">
              On:{' '}
              <span className="italic normal-case tracking-normal text-olive-500">
                &ldquo;{askedQuestion}&rdquo;
              </span>
            </p>

            <div className="border-l-2 border-amber-400/50 pl-4 pr-1">
              <p className="text-sm text-olive-800 leading-relaxed">{response.answer}</p>
            </div>

            {/* Suggested portfolio wines */}
            {response.suggestedWines && response.suggestedWines.length > 0 && (
              <div className="mt-4 pt-4 border-t border-olive-100">
                <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-olive-400 mb-2">
                  From the Portfolio
                </p>
                <div className="space-y-1.5">
                  {response.suggestedWines.map((w) => (
                    <Link
                      key={w.id}
                      href={`/products/${w.id}`}
                      className="flex items-center justify-between group hover:bg-olive-50 px-2 py-1.5 -mx-2 rounded transition-colors"
                    >
                      <div>
                        <span className="text-sm font-serif font-semibold text-olive-800 group-hover:text-olive-900">
                          {w.displayName}
                        </span>
                        <span className="text-xs text-olive-500 ml-2">{w.type}</span>
                      </div>
                      <span className="text-xs text-olive-500 flex-shrink-0">
                        ${w.price.toFixed(0)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Ask another question prompt */}
            <button
              type="button"
              onClick={() => {
                setResponse(null)
                setInputValue('')
                setAskedQuestion('')
              }}
              className="mt-4 text-xs text-olive-400 hover:text-olive-700 transition-colors underline underline-offset-2"
            >
              Ask another question
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
