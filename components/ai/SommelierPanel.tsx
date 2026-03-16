/**
 * SommelierPanel — shared structured response renderer for Phase 2.
 *
 * Renders:
 *  - The prose answer
 *  - Primary recommendation card (wine name + reason)
 *  - Secondary recommendation cards
 *  - Clickable follow-up prompts
 *  - Linked portfolio wine chips
 *
 * Used by SommelierAsk (inline) and SommelierChat (chat bubble).
 */
'use client'

import Link from 'next/link'
import type { SommelierResponse } from '@/lib/ai/types'

interface SommelierPanelProps {
  response: SommelierResponse
  askedQuestion: string
  /** Called when the user clicks a follow-up prompt */
  onFollowUp?: (prompt: string) => void
  /** Called when the user wants to reset / ask another */
  onReset?: () => void
  /** Compact mode — used inside chat bubble (no border, reduced padding) */
  compact?: boolean
}

export default function SommelierPanel({
  response,
  askedQuestion,
  onFollowUp,
  onReset,
  compact = false,
}: SommelierPanelProps) {
  const hasRecommendations =
    response.primaryRecommendation ||
    (response.secondaryRecommendations && response.secondaryRecommendations.length > 0)

  const inner = (
    <div className={compact ? 'space-y-3' : 'space-y-5'}>

      {/* ── Question label ────────────────────────────────────────── */}
      {!compact && (
        <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-olive-400">
          On:{' '}
          <span className="italic normal-case tracking-normal text-olive-500">
            &ldquo;{askedQuestion}&rdquo;
          </span>
        </p>
      )}

      {/* ── Prose answer ──────────────────────────────────────────── */}
      <div className={compact ? '' : 'border-l-2 border-amber-400/50 pl-4 pr-1'}>
        <p className={`text-olive-800 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
          {response.answer}
        </p>
      </div>

      {/* ── Primary recommendation card ──────────────────────────── */}
      {response.primaryRecommendation && (
        <div className="rounded-lg border border-olive-200 bg-parchment-50 overflow-hidden">
          <div className="px-4 py-2 bg-olive-900 flex items-center gap-2">
            <span className="text-[8px] font-medium uppercase tracking-[0.25em] text-amber-400/70">
              Recommended
            </span>
          </div>
          <div className="px-4 py-3">
            {response.primaryRecommendation.slug ? (
              <Link
                href={`/products/${response.primaryRecommendation.slug}`}
                className="font-serif font-semibold text-olive-900 hover:text-olive-600 transition-colors text-sm block"
              >
                {response.primaryRecommendation.name}
              </Link>
            ) : (
              <p className="font-serif font-semibold text-olive-900 text-sm">
                {response.primaryRecommendation.name}
              </p>
            )}
            {response.primaryRecommendation.reason && (
              <p className="text-xs text-olive-600 mt-1 leading-relaxed line-clamp-2">
                {response.primaryRecommendation.reason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Secondary recommendations ────────────────────────────── */}
      {response.secondaryRecommendations && response.secondaryRecommendations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-olive-400">
            Also consider
          </p>
          {response.secondaryRecommendations.map((rec) => (
            <div
              key={rec.name}
              className="flex items-start gap-2 rounded border border-olive-100 bg-white px-3 py-2"
            >
              <span className="w-1 h-1 rounded-full bg-amber-400/60 flex-shrink-0 mt-1.5" />
              <div className="min-w-0">
                {rec.slug ? (
                  <Link
                    href={`/products/${rec.slug}`}
                    className="text-xs font-serif font-semibold text-olive-800 hover:text-olive-600 transition-colors"
                  >
                    {rec.name}
                  </Link>
                ) : (
                  <p className="text-xs font-serif font-semibold text-olive-800">{rec.name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Portfolio wine chips (legacy fallback if no rec cards) ── */}
      {!hasRecommendations &&
        response.suggestedWines &&
        response.suggestedWines.length > 0 && (
          <div className="pt-2 border-t border-olive-100">
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

      {/* ── Follow-up prompts ─────────────────────────────────────── */}
      {onFollowUp && response.followUpPrompts && response.followUpPrompts.length > 0 && (
        <div className="pt-1">
          <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-olive-400 mb-1.5">
            Continue exploring
          </p>
          <div className="flex flex-col gap-1">
            {response.followUpPrompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onFollowUp(p)}
                className="text-left text-xs text-olive-600 border border-olive-200 px-3 py-1.5 hover:border-olive-500 hover:text-olive-900 hover:bg-olive-50 transition-all rounded"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Reset link ────────────────────────────────────────────── */}
      {onReset && !compact && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-olive-400 hover:text-olive-700 transition-colors underline underline-offset-2"
        >
          Ask another question
        </button>
      )}
    </div>
  )

  if (compact) return inner
  return <div className="mt-5">{inner}</div>
}
