/**
 * EstatePhotoStrip — 4 bespoke SVG illustration panels depicting Italian estate life.
 * Fully self-contained: no external images, no external dependencies.
 * Layout: 2×2 on mobile, 4-across on desktop.
 */

interface Props {
  caption?: string
}

// ── Panel 1: Vineyard rows in perspective ─────────────────────────────────────
function VineyardRowsPanel() {
  return (
    <div style={{ background: '#0d1608', aspectRatio: '4/3' }} className="relative overflow-hidden">
      <svg
        viewBox="0 0 300 225"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Sky at vanishing point */}
        <rect x="0" y="0" width="300" height="225" fill="#0d1608" />

        {/* Horizon glow at VP (150,44) */}
        <ellipse cx="150" cy="44" rx="92" ry="42" fill="#c08820" fillOpacity="0.18" />
        <ellipse cx="150" cy="44" rx="48" ry="22" fill="#d4a030" fillOpacity="0.14" />

        {/* Sky fade above horizon */}
        <rect x="0" y="0" width="300" height="50" fill="#080c05" fillOpacity="0.55" />

        {/* Converging vineyard row lines */}
        <g stroke="#527038" strokeWidth="1.5" strokeOpacity="0.52">
          <line x1="150" y1="44" x2="0"   y2="225" />
          <line x1="150" y1="44" x2="38"  y2="225" />
          <line x1="150" y1="44" x2="80"  y2="225" />
          <line x1="150" y1="44" x2="116" y2="225" />
          <line x1="150" y1="44" x2="150" y2="225" />
          <line x1="150" y1="44" x2="184" y2="225" />
          <line x1="150" y1="44" x2="220" y2="225" />
          <line x1="150" y1="44" x2="262" y2="225" />
          <line x1="150" y1="44" x2="300" y2="225" />
        </g>

        {/* Horizontal vine wire lines at depth intervals */}
        <g stroke="#3c5022" strokeWidth="1" strokeOpacity="0.32" fill="none">
          <line x1="113" y1="88"  x2="187" y2="88"  />
          <line x1="100" y1="114" x2="200" y2="114" />
          <line x1="86"  y1="140" x2="214" y2="140" />
          <line x1="70"  y1="168" x2="230" y2="168" />
          <line x1="52"  y1="198" x2="248" y2="198" />
        </g>

        {/* Subtle earth tone between two central rows */}
        <path
          d="M150,44 L116,225 L150,225 Z"
          fill="#2a3c14" fillOpacity="0.18"
        />
        <path
          d="M150,44 L150,225 L184,225 Z"
          fill="#3a5020" fillOpacity="0.14"
        />
      </svg>
    </div>
  )
}

// ── Panel 2: Oak barrel cellar ────────────────────────────────────────────────
function BarrelCellarPanel() {
  // Three rows of barrels: back (small), mid, front (large)
  const back  = [50, 95, 140, 185, 230].map(x => ({ x, y: 108, r: 18 }))
  const mid   = [70, 148, 222].map(x => ({ x, y: 154, r: 22 }))
  const front = [88, 196].map(x => ({ x, y: 198, r: 26 }))
  const allBarrels = [...back, ...mid, ...front]

  return (
    <div style={{ background: '#0c0a08', aspectRatio: '4/3' }} className="relative overflow-hidden">
      <svg
        viewBox="0 0 300 225"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <rect width="300" height="225" fill="#0c0a08" />

        {/* Stone vault arch ceiling */}
        <path d="M0,108 Q150,18 300,108 L300,0 L0,0 Z" fill="#141210" />
        <path d="M0,108 Q150,18 300,108" stroke="#242018" strokeWidth="4" fill="none" />

        {/* Warm lantern glow from cellar depth */}
        <radialGradient id="bc-glow" cx="0.5" cy="0.52" r="0.45">
          <stop offset="0%" stopColor="#c07820" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c07820" stopOpacity="0" />
        </radialGradient>
        <rect width="300" height="225" fill="url(#bc-glow)" />

        {/* Barrels */}
        {allBarrels.map((b, i) => (
          <g key={i}>
            {/* Outer oak ring */}
            <ellipse cx={b.x} cy={b.y} rx={b.r * 1.12} ry={b.r} fill="#1e1008" stroke="#624030" strokeWidth="1.5" />
            {/* Wood end face */}
            <ellipse cx={b.x} cy={b.y} rx={b.r * 0.76} ry={b.r * 0.72} fill="#281808" stroke="#482818" strokeWidth="1" />
            {/* Metal hoop band */}
            <ellipse cx={b.x} cy={b.y} rx={b.r * 1.12} ry={b.r * 0.32} fill="none" stroke="#402818" strokeWidth="1" strokeOpacity="0.65" />
            {/* Stave grain lines */}
            {[-0.38, -0.14, 0.1, 0.34].map((ofs, j) => (
              <line
                key={j}
                x1={b.x + b.r * ofs}      y1={b.y - b.r * 0.94}
                x2={b.x + b.r * ofs * 0.6} y2={b.y + b.r * 0.94}
                stroke="#381808" strokeWidth="0.7" strokeOpacity="0.48"
              />
            ))}
          </g>
        ))}

        {/* Floor warmth */}
        <ellipse cx="150" cy="220" rx="90" ry="10" fill="#c07820" fillOpacity="0.09" />
      </svg>
    </div>
  )
}

