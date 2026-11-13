import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useReducedMotion } from '../lib/useReducedMotion'
import { CanSilhouette } from './process/CanSilhouette'
import { CAN_BODY, CAN_VIEWBOX, LIQUID_TRAVEL, WAVE_LENGTH } from './process/canShape'
import { createProcessRenderer, type ProcessState } from './process/processCanvas'
import { ProcessStatic } from './process/ProcessStatic'
import { STEPS } from './process/steps'

const EXTRACTION_MINUTES = 12 * 60

const formatClock = (minutes: number) => {
  const rounded = Math.round(minutes)
  const hours = String(Math.floor(rounded / 60)).padStart(2, '0')
  return `${hours}:${String(rounded % 60).padStart(2, '0')}`
}

/** "From bean to can": the stage pins while scroll scrubs through four steps. */
function ProcessPinned() {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const canSlot = useRef<HTMLDivElement>(null)
  const clock = useRef<HTMLSpanElement>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isWide = useMediaQuery('(min-width: 1280px)')

  useGSAP(
    () => {
      const state: ProcessState = { enter: 0, step: 0, fill: 0 }
      const renderer = createProcessRenderer(
        canvas.current!,
        isWide ? 'full' : isDesktop ? 'medium' : 'lite',
      )

      // The canvas needs to know where the SVG can sits to aim the drops at it.
      const measure = () => {
        const stageRect = stage.current!.getBoundingClientRect()
        const canRect = canSlot.current!.getBoundingClientRect()
        const canY = canRect.top - stageRect.top
        renderer.resize({
          width: stageRect.width,
          height: stageRect.height,
          centerX: canRect.left - stageRect.left + canRect.width / 2,
          centerY: stageRect.height * (isDesktop ? 0.5 : 0.43),
          canTop: canY + canRect.height * (CAN_BODY.top / CAN_VIEWBOX.height),
          canBottom: canY + canRect.height * (CAN_BODY.bottom / CAN_VIEWBOX.height),
        })
      }
      measure()
      const resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(stage.current!)

      const setLiquidY = gsap.quickSetter('[data-can-liquid]', 'y', 'px')
      const render = (time: number) => {
        setLiquidY(CAN_BODY.bottom - state.fill * LIQUID_TRAVEL)
        renderer.draw(state, time)
      }
      const wave = gsap.to('[data-can-wave]', {
        x: -WAVE_LENGTH,
        duration: 2.2,
        ease: 'none',
        repeat: -1,
        paused: true,
      })

      // Approach: the bean grows in while the section scrolls up to the pin.
      gsap.to(state, {
        enter: 1,
        ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'top top', scrub: true },
      })
      gsap.from('[data-process-heading]', {
        autoAlpha: 0,
        y: 40,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: section.current, start: 'top 55%', toggleActions: 'play none none reverse' },
      })

      const steps = gsap.utils.toArray<HTMLElement>('[data-step]')
      const markers = gsap.utils.toArray<HTMLElement>('[data-marker]')
      let activeStep = -1
      const setActiveStep = (index: number) => {
        if (index === activeStep) return
        activeStep = index
        markers.forEach((marker, i) => marker.toggleAttribute('data-active', i === index))
      }
      setActiveStep(0)

      // One timeline unit per step, scrubbed across the pinned distance.
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage.current,
          pin: true,
          start: 'top top',
          end: () => `+=${window.innerHeight * (isDesktop ? 3 : 2.2)}`,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => setActiveStep(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))),
        },
      })

      timeline
        .to(state, { step: STEPS.length, duration: STEPS.length }, 0)
        .fromTo('[data-progress-fill]', { scaleY: 0 }, { scaleY: 1, duration: STEPS.length }, 0)

      steps.forEach((step, index) => {
        if (index > 0) {
          timeline.fromTo(
            step,
            { opacity: 0, y: 48 },
            { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
            index,
          )
        }
        if (index < steps.length - 1) {
          timeline.to(step, { opacity: 0, y: -48, duration: 0.22, ease: 'power2.in' }, index + 0.78)
        }
      })

      const elapsed = { minutes: 0 }
      timeline
        // Step 3: the empty can rises, the clock runs, a little coffee collects.
        .fromTo(
          '[data-can]',
          { opacity: 0, yPercent: 25 },
          { opacity: 1, yPercent: 0, duration: 0.35, ease: 'power2.out' },
          2,
        )
        .fromTo('[data-timer]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.2 }, 2.1)
        .to(
          elapsed,
          {
            minutes: EXTRACTION_MINUTES,
            duration: 0.75,
            onUpdate: () => {
              clock.current!.textContent = formatClock(elapsed.minutes)
            },
          },
          2.2,
        )
        .to(state, { fill: 0.1, duration: 0.55 }, 2.42)
        .to('[data-timer]', { opacity: 0, y: -20, duration: 0.18 }, 3)
        // Step 4: fill to the top, drop the lid, stamp the emblem.
        .to(state, { fill: 1, duration: 0.68, ease: 'power1.inOut' }, 3.06)
        .fromTo(
          '[data-can-lid]',
          { opacity: 0, y: -46 },
          { opacity: 1, y: 0, duration: 0.14, ease: 'power2.in' },
          3.78,
        )
        .fromTo('[data-can-emblem]', { opacity: 0 }, { opacity: 1, duration: 0.1 }, 3.9)

      // Only draw while the section is on screen. Created after the pin so its
      // end position accounts for the pinned distance.
      ScrollTrigger.create({
        trigger: section.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: ({ isActive }) => {
          if (isActive) gsap.ticker.add(render)
          else gsap.ticker.remove(render)
          wave.paused(!isActive)
        },
      })

      return () => {
        resizeObserver.disconnect()
        gsap.ticker.remove(render)
      }
    },
    { scope: section, dependencies: [isDesktop, isWide], revertOnUpdate: true },
  )

  return (
    <section ref={section} id="origem" data-theme="surface" aria-labelledby="origem-title" className="relative">
      <div ref={stage} className="relative h-svh overflow-hidden">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 size-full" />

        <div ref={canSlot} className="absolute top-[38%] left-1/2 h-[31%] -translate-x-1/2 md:top-[45%] md:h-[42%]">
          <div data-can className="h-full opacity-0">
            <CanSilhouette className="h-full w-auto" />
          </div>
        </div>

        <p
          data-timer
          aria-hidden="true"
          className="absolute top-[25%] left-[calc(50%+4.5rem)] opacity-0 md:top-[31%] md:left-[calc(50%+10rem)]"
        >
          <span ref={clock} className="display block text-4xl tabular-nums md:text-7xl">
            00:00
          </span>
          <span className="eyebrow mt-2 block text-ink-muted">Horas de extração</span>
        </p>

        <div data-process-heading className="absolute top-24 left-5 md:top-28 md:left-10">
          <p className="eyebrow mb-4 text-ink-muted">Origem</p>
          <h2 id="origem-title" className="display text-4xl md:text-6xl">
            Do grão à lata
          </h2>
        </div>

        <ol className="absolute inset-x-5 bottom-8 grid md:inset-x-auto md:top-1/2 md:bottom-auto md:left-10 md:w-[min(26vw,21rem)] md:-translate-y-1/3">
          {STEPS.map((step, index) => (
            <li
              key={step.id}
              data-step
              className={`col-start-1 row-start-1 pr-10 md:pr-0 ${index > 0 ? 'opacity-0' : ''}`}
            >
              <p className="eyebrow text-ink-muted">{String(index + 1).padStart(2, '0')} / 04</p>
              <h3 className="display mt-3 text-5xl md:mt-5 md:text-7xl">{step.title}</h3>
              <p className="mt-3 max-w-xs text-base text-ink-muted md:mt-5">{step.description}</p>
            </li>
          ))}
        </ol>

        {/* Side progress: one segment per step, filled as the pin scrolls. */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 right-5 flex h-[30svh] -translate-y-1/2 gap-5 md:right-10 md:h-[42svh]"
        >
          <ul className="eyebrow hidden flex-col justify-around text-right md:flex">
            {STEPS.map((step) => (
              <li
                key={step.id}
                data-marker
                className="text-ink opacity-35 transition-opacity duration-300 data-active:opacity-100"
              >
                {step.title}
              </li>
            ))}
          </ul>
          <div className="relative w-px bg-ink/20">
            <div data-progress-fill className="absolute inset-0 origin-top bg-pop" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function Process() {
  const reducedMotion = useReducedMotion()
  return reducedMotion ? <ProcessStatic /> : <ProcessPinned />
}
