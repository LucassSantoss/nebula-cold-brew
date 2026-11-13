import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/gsap'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useReducedMotion } from '../lib/useReducedMotion'

type MagneticButtonProps = {
  /** The link or button to pull towards the pointer. */
  children: ReactNode
  /** Fraction of the pointer's offset from the center that the element travels. */
  strength?: number
  className?: string
}

/**
 * Wraps a button so it leans towards the pointer while hovered and springs
 * back when the pointer leaves. Inert for touch input and reduced motion.
 */
export function MagneticButton({ children, strength = 0.35, className = '' }: MagneticButtonProps) {
  const wrapper = useRef<HTMLSpanElement>(null)
  const hasMouse = useMediaQuery('(hover: hover) and (pointer: fine)')
  const reducedMotion = useReducedMotion()
  const enabled = hasMouse && !reducedMotion

  useEffect(() => {
    const element = wrapper.current
    if (!enabled || !element) return

    // Measured on enter, before any offset, so the pull does not feed back into itself.
    let center = { x: 0, y: 0 }
    const xTo = gsap.quickTo(element, 'x', { duration: 0.45, ease: 'power3.out' })
    const yTo = gsap.quickTo(element, 'y', { duration: 0.45, ease: 'power3.out' })

    const onEnter = () => {
      gsap.killTweensOf(element)
      gsap.set(element, { x: 0, y: 0 })
      const rect = element.getBoundingClientRect()
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }
    const onMove = (event: PointerEvent) => {
      xTo((event.clientX - center.x) * strength)
      yTo((event.clientY - center.y) * strength)
    }
    const onLeave = () => {
      gsap.to(element, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)', overwrite: true })
    }

    element.addEventListener('pointerenter', onEnter)
    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerleave', onLeave)
    return () => {
      element.removeEventListener('pointerenter', onEnter)
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerleave', onLeave)
      gsap.killTweensOf(element)
      gsap.set(element, { clearProps: 'transform' })
    }
  }, [enabled, strength])

  return (
    <span ref={wrapper} className={`inline-block ${className}`}>
      {children}
    </span>
  )
}
