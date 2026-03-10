/**
 * VisualDivider — full-width editorial image break rendered entirely in SVG.
 * No external image dependencies. Three bespoke illustrated scenes.
 */

type DividerVariant = 'vineyard-hills' | 'alpine-panoramic' | 'olive-grove'
type DividerHeight = 'md' | 'lg' | 'xl'

interface Props {
  variant: DividerVariant
  title: string
  subtitle?: string
  height?: DividerHeight
}

const HEIGHT_CLASSES: Record<DividerHeight, string> = {
  md: 'h-56 md:h-72',
  lg: 'h-72 md:h-[480px]',
  xl: 'h-80 md:h-[560px]',
}

// ── Scene A: Rolling Piemonte vineyard hills at golden hour ───────────────────
function VineyardHillsSVG() {
  return (
    <svg
      viewBox="0 0 1200 480"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1308" />
          <stop offset="50%" stopColor="#1c2510" />
          <stop offset="100%" stopColor="#2d1c08" />
        </linearGradient>
        <linearGradient id="vh-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#243016" />
          <stop offset="100%" stopColor="#162010" />
        </linearGradient>
        <linearGradient id="vh-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#304020" />
          <stop offset="100%" stopColor="#1e2c12" />
        </linearGradient>
        <linearGradient id="vh-fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e2c0e" />
          <stop offset="100%" stopColor="#080c04" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="1200" height="480" fill="url(#vh-sky)" />

      {/* Golden hour glow, right horizon */}
      <ellipse cx="1080" cy="268" rx="520" ry="290" fill="#c48428" fillOpacity="0.18" />
      <ellipse cx="1080" cy="205" rx="310" ry="155" fill="#c48428" fillOpacity="0.1" />

      {/* Stars */}
      {[[45,38],[180,22],[320,48],[460,18],[600,35],[720,15],[840,42],[950,28],[1080,18],[1150,48],[120,68],[380,75],[650,60],[900,72]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="0.9" fill="#e8d8b0" fillOpacity="0.38" />
      ))}

      {/* Far hill */}
      <path
        d="M0,295 C100,268 250,255 420,262 C580,269 720,248 900,232 C1010,224 1120,228 1200,235 L1200,480 L0,480 Z"
        fill="url(#vh-far)"
      />

      {/* Mid hill */}
      <path
        d="M0,330 C140,298 310,280 500,288 C660,295 810,272 980,260 C1080,254 1155,258 1200,263 L1200,480 L0,480 Z"
        fill="url(#vh-mid)"
      />

      {/* Vineyard row stakes */}
      {Array.from({ length: 13 }).map((_, i) => (
        <line
          key={i}
          x1={65 + i * 85} y1={398}
          x2={78 + i * 83} y2={303}
          stroke="#567040" strokeWidth="1.5" strokeOpacity="0.42"
        />
      ))}

      {/* Horizontal vine wires */}
      {[318, 336, 354, 370].map((y, i) => (
        <path
          key={i}
          d={`M60,${y} Q350,${y - 5} 700,${y + 3} Q1000,${y + 6} 1140,${y - 2}`}
          stroke="#486030" strokeWidth="1" strokeOpacity="0.28" fill="none"
        />
      ))}

      {/* Foreground land */}
      <path
        d="M0,405 C220,385 480,372 740,378 C920,382 1080,376 1200,372 L1200,480 L0,480 Z"
        fill="url(#vh-fg)"
      />

      {/* Horizon thin haze line */}
      <rect x="0" y="222" width="1200" height="20" fill="#b87820" fillOpacity="0.06" />
    </svg>
  )
}

