import { TAU } from './math'
import { columnMajor, ident } from './matrix'

export const palettes = [
  'yellow_blue',
  'rainbow',
  'red_green',
  'yellow_green',
  'orange_purple',
  'yellow_purple',
  'pink_green',
  'pink_yellow',
  'viridis',
  'plasma',
  'magma',
  'inferno',
  'turbo',
]

export const controls = ['3d', '4d', 'arg']

export const defaultParams = {
  move: [],
  vars: ['t'],
  args: {},
  timeref: 0,
  tmin: 0,
  tmax: TAU,
  smin: 0,
  smax: TAU,
  rmin: 0,
  rmax: TAU,
  transparent: true,
  alpha: 40,
  grid: true,
  gridWidth: 100,
  gridScale: 10,
  subgrid: false,
  subgridWidth: 50,
  subgridScale: 50,
  invertGrid: false,
  x_resolution: 10,
  y_resolution: 10,
  z_resolution: 10,
  x_faces: true,
  y_faces: true,
  z_faces: true,
  control: '3d',
  anakata: 2.5,
  offset: 80,
  velocity: 100,
  hue: 0,
  saturation: 100,
  lightness: 100,
  celShading: 4,
  specular: true,
  supersampling: window.devicePixelRatio > 2 ? window.devicePixelRatio / 2 : 1,
  matrix: ident(),
  rotation: 0,
  thickness: 100,
  xfun: 'sin(t) + 2. * sin(2. * t)',
  yfun: 'cos(t) - 2. * cos(2. * t)',
  zfun: '- sin(3. * t)',
  wfun: '0',
  palette: 'rainbow',
  animate: false,
  speed: 100,
  background: [0.1, 0.1, 0.1, 1],
}

export const allParams = Object.keys(defaultParams)
export const compileConstants = {
  palette: rt => palettes.indexOf(rt.palette),
  dimensions: rt => rt.vars.length,
  animate: null,
  grid: null,
  subgrid: null,
  transparent: null,
  invertGrid: null,
  celShading: (_, v) => v !== 0 && v,
  specular: null,
}
export const compileParams = [
  'xfun',
  'yfun',
  'zfun',
  'wfun',
  ...Object.keys(compileConstants),
]
export const uniformParams = {
  anakata: '1f',
  tmin: '1f',
  tmax: '1f',
  smin: '1f',
  smax: '1f',
  rmin: '1f',
  rmax: '1f',
  aspect: '1f',
  alpha: {
    type: '1f',
    value: v => v / 100,
  },
  time: {
    type: '1f',
    value: () => 0,
  },
  speed: {
    type: '1f',
    value: v => v / 1000000,
  },
  matrix: {
    type: 'm4fv',
    value: v => columnMajor(v),
  },

  thickness: {
    type: '1f',
    value: v => v / 500,
  },

  offset: {
    type: '1f',
    value: v => v / 25,
  },
  velocity: {
    type: '1f',
    value: v => v / 1000,
  },
  hue: {
    type: '1f',
    value: v => v / 360,
  },
  saturation: {
    type: '1f',
    value: v => v / 100,
  },
  lightness: {
    type: '1f',
    value: v => v / 100,
  },
  gridWidth: {
    type: '1f',
    value: v => v / 100,
  },
  gridScale: '1f',
  subgridWidth: {
    type: '1f',
    value: v => v / 100,
  },
  subgridScale: '1f',
}
