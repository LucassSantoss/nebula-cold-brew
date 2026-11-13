type SplitTextProps = {
  text: string
  className?: string
}

/**
 * Renders text as one element per character, each inside a clipping mask, so
 * characters can slide into view from below. Characters carry `data-char` for
 * animation; the result is hidden from assistive tech, so the parent must
 * expose the full text (e.g. with `aria-label`).
 */
export function SplitText({ text, className }: SplitTextProps) {
  const words = text.split(' ')

  return (
    <span aria-hidden="true" className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex}>
          <span className="inline-block whitespace-nowrap">
            {Array.from(word).map((char, charIndex) => (
              <span key={charIndex} className="inline-block overflow-hidden align-top">
                <span data-char className="inline-block will-change-transform">
                  {char}
                </span>
              </span>
            ))}
          </span>
          {wordIndex < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  )
}
