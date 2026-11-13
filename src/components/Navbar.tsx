import { useEffect, useState } from 'react'
import { ScrollTrigger, lockScroll } from '../lib/gsap'
import { BUY_LINK, NAV_LINKS } from '../lib/site'
import { Logo } from './Logo'
import { MagneticButton } from './MagneticButton'

const HIDE_AFTER_PX = 120

export function Navbar() {
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Slide away when scrolling down, come back when scrolling up.
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => setHidden(self.direction === 1 && self.scroll() > HIDE_AFTER_PX),
    })
    return () => trigger.kill()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    lockScroll(true)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      lockScroll(false)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  // Unlock before the browser/Lenis handles the anchor, or the jump is ignored.
  const closeMenu = () => {
    lockScroll(false)
    setMenuOpen(false)
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 text-ink transition-transform duration-500 ease-out-expo focus-within:translate-y-0 motion-reduce:transition-none ${
        hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <nav
        aria-label="Principal"
        className="relative z-10 flex items-center justify-between px-5 py-4 md:px-10 md:py-6"
      >
        <a href="#top" aria-label="Nébula — voltar ao topo" onClick={closeMenu}>
          <Logo className="text-3xl md:text-4xl" />
        </a>

        <div className="flex items-center gap-3 md:gap-10">
          <ul className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="link-underline text-sm font-semibold">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <MagneticButton>
            <a
              href={BUY_LINK.href}
              onClick={closeMenu}
              className="block rounded-full bg-pop px-5 py-2.5 text-sm font-bold text-pop-ink"
            >
              {BUY_LINK.label}
            </a>
          </MagneticButton>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-full border border-ink/30 px-4 py-2.5 text-sm font-bold md:hidden"
          >
            {menuOpen ? 'Fechar' : 'Menu'}
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="fixed inset-0 flex h-svh flex-col justify-center bg-page px-5 md:hidden"
      >
        <ul className="flex flex-col gap-4">
          {[...NAV_LINKS, BUY_LINK].map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={closeMenu} className="display text-6xl">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
