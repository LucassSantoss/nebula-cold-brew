import Matter from 'matter-js'

const { Bodies, Body, Composite, Constraint, Engine, Query, Sleeping } = Matter

export type IceSimulation = {
  /** Starts dropping the cubes in from the top. Only the first call has an effect. */
  drop(): void
  /** Resumes stepping and drawing. */
  start(): void
  /** Pauses stepping and drawing, e.g. while off screen. */
  stop(): void
  /** Kicks every cube with a random force. */
  shake(): void
  destroy(): void
}

type Options = {
  count: number
  /** Skips the animation: cubes are settled instantly and drawn once, with no interaction. */
  frozen: boolean
}

type Cube = {
  body: Matter.Body
  /** Index into the sprite list, i.e. the size bucket. */
  bucket: number
}

const TAU = Math.PI * 2
const STEP_MS = 1000 / 60
const SPAWN_INTERVAL_MS = 70
const WALL_THICKNESS = 240
/** Relative cube sizes; each gets its own pre-rendered sprite. */
const SIZE_BUCKETS = [0.78, 1, 1.24]
/** Transparent margin around a sprite, leaving room for its glow. */
const SPRITE_PADDING = 14
const MAX_SPEED = 42

const cubeBaseSize = (width: number) => Math.min(132, Math.max(58, width * 0.085))

/** Paints one ice cube into an offscreen canvas, so drawing it later is a single blit. */
function createSprite(size: number, dpr: number): HTMLCanvasElement {
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = Math.ceil((size + SPRITE_PADDING * 2) * dpr)
  const ctx = sprite.getContext('2d')!
  ctx.scale(dpr, dpr)
  ctx.translate(SPRITE_PADDING, SPRITE_PADDING)
  const radius = size * 0.2

  // Translucent body with a cold glow
  const body = ctx.createLinearGradient(0, 0, size, size)
  body.addColorStop(0, 'rgba(235, 247, 255, 0.44)')
  body.addColorStop(0.45, 'rgba(150, 205, 245, 0.16)')
  body.addColorStop(1, 'rgba(215, 238, 255, 0.36)')
  ctx.shadowColor = 'rgba(120, 190, 255, 0.5)'
  ctx.shadowBlur = SPRITE_PADDING
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, radius)
  ctx.fill()
  ctx.shadowBlur = 0

  // Bluish rim and a softer inner bevel
  ctx.strokeStyle = 'rgba(165, 215, 250, 0.85)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(0.75, 0.75, size - 1.5, size - 1.5, radius)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)'
  ctx.lineWidth = size * 0.04
  ctx.beginPath()
  ctx.roundRect(size * 0.11, size * 0.11, size * 0.78, size * 0.78, radius * 0.7)
  ctx.stroke()

  // Corner glint, sparkle and a few hairline cracks
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = size * 0.045
  ctx.beginPath()
  ctx.moveTo(size * 0.2, size * 0.36)
  ctx.quadraticCurveTo(size * 0.2, size * 0.2, size * 0.36, size * 0.2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.beginPath()
  ctx.arc(size * 0.74, size * 0.7, size * 0.028, 0, TAU)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(size * 0.3, size * 0.8)
  ctx.lineTo(size * 0.5, size * 0.56)
  ctx.lineTo(size * 0.46, size * 0.4)
  ctx.moveTo(size * 0.5, size * 0.56)
  ctx.lineTo(size * 0.69, size * 0.5)
  ctx.stroke()

  return sprite
}

/**
 * Ice cubes simulated with Matter.js and drawn on a 2D canvas. The canvas is
 * sized to its CSS box; cubes can be grabbed and thrown with mouse or touch.
 */
