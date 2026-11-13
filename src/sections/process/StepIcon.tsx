import { CanSilhouette } from './CanSilhouette'
import type { StepId } from './steps'

/** Still illustration for a step, used when the animated version is turned off. */
export function StepIcon({ step }: { step: StepId }) {
  if (step === 'can') return <CanSilhouette sealed className="h-24 w-auto" />

  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" className="size-24">
      {step === 'bean' && (
        <g transform="rotate(-24 48 48)">
          <ellipse cx="48" cy="48" rx="24" ry="38" fill="#55301a" />
          <path
            d="M50 14C32 36 64 60 46 82"
            stroke="#1a0c05"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      )}
      {step === 'grind' && (
        <g fill="#9a6a3c">
          {[
            [48, 48, 5], [30, 36, 3.5], [66, 34, 4], [24, 58, 2.5], [70, 60, 3.5], [44, 72, 4],
            [58, 20, 2.5], [38, 18, 2], [80, 46, 2], [16, 42, 2], [56, 84, 2.5], [30, 78, 2],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      )}
      {step === 'brew' && (
        <>
          <path d="M20 18H76L52 52V60H44V52Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <path d="M48 68C54 76 55 80 55 83A7 7 0 0 1 41 83C41 80 42 76 48 68Z" fill="#c8873a" />
        </>
      )}
    </svg>
  )
}
