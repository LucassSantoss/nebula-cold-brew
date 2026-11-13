import { useRef, useState } from 'react'
import { LiquidButton } from '../components/LiquidButton'
import { MagneticButton } from '../components/MagneticButton'
import { SplitText } from '../components/SplitText'
import { canAnchorRef } from '../lib/canAnchors'
import { gsap, useGSAP } from '../lib/gsap'
import { sceneMotion } from '../lib/sceneMotion'
import { useReducedMotion } from '../lib/useReducedMotion'

const canAnchor = canAnchorRef('cta')

export function FinalCta() {
  const section = useRef<HTMLElement>(null)
  const [launched, setLaunched] = useState(false)
  const reducedMotion = useReducedMotion()

  useGSAP(
    () => {
      const scrollTrigger = { trigger: section.current, start: 'top 55%', once: true }
      if (reducedMotion) {
        gsap.from('[data-cta-copy]', { autoAlpha: 0, duration: 0.6, scrollTrigger })
        return
      }

      gsap
        .timeline({ scrollTrigger, defaults: { ease: 'expo.out' } })
        .from('[data-char]', { yPercent: 115, duration: 1.1, stagger: 0.03 }, 0)
        .from('[data-cta-copy]', { autoAlpha: 0, y: 28, duration: 1, stagger: 0.1 }, 0.35)

      // The oversized can drifts against the scroll for a little extra depth.
      gsap.fromTo(
        '[data-can-parallax]',
        { yPercent: 10 },
        {
          yPercent: -10,
          ease: 'none',
          scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    },
    { scope: section, dependencies: [reducedMotion], revertOnUpdate: true },
  )

  // There is nothing to buy: celebrate with a spin and say so.
  const launch = () => {
    setLaunched(true)
    if (reducedMotion) return
    gsap.to(sceneMotion, {
      canSpin: `+=${Math.PI * 4}`,
      duration: 1.8,
      ease: 'power3.inOut',
      overwrite: 'auto',
    })
  }

  return (
    <section
      ref={section}
      id="comprar"
      data-theme="flavor"
      data-3d
      aria-labelledby="comprar-title"
      className="relative overflow-clip md:min-h-[150svh]"
    >
      {/* Desktop: the copy sticks while the can, taller than the screen, scrolls past. */}
      <div className="relative z-30 flex flex-col justify-center px-5 pt-28 md:sticky md:top-0 md:h-svh md:w-1/2 md:px-10 md:pt-0">
        <p data-cta-copy className="eyebrow mb-5 text-ink-muted">
          Comprar
        </p>
        <h2
          id="comprar-title"
          aria-label="Pronto para decolar?"
          className="display text-[17.5vw] leading-[1.05] md:text-[7.4vw] lg:text-[8.6vw]"
        >
          <SplitText text="Pronto para" className="block" />
          <SplitText text="decolar?" className="block text-pop" />
        </h2>
        <p data-cta-copy className="mt-6 max-w-md md:mt-8">
          Escolha seu sabor, abra a lata e deixe a gravidade para depois.
        </p>
        <div data-cta-copy className="mt-8 md:mt-10">
          <MagneticButton strength={0.25}>
            <LiquidButton onClick={launch}>Quero minha lata</LiquidButton>
          </MagneticButton>
        </div>
        <p role="status" className="mt-8 min-h-12 max-w-md text-sm text-ink-muted md:mt-14">
          {launched &&
            'Decolagem simulada! Este é um projeto fictício de portfólio: nenhuma lata foi vendida.'}
        </p>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none flex justify-center pt-6 pb-16 md:absolute md:inset-y-0 md:right-0 md:w-1/2 md:items-center md:p-0"
      >
        <div data-can-parallax>
          <div ref={canAnchor} className="aspect-[200/486] h-[82svh] md:h-[min(112svh,100vw)]" />
        </div>
      </div>
    </section>
  )
}
