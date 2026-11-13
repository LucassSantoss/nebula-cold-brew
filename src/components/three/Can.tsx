import { useMemo } from 'react'
import { LatheGeometry, MeshStandardMaterial, Path, type Texture } from 'three'
import { CAN_HEIGHT, LID_Y, PAINT_BOTTOM, PAINT_TOP, WALL_BOTTOM, WALL_TOP } from './canDimensions'

const RADIAL_SEGMENTS = 96

/** Revolves a 2D profile (x = radius, y = height) around the Y axis. */
function lathe(draw: (path: Path) => void): LatheGeometry {
  const path = new Path()
  draw(path)
  return new LatheGeometry(path.getPoints(10), RADIAL_SEGMENTS)
}

function createBodyGeometry() {
  const geometry = lathe((path) => {
    path.moveTo(0.9, PAINT_BOTTOM)
    path.quadraticCurveTo(0.99, 0.24, 1, WALL_BOTTOM)
    path.lineTo(1, WALL_TOP)
    path.quadraticCurveTo(1, 4.42, 0.9, 4.56)
    path.quadraticCurveTo(0.83, 4.64, 0.82, PAINT_TOP)
  })

  // Lathe UVs follow the profile point index; remap V to height so the label
  // keeps its proportions over the curved shoulder and base.
  const { position, uv } = geometry.attributes
  for (let i = 0; i < uv.count; i++) {
    uv.setY(i, (position.getY(i) - PAINT_BOTTOM) / (PAINT_TOP - PAINT_BOTTOM))
  }
  return geometry
}

function createTopGeometry() {
  return lathe((path) => {
    path.moveTo(0.82, PAINT_TOP)
    path.lineTo(0.82, 4.72)
    path.quadraticCurveTo(0.87, 4.74, 0.87, 4.79)
    path.quadraticCurveTo(0.87, CAN_HEIGHT, 0.82, CAN_HEIGHT)
    path.quadraticCurveTo(0.78, CAN_HEIGHT, 0.77, 4.8)
    path.lineTo(0.75, 4.73)
    path.quadraticCurveTo(0.74, LID_Y, 0.7, LID_Y)
    path.lineTo(0, LID_Y)
  })
}

function createBottomGeometry() {
  return lathe((path) => {
    path.moveTo(0, 0.2)
    path.quadraticCurveTo(0.5, 0.2, 0.68, 0.03)
    path.quadraticCurveTo(0.72, 0, 0.76, 0)
    path.quadraticCurveTo(0.84, 0, 0.9, PAINT_BOTTOM)
  })
}

type CanProps = {
  /** Label texture wrapped around the body. */
  map: Texture
}

/** Procedural drink can, centered on the origin. */
export function Can({ map }: CanProps) {
  const body = useMemo(() => createBodyGeometry(), [])
  const top = useMemo(() => createTopGeometry(), [])
  const bottom = useMemo(() => createBottomGeometry(), [])

  const aluminum = useMemo(
    () => new MeshStandardMaterial({ color: '#cfd2d6', metalness: 1, roughness: 0.26 }),
    [],
  )

  return (
    <group position-y={-CAN_HEIGHT / 2}>
      {/* Half a turn so the label front (center of the texture) faces +Z. */}
      <mesh geometry={body} rotation-y={Math.PI}>
        <meshStandardMaterial map={map} metalness={0.35} roughness={0.36} />
      </mesh>
      <mesh geometry={top} material={aluminum} />
      <mesh geometry={bottom} material={aluminum} />

      {/* Pull tab: rivet, ring and the flat tail under the rivet. */}
      <group position-y={LID_Y}>
        <mesh position-y={0.03} material={aluminum}>
          <cylinderGeometry args={[0.075, 0.075, 0.06, 20]} />
        </mesh>
        <mesh
          position={[0, 0.035, 0.24]}
          rotation-x={Math.PI / 2}
          scale={[0.82, 1.3, 0.45]}
          material={aluminum}
        >
          <torusGeometry args={[0.2, 0.06, 10, 36]} />
        </mesh>
        <mesh position={[0, 0.03, -0.1]} material={aluminum}>
          <boxGeometry args={[0.28, 0.035, 0.3]} />
        </mesh>
      </group>
    </group>
  )
}
