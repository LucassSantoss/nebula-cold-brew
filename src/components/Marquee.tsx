import { useEffect, useRef, type ReactNode } from 'react'
import { getScrollVelocity, gsap } from '../lib/gsap'
import { useReducedMotion } from '../lib/useReducedMotion'

type MarqueeProps = {
  /** List items (`<li>`) to scroll. Rendered twice to make the loop seamless. */
  children: ReactNode
  /** 1 moves left, -1 moves right. */
  direction?: 1 | -1
  /** Base speed in px/s. */
  speed?: number
  label: string
}

/** Scroll velocity (px/s) that doubles the base speed. */
const VELOCITY_FOR_DOUBLE_SPEED = 900
const MAX_BOOST = 7

/**
 * Infinite horizontal ticker. It speeds up with the page scroll, eases to a
 * stop while hovered or focused, and stays still under reduced motion.
 */
export function Marquee({ children, direction = 1, speed = 70, label }: MarqueeProps) {
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const row = viewport.current
    const strip = track.current
    if (!row || !strip || reducedMotion) return

    let offset = 0
    let boost = 1
    let throttle = 1
    let held = false

    const tick = (_time: number, deltaTime: number) => {
      const loopWidth = strip.scrollWidth / 2
      if (!loopWidth) return

      const targetBoost = Math.min(MAX_BOOST, 1 + Math.abs(getScrollVelocity()) / VELOCITY_FOR_DOUBLE_SPEED)
      boost += (targetBoost - boost) * 0.08
      throttle += ((held ? 0 : 1) - throttle) * 0.1

      offset = (offset + direction * speed * boost * throttle * (deltaTime / 1000)) % loopWidth
      // Keep the strip between -loopWidth and 0, whichever way it travels.
      const x = direction === 1 ? -offset : offset - loopWidth
      strip.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`
    }

    const hold = () => (held = true)
    const resume = () => (held = false)
    row.addEventListener('pointerenter', hold)
    row.addEventListener('pointerleave', resume)
    row.addEventListener('focusin', hold)
    row.addEventListener('focusout', resume)

    // Only animate while the row is on screen.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) gsap.ticker.add(tick)
      else gsap.ticker.remove(tick)
    })
    observer.observe(row)

    return () => {
      observer.disconnect()
      gsap.ticker.remove(tick)
      row.removeEventListener('pointerenter', hold)
      row.removeEventListener('pointerleave', resume)
      row.removeEventListener('focusin', hold)
      row.removeEventListener('focusout', resume)
      strip.style.transform = ''
    }
  }, [direction, speed, reducedMotion])

  if (reducedMotion) {
    return (
      <ul aria-label={label} className="flex flex-wrap justify-center gap-y-6 px-5">
        {children}
      </ul>
    )
  }

  return (
    <div ref={viewport} className="overflow-hidden">
      <div ref={track} className="flex w-max will-change-transform">
        <ul aria-label={label} className="flex shrink-0">
          {children}
        </ul>
        <ul aria-hidden="true" className="flex shrink-0">
          {children}
        </ul>
      </div>
    </div>
  )
}