// ── Panel 3: Grape harvest close-up ──────────────────────────────────────────
function HarvestGrapesPanel() {
  // Grape cluster: 5-4-3-2-1 rows, r=13
  const r = 13
  const rows: { y: number; xs: number[] }[] = [
    { y: 82,  xs: [94, 122, 150, 178, 206] },
    { y: 108, xs: [108, 136, 164, 192] },
    { y: 134, xs: [122, 150, 178] },
    { y: 160, xs: [136, 164] },
    { y: 186, xs: [150] },
  ]

  return (
    <div style={{ background: '#180c10', aspectRatio: '4/3' }} className="relative overflow-hidden">
      <svg
        viewBox="0 0 300 225"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <rect width="300" height="225" fill="#180c10" />

        {/* Background vine leaf — large, muted */}
        <path
          d="M62,14 C80,6 102,18 98,38 C110,30 126,38 120,52 C132,48 140,58 133,68 C138,74 135,86 126,86 C120,96 106,98 96,92 C90,98 76,98 70,92 C61,86 58,74 63,68 C56,58 64,48 76,52 C70,38 78,30 90,38 C86,18 44,6 62,14 Z"
          fill="#264818" fillOpacity="0.52"
          transform="translate(24,14) scale(1.38)"
        />
        <path
          d="M62,14 C80,6 102,18 98,38 C110,30 126,38 120,52 C132,48 140,58 133,68 C138,74 135,86 126,86 C120,96 106,98 96,92 C90,98 76,98 70,92 C61,86 58,74 63,68 C56,58 64,48 76,52 C70,38 78,30 90,38 C86,18 44,6 62,14 Z"
          fill="none" stroke="#3a6024" strokeWidth="0.8" strokeOpacity="0.42"
          transform="translate(24,14) scale(1.38)"
        />

        {/* Warm ambient glow */}
        <ellipse cx="150" cy="128" rx="105" ry="95" fill="#c04828" fillOpacity="0.1" />

        {/* Stem */}
        <line x1="150" y1="56" x2="150" y2="82" stroke="#4a3028" strokeWidth="2.5" strokeLinecap="round" />

        {/* Grapes */}
        {rows.map((row, ri) =>
          row.xs.map((x, gi) => (
            <g key={`${ri}-${gi}`}>
              {/* Drop shadow */}
              <ellipse cx={x + 2} cy={row.y + 2} rx={r + 1} ry={r * 0.96} fill="#0a0008" fillOpacity="0.38" />
              {/* Grape body */}
              <ellipse cx={x} cy={row.y} rx={r} ry={r * 0.96} fill="#3c1a42" />
              {/* Highlight */}
              <ellipse cx={x - r * 0.3} cy={row.y - r * 0.3} rx={r * 0.28} ry={r * 0.22} fill="#7a488a" fillOpacity="0.38" />
            </g>
          ))
        )}
      </svg>
    </div>
  )
}

// ── Panel 4: Stone-vaulted cantina arch ───────────────────────────────────────
function StoneArchPanel() {
  return (
    <div style={{ background: '#100e0c', aspectRatio: '4/3' }} className="relative overflow-hidden">
      <svg
        viewBox="0 0 300 225"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <rect width="300" height="225" fill="#100e0c" />

        {/* Outer arch masonry fill */}
        <path d="M0,0 L0,185 Q150,75 300,185 L300,0 Z" fill="#1a1816" />
        {/* Outer arch stroke */}
        <path d="M0,185 Q150,75 300,185" stroke="#2a2620" strokeWidth="4" fill="none" />

        {/* Inner arch (tunnel depth) */}
        <path
          d="M38,185 L38,225 L262,225 L262,185 Q150,105 38,185 Z"
          fill="#141210"
        />
        <path d="M38,185 Q150,105 262,185" stroke="#201e1a" strokeWidth="3" fill="none" />

        {/* Deepest vault — far end */}
        <path d="M78,185 Q150,130 222,185 L222,225 L78,225 Z" fill="#0e0c0a" />

        {/* Lantern glow at far end */}
        <ellipse cx="150" cy="160" rx="36" ry="28" fill="#c07820" fillOpacity="0.22" />
        <ellipse cx="150" cy="160" rx="14" ry="11" fill="#d09030" fillOpacity="0.38" />

        {/* Small barrel ends at the back */}
        {[118, 150, 182].map((x, i) => (
          <ellipse key={i} cx={x} cy={178} rx="9" ry="8"
            fill="#281808" stroke="#483018" strokeWidth="1" fillOpacity="0.88"
          />
        ))}

        {/* Stone block joints on arch surround */}
        {[30, 65, 100, 140, 180, 220, 260].map((x, i) => (
          <line
            key={i}
            x1={x} y1={i % 2 === 0 ? 0 : 28}
            x2={x} y2={i % 2 === 0 ? 28 : 56}
            stroke="#1e1c1a" strokeWidth="1" strokeOpacity="0.38"
          />
        ))}
        {[22, 45, 68].map((y, i) => (
          <line key={i} x1="0" y1={y} x2="300" y2={y}
            stroke="#1c1a18" strokeWidth="0.8" strokeOpacity="0.3"
          />
        ))}

        {/* Floor reflection pool */}
        <ellipse cx="150" cy="222" rx="72" ry="7" fill="#c07820" fillOpacity="0.1" />
      </svg>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EstatePhotoStrip({ caption = 'Inside the Estates' }: Props) {
  return (
    <section aria-label={caption}>
      <div className="grid grid-cols-2 md:grid-cols-4">
        <VineyardRowsPanel />
        <BarrelCellarPanel />
        <HarvestGrapesPanel />
        <StoneArchPanel />
      </div>

      <div className="bg-parchment-100 border-y border-parchment-200 py-4 text-center">
        <p className="text-[9px] font-medium tracking-[0.35em] uppercase text-olive-400">
          {caption}
        </p>
      </div>
    </section>
  )
}
