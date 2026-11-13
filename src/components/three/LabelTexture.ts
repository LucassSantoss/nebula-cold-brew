import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import type { Flavor, FlavorId } from '../../lib/flavors'
import { LABEL_ASPECT, PAINT_BOTTOM, PAINT_TOP, WALL_BOTTOM, WALL_TOP } from './canDimensions'

// The label is painted in a fixed design space and scaled to the canvas size.
const W = 2048
const H = Math.round(W / LABEL_ASPECT)
const TAU = Math.PI * 2

/** Converts a height on the can to a y coordinate in design space. */
const yAt = (canY: number) => H * (1 - (canY - PAINT_BOTTOM) / (PAINT_TOP - PAINT_BOTTOM))
const BAND_TOP = yAt(WALL_TOP)
const BAND_BOTTOM = yAt(WALL_BOTTOM)

const DISPLAY_FONT = 'Anton, "Arial Narrow", Impact, sans-serif'
const TEXT_FONT = '"Manrope Variable", system-ui, sans-serif'

const FACTS = [
  ['12H', 'EXTRAÇÃO A FRIO'],
  ['0G', 'AÇÚCAR ADICIONADO'],
  ['180MG', 'CAFEÍNA'],
  ['100%', 'ARÁBICA'],
] as const

/** Small deterministic PRNG so every flavor always gets the same starfield. */
function createRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function spacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  ctx.letterSpacing = `${spacing}px`
  // letterSpacing also pads the last glyph; shift to keep the text optically centered.
  const offset = ctx.textAlign === 'center' ? spacing / 2 : 0
  ctx.fillText(text, x + offset, y)
  ctx.letterSpacing = '0px'
}

function paintBackground(ctx: CanvasRenderingContext2D, flavor: Flavor) {
  const { top, bottom, ink, accent } = flavor.label
  const gradient = ctx.createLinearGradient(0, 0, 0, H)
  gradient.addColorStop(0, top)
  gradient.addColorStop(1, bottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, W, H)

  // Starfield
  const random = createRandom(flavor.id.length * 7919 + flavor.id.charCodeAt(0))
  ctx.fillStyle = ink
  for (let i = 0; i < 320; i++) {
    const x = random() * W
    const y = BAND_TOP + random() * (BAND_BOTTOM - BAND_TOP)
    const radius = 1.2 + random() ** 4 * 5
    ctx.globalAlpha = 0.12 + random() * 0.45
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, TAU)
    ctx.fill()
  }
  for (let i = 0; i < 14; i++) {
    const x = random() * W
    const y = BAND_TOP + 60 + random() * (BAND_BOTTOM - BAND_TOP - 120)
    const size = 10 + random() * 16
    ctx.globalAlpha = 0.5 + random() * 0.4
    ctx.beginPath()
    ctx.moveTo(x, y - size)
    ctx.quadraticCurveTo(x, y, x + size, y)
    ctx.quadraticCurveTo(x, y, x, y + size)
    ctx.quadraticCurveTo(x, y, x - size, y)
    ctx.quadraticCurveTo(x, y, x, y - size)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Solid bands on the tapered shoulder and base, plus a pinstripe.
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, BAND_TOP)
  ctx.fillRect(0, BAND_BOTTOM, W, H - BAND_BOTTOM)
  ctx.fillRect(0, BAND_TOP + 16, W, 5)
  ctx.fillRect(0, BAND_BOTTOM - 21, W, 5)
}

function paintPlanet(ctx: CanvasRenderingContext2D, flavor: Flavor, cx: number, cy: number) {
  const { ink, accent } = flavor.label
  const radius = 215
  const ring = { rx: 345, ry: 80, tilt: -0.32 }

  const strokeRing = (from: number, to: number) => {
    ctx.beginPath()
    ctx.ellipse(cx, cy + 14, ring.rx, ring.ry, ring.tilt, from, to)
    ctx.stroke()
  }

  ctx.strokeStyle = ink
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  strokeRing(Math.PI, TAU) // far half, hidden behind the planet

  // Planet body: solid on top, dissolving into stripes below.
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, TAU)
  ctx.clip()
  ctx.fillStyle = accent
  let y = cy - radius
  let bar = radius * 1.08
  let gap = 9
  while (y < cy + radius) {
    ctx.fillRect(cx - radius, y, radius * 2, bar)
    y += bar + gap
    bar = Math.max(6, bar > 60 ? 46 : bar * 0.76)
    gap *= 1.22
  }
  ctx.restore()

  strokeRing(0, Math.PI) // near half, in front of the planet

  // Moon riding the ring
  const angle = -0.42
  const mx = Math.cos(angle) * ring.rx
  const my = Math.sin(angle) * ring.ry
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(
    cx + mx * Math.cos(ring.tilt) - my * Math.sin(ring.tilt),
    cy + 14 + mx * Math.sin(ring.tilt) + my * Math.cos(ring.tilt),
    17,
    0,
    TAU,
  )
  ctx.fill()
}

