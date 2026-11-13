import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { MathUtils, type Group, type MeshStandardMaterial } from 'three'
import { getCanAnchors, type CanAnchorId } from '../../lib/canAnchors'
import { FLAVORS } from '../../lib/flavors'
import { pointer } from '../../lib/pointer'
import { sceneMotion } from '../../lib/sceneMotion'
import { useReducedMotion } from '../../lib/useReducedMotion'
import { Can } from './Can'
import { CAN_HEIGHT } from './canDimensions'
import { getLabelTexture } from './LabelTexture'

/** Resting lean of the can (radians, around Z) for each anchor. */
const TILT: Record<CanAnchorId, number> = { hero: -0.14, flavors: 0.05, cta: -0.42 }

// Half-resolution labels on small screens: a quarter of the texture memory.
const LABEL_WIDTH = window.matchMedia('(min-width: 768px)').matches ? 2048 : 1024
const labelTexture = (flavor: number) => getLabelTexture(FLAVORS[flavor], LABEL_WIDTH)

/**
 * Glues the can to whichever DOM anchor is on screen: position and size come
 * from the anchor's bounding box, so layout and scroll choreography stay in
 * CSS/GSAP while this only adds rotation and idle motion.
 */
export function CanRig() {
  const group = useRef<Group>(null)
  const sway = useRef({ x: 0, y: 0 })
  const reveal = useRef(0)
  const shownLabel = useRef(sceneMotion.labelFlavor)
  const reducedMotion = useReducedMotion()
  const gl = useThree((state) => state.gl)

  const labelMaterial = useRef<MeshStandardMaterial>(null)
  const initialLabel = useMemo(() => labelTexture(sceneMotion.labelFlavor), [])

  // Paint and upload the other labels while idle, so switching flavor never stalls a frame.
  useEffect(() => {
    const pending = FLAVORS.map((_, index) => index)
    let timer = 0
    const warmNext = () => {
      const index = pending.shift()
      if (index === undefined) return
      gl.initTexture(labelTexture(index))
      timer = window.setTimeout(warmNext, 250)
    }
    timer = window.setTimeout(warmNext, 1200)
    return () => window.clearTimeout(timer)
  }, [gl])

  useFrame(({ viewport, size, clock }, delta) => {
    const can = group.current
    if (!can) return

    if (labelMaterial.current && shownLabel.current !== sceneMotion.labelFlavor) {
      shownLabel.current = sceneMotion.labelFlavor
      labelMaterial.current.map = labelTexture(shownLabel.current)
    }

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

    // Ease in on the first frames so a late-loading scene does not pop.
    reveal.current = MathUtils.damp(reveal.current, 1, 5, delta)

    const unitsPerPixel = viewport.height / size.height
    const scale = ((activeRect.height * unitsPerPixel) / CAN_HEIGHT) * reveal.current
    can.position.x = (activeRect.left + activeRect.width / 2 - size.width / 2) * unitsPerPixel
    can.position.y = -(activeRect.top + activeRect.height / 2 - size.height / 2) * unitsPerPixel
    can.scale.setScalar(scale)

    const spin = sceneMotion.canSpin + sceneMotion.canDrag
    if (reducedMotion) {
      can.rotation.set(0, spin, TILT[activeId])
      return
    }

    const time = clock.elapsedTime
    sway.current.x = MathUtils.damp(sway.current.x, pointer.x, 3, delta)
    sway.current.y = MathUtils.damp(sway.current.y, pointer.y, 3, delta)

    // Hero: slow continuous turn. Flavors: face the viewer and sway, so the
    // label stays readable. CTA: turn with the scroll.
    let idle = time * 0.35 + window.scrollY * 0.0025
    if (activeId === 'flavors') idle = Math.sin(time * 0.6) * 0.28
    if (activeId === 'cta') idle = window.scrollY * 0.004

    can.position.y += Math.sin(time * 1.1) * 0.1 * scale
    can.rotation.x = -sway.current.y * 0.1
    can.rotation.y = idle + spin + sway.current.x * 0.35
    can.rotation.z = TILT[activeId] + Math.sin(time * 0.7) * 0.02
  })

  return (
    <group ref={group} visible={false}>
      <Can label={initialLabel} labelMaterialRef={labelMaterial} />
    </group>
  )
}
