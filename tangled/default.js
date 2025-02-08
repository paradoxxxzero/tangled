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

export const shadings = [
  '',
  'ads',
  'gravity',
  'normal',
  'position',
  'uv',
  'instance',
  'vertex',
]
export const diffuseLight = [
  '',
  'lambert',
  'oren-nayar',
  'minnaert',
  'cel',
  'reverse',
]
export const specularLight = [
  '',
  'phong',
  'blinn-phong',
  'cook-torrance',
  'ward-anisotropic',
]

export const controls = ['3d', '4d', 'arg']

export const defaultParams = {
  move: [],
  vars: ['u'],
  args: {},
  timeref: 0,
  umin: 0,
  umax: TAU,
  vmin: 0,
  vmax: TAU,
  wmin: 0,
  wmax: TAU,
  transparent: true,
  opacity: 40,
  grid: false,
  gridWidth: 100,
  gridScale: 10,
  subgrid: false,
  subgridWidth: 50,
  subgridScale: 50,
  invertGrid: false,
  x_resolution: 40,
  y_resolution: 40,
  z_resolution: 3,
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
  shading: 'ads',
  diffuse: 'oren-nayar',
  specular: 'cook-torrance',
  ambient: 0.2,
  shininess: 32,
  metalness: 0,
  roughness: 0.65,
  useFresnel: false,
  fresnel: 3,
  celShading: 4,
  supersampling: window.devicePixelRatio,
  matrix: ident(),
  rotation: 0,
  thickness: 100,
  xfn: 'sin(u) + 2sin(u)',
  yfn: 'cos(u) - 2cos(u)',
  zfn: '- sin(3u)',
  wfn: '0',
  palette: 'rainbow',
  animate: false,
  speed: 100,
  background: [0.1, 0.1, 0.1, 1],
}

export const allParams = Object.keys(defaultParams)
export const compileConstants = {
  palette: (_, v) => palettes.indexOf(v),
  dimensions: rt => rt.vars.length,
  animate: null,
  grid: null,
  subgrid: null,
  transparent: null,
  invertGrid: null,
  shading: (_, v) => (v ? shadings.indexOf(v) - 1 : false),
  diffuse: (_, v) => (v ? diffuseLight.indexOf(v) - 1 : false),
  specular: (_, v) => (v ? specularLight.indexOf(v) - 1 : false),
  useFresnel: null,
}

export const compileParams = [
  'xfn',
  'yfn',
  'zfn',
  'wfn',
  ...Object.keys(compileConstants),
]
export const uniformParams = {
  anakata: '1f',
  umin: '1f',
  umax: '1f',
  vmin: '1f',
  vmax: '1f',
  wmin: '1f',
  wmax: '1f',
  aspect: '1f',
  opacity: {
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
  ambient: '1f',
  shininess: '1f',
  metalness: '1f',
  roughness: '1f',
  fresnel: '1f',
  celShading: '1f',
  subgridScale: '1f',
}
