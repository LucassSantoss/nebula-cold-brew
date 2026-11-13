import { CAN_BODY, LIQUID_TRAVEL } from './canShape'

/** Scroll-driven values the canvas is a pure function of (plus time, for idle motion). */
export type ProcessState = {
  /** 0..1 while the section scrolls into view, before it pins. */
  enter: number
  /** 0..4, one unit per step. */
  step: number
  /** 0..1 liquid level inside the can. */
  fill: number
}

export type ProcessLayout = {
  width: number
  height: number
  /** Center of the bean and of the powder cloud. */
  centerX: number
  centerY: number
  /** Top and bottom of the can body, where drops fall into. */
  canTop: number
  canBottom: number
}

type Particle = {
  /** Start position inside the bean, in unit-disc coordinates. */
  homeX: number
  homeY: number
  /** Position in the powder cloud, polar around the center. */
  angle: number
  radius: number
  /** Position inside the funnel: `bedY` 0 = tip, 1 = rim; `bedX` -1..1 across. */
  bedX: number
  bedY: number
  size: number
  delay: number
}

const TAU = Math.PI * 2
const CREAM = '#f3e6d3'
const LIQUID = '#c8873a'
const POWDER_SHADES = ['#7a4a25', '#9a6a3c', '#b8793f', '#dba765']
const GRIND_STAGGER = 0.45
const LIQUID_RANGE = LIQUID_TRAVEL / (CAN_BODY.bottom - CAN_BODY.top)

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const smoothstep = (from: number, to: number, value: number) => {
  const t = clamp01((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}

/** A chunk of the bean that flies off when grinding starts, then crumbles away. */
type Shard = {
  angle: number
  distance: number
  size: number
  spin: number
  /** Outline as radii around the shard center, one per corner. */
  corners: number[]
}

function createShard(index: number, total: number): Shard {
  return {
    angle: (index / total) * TAU + Math.random() * 0.5,
    distance: 0.12 + Math.random() * 0.2,
    size: 0.022 + Math.random() * 0.03,
    spin: (Math.random() - 0.5) * 9,
    corners: Array.from({ length: 5 }, () => 0.55 + Math.random() * 0.45),
  }
}

function createParticle(): Particle {
  const homeAngle = Math.random() * TAU
  const homeRadius = Math.sqrt(Math.random())
  // sqrt bias puts more grounds near the wide rim than at the narrow tip.
  const depth = Math.sqrt(Math.random())
  return {
    homeX: Math.cos(homeAngle) * homeRadius,
    homeY: Math.sin(homeAngle) * homeRadius,
    angle: Math.random() * TAU,
    radius: 0.1 + Math.random() ** 0.8 * 0.3,
    bedX: (Math.random() * 2 - 1) * depth,
    bedY: depth * 0.78,
    size: 1 + Math.random() ** 2.5 * 4,
    delay: Math.random() * GRIND_STAGGER,
  }
}

function drawBean(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  alpha: number,
) {
  const rx = size * 0.64
  const ry = size

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.globalAlpha = alpha

  const body = ctx.createRadialGradient(-rx * 0.4, -ry * 0.45, size * 0.05, 0, 0, size * 1.15)
  body.addColorStop(0, '#8a552b')
  body.addColorStop(0.5, '#55301a')
  body.addColorStop(1, '#2a160b')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU)
  ctx.fill()

  // S-shaped groove, with a faint lit edge beside it
  const groove = (offset: number) => {
    ctx.beginPath()
    ctx.moveTo(rx * 0.08 + offset, -ry * 0.88)
    ctx.bezierCurveTo(-rx * 0.6 + offset, -ry * 0.3, rx * 0.6 + offset, ry * 0.3, -rx * 0.08 + offset, ry * 0.88)
    ctx.stroke()
  }
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(255, 214, 170, 0.14)'
  ctx.lineWidth = size * 0.05
  groove(size * 0.05)
  ctx.strokeStyle = '#1a0c05'
  ctx.lineWidth = size * 0.075
  groove(0)

  ctx.restore()
}

function drawDrop(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, stretch: number) {
  const tip = y - radius * 1.7 * stretch
  ctx.beginPath()
  ctx.moveTo(x, tip)
  ctx.quadraticCurveTo(x + radius, y - radius * 0.7, x + radius, y)
  ctx.arc(x, y, radius, 0, Math.PI)
  ctx.quadraticCurveTo(x - radius, y - radius * 0.7, x, tip)
  ctx.fill()
}

/**
 * Draws the bean → powder → drops story on a 2D canvas. `density` trades
 * particle count for speed on smaller screens.
 */
export type ProcessDensity = keyof typeof DENSITIES

const DENSITIES = {
  full: { particles: 640, drops: 8, shards: 16, particleScale: 1 },
  medium: { particles: 400, drops: 8, shards: 12, particleScale: 1 },
  lite: { particles: 220, drops: 5, shards: 0, particleScale: 0.7 },
}

export function createProcessRenderer(canvas: HTMLCanvasElement, density: ProcessDensity) {
  const ctx = canvas.getContext('2d')!
  const {
    particles: particleCount,
    drops: dropCount,
    shards: shardCount,
    particleScale,
  } = DENSITIES[density]

  // Grouped by color so each shade is filled with a single path per frame.
  const groups: Particle[][] = POWDER_SHADES.map(() => [])
  for (let i = 0; i < particleCount; i++) groups[i % groups.length].push(createParticle())
  const shards = Array.from({ length: shardCount }, (_, index) => createShard(index, shardCount))
  const drops = Array.from({ length: dropCount }, (_, index) => ({
    phase: index / dropCount + Math.random() * 0.06,
    offset: Math.random() * 2 - 1,
  }))

  let layout: ProcessLayout = { width: 0, height: 0, centerX: 0, centerY: 0, canTop: 0, canBottom: 0 }

  function resize(next: ProcessLayout) {
    layout = next
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(next.width * dpr)
    canvas.height = Math.round(next.height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function draw(state: ProcessState, time: number) {
    const { width, height, centerX: cx, centerY: cy, canTop, canBottom } = layout
    if (!width) return
    ctx.clearRect(0, 0, width, height)

    const unit = Math.min(width * 0.9, height)
    const grind = clamp01(state.step - 1)
    const brew = clamp01(state.step - 2)
    const canning = clamp01(state.step - 3)
    const beanSize = 0.22 * unit

    // Step 1: the bean. It shakes and shrinks as grinding starts.
    const beanAlpha = smoothstep(0, 0.6, state.enter) * (1 - smoothstep(0.05, 0.45, grind))
    if (beanAlpha > 0.01) {
      const shake = Math.sin(time * 55) * 0.01 * unit * smoothstep(0, 0.12, grind)
      const scale = lerp(0.35, 1, easeOutCubic(state.enter)) * (1 - 0.35 * smoothstep(0, 0.45, grind))
      const rotation = -0.5 + Math.min(state.step, 1) * 0.5 + Math.sin(time * 0.8) * 0.03
      drawBean(ctx, cx + shake, cy + Math.sin(time * 1.3) * 0.008 * unit, beanSize * scale, rotation, beanAlpha)
    }

    // Step 2 opens with the bean cracking into shards that crumble as they fly.
    if (grind > 0 && grind < 0.75) {
      const flight = easeOutCubic(grind / 0.75)
      ctx.fillStyle = '#55301a'
      for (const shard of shards) {
        const size = shard.size * unit * (1 - flight)
        const x = cx + Math.cos(shard.angle) * shard.distance * unit * flight
        const y = cy + Math.sin(shard.angle) * shard.distance * unit * flight
        const rotation = shard.angle + shard.spin * flight
        ctx.beginPath()
        shard.corners.forEach((corner, index) => {
          const theta = rotation + (index / shard.corners.length) * TAU
          ctx.lineTo(x + Math.cos(theta) * size * corner, y + Math.sin(theta) * size * corner)
        })
        ctx.fill()
      }
    }

    // Funnel the grounds settle into for the extraction.
    const tipY = canTop - 0.035 * unit
    const rimY = tipY - 0.17 * unit
    const rimHalf = 0.115 * unit
    const funnelAlpha = smoothstep(0, 0.3, brew) * (1 - smoothstep(0.78, 0.95, canning))
    if (funnelAlpha > 0.01) {
      ctx.globalAlpha = funnelAlpha
      ctx.strokeStyle = CREAM
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(cx - rimHalf * 1.1, rimY - 0.012 * unit)
      ctx.lineTo(cx - 0.012 * unit, tipY - 0.012 * unit)
      ctx.lineTo(cx - 0.012 * unit, tipY)
      ctx.moveTo(cx + rimHalf * 1.1, rimY - 0.012 * unit)
      ctx.lineTo(cx + 0.012 * unit, tipY - 0.012 * unit)
      ctx.lineTo(cx + 0.012 * unit, tipY)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Steps 2-3: powder bursts out of the bean, swirls, then settles in the funnel.
    const powderScale = 1 - smoothstep(0.75, 0.95, canning)
    if (grind > 0 && powderScale > 0.01) {
      const spin = time * 0.12
      groups.forEach((group, shade) => {
        ctx.fillStyle = POWDER_SHADES[shade]
        ctx.beginPath()
        for (const particle of group) {
          const burst = easeOutCubic(clamp01((grind - particle.delay) / (1 - GRIND_STAGGER)))
          const radius = particle.size * particleScale * Math.min(1, burst * 5) * powderScale
          if (radius < 0.2) continue

          const swirl = particle.angle + burst * 1.4 + spin * (0.5 + particle.radius * 2)
          let x = lerp(cx + particle.homeX * beanSize * 0.55, cx + Math.cos(swirl) * particle.radius * unit, burst)
          let y = lerp(cy + particle.homeY * beanSize * 0.85, cy + Math.sin(swirl) * particle.radius * unit * 0.82, burst)

          const settle = easeInOutCubic(clamp01((brew - particle.delay * 0.4) / 0.42))
          if (settle > 0) {
            x = lerp(x, cx + particle.bedX * rimHalf * 0.74, settle)
            y = lerp(y, tipY - 0.016 * unit - particle.bedY * (tipY - rimY), settle)
          }

          ctx.moveTo(x + radius, y)
          ctx.arc(x, y, radius, 0, TAU)
        }
        ctx.fill()
      })
    }

    // Steps 3-4: drops, then a steady stream, fall from the funnel into the can.
    const surfaceY = canBottom - state.fill * (canBottom - canTop) * LIQUID_RANGE
    const dripping = smoothstep(0.3, 0.5, brew) * (1 - smoothstep(0.78, 0.86, canning))
    ctx.fillStyle = LIQUID

    const stream = smoothstep(0, 0.15, canning) * (1 - smoothstep(0.76, 0.84, canning))
    if (stream > 0.01) {
      const half = 0.0045 * unit * stream
      ctx.fillRect(cx - half, tipY, half * 2, Math.max(0, surfaceY - tipY))
    }

    if (dripping > 0.01) {
      drops.forEach((drop, index) => {
        if (index / drops.length >= dripping) return
        const cycle = (time * 0.85 + drop.phase) % 1
        // Swell at the tip for a moment, then fall with gravity.
        const fall = cycle < 0.25 ? 0 : ((cycle - 0.25) / 0.75) ** 2
        const radius = 0.0078 * unit * Math.min(1, cycle / 0.25)
        const y = lerp(tipY + radius, surfaceY, fall)
        drawDrop(ctx, cx + drop.offset * 0.003 * unit, y, radius, 1 + fall * 1.5)
      })
    }
  }

  return { resize, draw }
}