function paintWordmark(ctx: CanvasRenderingContext2D, flavor: Flavor, cx: number, baseline: number) {
  const { ink, accent } = flavor.label
  ctx.font = `400 236px ${DISPLAY_FONT}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = ink

  const text = 'NEBULA'
  const left = cx - ctx.measureText(text).width / 2
  ctx.fillText(text, left, baseline)

  // The orbit that replaces the acute accent, matching the HTML logo.
  const eMetrics = ctx.measureText('E')
  const ex = left + ctx.measureText('N').width + eMetrics.width / 2 + 8
  const ey = baseline - eMetrics.actualBoundingBoxAscent - 34
  ctx.strokeStyle = ink
  ctx.lineWidth = 9
  ctx.beginPath()
  ctx.ellipse(ex, ey, 58, 19, -0.38, 0, TAU)
  ctx.stroke()
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.arc(ex + 54, ey - 21, 13, 0, TAU)
  ctx.fill()
}

function paintFront(ctx: CanvasRenderingContext2D, flavor: Flavor, cx: number) {
  const { top, ink, accent } = flavor.label

  paintPlanet(ctx, flavor, cx, 470)
  paintWordmark(ctx, flavor, cx, 985)

  // Flavor name in a pill
  ctx.font = `400 84px ${DISPLAY_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const name = flavor.name.toUpperCase()
  ctx.letterSpacing = '12px'
  const pillWidth = ctx.measureText(name).width + 96
  ctx.letterSpacing = '0px'
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.roundRect(cx - pillWidth / 2, 1034, pillWidth, 124, 62)
  ctx.fill()
  ctx.fillStyle = top
  spacedText(ctx, name, cx, 1101, 12)

  ctx.fillStyle = ink
  ctx.font = `700 31px ${TEXT_FONT}`
  spacedText(ctx, 'COLD BREW · EXTRAÇÃO A FRIO', cx, 1216, 9)
  ctx.globalAlpha = 0.75
  ctx.font = `600 27px ${TEXT_FONT}`
  spacedText(ctx, '269 ML', cx, 1272, 9)
  ctx.globalAlpha = 1
}

function paintBack(ctx: CanvasRenderingContext2D, flavor: Flavor, cx: number) {
  const { ink, accent } = flavor.label
  const left = cx - 290

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = ink
  ctx.font = `400 104px ${DISPLAY_FONT}`
  ctx.fillText('CAFÉ GELADO', cx, 400)
  ctx.fillStyle = accent
  ctx.fillText('DE OUTRA GALÁXIA', cx, 508)

  ctx.textAlign = 'left'
  FACTS.forEach(([value, label], row) => {
    const y = 680 + row * 132
    ctx.fillStyle = ink
    ctx.globalAlpha = 0.3
    ctx.fillRect(left, y - 104, 580, 3)
    ctx.globalAlpha = 1
    ctx.font = `400 92px ${DISPLAY_FONT}`
    ctx.fillText(value, left, y)
    ctx.font = `700 25px ${TEXT_FONT}`
    spacedText(ctx, label, left + 280, y - 26, 5)
  })

  ctx.textAlign = 'center'
  ctx.globalAlpha = 0.75
  ctx.font = `600 22px ${TEXT_FONT}`
  spacedText(ctx, 'PRODUTO FICTÍCIO · PROJETO DE PORTFÓLIO', cx, 1210, 5)
  ctx.globalAlpha = 1

  // Decorative stripes standing in for a barcode
  const random = createRandom(42)
  let x = cx - 150
  while (x < cx + 150) {
    const bar = 3 + Math.floor(random() * 3) * 3
    ctx.fillRect(x, 1236, bar, 62)
    x += bar + 4 + Math.floor(random() * 3) * 3
  }
}

function paintSide(ctx: CanvasRenderingContext2D, flavor: Flavor, cx: number) {
  ctx.save()
  ctx.translate(cx, (BAND_TOP + BAND_BOTTOM) / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = flavor.label.ink
  ctx.globalAlpha = 0.6
  ctx.font = `700 26px ${TEXT_FONT}`
  spacedText(ctx, 'NÉBULA · COLD BREW · SERVIR A 4°C', 0, 0, 16)
  ctx.restore()
}

export function paintLabel(canvas: HTMLCanvasElement, flavor: Flavor) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.save()
  ctx.scale(canvas.width / W, canvas.height / H)
  paintBackground(ctx, flavor)
  paintFront(ctx, flavor, W / 2)
  paintSide(ctx, flavor, W * 0.25)
  paintSide(ctx, flavor, W * 0.75)
  // The back panel straddles the seam, so it is painted on both edges.
  paintBack(ctx, flavor, 0)
  paintBack(ctx, flavor, W)
  ctx.restore()
}

const cache = new Map<FlavorId, CanvasTexture>()

/** Returns the label texture for a flavor, painting it on first use. */
export function getLabelTexture(flavor: Flavor, width = W): CanvasTexture {
  let texture = cache.get(flavor.id)
  if (!texture) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = Math.round(width / LABEL_ASPECT)
    paintLabel(canvas, flavor)

    texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = RepeatWrapping
    texture.anisotropy = 8
    cache.set(flavor.id, texture)
  }
  return texture
}
