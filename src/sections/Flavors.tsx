import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { canAnchorRef } from '../lib/canAnchors'
import { FLAVORS } from '../lib/flavors'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { sceneMotion } from '../lib/sceneMotion'
import { getState, setState, useStore } from '../lib/store'
import { useReducedMotion } from '../lib/useReducedMotion'
import { Ingredient } from './flavors/Ingredient'

const canAnchor = canAnchorRef('flavors')

/** Horizontal distance, in px, a drag must travel to change flavor. */
const SWIPE_DISTANCE = 56
const TURN = Math.PI * 2

/** Where ingredients rest around the can: position in % of the section, size in rem. */
const INGREDIENT_SLOTS = [
  { x: 35, y: 29, size: 5 },
  { x: 14, y: 40, size: 4 },
  { x: 27, y: 53, size: 6.5 },
  { x: 37, y: 72, size: 3.2 },
  { x: 6, y: 58, size: 3 },
  { x: 69, y: 23, size: 4.5 },
  { x: 87, y: 35, size: 6 },
  { x: 65, y: 51, size: 3.2 },
  { x: 78, y: 65, size: 5 },
  { x: 94, y: 60, size: 3 },
]

const wrapIndex = (index: number) => (index + FLAVORS.length) % FLAVORS.length

export function Flavors() {
  const section = useRef<HTMLElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const active = useStore((state) => state.flavor)
  const reducedMotion = useReducedMotion()
  /** Flavor the animated layers currently show; null until the section is first seen. */
  const shown = useRef<number | null>(null)
  /** 1 when moving to the next flavor, -1 to the previous one. */
  const direction = useRef(1)
  const drag = useRef<{ x: number; y: number } | null>(null)
  /** Animations of the transition in progress, kept so the next one can cut them short. */
  const running = useRef<gsap.core.Animation[]>([])

  const select = (index: number, towards?: number) => {
    const next = wrapIndex(index)
    const current = getState().flavor
    if (next === current) return
    direction.current = towards ?? (next > current ? 1 : -1)
    setState({ flavor: next })
  }

  /** Swaps every flavor-dependent layer from the shown flavor to `to`. */
  const transition = (to: number) => {
    const root = section.current
    const from = shown.current
    if (!root || from === to) return
    shown.current = to
    const towards = direction.current

    // Staggered tweens are not reliably stopped by killTweensOf(), so every
    // animation is tracked and killed explicitly before the next transition.
    running.current.forEach((animation) => animation.kill())
    const play = (animation: gsap.core.Animation) => running.current.push(animation)
    running.current = []

    // Name and description slide vertically through their masks.
    for (const slide of gsap.utils.toArray<HTMLElement>('[data-slide]', root)) {
      const index = Number(slide.dataset.slide)
      if (index === to) {
        play(
          gsap.fromTo(
            slide,
            { yPercent: reducedMotion ? 0 : 110 * towards, autoAlpha: reducedMotion ? 0 : 1 },
            { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out', delay: 0.12 },
          ),
        )
      } else if (index === from) {
        play(
          gsap.to(
            slide,
            reducedMotion
              ? { autoAlpha: 0, duration: 0.12 }
              : { yPercent: -110 * towards, duration: 0.5, ease: 'power3.in' },
          ),
        )
      } else {
        gsap.set(slide, { yPercent: 110 })
      }
    }

    // Old ingredients drop out of frame, new ones fall in from above.
    FLAVORS.forEach((_, index) => {
      const items = gsap.utils.toArray<HTMLElement>(
        `[data-ingredients="${index}"] [data-ingredient]`,
        root,
      )
      if (index === to) {
        play(
          gsap.fromTo(
            items,
            reducedMotion
              ? { autoAlpha: 0, y: 0, rotation: 0 }
              : { autoAlpha: 0, y: -260, rotation: () => gsap.utils.random(-140, 140) },
            {
              autoAlpha: 1,
              y: 0,
              rotation: 0,
              duration: reducedMotion ? 0.4 : 1.1,
              ease: 'back.out(1.3)',
              stagger: { each: 0.045, from: 'random' },
              delay: 0.2,
            },
          ),
        )
      } else if (index === from) {
        play(
          gsap.to(
            items,
            reducedMotion
              ? { autoAlpha: 0, duration: 0.3 }
              : { autoAlpha: 0, y: 180, rotation: '+=60', duration: 0.55, ease: 'power2.in', stagger: 0.025 },
          ),
        )
      } else {
        // A set still on its way out from an interrupted transition: fade it quickly.
        play(gsap.to(items, { autoAlpha: 0, duration: 0.2 }))
      }
    })

    // The can makes one full turn and the label changes while its back is to us.
    if (from === null || reducedMotion) {
      sceneMotion.labelFlavor = to
      return
    }
    gsap.to(sceneMotion, {
      canSpin: (Math.round(sceneMotion.canSpin / TURN) - towards) * TURN,
      duration: 1.2,
      ease: 'power3.inOut',
      overwrite: 'auto',
      onUpdate() {
        if (this.progress() >= 0.5) sceneMotion.labelFlavor = to
      },
    })
  }

  useGSAP(
    () => {
      shown.current = null
      gsap.set('[data-slide]', { yPercent: 110 })
      gsap.set('[data-ingredient]', { autoAlpha: 0 })

      ScrollTrigger.create({
        trigger: section.current,
        start: 'top 60%',
        once: true,
        onEnter: () => transition(getState().flavor),
      })

      gsap.from('[data-flavors-ui]', {
        autoAlpha: 0,
        y: reducedMotion ? 0 : 36,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: section.current,
          start: 'top 60%',
          toggleActions: 'play none none reverse',
        },
      })

      if (reducedMotion) return
      // The can grows into place as the section scrolls in.
      gsap.from('[data-can-enter]', {
        scale: 0.25,
        yPercent: 45,
        ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'top 15%', scrub: true },
      })
    },
    { scope: section, dependencies: [reducedMotion], revertOnUpdate: true },
  )

  useEffect(() => {
    if (shown.current !== null) transition(active)
    // `transition` only reads refs and the current motion preference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const onTabKeyDown = (event: KeyboardEvent) => {
    const targets: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: FLAVORS.length - 1,
    }
    if (!(event.key in targets)) return
    event.preventDefault()
    const next = wrapIndex(targets[event.key])
    select(next, event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : undefined)
    tabs.current[next]?.focus()
  }

  // Dragging sideways turns the can; a long enough drag changes flavor.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    drag.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!drag.current || reducedMotion) return
    sceneMotion.canDrag = (event.clientX - drag.current.x) * 0.006
  }

  const onPointerEnd = (event: PointerEvent) => {
    const start = drag.current
    if (!start) return
    drag.current = null
    gsap.to(sceneMotion, { canDrag: 0, duration: 0.9, ease: 'elastic.out(1, 0.7)', overwrite: 'auto' })

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (event.type === 'pointerup' && Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
      const towards = dx < 0 ? 1 : -1
      select(getState().flavor + towards, towards)
    }
  }

  return (
    <section
      ref={section}
      id="sabores"
      data-theme="flavor"
      data-3d
      aria-labelledby="sabores-title"
      className="relative flex min-h-svh flex-col overflow-clip px-5 pt-24 pb-6 md:px-10 md:pt-28 md:pb-10"
    >
      {/* Drag surface holding everything that sits behind the 3D can. */}
      <div
        className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 overflow-hidden text-center tall:top-[44%]"
        >
          {FLAVORS.map((flavor, index) => (
            <span
              key={flavor.id}
              data-slide={index}
              className="display col-start-1 row-start-1 text-[24vw] leading-none text-pop md:text-[min(21vw,32svh)]"
            >
              {flavor.name}
            </span>
          ))}
        </div>

        {FLAVORS.map((flavor, flavorIndex) => (
          <div
            key={flavor.id}
            data-ingredients={flavorIndex}
            aria-hidden="true"
            className="absolute inset-0"
          >
            {INGREDIENT_SLOTS.map((slot, slotIndex) => (
              <span
                key={slotIndex}
                data-ingredient
                className="invisible absolute block w-[calc(var(--size)*0.62)] -translate-1/2 md:w-(--size)"
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  '--size': `${slot.size}rem`,
                } as React.CSSProperties}
              >
                <span
                  className="block motion-safe:animate-float"
                  style={{ animationDuration: `${4 + (slotIndex % 4)}s`, animationDelay: `${-slotIndex * 0.8}s` }}
                >
                  <Ingredient kind={flavor.ingredient} variant={slotIndex % 2} />
                </span>
              </span>
            ))}
          </div>
        ))}

        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center tall:top-[44%]">
          <div data-can-enter>
            <div ref={canAnchor} className="aspect-[200/486] h-[40svh] md:h-[min(60svh,58vw)]" />
          </div>
        </div>
      </div>

      <div data-flavors-ui className="pointer-events-none relative flex items-start justify-between gap-6">
        <div>
          <p className="eyebrow mb-4 text-ink-muted">Sabores</p>
          <h2 id="sabores-title" className="display max-w-xs text-4xl md:text-6xl xl:max-w-none">
            Escolha sua órbita
          </h2>
        </div>
        <p aria-hidden="true" className="eyebrow shrink-0 pt-1 whitespace-nowrap text-ink-muted tabular-nums">
          {String(active + 1).padStart(2, '0')} / {String(FLAVORS.length).padStart(2, '0')}
        </p>
      </div>

      <div className="pointer-events-none relative mt-auto grid items-end gap-5 lg:grid-cols-[1fr_auto_1fr]">
        <div
          data-flavors-ui
          role="tabpanel"
          id="flavor-panel"
          aria-labelledby={`flavor-tab-${active}`}
          className="grid max-w-sm overflow-hidden"
        >
          {FLAVORS.map((flavor, index) => (
            <div
              key={flavor.id}
              data-slide={index}
              aria-hidden={index !== active}
              className="col-start-1 row-start-1"
            >
              <p className="text-base md:text-lg">{flavor.description}</p>
              <ul className="eyebrow mt-4 flex flex-wrap gap-x-4 gap-y-2 text-ink-muted">
                {flavor.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          data-flavors-ui
          role="tablist"
          aria-label="Sabores"
          onKeyDown={onTabKeyDown}
          className="pointer-events-auto flex justify-between gap-1.5 md:justify-start md:gap-2 lg:justify-center"
        >
          {FLAVORS.map((flavor, index) => (
            <button
              key={flavor.id}
              ref={(element) => {
                tabs.current[index] = element
              }}
              type="button"
              role="tab"
              id={`flavor-tab-${index}`}
              aria-selected={index === active}
              aria-controls="flavor-panel"
              tabIndex={index === active ? 0 : -1}
              onClick={() => select(index)}
              className={`rounded-full border px-3.5 py-2.5 text-xs font-bold transition-colors duration-300 md:px-5 md:text-sm ${
                index === active
                  ? 'border-ink bg-ink text-page'
                  : 'border-ink/30 text-ink hover:border-ink'
              }`}
            >
              {flavor.name}
            </button>
          ))}
        </div>

        <div data-flavors-ui className="pointer-events-auto hidden justify-end gap-3 lg:flex">
          {[
            { towards: -1, label: 'Sabor anterior', path: 'M14 6l-6 6 6 6' },
            { towards: 1, label: 'Próximo sabor', path: 'M10 6l6 6-6 6' },
          ].map((arrow) => (
            <button
              key={arrow.towards}
              type="button"
              aria-label={arrow.label}
              onClick={() => select(active + arrow.towards, arrow.towards)}
              className="grid size-12 place-items-center rounded-full border border-ink/30 transition-colors duration-300 hover:border-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
                <path d={arrow.path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
