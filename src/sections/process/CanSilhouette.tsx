import { useId } from 'react'
import { BODY_PATH, CAN_BODY, CAN_VIEWBOX, LIQUID_TRAVEL, WAVE_PATH } from './canShape'

type CanSilhouetteProps = {
  className?: string
  /** Renders the can already full and closed (used when nothing animates). */
  sealed?: boolean
}

/**
 * Line-art can whose liquid level is a clipped group. Animated parts are
 * tagged with `data-can-*` so the parent timeline can drive them.
 */
export function CanSilhouette({ className, sealed = false }: CanSilhouetteProps) {
  const id = useId()
  const clipId = `${id}-clip`
  const gradientId = `${id}-liquid`
  const liquidY = sealed ? CAN_BODY.bottom - LIQUID_TRAVEL : CAN_BODY.bottom

  return (
    <svg
      viewBox={`0 0 ${CAN_VIEWBOX.width} ${CAN_VIEWBOX.height}`}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BODY_PATH} />
        </clipPath>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d99a4e" />
          <stop offset="1" stopColor="#7d4517" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <g data-can-liquid transform={`translate(0 ${liquidY})`}>
          <path data-can-wave d={WAVE_PATH} fill={`url(#${gradientId})`} />
        </g>
      </g>

      <path d={BODY_PATH} stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />

      <g data-can-emblem stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="60" cy="112" r="17" />
        <path d="M47 121C36 128 34 133 39 134C47 136 74 124 84 113C89 107 87 103 78 105" />
      </g>

      <g data-can-lid stroke="currentColor" strokeWidth="3">
        <ellipse cx="60" cy="8" rx="13" ry="3.5" />
        <rect x="23" y="11" width="74" height="12" rx="5" fill="var(--page-bg)" />
      </g>
    </svg>
  )
}
