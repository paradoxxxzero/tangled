import { defaultParams } from './default'
import { ETA, PI, TAU } from './math'
import { filterParams } from './params'

const withDefaults = presets =>
  presets.map(({ name, params, subfowms }) => ({
    name,
    params: filterParams(
      {
        ...defaultParams,
        xfn: '0',
        yfn: '0',
        zfn: '0',
        wfn: '0',
        ...params,
      },
      null
    ).params,
    subfowms: subfowms ? withDefaults(subfowms) : [],
  }))

export const presets = withDefaults([
  {
    name: 'Donut',
    params: {
      xfn: 'sin(u)',
      yfn: 'cos(u)',
    },
  },
  {
    name: 'Torus',
    params: {
      xfn: '(b + a*cos(v)) * sin(u)',
      yfn: '(b + a*cos(v)) * cos(u)',
      zfn: 'a*sin(v)',
      args: {
        a: 1,
        b: 3,
      },
    },
  },
  {
    name: 'Clifford Torus',
    params: {
      xfn: 'a * sin(u)',
      yfn: 'a * cos(u)',
      zfn: 'a * sin(v)',
      wfn: 'a * cos(v)',
    },
  },
  {
    name: 'Spring',
    params: {
      xfn: 'sin(a * u + b)',
      yfn: 'cos(a * u + b)',
      zfn: 'u - PI',
      args: {
        a: 5,
        b: 0,
      },
      x_resolution: 200,
      transparent: false,
    },
  },
  {
    name: '3-sphere curve',
    params: {
      xfn: 'a * cos(b * u)',
      yfn: 'a * sin(b * u)',
      zfn: 'a * cos(c * u)',
      wfn: 'a * sin(c * u)',
      args: {
        a: 1,
        b: 3,
        c: 5,
      },
      x_resolution: 200,
      transparent: false,
    },
  },

  {
    name: 'Trefoil Knot',
    params: {
      xfn: 'sin(u) + 2sin(2t)',
      yfn: 'cos(u) - 2cos(2t)',
      zfn: 'sin(3t)',
    },
    x_resolution: 200,
    transparent: false,
  },
  {
    name: 'Trefoil Surface Knot',
    params: {
      xfn: 'a / 8 * (cos(u) - 2*cos(2t)) * (2 + cos(v)) * (2 + cos(v + TAU / 3))',
      yfn: 'a * (sin(u) + 2*sin(2t)) / (2 + cos(v + TAU / 3))',
      zfn: 'a * sin(3t) / (2 + cos(v))',
      umin: -PI,
      umax: PI,
      vmin: -PI,
      vmax: PI,
      args: {
        a: 1.5,
      },
    },
  },
  {
    name: 'Klein Bottle',
    params: {
      xfn: '(cos(u / a) * cos(v) - sin(u/a) * sin(a*v))',
      yfn: '(sin(u / a) * cos(v) + cos(u/a) * sin(a*v))',
      zfn: 'cos(u) * (b + c*sin(v))',
      wfn: 'sin(u) * (b + c*sin(v))',
      args: {
        a: 2,
        b: 1,
        c: 1,
      },
    },
  },
  {
    name: 'Klein Bottle 2',
    params: {
      xfn: '(a + b * cos(v)) * cos(u)',
      yfn: '(a + b * cos(v)) * sin(u)',
      zfn: 'b * sin(v) * cos(u/2)',
      wfn: 'b * sin(v) * sin(u/2)',
      args: {
        a: 2,
        b: 1,
      },
    },
  },
  {
    name: 'Mobius Tube',
    params: {
      xfn: '(a + b * cos(v)) * cos(u)',
      yfn: '(a + b * cos(v)) * sin(u)',
      zfn: 'b * sin(v) * cos(u / 2)',
      wfn: 'b * sin(v) * sin(u / 2)',
      args: {
        a: 1.5,
        b: 0.5,
      },
    },
  },

  {
    name: 'Eight knot',
    params: {
      xfn: '(2 + cos(2t)) * cos(3t)',
      yfn: '(2 + cos(2t)) * sin(3t)',
      zfn: 'sin(4t)',
    },
  },
  {
    name: 'Lissajou knot',
    params: {
      xfn: 'cos(a * u + d)',
      yfn: 'cos(b * u + e)',
      zfn: 'cos(c * u + f)',
      args: {
        a: 3,
        b: 2,
        c: 7,
        d: 1.5,
        e: 0.2,
        f: 0,
      },
      x_resolution: 200,
      transparent: false,
    },
  },
  {
    name: 'Torus knot',
    params: {
      xfn: '(cos(a * u) + 2) * cos(b * u)',
      yfn: '(cos(a * u) + 2) * sin(b * u)',
      zfn: '- sin(a * u)',
      args: {
        a: 7,
        b: 3,
      },
    },
  },
  {
    name: '3-sphere',
    params: {
      xfn: 'a * cos(u)',
      yfn: 'a * sin(u)cos(v)',
      zfn: 'a * sin(u)sin(v)cos(w)',
      wfn: 'a * sin(u)sin(v)sin(w)',
      umax: PI,
      vmax: PI,
      x_resolution: 20,
      y_resolution: 20,
      z_resolution: 20,
      args: {
        a: 2,
      },
    },
  },
  {
    name: 'Spherinder',
    params: {
      xfn: 'a * cos(u)sin(v)',
      yfn: 'a * sin(u)sin(v)',
      zfn: 'a * cos(v)',
      wfn: 'b * w',
      wmax: 1,
      args: {
        a: 2,
        b: 2,
      },
    },
  },
  {
    name: 'Cubinder',
    params: {
      xfn: 'a * cos(u)',
      yfn: 'a * sin(u)',
      zfn: 'b * v',
      wfn: 'c * w',
      vmax: 1,
      wmax: 1,
      args: {
        a: 2,
        b: 2,
        c: 2,
      },
    },
  },
  {
    name: 'Hopf fibrations',
    params: {
      xfn: 'a * sin(u)cos(.5*(v+w))',
      yfn: 'a * sin(u)sin(.5*(v+w))',
      zfn: 'a * cos(u)cos(.5*(v-w))',
      wfn: 'a * cos(u)sin(.5*(v-w))',
      umax: ETA,
      wmax: 2 * TAU,
      args: {
        a: 2,
      },
    },
  },
  {
    name: 'Hopf fibration',
    params: {
      xfn: 'a * sin(u)cos(.5*(v+b))',
      yfn: 'a * sin(u)sin(.5*(v+b))',
      zfn: 'a * cos(u)cos(.5*(v-b))',
      wfn: 'a * cos(u)sin(.5*(v-b))',
      umax: ETA,
      args: {
        a: 2,
      },
    },
  },
])
