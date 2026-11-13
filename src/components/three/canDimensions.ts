/** Can measurements in scene units. The can stands on y = 0 with radius 1. */
export const CAN_RADIUS = 1
export const CAN_HEIGHT = 4.86

/** Vertical span of the printed (label) part of the can. */
export const PAINT_BOTTOM = 0.14
export const PAINT_TOP = 4.68

/** Vertical span of the straight wall, where artwork is not distorted. */
export const WALL_BOTTOM = 0.5
export const WALL_TOP = 4.15

export const LID_Y = 4.7

/** Width / height of the unwrapped label. */
export const LABEL_ASPECT = (2 * Math.PI * CAN_RADIUS) / (PAINT_TOP - PAINT_BOTTOM)
