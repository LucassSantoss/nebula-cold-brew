import { useEffect, useRef, useState } from 'react'
import { networkReady, sceneReady } from '../lib/assets'
import { gsap, lockScroll } from '../lib/gsap'
import { setState } from '../lib/store'
import { prefersReducedMotion } from '../lib/useReducedMotion'

/** The preloader never holds the page longer than this, loaded or not. */
const MAX_DURATION_MS = 2500
/** Fonts and scene chunk arriving faster than this means they came from cache. */
const CACHED_WITHIN_MS = 250
/** With cached assets, how long to wait for the first WebGL frame before skipping ahead. */
const SKIP_WINDOW_MS = 800
const RING_LENGTH = 1000

/**
 * Full-screen loader: a counter inside an orbit that closes as assets arrive.
 * When done, the orbit bursts open and hands over to the hero, whose beans fly
 * out of the same ring. With everything cached it is skipped almost entirely.
 */
export function Preloader() {
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const ring = useRef<SVGCircleElement>(null)
  const orbit = useRef<SVGGElement>(null)
  const count = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = root.current
    if (!element) return

    const reducedMotion = prefersReducedMotion()
    const startedAt = performance.now()
    let cached = false
    let loaded = false
    let value = 0
    let shown = -1
    // Nothing behind the loader should take focus or be read out yet.
    const page = document.getElementById('page')
    page?.setAttribute('inert', '')
    lockScroll(true)

    networkReady.then(() => {
      cached = performance.now() - startedAt < CACHED_WITHIN_MS
    })
    Promise.all([networkReady, sceneReady]).then(() => {
      loaded = true
    })

    const finish = (quick: boolean) => {
      gsap.ticker.remove(tick)
      lockScroll(false)
      page?.removeAttribute('inert')
      // Starts the hero intro underneath, so the burst and the reveal overlap.
      setState({ introDone: true })

      const exit = gsap.timeline({ onComplete: () => setGone(true) })
      if (quick || reducedMotion) {
        // A skipped preloader should not flash its counter on the way out.
        if (quick) gsap.set('[data-preloader-content]', { autoAlpha: 0 })
        exit.to(element, { autoAlpha: 0, duration: 0.4, ease: 'power1.out' })
        return
      }
      exit
        .to('[data-preloader-count]', { autoAlpha: 0, scale: 0.7, duration: 0.3, ease: 'power2.in' }, 0)
        .to('[data-preloader-orbit]', { scale: 2.6, autoAlpha: 0, duration: 0.9, ease: 'expo.out' }, 0)
        .to('[data-preloader-backdrop]', { autoAlpha: 0, duration: 0.7, ease: 'power2.out' }, 0.05)
    }

    const tick = () => {
      const elapsed = performance.now() - startedAt
      if (loaded && cached && elapsed < SKIP_WINDOW_MS) return finish(true)

      const timedOut = elapsed >= MAX_DURATION_MS
      // Creep towards 92% while waiting, then run to 100% once everything is in.
      const target = loaded || timedOut ? 100 : Math.min(92, (elapsed / MAX_DURATION_MS) * 100)
      value += (target - value) * (loaded || timedOut ? 0.16 : 0.07)
      if (value > 99.5) value = 100

      const rounded = Math.round(value)
      if (rounded !== shown && count.current) {
        shown = rounded
        count.current.textContent = String(rounded)
      }
      ring.current?.setAttribute('stroke-dashoffset', String(RING_LENGTH * (1 - value / 100)))
      orbit.current?.setAttribute('transform', `rotate(${value * 3.6} 50 50)`)

      if (value === 100) finish(false)
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      lockScroll(false)
      page?.removeAttribute('inert')
    }
  }, [])

  if (gone) return null

  return (
    <div ref={root} className="fixed inset-0 z-[80] grid place-items-center text-cream">
      <div data-preloader-backdrop className="absolute inset-0 bg-bg" />

      {/* Appears after a beat, so a cached visit never flashes a "0%". */}
      <div data-preloader-content className="relative grid animate-fade-in place-items-center">
        {/* Sized to match the ring the 3D beans burst out of (see Beans.tsx). */}
        <svg
          data-preloader-orbit
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
          className="col-start-1 row-start-1 size-[24lvh] overflow-visible"
        >
          <circle cx="50" cy="50" r="49" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.6" />
          <circle
            ref={ring}
            cx="50"
            cy="50"
            r="49"
            pathLength={RING_LENGTH}
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH}
            transform="rotate(-90 50 50)"
          />
          <g ref={orbit}>
            <circle cx="50" cy="1" r="2.6" fill="var(--accent)" />
          </g>
        </svg>

        <p data-preloader-count aria-hidden="true" className="display col-start-1 row-start-1 text-[7lvh]">
          <span ref={count} className="tabular-nums">
            0
          </span>
          <span className="text-[0.5em] text-accent">%</span>
        </p>
        <p role="status" className="sr-only">
          Carregando Nébula
        </p>
      </div>
    </div>
  )
}
