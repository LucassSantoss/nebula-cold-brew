import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true })

let lenis: Lenis | null = null
let scrollLocked = false

/**
 * Starts Lenis and drives it from the GSAP ticker, so smooth scroll and
 * ScrollTrigger read the same scroll position on the same frame.
 */
export function startSmoothScroll(): () => void {
  const instance = new Lenis({ autoRaf: false, anchors: true })
  lenis = instance
  if (scrollLocked) instance.stop()

  instance.on('scroll', ScrollTrigger.update)
  const onTick = (time: number) => instance.raf(time * 1000)
  gsap.ticker.add(onTick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(onTick)
    gsap.ticker.lagSmoothing(500, 33)
    instance.destroy()
    if (lenis === instance) lenis = null
  }
}

/** Blocks page scroll (used while the preloader or the mobile menu is open). */
export function lockScroll(locked: boolean) {
  scrollLocked = locked
  document.documentElement.style.overflow = locked ? 'hidden' : ''
  if (locked) lenis?.stop()
  else lenis?.start()
}

let lastScrollY = 0
let scrollVelocity = 0
gsap.ticker.add((_time, deltaTime) => {
  const y = window.scrollY
  scrollVelocity = deltaTime > 0 ? ((y - lastScrollY) / deltaTime) * 1000 : 0
  lastScrollY = y
})

/** Current scroll velocity in px/s, for both smooth and native scrolling. */
export function getScrollVelocity(): number {
  return scrollVelocity
}

export { gsap, ScrollTrigger, useGSAP }
