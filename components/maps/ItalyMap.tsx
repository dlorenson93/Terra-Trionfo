'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { REGION_LIST, type RegionData } from '@/lib/regions'

/**
 * Pure-SVG interactive Italy wine regions map.
 *
 * ViewBox: 0 0 280 430
 * Geographic transform:
 *   x = (lng - 6.5) * 23.3
 *   y = (47.1 - lat) * 44.8
 *
 * Italy mainland outline is a hand-optimised 35-point polygon
 * derived from the real coastline / border geometry.
 */

// Italy mainland outline — clockwise from NW border near Monaco
const ITALY_MAINLAND =
  'M8,138 L10,60 L30,55 L96,10 L118,3 L135,3 L152,26 ' +
  'L169,30 L167,64 L140,78 L138,125 L148,138 L165,158 ' +
  'L180,208 L208,228 L222,238 L215,248 L242,268 L252,296 ' +
  'L268,318 L248,330 L242,348 L230,378 L215,402 ' +
  'L210,396 L215,348 L212,315 L182,282 ' +
  'L155,264 L136,241 L122,222 L108,190 ' +
  'L90,182 L88,156 L80,131 L57,118 L24,148 Z'

// Sardinia simplified polygon (adds recognisability)
const SARDINIA = 'M42,255 L50,240 L62,238 L67,250 L72,268 L65,285 L55,290 L44,278 Z'

// Sicily simplified polygon
const SICILY   = 'M110,415 L130,408 L160,410 L178,420 L170,430 L140,432 L115,426 Z'

// SVG marker [cx, cy] for each region — pre-computed from coordinates
// Formula: x = (lng - 6.5) * 23.3 | y = (47.1 - lat) * 44.8
// Piedmont       (7.9°E, 44.6°N)  → (33,  112)
// Lombardy       (9.7°E, 45.7°N)  → (75,   63)
// Alto Adige     (11.3°E, 46.6°N) → (112,  22)
// Emilia-Romagna (12.1°E, 44.1°N) → (130, 134)
const MARKERS: Record<string, { cx: number; cy: number; labelAnchor: 'end' | 'start' }> = {
  'piedmont':        { cx: 33,  cy: 112, labelAnchor: 'end'   },
  'lombardy':        { cx: 75,  cy: 63,  labelAnchor: 'start' },
  'alto-adige':      { cx: 112, cy: 22,  labelAnchor: 'start' },
  'emilia-romagna':  { cx: 130, cy: 134, labelAnchor: 'start' },
}

export default function ItalyMap() {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

  const hoveredRegion: RegionData | undefined = REGION_LIST.find((r) => r.slug === hovered)

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox="0 0 280 430"
        className="w-full h-auto"
        role="img"
        aria-label="Interactive map of Italian wine regions"
        style={{ maxHeight: 480 }}
      >
        {/* ── Mainland Italy ─────────────────────────────────── */}
        <path
          d={ITALY_MAINLAND}
          fill="#2d3d20"
          stroke="#4a603a"
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ── Sardinia ───────────────────────────────────────── */}
        <path
          d={SARDINIA}
          fill="#253318"
          stroke="#3d522e"
          strokeWidth="0.8"
        />

        {/* ── Sicily ─────────────────────────────────────────── */}
        <path
          d={SICILY}
          fill="#253318"
          stroke="#3d522e"
          strokeWidth="0.8"
        />

        {/* ── Region markers ─────────────────────────────────── */}
        {REGION_LIST.map((region) => {
          const marker = MARKERS[region.slug]
          if (!marker) return null
          const active = hovered === region.slug

          return (
            <g
              key={region.slug}
              onClick={() => router.push(`/regions/${region.slug}`)}
              onMouseEnter={() => setHovered(region.slug)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`Explore ${region.name} wine region`}
            >
              {/* Outer pulse ring */}
              <circle
                cx={marker.cx}
                cy={marker.cy}
                r={active ? 14 : 11}
                fill="none"
                stroke="#d97706"
                strokeWidth={active ? 1.5 : 0.8}
                opacity={active ? 0.45 : 0.25}
                style={{ transition: 'r 0.2s ease, opacity 0.2s ease' }}
              />
              {/* Inner filled marker */}
              <circle
                cx={marker.cx}
                cy={marker.cy}
                r={active ? 7 : 5}
                fill={active ? '#f59e0b' : '#b45309'}
                stroke="#fef3c7"
                strokeWidth={1.5}
                style={{ transition: 'r 0.2s ease, fill 0.2s ease' }}
              />
              {/* Region label */}
              <text
                x={marker.cx + (marker.labelAnchor === 'end' ? -14 : 14)}
                y={marker.cy + 1}
                textAnchor={marker.labelAnchor}
                dominantBaseline="middle"
                fill="#f5f0e8"
                fontSize={7}
                fontFamily="Georgia, 'Times New Roman', serif"
                letterSpacing={0.5}
                opacity={active ? 1 : 0.55}
                style={{ pointerEvents: 'none', transition: 'opacity 0.2s ease' }}
              >
                {region.name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* ── Hover tooltip ──────────────────────────────────────── */}
      <div
        className="absolute bottom-3 left-3 right-3 pointer-events-none"
        style={{
          opacity: hoveredRegion ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        {hoveredRegion && (
          <div className="bg-olive-950/95 border border-olive-700/60 px-4 py-3 max-w-xs">
            <p className="text-[9px] font-medium text-amber-400/60 uppercase tracking-[0.3em] mb-0.5">
              {hoveredRegion.subtitle}
            </p>
            <p className="font-serif font-bold text-parchment-100 text-sm leading-tight">
              {hoveredRegion.name}
            </p>
            <p className="text-[10px] text-parchment-400/60 mt-1">
              {hoveredRegion.grapes.slice(0, 3).join(' · ')}
            </p>
            <p className="text-[9px] text-amber-400/50 mt-1.5 uppercase tracking-wider">
              Click to explore →
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
