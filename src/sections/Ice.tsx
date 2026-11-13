import { useEffect, useRef } from 'react'
import { SplitText } from '../components/SplitText'
import { gsap, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useReducedMotion } from '../lib/useReducedMotion'
import type { IceSimulation } from './ice/iceSimulation'

const SERVING_TEMPERATURE = 4
const ROOM_TEMPERATURE = 24

export function Ice() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const temperature = useRef<HTMLSpanElement>(null)
  const simulation = useRef<IceSimulation | null>(null)
  const reducedMotion = useReducedMotion()
  const isWide = useMediaQuery('(min-width: 1280px)')
  const isMedium = useMediaQuery('(min-width: 768px)')
  const cubeCount = isWide ? 26 : isMedium ? 18 : 14

  // Matter.js loads only when the section is about to appear, and the
  // simulation runs only while the section is on screen.
  useEffect(() => {
    const element = section.current!
    let disposed = false
    let visible = false
    let entered = false

    const sync = () => {
      const current = simulation.current
      if (!current) return
      if (entered) current.drop()
      if (visible) current.start()
      else current.stop()
    }

    const loader = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        loader.disconnect()
        import('./ice/iceSimulation').then(({ createIceSimulation }) => {
          if (disposed) return
          simulation.current = createIceSimulation(canvas.current!, {
            count: cubeCount,
            frozen: reducedMotion,
          })
          sync()
        })
      },
      { rootMargin: '100% 0px' },
    )
    loader.observe(element)

    const watcher = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (entry.intersectionRatio >= 0.4) entered = true
        sync()
      },
      { threshold: [0, 0.4] },
    )
    watcher.observe(element)

    return () => {
      disposed = true
      loader.disconnect()
      watcher.disconnect()
      simulation.current?.destroy()
      simulation.current = null
    }
  }, [cubeCount, reducedMotion])

  useGSAP(
    () => {
      const scrollTrigger = { trigger: section.current, start: 'top 55%', once: true }
      if (reducedMotion) {
        gsap.from('[data-ice-copy]', { autoAlpha: 0, duration: 0.6, scrollTrigger })
        return
      }

      // The headline rises in while the thermometer drops to serving temperature.
      const degrees = { value: ROOM_TEMPERATURE }
      gsap
        .timeline({ scrollTrigger, defaults: { ease: 'expo.out' } })
        .from('[data-char]', { yPercent: 115, duration: 1.1, stagger: 0.035 }, 0)
        .from('[data-ice-copy]', { autoAlpha: 0, y: 28, duration: 1, stagger: 0.1 }, 0.3)
        .to(
          degrees,
          {
            value: SERVING_TEMPERATURE,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: () => {
              temperature.current!.textContent = String(Math.round(degrees.value))
            },
          },
          0.2,
        )
    },
    { scope: section, dependencies: [reducedMotion], revertOnUpdate: true },
  )

  return (
    <section
      ref={section}
      id="gelo"
      data-theme="ice"
      aria-labelledby="gelo-title"
      className="relative h-svh min-h-[36rem] overflow-hidden"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 pb-[24svh] text-center">
        <p data-ice-copy className="eyebrow mb-6 text-ink-muted">
          Frio de verdade
        </p>
        <h2
          id="gelo-title"
          aria-label={`Servido a ${SERVING_TEMPERATURE}°C`}
          className="display text-[21vw] leading-[1.02] md:text-[15vw]"
        >
          <SplitText text="Servido a" className="block md:inline" />{' '}
          <span aria-hidden="true" className="inline-block overflow-hidden align-top text-pop">
            <span data-char className="inline-block tabular-nums">
              <span ref={temperature}>{SERVING_TEMPERATURE}</span>°C
            </span>
          </span>
        </h2>
        <p data-ice-copy className="mt-6 max-w-md text-ink-muted">
          Gelado no ponto para destacar cada nota, sem diluir o café.
          {!reducedMotion && ' Arraste e arremesse os cubos.'}
        </p>
      </div>

      <canvas
        ref={canvas}
        role="img"
        aria-label="Cubos de gelo empilhados. Com mouse ou toque, é possível arrastar e arremessar cada cubo."
        className="absolute inset-0 size-full touch-pan-y"
      />

      {!reducedMotion && (
        <button
          type="button"
          onClick={() => simulation.current?.shake()}
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-ink/40 bg-page/70 px-7 py-3.5 text-sm font-bold backdrop-blur-sm transition-colors duration-300 hover:border-ink md:bottom-8"
        >
          Chacoalhar
        </button>
      )}
    </section>
  )
}
