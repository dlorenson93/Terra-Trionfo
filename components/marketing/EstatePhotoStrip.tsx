/**
 * EstatePhotoStrip — magazine-style 4-up image strip for editorial homepage rhythm.
 * Renders as 2×2 on mobile, 4-across on desktop.
 */

interface PhotoItem {
  src: string
  alt: string
}

interface Props {
  images: PhotoItem[]
  caption?: string
}

export default function EstatePhotoStrip({
  images,
  caption = 'Inside the Estates',
}: Props) {
  // Clamp to first 4 images
  const panels = images.slice(0, 4)

  return (
    <section aria-label={caption}>
      {/* Photo grid */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {panels.map((img, i) => (
          <div
            key={i}
            className="relative overflow-hidden"
            style={{ aspectRatio: '4 / 3' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              style={{ filter: 'brightness(0.88) saturate(0.85)' }}
            />
            {/* Edge-to-edge bottom vignette for editorial depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-olive-900/40 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Caption bar */}
      <div className="bg-parchment-100 border-y border-parchment-200 py-4 text-center">
        <p className="text-[9px] font-medium tracking-[0.35em] uppercase text-olive-400">
          {caption}
        </p>
      </div>
    </section>
  )
}
