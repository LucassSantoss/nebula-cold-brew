import { useMediaQuery } from './useMediaQuery'

const QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return window.matchMedia(QUERY).matches
}

export function useReducedMotion(): boolean {
  return useMediaQuery(QUERY)
}
