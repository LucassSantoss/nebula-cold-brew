import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../lib/useReducedMotion'

/**
 * `from` is where the counter starts; `ring` is how much of the circle ends up
 * drawn (0..1). Sugar counts down to zero, so its ring empties instead.
 */
// The ring's path is normalized to this length, so dash offsets are whole numbers.
const RING_LENGTH = 1000
// Slightly over-travels so an empty ring leaves no sliver at the seam.
const ringOffset = (drawn: number) => (RING_LENGTH + 2) * (1 - drawn)

const STATS = [
  { value: 12, from: 0, unit: 'h', label: 'de extração a frio', ring: 0.5 },
  { value: 0, from: 24, unit: 'g', label: 'de açúcar adicionado', ring: 0 },
  { value: 180, from: 0, unit: 'mg', label: 'de cafeína', ring: 0.72 },
  { value: 100, from: 0, unit: '%', label: 'arábica', ring: 1 },
]

export function Stats() {
  const section = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>('[data-stat]')
      // Final state first, so the numbers are right even if nothing animates.
      items.forEach((item, index) => {
        gsap.set(item.querySelector('[data-ring]'), { strokeDashoffset: ringOffset(STATS[index].ring) })
      })
      if (reducedMotion) {
        gsap.from(items, {
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: { trigger: section.current, start: 'top 70%', once: true },
        })
        return
      }

      gsap.from('[data-stats-heading]', {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: section.current, start: 'top 70%', once: true },
      })

      items.forEach((item, index) => {
        const stat = STATS[index]
        const number = item.querySelector<HTMLElement>('[data-number]')!
        const counter = { value: stat.from }

        gsap
          .timeline({
            delay: index * 0.12,
            scrollTrigger: { trigger: item, start: 'top 85%', once: true },
          })
          .from(item, { opacity: 0, y: 40, duration: 0.9, ease: 'expo.out' }, 0)
          .fromTo(
            item.querySelector('[data-ring]'),
            { strokeDashoffset: ringOffset(stat.from > stat.value ? 1 : 0) },
            { strokeDashoffset: ringOffset(stat.ring), duration: 1.8, ease: 'power3.inOut' },
            0,
          )
          .to(
            counter,
            {
              value: stat.value,
              duration: 1.8,
              ease: 'power3.inOut',
              onUpdate: () => {
                number.textContent = String(Math.round(counter.value))
              },
            },
            0,
          )
      })
    },
    { scope: section, dependencies: [reducedMotion], revertOnUpdate: true },
  )

  return (
    <section
      ref={section}
      id="numeros"
      data-theme="base"
      aria-labelledby="numeros-title"
      className="relative px-5 py-28 md:px-10 md:py-40"
    >
      <div data-stats-heading className="mb-16 md:mb-24">
        <p className="eyebrow mb-5 text-ink-muted">Números</p>
        <h2 id="numeros-title" className="display text-5xl md:text-8xl">
          Os números da missão
        </h2>
      </div>

      <ul className="grid grid-cols-2 gap-x-5 gap-y-14 lg:grid-cols-4 lg:gap-x-10">
        {STATS.map((stat) => (
          <li key={stat.label} data-stat className="flex flex-col items-center text-center">
            <div aria-hidden="true" className="relative grid aspect-square w-full max-w-64 place-items-center">
              <svg viewBox="0 0 120 120" fill="none" className="absolute inset-0 size-full -rotate-90">
                <circle cx="60" cy="60" r="57" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1" />
                <circle
                  data-ring
                  cx="60"
                  cy="60"
                  r="57"
                  pathLength={RING_LENGTH}
                  stroke="var(--page-accent)"
                  strokeWidth="2"
                  strokeDasharray={RING_LENGTH}
                />
              </svg>
              <p className="display text-[13vw] leading-none lg:text-[5.5vw]">
                <span data-number className="tabular-nums">
                  {stat.value}
                </span>
                <span className="text-[0.5em] text-pop">{stat.unit}</span>
              </p>
            </div>
            <p className="mt-6 max-w-40 text-base text-ink-muted">
              <span className="sr-only">
                {stat.value}
                {stat.unit}{' '}
              </span>
              {stat.label}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
