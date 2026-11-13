import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  Color,
  MathUtils,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  type InstancedMesh,
  type PerspectiveCamera,
} from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getScrollY } from '../../lib/gsap'
import { pointer } from '../../lib/pointer'
import { sceneMotion } from '../../lib/sceneMotion'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { useReducedMotion } from '../../lib/useReducedMotion'

/** Depth layers, back to front. Nearer layers are sparser and move faster. */
const LAYERS = [
  { z: -9, share: 0.5, size: 0.3, scrollSpeed: 0.85, parallax: 0.15 },
  { z: -3, share: 0.32, size: 0.34, scrollSpeed: 1.2, parallax: 0.4 },
  { z: 4.5, share: 0.18, size: 0.36, scrollSpeed: 1.8, parallax: 0.9 },
] as const

const BEAN_COLORS = ['#4a2a17', '#3a2012', '#5a351d', '#2c170c']
/** Radius of the ring the beans burst out of, as a fraction of viewport height. */
const RING_RADIUS = 0.12
const BURST_STAGGER = 0.35
const REPEL_RADIUS = 0.22

type Bean = {
  layer: number
  /** Resting position in viewport fractions (-0.5..0.5 spans the screen at that depth). */
  x: number
  y: number
  size: number
  phase: number
  floatSpeed: number
  spin: [number, number, number]
  ringAngle: number
  delay: number
}

/** A coffee bean: squashed ellipsoid with the characteristic S-shaped groove. */
function createBeanGeometry() {
  const sphere = new SphereGeometry(1, 28, 18)
  // Drop UVs so the seam vertices merge and shading stays smooth across it.
  sphere.deleteAttribute('uv')
  sphere.deleteAttribute('normal')
  const geometry = mergeVertices(sphere)
  sphere.dispose()

  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    let y = position.getY(i)
    const z = position.getZ(i)

    if (y > 0) {
      const center = 0.14 * Math.sin(x * Math.PI)
      const across = (z - center) / 0.15
      const fade = 1 - Math.abs(x) ** 4
      y *= 1 - 0.85 * Math.exp(-across * across) * fade
    }
    // Flat on the groove side, rounder on the back.
    position.setXYZ(i, x, y * (y > 0 ? 0.42 : 0.58), z * 0.68)
  }
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Keeps beans off the hero copy and the can. Coordinates are viewport
 * fractions with the origin at the center and y pointing up.
 */
function isBlocked(x: number, y: number, layerIndex: number, compact: boolean): boolean {
  // The front layer is closer to the camera than the can, so keep it off the can too.
  if (layerIndex === 2 && Math.abs(x) < (compact ? 0.34 : 0.17)) return true
  if (compact) {
    // Small screens: title on top, paragraph and button at the bottom.
    return y < -0.2 || (layerIndex > 0 && y > 0.14)
  }
  const overTitle = Math.abs(x) < 0.44 && Math.abs(y) < 0.2
  const overParagraph = x < -0.16 && y < -0.24
  return overParagraph || (layerIndex > 0 && overTitle)
}

