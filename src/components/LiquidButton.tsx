import type { CSSProperties, ReactNode } from 'react'

type LiquidButtonProps = {
  children: ReactNode
  onClick?: () => void
}

/** Drips that slide out of the pill on hover: position, width and how far they hang (px). */
const DRIPS = [
  { left: '13%', width: 20, hang: 30, delay: 0 },
  { left: '33%', width: 30, hang: 54, delay: 70 },
  { left: '58%', width: 18, hang: 24, delay: 140 },
  { left: '76%', width: 26, hang: 42, delay: 30 },
]

/** Loose drops that fall from the longest drips while hovered. */
const DROPS = [
  { left: 'calc(33% + 9px)', delay: 350 },
  { left: 'calc(76% + 7px)', delay: 900 },
]

/**
 * Button whose fill behaves like liquid: on hover, drips ooze from its lower
 * edge. The pill and the drips are separate shapes fused by an SVG "gooey"
 * filter (blur, then a hard alpha threshold).
 */
export function LiquidButton({ children, onClick }: LiquidButtonProps) {
  return (
    <button
      type="button"
      data-cursor="drop"
      onClick={onClick}
      className="group relative isolate inline-flex h-16 items-center px-10 text-base font-bold text-pop-ink"
    >
      {/* Extends below the button so the filter has room for the drips. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -bottom-24 -z-10"
        style={{ filter: 'url(#liquid-goo)' }}
      >
        <span className="absolute inset-x-0 top-0 h-16 rounded-full bg-pop" />
        {DRIPS.map((drip) => (
          <span
            key={drip.left}
            className="absolute top-6 h-10 rounded-full bg-pop transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-safe:group-hover:translate-y-(--hang) motion-safe:group-focus-visible:translate-y-(--hang)"
            style={
              {
                left: drip.left,
                width: drip.width,
                transitionDelay: `${drip.delay}ms`,
                '--hang': `${drip.hang}px`,
              } as CSSProperties
            }
          />
        ))}
        {DROPS.map((drop) => (
          <span
            key={drop.left}
            className="absolute top-20 size-2.5 rounded-full bg-pop opacity-0 motion-safe:group-hover:animate-drip"
            style={{ left: drop.left, animationDelay: `${drop.delay}ms` }}
          />
        ))}
      </span>

      <span className="relative">{children}</span>

      <svg aria-hidden="true" className="absolute size-0">
        <defs>
          <filter id="liquid-goo" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </button>
  )
}
