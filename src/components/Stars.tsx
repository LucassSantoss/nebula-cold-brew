import { useEffect, useRef } from 'react'
import { useMediaQuery } from '../lib/useMediaQuery'

/** Two layers twinkle out of phase; each is painted once and then only fades. */
const LAYERS = [{ twinkle: '5s' }, { twinkle: '8s' }]

function paintStars(canvas: HTMLCanvasElement, count: number) {
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#f3e6d3'
  for (let i = 0; i < count; i++) {
    const radius = 0.4 + Math.random() ** 3 * 1.3
    ctx.globalAlpha = 0.25 + Math.random() * 0.6
    ctx.beginPath()
    ctx.arc(Math.random() * rect.width, Math.random() * rect.height, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * Faint starfield fixed behind the page. It costs no per-frame JavaScript:
 * the stars are static bitmaps and the twinkle is a CSS opacity animation.
 * `--stars-opacity` (set by the page theme) hides it on light backgrounds.
 */
export function Stars() {
  const layers = useRef<(HTMLCanvasElement | null)[]>([])
  const isWide = useMediaQuery('(min-width: 1280px)')
  const isMedium = useMediaQuery('(min-width: 768px)')
  const starsPerLayer = isWide ? 90 : isMedium ? 55 : 32

  useEffect(() => {
    const paint = () => layers.current.forEach((canvas) => canvas && paintStars(canvas, starsPerLayer))
    paint()

    // Only widths matter: mobile browsers fire resize when the URL bar slides.
    let width = window.innerWidth
    const onResize = () => {
      if (window.innerWidth === width) return
      width = window.innerWidth
      paint()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [starsPerLayer])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-0 h-lvh w-full opacity-(--stars-opacity) transition-opacity duration-500"
    >
      {LAYERS.map((layer, index) => (
        <canvas
          key={index}
          ref={(element) => {
            layers.current[index] = element
          }}
          className="absolute inset-0 size-full motion-safe:animate-twinkle"
          style={{ animationDuration: layer.twinkle, animationDelay: `${-index * 2.5}s` }}
        />
      ))}
    </div>
  )
}
