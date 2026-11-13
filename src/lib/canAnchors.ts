/**
 * DOM boxes the 3D can snaps to. Sections lay out and animate a plain div;
 * the WebGL scene reads its bounding box every frame and places the can there.
 */
export type CanAnchorId = 'hero' | 'flavors' | 'cta'

const anchors = new Map<CanAnchorId, HTMLElement>()

export function canAnchorRef(id: CanAnchorId) {
  return (element: HTMLElement | null) => {
    if (element) anchors.set(id, element)
    return () => {
      anchors.delete(id)
    }
  }
}

export function getCanAnchors(): ReadonlyMap<CanAnchorId, HTMLElement> {
  return anchors
}
