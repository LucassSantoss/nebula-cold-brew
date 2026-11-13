import { useRef } from 'react'
import { Logo } from '../components/Logo'
import { gsap, useGSAP } from '../lib/gsap'
import { BUY_LINK, NAV_LINKS, SITE } from '../lib/site'
import { useReducedMotion } from '../lib/useReducedMotion'

/** Made-up company links; they simply lead back to the top of the page. */
const FICTIONAL_LINKS = ['Nossa missão', 'Sustentabilidade', 'Imprensa', 'Trabalhe conosco']

export function Footer() {
  const footer = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()

  // The giant wordmark rises out of the bottom edge as the page ends.
  useGSAP(
    () => {
      if (reducedMotion) return
      gsap.from('[data-footer-wordmark]', {
        yPercent: 100,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-footer-wordmark-mask]',
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
        },
      })
    },
    { scope: footer, dependencies: [reducedMotion], revertOnUpdate: true },
  )

  return (
    <footer ref={footer} data-theme="base" className="relative overflow-clip px-5 pt-20 md:px-10 md:pt-28">
      <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo className="text-5xl" />
          <p className="mt-6 max-w-xs text-base text-ink-muted">
            Cold brew em lata, extraído a frio por 12 horas. Café gelado de outra galáxia.
          </p>
        </div>

        <nav aria-label="Seções">
          <h2 className="eyebrow mb-5 text-ink-muted">Explorar</h2>
          <ul className="flex flex-col gap-3 text-base">
            {[...NAV_LINKS, BUY_LINK].map((link) => (
              <li key={link.href}>
                <a href={link.href} className="link-underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Institucional (fictício)">
          <h2 className="eyebrow mb-5 text-ink-muted">Nébula</h2>
          <ul className="flex flex-col gap-3 text-base">
            {FICTIONAL_LINKS.map((label) => (
              <li key={label}>
                <a href="#top" className="link-underline">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-16 flex flex-col gap-3 border-t border-ink/15 pt-6 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
        <p>Projeto fictício para portfólio — não é um produto real.</p>
        <p>
          Feito por{' '}
          <a href={SITE.githubUrl} target="_blank" rel="noreferrer" className="link-underline text-ink">
            {SITE.author}
          </a>{' '}
          ·{' '}
          <a href={SITE.repoUrl} target="_blank" rel="noreferrer" className="link-underline text-ink">
            Código no GitHub
          </a>
        </p>
      </div>

      <div data-footer-wordmark-mask aria-hidden="true" className="mt-10 overflow-hidden">
        <p
          data-footer-wordmark
          className="display pt-[0.1em] text-center text-[29vw] leading-none text-pop will-change-transform"
        >
          Nébula
        </p>
      </div>
    </footer>
  )
}