export function createIceSimulation(canvas: HTMLCanvasElement, { count, frozen }: Options): IceSimulation {
  const ctx = canvas.getContext('2d')!
  const engine = Engine.create({ enableSleeping: true })
  engine.gravity.y = 1.15

  let width = 0
  let height = 0
  let dpr = 1
  let baseSize = 0
  let sprites: HTMLCanvasElement[] = []
  let walls: Matter.Body[] = []
  const cubes: Cube[] = []

  let pendingSpawns = 0
  let spawnClock = 0
  let accumulator = 0
  let running = false
  let dropped = false
  let dirty = true
  let grab: { constraint: Matter.Constraint; pointerId: number } | null = null

  function buildWalls() {
    Composite.remove(engine.world, walls)
    const half = WALL_THICKNESS / 2
    const tall = height * 6
    const fixed = { isStatic: true }
    walls = [
      Bodies.rectangle(width / 2, height + half, width + WALL_THICKNESS * 2, WALL_THICKNESS, fixed),
      Bodies.rectangle(-half, height - tall / 2, WALL_THICKNESS, tall, fixed),
      Bodies.rectangle(width + half, height - tall / 2, WALL_THICKNESS, tall, fixed),
      // A ceiling far above, so a cube thrown upwards always comes back.
      Bodies.rectangle(width / 2, height - tall, width + WALL_THICKNESS * 2, WALL_THICKNESS, fixed),
    ]
    Composite.add(engine.world, walls)
  }

  function resize() {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    width = rect.width
    height = rect.height
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)

    const nextBase = cubeBaseSize(width)
    if (nextBase !== baseSize) {
      // Keep existing cubes proportional to the new viewport.
      if (baseSize) cubes.forEach(({ body }) => Body.scale(body, nextBase / baseSize, nextBase / baseSize))
      baseSize = nextBase
      sprites = SIZE_BUCKETS.map((scale) => createSprite(baseSize * scale, dpr))
    }

    buildWalls()
    for (const { body } of cubes) {
      Sleeping.set(body, false)
      if (body.position.x > width || body.position.y > height) {
        Body.setPosition(body, { x: Math.min(body.position.x, width - baseSize), y: Math.min(body.position.y, height - baseSize) })
      }
    }
    dirty = true
    if (!running) render()
  }

  function spawnCube() {
    const bucket = cubes.length % SIZE_BUCKETS.length
    const size = baseSize * SIZE_BUCKETS[bucket]
    const body = Bodies.rectangle(
      size + Math.random() * Math.max(1, width - size * 2),
      -size,
      size,
      size,
      {
        chamfer: { radius: size * 0.2 },
        angle: Math.random() * TAU,
        restitution: 0.28,
        friction: 0.03,
        frictionAir: 0.012,
        density: 0.0012,
      },
    )
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12)
    Composite.add(engine.world, body)
    cubes.push({ body, bucket })
  }

  function step() {
    spawnClock += STEP_MS
    while (pendingSpawns > 0 && spawnClock >= SPAWN_INTERVAL_MS) {
      spawnCube()
      pendingSpawns--
      spawnClock -= SPAWN_INTERVAL_MS
    }

    for (const { body } of cubes) {
      // A hard throw can otherwise tunnel through the walls.
      if (body.speed > MAX_SPEED) {
        Body.setVelocity(body, { x: (body.velocity.x / body.speed) * MAX_SPEED, y: (body.velocity.y / body.speed) * MAX_SPEED })
      }
    }
    Engine.update(engine, STEP_MS)
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    for (const { body, bucket } of cubes) {
      const drawSize = baseSize * SIZE_BUCKETS[bucket] + SPRITE_PADDING * 2
      const cos = Math.cos(body.angle) * dpr
      const sin = Math.sin(body.angle) * dpr
      ctx.setTransform(cos, sin, -sin, cos, body.position.x * dpr, body.position.y * dpr)
      ctx.drawImage(sprites[bucket], -drawSize / 2, -drawSize / 2, drawSize, drawSize)
    }
  }

  function tick(deltaMs: number) {
    accumulator = Math.min(accumulator + deltaMs, STEP_MS * 3)
    while (accumulator >= STEP_MS) {
      step()
      accumulator -= STEP_MS
    }
    // Once the pile is asleep and untouched there is nothing new to draw.
    const resting = !grab && pendingSpawns === 0 && cubes.every(({ body }) => body.isSleeping)
    if (!resting || dirty) render()
    dirty = !resting
  }

  let frame = 0
  let lastTime = 0
  function loop(time: number) {
    tick(lastTime ? time - lastTime : STEP_MS)
    lastTime = time
    frame = requestAnimationFrame(loop)
  }

  // --- Pointer interaction ---------------------------------------------------

  const toCanvas = (event: { clientX: number; clientY: number }) => {
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }
  const cubeAt = (point: Matter.Vector) =>
    Query.point(cubes.map((cube) => cube.body), point)[0] as Matter.Body | undefined

  function release() {
    if (!grab) return
    Composite.remove(engine.world, grab.constraint)
    grab = null
    canvas.style.cursor = ''
  }

  function onPointerDown(event: PointerEvent) {
    if (grab || (event.pointerType === 'mouse' && event.button !== 0)) return
    const point = toCanvas(event)
    const body = cubeAt(point)
    if (!body) return

    Sleeping.set(body, false)
    const constraint = Constraint.create({
      pointA: point,
      bodyB: body,
      pointB: { x: point.x - body.position.x, y: point.y - body.position.y },
      length: 0,
      stiffness: 0.14,
      damping: 0.12,
    })
    Composite.add(engine.world, constraint)
    grab = { constraint, pointerId: event.pointerId }
    canvas.setPointerCapture(event.pointerId)
    canvas.style.cursor = 'grabbing'
  }

  function onPointerMove(event: PointerEvent) {
    const point = toCanvas(event)
    if (grab?.pointerId === event.pointerId) {
      grab.constraint.pointA = point
      if (grab.constraint.bodyB) Sleeping.set(grab.constraint.bodyB, false)
    } else if (!grab && event.pointerType === 'mouse') {
      canvas.style.cursor = cubeAt(point) ? 'grab' : ''
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (grab?.pointerId === event.pointerId) release()
  }

  // Touching a cube must not scroll the page; touching empty space still does.
  function onTouchStart(event: TouchEvent) {
    const touch = event.changedTouches[0]
    if (touch && cubeAt(toCanvas(touch))) event.preventDefault()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  resize()

  if (!frozen) {
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  }

  function stop() {
    if (!running) return
    running = false
    cancelAnimationFrame(frame)
    release()
  }

  return {
    drop() {
      if (dropped) return
      dropped = true
      pendingSpawns = count
      if (!frozen) return
      // No animation: simulate the whole fall up front and show the result.
      for (let i = 0; i < 600; i++) step()
      render()
    },

    start() {
      if (running || frozen) return
      running = true
      lastTime = 0
      frame = requestAnimationFrame(loop)
    },

    stop,

    shake() {
      for (const { body } of cubes) {
        Sleeping.set(body, false)
        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * 0.09 * body.mass,
          y: -(0.04 + Math.random() * 0.05) * body.mass,
        })
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4)
      }
    },

    destroy() {
      stop()
      resizeObserver.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      Composite.clear(engine.world, false)
      Engine.clear(engine)
    },
  }
}
