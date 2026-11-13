/**
 * Plain values tweened by GSAP on the DOM side and read by the WebGL scene on
 * every frame. Keeps scroll/intro choreography out of React state.
 */
export const sceneMotion = {
  /** Extra can rotation in radians, added on top of its idle spin. */
  canSpin: 0,
  /** 0 = beans packed into the preloader ring, 1 = floating freely. */
  beanBurst: 0,
}
