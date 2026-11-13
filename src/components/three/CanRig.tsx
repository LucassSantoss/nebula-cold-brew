import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type Group } from 'three'
import { getCanAnchors, type CanAnchorId } from '../../lib/canAnchors'
import { FLAVORS } from '../../lib/flavors'
import { pointer } from '../../lib/pointer'
import { useStore } from '../../lib/store'
import { useReducedMotion } from '../../lib/useReducedMotion'
import { Can } from './Can'
import { CAN_HEIGHT } from './canDimensions'
import { getLabelTexture } from './LabelTexture'

/** Resting lean of the can (radians, around Z) for each anchor. */
const TILT: Record<CanAnchorId, number> = { hero: -0.14, flavors: 0.06, cta: -0.42 }

/**
 * Glues the can to whichever DOM anchor is on screen: position and size come
 * from the anchor's bounding box, so layout and scroll choreography stay in
 * CSS/GSAP while this only adds rotation and idle motion.
 */
export function CanRig() {
  const group = useRef<Group>(null)
  const sway = useRef({ x: 0, y: 0 })
  const flavor = useStore((state) => state.flavor)
  const reducedMotion = useReducedMotion()

  useFrame(({ viewport, size, clock }, delta) => {
    const can = group.current
    if (!can) return

    // Pick the anchor with the largest visible height.
    let activeId: CanAnchorId | null = null
    let activeRect: DOMRect | null = null
    let bestVisible = 1
    for (const [id, element] of getCanAnchors()) {
      const rect = element.getBoundingClientRect()
      const visible = Math.min(rect.bottom, size.height) - Math.max(rect.top, 0)
      if (visible > bestVisible) {
        bestVisible = visible
        activeId = id
        activeRect = rect
      }
    }

    can.visible = activeId !== null
    if (!activeId || !activeRect) return

    const unitsPerPixel = viewport.height / size.height
    const scale = (activeRect.height * unitsPerPixel) / CAN_HEIGHT
    can.position.x = (activeRect.left + activeRect.width / 2 - size.width / 2) * unitsPerPixel
    can.position.y = -(activeRect.top + activeRect.height / 2 - size.height / 2) * unitsPerPixel
    can.scale.setScalar(scale)

    if (reducedMotion) {
      can.rotation.set(0, 0, TILT[activeId])
      return
    }

    const time = clock.elapsedTime
    sway.current.x = MathUtils.damp(sway.current.x, pointer.x, 3, delta)
    sway.current.y = MathUtils.damp(sway.current.y, pointer.y, 3, delta)

    can.position.y += Math.sin(time * 1.1) * 0.1 * scale
    can.rotation.x = -sway.current.y * 0.1
    can.rotation.y = time * 0.35 + sway.current.x * 0.35
    can.rotation.z = TILT[activeId] + Math.sin(time * 0.7) * 0.02
  })

  return (
    <group ref={group} visible={false}>
      <Can map={getLabelTexture(FLAVORS[flavor])} />
    </group>
  )
}