// ── Scene B: Alpine Dolomites panoramic with vineyard terrace foreground ───────
function AlpinePanoramicSVG() {
  return (
    <svg
      viewBox="0 0 1200 480"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ap-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#080c14" />
          <stop offset="50%" stopColor="#10182a" />
          <stop offset="100%" stopColor="#141e14" />
        </linearGradient>
        <linearGradient id="ap-peakL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8cfc0" />
          <stop offset="35%" stopColor="#807060" />
          <stop offset="100%" stopColor="#2e3c1a" />
        </linearGradient>
        <linearGradient id="ap-peakR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8bfb0" />
          <stop offset="35%" stopColor="#6a6050" />
          <stop offset="100%" stopColor="#283418" />
        </linearGradient>
        <linearGradient id="ap-valley" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#28381a" />
          <stop offset="100%" stopColor="#0c1208" />
        </linearGradient>
      </defs>

      <rect width="1200" height="480" fill="url(#ap-sky)" />

      {/* Stars */}
      {[[60,25],[180,50],[320,18],[480,42],[610,12],[750,55],[890,22],[1020,48],[1130,16],[140,72],[400,85],[680,68],[920,82],[1060,35]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="0.9" fill="#c8d0e0" fillOpacity="0.48" />
      ))}

      {/* Distant ridge — far blue-grey */}
      <path
        d="M0,300 L90,225 L180,265 L270,195 L360,235 L450,170 L540,205 L630,160 L720,195 L810,155 L900,180 L990,140 L1080,170 L1170,145 L1200,160 L1200,480 L0,480 Z"
        fill="#202836" fillOpacity="0.58"
      />

      {/* Left massive Dolomite peak */}
      <path
        d="M-60,480 L60,345 L130,390 L210,265 L280,305 L360,215 L420,270 L490,200 L545,295 L600,480 Z"
        fill="url(#ap-peakL)"
      />
      {/* Left peak snow */}
      <path
        d="M472,220 L490,200 L506,218 L520,242 L502,230 L480,236 Z"
        fill="#e8e0d5" fillOpacity="0.72"
      />

      {/* Right massive peak */}
      <path
        d="M600,480 L630,360 L695,405 L760,305 L820,345 L880,258 L935,315 L990,238 L1045,288 L1100,215 L1155,268 L1200,248 L1200,480 Z"
        fill="url(#ap-peakR)"
      />
      {/* Right peak snow */}
      <path
        d="M1083,232 L1100,215 L1112,230 L1128,252 L1110,242 L1090,246 Z"
        fill="#dcd4c8" fillOpacity="0.65"
      />

      {/* Valley vineyard floor */}
      <path
        d="M440,445 Q600,408 760,415 Q900,422 1060,408 L1200,398 L1200,480 L0,480 L0,428 Q200,445 360,440 Z"
        fill="url(#ap-valley)"
      />

      {/* Terrace contour lines */}
      {[430, 446, 461].map((y, i) => (
        <path
          key={i}
          d={`M80,${y} Q400,${y - 7} 750,${y - 1} Q1000,${y + 4} 1120,${y - 5}`}
          stroke="#4a6030" strokeWidth="1.2" strokeOpacity="0.36" fill="none"
        />
      ))}

      {/* Mid-distance atmospheric haze */}
      <rect x="0" y="285" width="1200" height="48" fill="#101828" fillOpacity="0.28" />
    </svg>
  )
}

