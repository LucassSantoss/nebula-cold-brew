type LogoProps = {
  className?: string
}

/** "NÉBULA" wordmark. The acute accent on the E is drawn as a small orbit. */
export function Logo({ className = '' }: LogoProps) {
  return (
    <span role="img" aria-label="Nébula" className={`display inline-flex ${className}`}>
      <span aria-hidden="true">N</span>
      <span aria-hidden="true" className="relative">
        E
        <svg
          viewBox="0 0 28 16"
          fill="none"
          className="absolute bottom-[86%] left-[56%] w-[0.54em] -translate-x-1/2 overflow-visible"
        >
          <ellipse
            cx="14"
            cy="8"
            rx="12"
            ry="4.2"
            transform="rotate(-22 14 8)"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <circle cx="25.1" cy="3.5" r="2.8" fill="var(--page-accent)" />
        </svg>
      </span>
      <span aria-hidden="true">BULA</span>
    </span>
  )
}
