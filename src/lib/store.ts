import { useSyncExternalStore } from 'react'

type State = {
  /** Index of the active flavor in `FLAVORS`. */
  flavor: number
  /** True once the preloader is gone and intro animations may run. */
  introDone: boolean
  /** True once the WebGL scene has rendered its first frame. */
  sceneReady: boolean
}

let state: State = { flavor: 0, introDone: false, sceneReady: false }
const listeners = new Set<() => void>()

export function getState(): State {
  return state
}

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStore<T>(selector: (state: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state))
}
