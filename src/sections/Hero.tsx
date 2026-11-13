import { useRef } from 'react'
import { SplitText } from '../components/SplitText'
import { canAnchorRef } from '../lib/canAnchors'
import { gsap, useGSAP } from '../lib/gsap'
import { sceneMotion } from '../lib/sceneMotion'
import { useStore } from '../lib/store'
import { useReducedMotion } from '../lib/useReducedMotion'

const canAnchor = canAnchorRef('hero')

const SPECS = ['269 ml', '0g açúcar', '100% arábica']

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const introDone = useStore((state) => state.introDone)
  const reducedMotion = useReducedMotion()

  // Entrance: title characters rise through their masks, then the rest fades in.
  useGSAP(
    () => {
      if (reducedMotion) {
        sceneMotion.beanBurst = 1
        gsap.from(section.current, { autoAlpha: 0, duration: 0.8, paused: !introDone })
        return
      }

      gsap
        .timeline({ paused: !introDone, defaults: { ease: 'expo.out' } })
        .from('[data-char]', { yPercent: 115, duration: 1.2, stagger: 0.03 }, 0)
        .from('[data-can-intro]', { yPercent: 35, scale: 0.55, duration: 1.8 }, 0)
        .from(sceneMotion, { canSpin: -Math.PI * 1.5, duration: 2.4, ease: 'power3.out' }, 0)
        .fromTo(sceneMotion, { beanBurst: 0 }, { beanBurst: 1, duration: 2, ease: 'none' }, 0)
        .from('[data-hero-fade]', { autoAlpha: 0, y: 28, duration: 1, stagger: 0.12 }, 0.8)
    },
    { scope: section, dependencies: [reducedMotion, introDone], revertOnUpdate: true },
  )

  // Exit: the can holds its place on screen and shrinks into the next section
  // while the title splits apart.
  useGSAP(
    () => {
      if (reducedMotion) return

      const hero = section.current!
      const anchor = hero.querySelector<HTMLElement>('[data-can-exit]')!
      const anchorSlot = anchor.parentElement!

      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        .to(
          anchor,
          {
            // Moves down as fast as the page scrolls up, ending on the viewport center.
            y: () => {
              const slot = anchorSlot.getBoundingClientRect()
              const slotCenter = slot.top + slot.height / 2 + window.scrollY
              return hero.offsetTop + hero.offsetHeight + window.innerHeight / 2 - slotCenter
            },
          },
          0,
        )
        .to(anchor, { scale: 0, ease: 'power2.in' }, 0)
        .to('[data-title-left]', { xPercent: -30, autoAlpha: 0 }, 0)
        .to('[data-title-right]', { xPercent: 30, autoAlpha: 0 }, 0)
        .to('[data-hero-exit]', { autoAlpha: 0, duration: 0.3 }, 0)
    },
    { scope: section, dependencies: [reducedMotion], revertOnUpdate: true },
  )

  return (
    <section
      ref={section}
      id="top"
      data-theme="base"
      data-3d
      aria-labelledby="top-title"
      className="relative flex min-h-svh flex-col overflow-clip px-5 pt-24 pb-8 md:px-10 md:pt-28 md:pb-10"
    >
      {/*
        Mobile: three centered lines above the can.
        Desktop: two rows split around the can, which sits in the column gap.
        Copy sits above the WebGL layer (z-20) so beans drift behind it.
      */}
      <h1
        id="top-title"
        aria-label="Café gelado de outra galáxia"
        className="display relative z-30 flex flex-wrap justify-center gap-x-[0.22em] text-[15.5vw] leading-[1.18] md:absolute md:inset-x-10 md:top-1/2 md:grid md:-translate-y-[54%] md:grid-cols-2 md:gap-x-[calc(64svh*0.4115+7vw)] md:text-[clamp(4rem,8.8vw,11rem)]"
      >
        <span data-title-left className="md:text-right">
          <SplitText text="Café" />
        </span>
        <span data-title-right>
          <SplitText text="Gelado" />
        </span>
        <span data-title-left className="w-full text-center md:w-auto md:text-right">
          <SplitText text="De outra" />
        </span>
        <span data-title-right>
          <SplitText text="Galáxia" />
        </span>
      </h1>

      <div className="flex flex-1 items-center justify-center py-4 md:absolute md:inset-0 md:py-0">
        <div data-can-exit>
          <div data-can-intro ref={canAnchor} className="aspect-[200/486] h-[36svh] md:h-[64svh]" />
        </div>
      </div>

      <div data-hero-exit className="relative z-30 mt-auto flex items-end justify-between gap-8">
        <div className="max-w-sm">
          <p data-hero-fade className="text-ink-muted">
            Cold brew extraído a frio por 12 horas e enlatado no ponto exato. Encorpado, cremoso e
            sem açúcar adicionado.
          </p>
          <a
            data-hero-fade
            href="#sabores"
            className="mt-5 inline-block rounded-full bg-pop px-7 py-3.5 text-sm font-bold text-pop-ink md:mt-6"
          >
            Explorar sabores
          </a>
        </div>

        <div
          data-hero-fade
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
        >
          <span className="eyebrow text-ink-muted">Role para baixo</span>
          <span className="relative h-12 w-px overflow-hidden bg-ink/20">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-scroll-hint bg-ink" />
          </span>
        </div>

        <ul data-hero-fade className="eyebrow hidden flex-col items-end gap-3 text-ink-muted md:flex">
          {SPECS.map((spec) => (
            <li key={spec}>{spec}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
