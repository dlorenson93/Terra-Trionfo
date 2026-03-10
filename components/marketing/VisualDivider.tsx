type DividerHeight = 'md' | 'lg' | 'xl'
type DividerOverlay = 'olive' | 'dark' | 'parchment'

interface Props {
  imageSrc: string
  title: string
  subtitle?: string
  height?: DividerHeight
  overlay?: DividerOverlay
}

const HEIGHT_CLASSES: Record<DividerHeight, string> = {
  md: 'h-56 md:h-72',
  lg: 'h-72 md:h-[460px]',
  xl: 'h-80 md:h-[560px]',
}

const OVERLAY_STYLES: Record<DividerOverlay, string> = {
  olive:    'bg-olive-900/60',
  dark:     'bg-black/55',
  parchment:'bg-[#2a2218]/50',
}

export default function VisualDivider({
  imageSrc,
  title,
  subtitle,
  height = 'lg',
  overlay = 'olive',
}: Props) {
  const heightClass = HEIGHT_CLASSES[height]
  const overlayClass = OVERLAY_STYLES[overlay]

  return (
    <section
      aria-hidden="true"
      className={`relative w-full ${heightClass} flex items-center justify-center overflow-hidden`}
      style={{
        backgroundImage: `url(${imageSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Colour overlay */}
      <div className={`absolute inset-0 ${overlayClass}`} />

      {/* Gradient vignette top + bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />

      {/* Text */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="h-px w-10 bg-amber-400/40 mx-auto mb-6" />
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-parchment-100 leading-tight mb-4 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-parchment-300/70 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
            {subtitle}
          </p>
        )}
        <div className="h-px w-10 bg-amber-400/30 mx-auto mt-6" />
      </div>
    </section>
  )
}