function createBeans(count: number, compact: boolean): Bean[] {
  const beans: Bean[] = []
  LAYERS.forEach((layer, layerIndex) => {
    const amount = Math.round(count * layer.share)
    for (let i = 0; i < amount; i++) {
      let x = 0
      let y = 0
      for (let attempt = 0; attempt < 30; attempt++) {
        x = MathUtils.randFloatSpread(1.12)
        y = MathUtils.randFloatSpread(1.1)
        if (!isBlocked(x, y, layerIndex, compact)) break
      }
      beans.push({
        layer: layerIndex,
        x,
        y,
        size: layer.size * MathUtils.randFloat(0.7, 1.25),
        phase: Math.random() * Math.PI * 2,
        floatSpeed: MathUtils.randFloat(0.25, 0.6),
        spin: [MathUtils.randFloatSpread(0.7), MathUtils.randFloatSpread(0.7), MathUtils.randFloatSpread(0.5)],
        ringAngle: 0,
        delay: 0,
      })
    }
  })
  beans.forEach((bean, index) => {
    bean.ringAngle = (index / beans.length) * Math.PI * 2
    bean.delay = Math.random() * BURST_STAGGER
  })
  return beans
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

/** Instanced coffee beans floating around the hero in three parallax layers. */
export function Beans() {
  const mesh = useRef<InstancedMesh>(null)
  const reducedMotion = useReducedMotion()
  const isWide = useMediaQuery('(min-width: 1280px)')
  const isMedium = useMediaQuery('(min-width: 768px)')
  const count = isWide ? 80 : isMedium ? 52 : 28

  const geometry = useMemo(() => createBeanGeometry(), [])
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.48, metalness: 0.2 }), [])
  const beans = useMemo(() => createBeans(count, !isMedium), [count, isMedium])
  // Per-bean push away from the pointer, smoothed over time (x, y pairs).
  const push = useMemo(() => new Float32Array(beans.length * 2), [beans])
  const drift = useRef({ x: 0, y: 0 })
  const dummy = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    const color = new Color()
    beans.forEach((_, index) => {
      mesh.current?.setColorAt(index, color.set(BEAN_COLORS[index % BEAN_COLORS.length]))
    })
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [beans])

  useFrame(({ camera, size, clock }, delta) => {
    const instanced = mesh.current
    if (!instanced) return

    // Beans belong to the hero: once it has scrolled away there is nothing to draw.
    const scroll = getScrollY() / size.height
    instanced.visible = scroll < 1.6
    if (!instanced.visible) return

    const time = reducedMotion ? 0 : clock.elapsedTime
    const fovScale = 2 * Math.tan(MathUtils.degToRad((camera as PerspectiveCamera).fov) / 2)
    const aspect = size.width / size.height
    // Beans are sized for landscape screens; shrink them on narrow viewports.
    const sizeScale = MathUtils.clamp(aspect / 1.5, 0.5, 1)
    const ringRadius = RING_RADIUS * fovScale * camera.position.z
    const burst = sceneMotion.beanBurst

    if (!reducedMotion) {
      drift.current.x = MathUtils.damp(drift.current.x, pointer.x, 2.5, delta)
      drift.current.y = MathUtils.damp(drift.current.y, pointer.y, 2.5, delta)
    }

    beans.forEach((bean, index) => {
      const layer = LAYERS[bean.layer]
      const viewHeight = fovScale * (camera.position.z - layer.z)
      const viewWidth = viewHeight * aspect

      // Push beans away from the pointer, in screen space.
      let pushX = 0
      let pushY = 0
      if (!reducedMotion) {
        const dx = bean.x - pointer.x / 2
        const dy = bean.y + scroll * layer.scrollSpeed - pointer.y / 2
        const distance = Math.hypot(dx * aspect, dy)
        if (distance < REPEL_RADIUS && distance > 0.0001) {
          const force = (1 - distance / REPEL_RADIUS) ** 2 * 0.09
          pushX = (dx / distance) * force
          pushY = (dy / distance) * force
        }
        push[index * 2] = MathUtils.damp(push[index * 2], pushX, 4, delta)
        push[index * 2 + 1] = MathUtils.damp(push[index * 2 + 1], pushY, 4, delta)
      }

      const scrollSpeed = reducedMotion ? 1 : layer.scrollSpeed
      const restX =
        (bean.x + push[index * 2] - drift.current.x * layer.parallax * 0.04) * viewWidth +
        Math.cos(time * bean.floatSpeed * 0.7 + bean.phase) * 0.18
      const restY =
        (bean.y + push[index * 2 + 1] + scroll * scrollSpeed - drift.current.y * layer.parallax * 0.04) *
          viewHeight +
        Math.sin(time * bean.floatSpeed + bean.phase) * 0.22

      // Intro: every bean starts on a small ring at the center and flies out.
      const progress = easeOutExpo(MathUtils.clamp((burst - bean.delay) / (1 - BURST_STAGGER), 0, 1))
      dummy.position.set(
        MathUtils.lerp(Math.cos(bean.ringAngle) * ringRadius, restX, progress),
        MathUtils.lerp(Math.sin(bean.ringAngle) * ringRadius, restY, progress),
        MathUtils.lerp(0, layer.z, progress),
      )
      dummy.rotation.set(
        bean.phase + time * bean.spin[0],
        bean.phase * 2 + time * bean.spin[1],
        bean.phase * 3 + time * bean.spin[2],
      )
      dummy.scale.setScalar(
        bean.size * sizeScale * MathUtils.lerp(0.25, 1, progress) * Math.min(1, burst * 20),
      )
      dummy.updateMatrix()
      instanced.setMatrixAt(index, dummy.matrix)
    })
    instanced.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      key={beans.length}
      ref={mesh}
      args={[geometry, material, beans.length]}
      frustumCulled={false}
    />
  )
}
