import { FLAVORS, type PageTheme } from './flavors'
import { gsap, ScrollTrigger } from './gsap'
import { getState, subscribe } from './store'

type Rgb = readonly [number, number, number]
type Palette = Record<keyof PageTheme, Rgb>

const CSS_VARIABLES: Record<keyof PageTheme, string> = {
  bg: '--page-bg',
  fg: '--page-fg',
  muted: '--page-muted',
  accent: '--page-accent',
  accentInk: '--page-accent-ink',
}
const KEYS = Object.keys(CSS_VARIABLES) as (keyof PageTheme)[]

/**
 * Fixed themes a section can request with `data-theme`. The extra value
 * `flavor` follows the active flavor instead. All text pairs are WCAG AA.
 */
const SECTION_THEMES: Record<string, PageTheme> = {
  base: { bg: '#0E0A08', fg: '#F3E6D3', muted: '#8A7663', accent: '#C8873A', accentInk: '#0E0A08' },
  surface: { bg: '#1C1410', fg: '#F3E6D3', muted: '#9C8873', accent: '#C8873A', accentInk: '#0E0A08' },
  ice: { bg: '#0A0D12', fg: '#EEF4F8', muted: '#8FA3B8', accent: '#9FD2F0', accentInk: '#0A0D12' },
}

/** Half-height, in viewport heights, of the band where two sections blend. */
const BLEND_ZONE = 0.25

function toRgb(hex: string): Rgb {
  const value = parseInt(hex.slice(1), 16)
  return [value >> 16, (value >> 8) & 255, value & 255]
}

function toPalette(theme: PageTheme): Palette {
  return {
    bg: toRgb(theme.bg),
    fg: toRgb(theme.fg),
    muted: toRgb(theme.muted),
    accent: toRgb(theme.accent),
    accentInk: toRgb(theme.accentInk),
  }
}

const smoothstep = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)))
  return t * t * (3 - 2 * t)
}

function mix(from: Palette, to: Palette, t: number): Palette {
  // Text colors flip in the middle third of the blend. Fading them linearly
  // with the background would leave ink and paper the same color halfway.
  const inkT = smoothstep(0.35, 0.65, t)
  const color = (key: keyof PageTheme, amount: number): Rgb => [
    from[key][0] + (to[key][0] - from[key][0]) * amount,
    from[key][1] + (to[key][1] - from[key][1]) * amount,
    from[key][2] + (to[key][2] - from[key][2]) * amount,
  ]
  return {
    bg: color('bg', t),
    fg: color('fg', inkT),
    muted: color('muted', inkT),
    accent: color('accent', t),
    accentInk: color('accentInk', inkT),
  }
}

/**
 * Drives the `--page-*` CSS variables: the page background and ink colors are
 * interpolated between neighboring sections as the boundary crosses the middle
 * of the viewport, and flavor-themed sections fade to the active flavor.
 */
export function startPageTheme(): () => void {
  const fixedPalettes = new Map(
    Object.entries(SECTION_THEMES).map(([name, theme]) => [name, toPalette(theme)]),
  )
  const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  const root = document.documentElement
  const written = new Map<string, string>()

  let sections: HTMLElement[] = []
  let activeFlavor = getState().flavor
  let flavorPalette = toPalette(FLAVORS[activeFlavor].theme)
  let flavorTween: gsap.core.Tween | undefined

  const paletteOf = (section: HTMLElement) =>
    fixedPalettes.get(section.dataset.theme ?? '') ?? flavorPalette

  const write = (name: string, value: string) => {
    if (written.get(name) === value) return
    written.set(name, value)
    root.style.setProperty(name, value)
  }

  const syncThemeColor = gsap.delayedCall(0.25, () => {
    themeColorMeta?.setAttribute('content', written.get(CSS_VARIABLES.bg) ?? '')
  })

  const apply = () => {
    if (!sections.length) return
    const center = window.innerHeight / 2
    const zone = window.innerHeight * BLEND_ZONE

    let palette = paletteOf(sections[0])
    for (let i = 1; i < sections.length; i++) {
      const top = sections[i].getBoundingClientRect().top
      if (top > center + zone) break
      const t = Math.min(1, (center + zone - top) / (zone * 2))
      palette =
        t >= 1
          ? paletteOf(sections[i])
          : mix(paletteOf(sections[i - 1]), paletteOf(sections[i]), smoothstep(0, 1, t))
    }

    for (const key of KEYS) {
      const [r, g, b] = palette[key]
      write(CSS_VARIABLES[key], `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`)
    }
    // Stars only read well on dark backgrounds: fade them out as the page gets lighter.
    const [r, g, b] = palette.bg
    const lightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    write('--stars-opacity', Math.min(1, Math.max(0, 1 - (lightness - 0.1) / 0.25)).toFixed(2))
    syncThemeColor.restart(true)
  }

  // Section elements can be replaced (e.g. on a reduced-motion change), so re-query on refresh.
  const collect = () => {
    sections = gsap.utils.toArray<HTMLElement>('[data-theme]')
    apply()
  }

  const unsubscribe = subscribe(() => {
    const { flavor } = getState()
    if (flavor === activeFlavor) return
    activeFlavor = flavor

    const from = flavorPalette
    const to = toPalette(FLAVORS[flavor].theme)
    const progress = { value: 0 }
    flavorTween?.kill()
    flavorTween = gsap.to(progress, {
      value: 1,
      duration: 0.9,
      ease: 'power2.inOut',
      onUpdate: () => {
        flavorPalette = mix(from, to, progress.value)
        apply()
      },
    })
  })

  const scrollWatcher = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: apply })
  ScrollTrigger.addEventListener('refresh', collect)
  collect()

  return () => {
    unsubscribe()
    flavorTween?.kill()
    syncThemeColor.kill()
    scrollWatcher.kill()
    ScrollTrigger.removeEventListener('refresh', collect)
  }
}
