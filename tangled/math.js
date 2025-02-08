export const {
  abs,
  cos,
  sin,
  tan,
  cosh,
  sinh,
  acos,
  acosh,
  atan,
  atan2,
  min,
  max,
  round,
  sqrt,
  cbrt,
  sign,
  ceil,
  floor,
  log,
  exp,
  hypot,
  pow,
  PI,
} = Math

export const avg = (...args) => args.reduce((a, b) => a + b, 0) / args.length

export const TAU = PI * 2
export const ETA = PI / 2

export const eps = x => (abs(x) < 1e-9 ? 0 : x)

export const float = v => v.toFixed(16).replace(/0*$/, '')

export const VARS = ['u', 'v', 'w']
