import type { IngredientKind } from '../../lib/flavors'

type IngredientProps = {
  kind: IngredientKind
  /** Each kind has two drawings; pass 0 or 1. */
  variant: number
}

/** Small flat illustration of a flavor ingredient, drawn in a 64x64 box. */
export function Ingredient({ kind, variant }: IngredientProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="size-full overflow-visible">
      {kind === 'bean' && (
        <g transform={variant ? 'rotate(28 32 32)' : 'rotate(-20 32 32)'}>
          <ellipse cx="32" cy="32" rx="17" ry="27" fill="#8a552b" />
          <ellipse cx="25" cy="21" rx="5" ry="10" fill="#fff" opacity="0.13" />
          <path d="M34 7C20 24 44 40 30 57" stroke="#35190b" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}

      {kind === 'vanilla' && variant === 0 && (
        <>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="32"
              cy="16"
              rx="9"
              ry="15"
              fill="#fffaf0"
              stroke="#7a5c3a"
              strokeWidth="1.5"
              transform={`rotate(${angle} 32 32)`}
            />
          ))}
          <circle cx="32" cy="32" r="6" fill="#e0b04a" />
        </>
      )}
      {kind === 'vanilla' && variant === 1 && (
        <>
          <path d="M8 56C24 46 42 28 56 8" stroke="#3b2314" strokeWidth="7" strokeLinecap="round" />
          <path d="M14 50C26 41 39 28 50 14" stroke="#6b4a2c" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}

      {kind === 'caramel' && variant === 0 && (
        <g transform="rotate(12 32 32)">
          <rect x="12" y="16" width="40" height="40" rx="9" fill="#8a4817" />
          <rect x="12" y="9" width="40" height="40" rx="9" fill="#f0b866" />
          <path d="M20 22C21 18 24 16 29 16" stroke="#fff3da" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {kind === 'caramel' && variant === 1 && (
        <>
          <path d="M32 6C44 22 50 32 50 40A18 18 0 0 1 14 40C14 32 20 22 32 6Z" fill="#f6d9a6" />
          <path d="M23 40C23 45 26 49 31 50" stroke="#fffaf0" strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {kind === 'chocolate' && variant === 0 && (
        <>
          <path d="M12 20L34 8L54 22L50 48L26 56L10 42Z" fill="#6b3f2e" />
          <path d="M34 8L54 22L36 30Z" fill="#9a6a52" />
          <path d="M12 20L34 8L36 30L20 34Z" fill="#83533f" />
        </>
      )}
      {kind === 'chocolate' && variant === 1 && (
        <g transform="rotate(-14 32 32)">
          <rect x="9" y="9" width="46" height="46" rx="6" fill="#5e3527" />
          {[
            [14, 14],
            [34, 14],
            [14, 34],
            [34, 34],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="16" height="16" rx="3" fill="#8a5a44" />
          ))}
        </g>
      )}
    </svg>
  )
}
