import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { StepIcon } from './StepIcon'
import { STEPS } from './steps'

/** Reduced-motion version: no pin, no particles, just the four steps side by side. */
export function ProcessStatic() {
  const section = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from('[data-step]', {
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.12,
        scrollTrigger: { trigger: section.current, start: 'top 75%', once: true },
      })
    },
    { scope: section },
  )

  return (
    <section
      ref={section}
      id="origem"
      aria-labelledby="origem-title"
      className="relative px-5 py-24 md:px-10 md:py-36"
    >
      <p className="eyebrow mb-5 text-ink-muted">Origem</p>
      <h2 id="origem-title" className="display text-6xl md:text-8xl">
        Do grão à lata
      </h2>

      <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.id} data-step className="rounded-3xl border border-ink/15 p-7">
            <StepIcon step={step.id} />
            <p className="eyebrow mt-8 text-ink-muted">{String(index + 1).padStart(2, '0')} / 04</p>
            <h3 className="display mt-4 text-4xl">{step.title}</h3>
            <p className="mt-3 text-base text-ink-muted">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
