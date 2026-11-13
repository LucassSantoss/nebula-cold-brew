import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { use, useEffect, useState } from 'react'
import { NeutralToneMapping } from 'three'
import { getState, setState } from '../../lib/store'
import { Beans } from './Beans'
import { CanRig } from './CanRig'

// Label artwork is drawn with the page fonts, so they must be ready first.
const fontsReady = Promise.all([
  document.fonts.load('400 64px Anton'),
  document.fonts.load('700 64px "Manrope Variable"'),
]).catch(() => [])

/**
 * Studio lighting built from emissive panels instead of an HDR file, so the
 * reflections on the can need no network request.
 */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#0b0807']} />
      <Lightformer form="rect" intensity={5} color="#fff3e0" position={[-6, 2, 5]} scale={[3, 12, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={3} color="#ffd7a3" position={[7, 1, 1]} scale={[2, 12, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, 9, 2]} scale={[10, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.2} color="#c8873a" position={[0, -8, 2]} scale={[10, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="ring" intensity={2.5} color="#ffe9cc" position={[2, 3, 9]} scale={3} target={[0, 0, 0]} />
    </Environment>
  )
}

/** Tells the rest of the app when the first frame is on screen. */
function ReadySignal() {
  useFrame(() => {
    if (!getState().sceneReady) setState({ sceneReady: true })
  })
  return null
}

/** True while any section that shows 3D content (`data-3d`) is near the viewport. */
function useSceneActive(): boolean {
  const [active, setActive] = useState(true)

  useEffect(() => {
    const visible = new Set<Element>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target)
          else visible.delete(entry.target)
        }
        setActive(visible.size > 0)
      },
      { rootMargin: '10% 0px' },
    )
    document.querySelectorAll('[data-3d]').forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return active
}

/** Fixed full-viewport WebGL layer that floats above the page content. */
export default function Scene() {
  use(fontsReady)
  const active = useSceneActive()

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-20 h-lvh w-full"
      // Hidden while paused so a stale frame can never linger over the page.
      style={{ visibility: active ? 'visible' : 'hidden' }}
    >
      <Canvas
        // The canvas only draws: it must never swallow clicks meant for the page below.
        style={{ pointerEvents: 'none' }}
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{ fov: 30, position: [0, 0, 16], near: 1, far: 60 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = NeutralToneMapping
        }}
      >
        <StudioEnvironment />
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 8]} intensity={1.6} />
        <CanRig />
        <Beans />
        <ReadySignal />
      </Canvas>
    </div>
  )
}
