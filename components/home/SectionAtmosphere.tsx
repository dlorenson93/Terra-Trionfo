import { ReactNode } from 'react'

interface Props {
  /** Absolute path to the background photo in /public, e.g. "/images/home/..." */
  imageSrc: string
  /** Tailwind classes for the tinted overlay above the photo — controls readability.
   *  e.g. "bg-white/[0.91]" (light sections) or "bg-olive-900/[0.82]" (dark sections) */
  overlayClassName?: string
  /** Additional classes for the outer <section> (padding, border, etc.) */
  className?: string
  children: ReactNode
}

/**
 * Atmospheric photographic background layer for homepage sections.
 * Stacking order: background photo → tinted overlay → foreground content (z-10).
 * All child content remains fully readable above the overlay.
 */
export default function SectionAtmosphere({
  imageSrc,
  overlayClassName = 'bg-white/90',
  className = '',
  children,
}: Props) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Photographic background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${imageSrc}')` }}
        aria-hidden="true"
      />
      {/* Tinted overlay — preserves text readability */}
      <div className={`absolute inset-0 ${overlayClassName}`} aria-hidden="true" />
      {/* Foreground content */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  )
}
