import { defaultParams } from './default'
import { PI } from './math'
import { filterParams } from './params'

const withDefaults = presets =>
  presets.map(({ name, params, subforms }) => ({
    name,
    params: filterParams(
      {
        ...defaultParams,
        xfun: '0',
        yfun: '0',
        zfun: '0',
        wfun: '0',
        ...params,
      },
      null
    ).params,
    subforms: subforms ? withDefaults(subforms) : [],
  }))

export const presets = withDefaults([
  {
    name: 'Donut',
    params: {
      xfun: 'sin(t)',
      yfun: 'cos(t)',
    },
  },
  {
    name: 'Torus',
    params: {
      xfun: '(b + a*cos(s)) * sin(t)',
      yfun: '(b + a*cos(s)) * cos(t)',
      zfun: 'a*sin(s)',
      args: {
        a: 1,
        b: 3,
      },
    },
  },
  {
    name: 'Clifford Torus',
    params: {
      xfun: 'sin(t)',
      yfun: 'cos(t)',
      zfun: 'sin(s)',
      wfun: 'cos(s)',
    },
  },
  {
    name: 'Spring',
    params: {
      xfun: 'sin(a * t + b)',
      yfun: 'cos(a * t + b)',
      zfun: 't - PI',
      args: {
        a: 5,
        b: 0,
      },
    },
  },
  {
    name: '3-sphere curve',
    params: {
      xfun: 'a * cos(b * t)',
      yfun: 'a * sin(b * t)',
      zfun: 'a * cos(c * t)',
      wfun: 'a * sin(c * t)',
      args: {
        a: 1,
        b: 3,
        c: 5,
      },
    },
  },

  {
    name: 'Trefoil Knot',
    params: {
      xfun: 'sin(t) + 2sin(2t)',
      yfun: 'cos(t) - 2cos(2t)',
      zfun: 'sin(3t)',
    },
  },
  {
    name: 'Trefoil Surface Knot',
    params: {
      xfun: 'a / 8 * (cos(t) - 2*cos(2t)) * (2 + cos(s)) * (2 + cos(s + TAU / 3))',
      yfun: 'a * (sin(t) + 2*sin(2t)) / (2 + cos(s + TAU / 3))',
      zfun: 'a * sin(3t) / (2 + cos(s))',
      tmin: -PI,
      tmax: PI,
      smin: -PI,
      smax: PI,
      args: {
        a: 1,
      },
    },
  },
  {
    name: 'Klein Bottle',
    params: {
      xfun: '(cos(t / a) * cos(s) - sin(t/a) * sin(a*s))',
      yfun: '(sin(t / a) * cos(s) + cos(t/a) * sin(a*s))',
      zfun: 'cos(t) * (b + c*sin(s))',
      wfun: 'sin(t) * (b + c*sin(s))',
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
      xfun: '(a + b * cos(s)) * cos(t)',
      yfun: '(a + b * cos(s)) * sin(t)',
      zfun: 'b * sin(s) * cos(t/2)',
      wfun: 'b * sin(s) * sin(t/2)',
      args: {
        a: 2,
        b: 1,
      },
    },
  },
  {
    name: 'Mobius Tube',
    params: {
      xfun: '(a + b * cos(s)) * cos(t)',
      yfun: '(a + b * cos(s)) * sin(t)',
      zfun: 'b * sin(s) * cos(t / 2)',
      wfun: 'b * sin(s) * sin(t / 2)',
      args: {
        a: 1.5,
        b: 0.5,
      },
    },
  },

  {
    name: 'Eight knot',
    params: {
      xfun: '(2 + cos(2t)) * cos(3t)',
      yfun: '(2 + cos(2t)) * sin(3t)',
      zfun: 'sin(4t)',
    },
  },
  {
    name: 'Lissajou knot',
    params: {
      xfun: 'cos(a * t + d)',
      yfun: 'cos(b * t + e)',
      zfun: 'cos(c * t + f)',
      args: {
        a: 3,
        b: 2,
        c: 7,
        d: 1.5,
        e: 0.2,
        f: 0,
      },
    },
  },
  {
    name: 'Torus knot',
    params: {
      xfun: '(cos(a * t) + 2) * cos(b * t)',
      yfun: '(cos(a * t) + 2) * sin(b * t)',
      zfun: '- sin(a * t)',
      args: {
        a: 7,
        b: 3,
      },
    },
  },
  {
    name: '3-sphere',
    params: {
      xfun: 'cos(t)',
      yfun: 'sin(t)cos(s)',
      zfun: 'sin(t)sin(s)cos(r)',
      wfun: 'sin(t)sin(s)sin(r)',
    },
  },
  {
    name: 'Hopf fibrations',
    params: {
      xfun: 'sin(t)cos(s)',
      yfun: 'sin(t)sin(s)',
      zfun: 'cos(t)cos(r)',
      wfun: 'cos(t)sin(r)',
    },
  },
])
