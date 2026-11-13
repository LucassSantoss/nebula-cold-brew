import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useReducedMotion } from '../lib/useReducedMotion'

/** How much of the remaining distance the circle covers each frame. */
const FOLLOW = 0.16
const INTERACTIVE = '[data-cursor], a, button'

/**
 * Circle that trails the mouse with a lag. It grows over links and buttons and
 * turns into a drop over elements marked `data-cursor="drop"`. Desktop only:
 * it is not rendered for touch input or reduced motion.
 */
export function Cursor() {
  const circle = useRef<HTMLDivElement>(null)
  const hasMouse = useMediaQuery('(hover: hover) and (pointer: fine) and (min-width: 768px)')
  const reducedMotion = useReducedMotion()
  const enabled = hasMouse && !reducedMotion

  useEffect(() => {
    const element = circle.current
    if (!enabled || !element) return

    let x = 0
    let y = 0
    let targetX = 0
    let targetY = 0
    let visible = false

    const tick = () => {
      // Stop writing styles once the circle has caught up.
      if (Math.abs(targetX - x) < 0.1 && Math.abs(targetY - y) < 0.1) return
      x += (targetX - x) * FOLLOW
      y += (targetY - y) * FOLLOW
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      targetX = event.clientX
      targetY = event.clientY
      if (!visible) {
        // First sighting: start on the pointer instead of flying in from a corner.
        visible = true
        x = targetX - 1
        y = targetY
        element.dataset.visible = ''
      }
    }

    const onOver = (event: PointerEvent) => {
      const target = (event.target as Element).closest<HTMLElement>(INTERACTIVE)
      element.dataset.mode = target ? (target.dataset.cursor ?? 'link') : 'default'
    }

    const onLeave = () => {
      visible = false
      delete element.dataset.visible
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    gsap.ticker.add(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      gsap.ticker.remove(tick)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div ref={circle} aria-hidden="true" data-mode="default" className="cursor">
      <div className="cursor-shape" />
    </div>
  )
}
