/** Five-stage viewport paths — seamless loop, no long idle segments. */
export type FloatPathId =
  | "gentle-float"
  | "gentle-drift-h"
  | "gentle-drift-v"
  | "gentle-orbit"
  | "drift-ne"
  | "drift-sw"
  | "drift-se"
  | "drift-nw"
  | "horizontal-wide"
  | "horizontal-slow"
  | "vertical-float"
  | "diagonal-ac"
  | "diagonal-bd"
  | "orbit-soft";

export type FloatPathDef = {
  xVw: readonly number[];
  yVh: readonly number[];
  rotate: readonly number[];
};

export const FLOAT_PATHS: Record<FloatPathId, FloatPathDef> = {
  "gentle-float": {
    xVw: [0, 6, -5, 7, 0],
    yVh: [0, -7, 5, -8, 0],
    rotate: [-2, 0.5, 2, -1, -2],
  },
  "gentle-drift-h": {
    xVw: [0, 9, 12, -7, 0],
    yVh: [0, -3, 4, -2, 0],
    rotate: [-1.5, 1, 1.5, 0, -1.5],
  },
  "gentle-drift-v": {
    xVw: [0, -4, 5, -3, 0],
    yVh: [0, -9, 6, 8, 0],
    rotate: [1, -1.5, 0.5, 1.5, 1],
  },
  "gentle-orbit": {
    xVw: [0, 8, -8, 5, 0],
    yVh: [0, -6, 6, -4, 0],
    rotate: [-2, 2, -1, 1.5, -2],
  },
  "drift-ne": {
    xVw: [0, 16, 8, 12, 0],
    yVh: [0, -14, -6, -10, 0],
    rotate: [-4, 3, -2, 1, -4],
  },
  "drift-sw": {
    xVw: [0, -18, -8, -12, 0],
    yVh: [0, 12, 6, 8, 0],
    rotate: [3, -4, 2, -1, 3],
  },
  "drift-se": {
    xVw: [0, 14, 6, 10, 0],
    yVh: [0, 10, 4, 7, 0],
    rotate: [-3, 4, -1, 2, -3],
  },
  "drift-nw": {
    xVw: [0, -15, -7, -10, 0],
    yVh: [0, -11, -5, -8, 0],
    rotate: [2, -3, 4, -1, 2],
  },
  "horizontal-wide": {
    xVw: [0, 22, -14, 18, 0],
    yVh: [0, -5, 4, -3, 0],
    rotate: [-2, 2, -1, 1, -2],
  },
  "horizontal-slow": {
    xVw: [0, -20, 12, -8, 0],
    yVh: [0, 3, -4, 2, 0],
    rotate: [1, -2, 3, -1, 1],
  },
  "vertical-float": {
    xVw: [0, 4, -3, 5, 0],
    yVh: [0, -16, 14, -10, 0],
    rotate: [-3, 0, 3, -1, -3],
  },
  "diagonal-ac": {
    xVw: [0, 18, 10, 14, 0],
    yVh: [0, -12, -18, -8, 0],
    rotate: [-5, 2, 4, -2, -5],
  },
  "diagonal-bd": {
    xVw: [0, -16, -22, -10, 0],
    yVh: [0, 14, 8, 10, 0],
    rotate: [4, -3, -2, 1, 4],
  },
  "orbit-soft": {
    xVw: [0, 12, -12, 8, 0],
    yVh: [0, -10, 10, -6, 0],
    rotate: [-6, 4, -4, 2, -6],
  },
};

export function pathKeyframeTimes(count: number): number[] {
  if (count <= 1) return [0];
  return Array.from({ length: count }, (_, i) => i / (count - 1));
}

export function pathToMotionValues(
  def: FloatPathDef,
  scale: number
): { x: string[]; y: string[]; rotate: number[] } {
  const s = scale;
  return {
    x: def.xVw.map((v) => `calc(-50% + ${(v * s).toFixed(2)}vw)`),
    y: def.yVh.map((v) => `calc(-50% + ${(v * s).toFixed(2)}vh)`),
    rotate: [...def.rotate],
  };
}