// ── Scene C: Olive grove in warm harvest afternoon light ──────────────────────
function OliveGroveSVG() {
  const trees = [
    { cx: 55,  cy: 295, rx: 55, ry: 62 },
    { cx: 195, cy: 275, rx: 68, ry: 76 },
    { cx: 350, cy: 265, rx: 74, ry: 84 },
    { cx: 520, cy: 255, rx: 80, ry: 92 },
    { cx: 700, cy: 260, rx: 76, ry: 86 },
    { cx: 875, cy: 270, rx: 68, ry: 75 },
    { cx: 1040, cy: 280, rx: 62, ry: 70 },
    { cx: 1175, cy: 292, rx: 50, ry: 58 },
  ]
  return (
    <svg
      viewBox="0 0 1200 480"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="og-sky" x1="0" y1="0.1" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#181408" />
          <stop offset="45%" stopColor="#241c0c" />
          <stop offset="100%" stopColor="#1a2410" />
        </linearGradient>
        <radialGradient id="og-warmth" cx="0.72" cy="0.38" r="0.7">
          <stop offset="0%" stopColor="#c88820" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#9a6818" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#9a6818" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="og-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c3816" />
          <stop offset="100%" stopColor="#10140a" />
        </linearGradient>
      </defs>

      <rect width="1200" height="480" fill="url(#og-sky)" />
      <rect width="1200" height="480" fill="url(#og-warmth)" />
      <rect x="0" y="345" width="1200" height="135" fill="url(#og-ground)" />

      {/* Earth texture rows */}
      {[362, 382, 402, 422].map((y, i) => (
        <path
          key={i}
          d={`M0,${y} Q300,${y + 5} 600,${y - 2} Q900,${y + 4} 1200,${y}`}
          stroke="#3a4c1e" strokeWidth="1" strokeOpacity="0.28" fill="none"
        />
      ))}

      {/* Olive trees */}
      {trees.map((t, i) => (
        <g key={i}>
          <rect
            x={t.cx - 5} y={t.cy + t.ry - 12}
            width="10" height={355 - (t.cy + t.ry) + 12}
            fill="#241808" fillOpacity="0.65" rx="3"
          />
          {/* Shadow canopy */}
          <ellipse cx={t.cx + 6} cy={t.cy + 8} rx={t.rx + 7} ry={t.ry + 4} fill="#101808" fillOpacity="0.38" />
          {/* Main canopy */}
          <ellipse cx={t.cx} cy={t.cy} rx={t.rx} ry={t.ry} fill="#2c4018" fillOpacity="0.88" />
          {/* Lit upper face */}
          <ellipse cx={t.cx - t.rx * 0.18} cy={t.cy - t.ry * 0.22} rx={t.rx * 0.52} ry={t.ry * 0.44} fill="#486030" fillOpacity="0.5" />
          {/* Silver-leaf shimmer */}
          <ellipse cx={t.cx + t.rx * 0.25} cy={t.cy - t.ry * 0.28} rx={t.rx * 0.28} ry={t.ry * 0.25} fill="#849860" fillOpacity="0.18" />
        </g>
      ))}

      {/* Ground light patches */}
      {[120, 295, 465, 640, 805, 980, 1115].map((x, i) => (
        <ellipse key={i} cx={x} cy={360 + (i % 2) * 8} rx="30" ry="10" fill="#c88820" fillOpacity="0.07" />
      ))}

      {/* Upper atmosphere darkening */}
      <rect x="0" y="0" width="1200" height="160" fill="#181408" fillOpacity="0.3" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

const SCENE_MAP: Record<DividerVariant, () => JSX.Element> = {
  'vineyard-hills':    VineyardHillsSVG,
  'alpine-panoramic':  AlpinePanoramicSVG,
  'olive-grove':       OliveGroveSVG,
}

export default function VisualDivider({
  variant,
  title,
  subtitle,
  height = 'lg',
}: Props) {
  const SceneSVG = SCENE_MAP[variant]

  return (
    <section
      className={`relative w-full ${HEIGHT_CLASSES[height]} flex items-center justify-center overflow-hidden`}
    >
      <SceneSVG />

      {/* Text */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="h-px w-10 bg-amber-400/40 mx-auto mb-6" />
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-parchment-100 leading-tight mb-4 tracking-tight"
          style={{ textShadow: '0 2px 24px rgba(0,0,0,0.7)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-parchment-300/70 text-sm md:text-base leading-relaxed max-w-lg mx-auto"
            style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
          >
            {subtitle}
          </p>
        )}
        <div className="h-px w-10 bg-amber-400/30 mx-auto mt-6" />
      </div>
    </section>
  )
}
