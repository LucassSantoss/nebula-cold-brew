/** Geometry of the can silhouette inside its viewBox, shared with the particle canvas. */
export const CAN_VIEWBOX = { width: 120, height: 220 }
export const CAN_BODY = { top: 22, bottom: 212 }
/** How far the liquid surface travels (in viewBox units) from empty to full. */
export const LIQUID_TRAVEL = 178
/** Width of one wave of the liquid surface, i.e. the loop distance. */
export const WAVE_LENGTH = 120

export const BODY_PATH =
  'M26 22C22 30 14 34 14 46V190C14 202 20 210 30 212H90C100 210 106 202 106 190V46C106 34 98 30 94 22Z'
// Wider than the can, so it can slide sideways by one wavelength in a seamless loop.
export const WAVE_PATH = 'M-120 0Q-90 -9 -60 0T0 0T60 0T120 0T180 0T240 0V200H-120Z'
