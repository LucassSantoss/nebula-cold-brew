import { getState, subscribe } from './store'

/** The WebGL scene chunk. Requested right away so it downloads alongside the main bundle. */
export const sceneModule = import('../components/three/Scene')

/** Everything the first screen fetches over the network: web fonts and the scene chunk. */
export const networkReady: Promise<unknown> = Promise.all([document.fonts.ready, sceneModule]).catch(
  () => undefined,
)

/** Resolves once the WebGL scene has drawn its first frame. */
export const sceneReady = new Promise<void>((resolve) => {
  if (getState().sceneReady) return resolve()
  const unsubscribe = subscribe(() => {
    if (!getState().sceneReady) return
    unsubscribe()
    resolve()
  })
})
