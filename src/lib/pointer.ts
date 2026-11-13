/** Pointer position normalized to -1..1 (y up), shared by pointer-reactive visuals. */
export const pointer = { x: 0, y: 0 }

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((event.clientY / window.innerHeight) * 2 - 1)
    },
    { passive: true },
  )
}
