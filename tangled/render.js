import { uniformParams, compileConstants } from './default'
import fragmentSource from './shaders/fragment.glsl?raw'
import includesSource from './shaders/includes.glsl?raw'
import globalsSource from './shaders/globals.glsl?raw'
import renderSource from './shaders/render.glsl?raw'
import vertexSource from './shaders/vertex.glsl?raw'
import { cage, grid, tube } from './geometry'
import {
  columnMajor,
  frustum,
  ident,
  inverse,
  multiply,
  multiplyVector,
  rotate,
  translate,
} from './matrix'
import { ast } from './formula'
import { cbrt, sqrt, VARS } from './math'

export const includes = {
  includes: includesSource,
  globals: globalsSource,
  render: renderSource,
}

export const camelCaseToSnakeCase = str =>
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toUpperCase()

export const constants = rt =>
  Object.entries(compileConstants)
    .map(([key, value]) =>
      (res =>
        res !== false
          ? `#define ${camelCaseToSnakeCase(key)}${res === true ? '' : ` ${res}`}`
          : '')(typeof value === 'function' ? value(rt) : rt[key])
    )
    .filter(s => s)
    .join('\n')

export const preprocess = (rt, source) => {
  Object.entries(includes).forEach(([key, value]) => {
    source = source.replace(`#include ${key}`, value)
  })
  source = source.replace('##CONFIG', constants(rt))
  source = source.replace(
    'uniform float args;',
    Object.keys(rt.args)
      .map(arg => `uniform float arg_${arg};`)
      .join('\n')
  )

  const decl = rt.vars.map(d => `float ${d}`).join(', ')

  const x = ast(rt.xfun)
  const y = ast(rt.yfun)
  const z = ast(rt.zfun)
  const w = ast(rt.wfun)
  // const xp = x.toDerivative([], vars).simplify()
  // const yp = y.toDerivative([], vars).simplify()
  // const zp = z.toDerivative([], vars).simplify()
  // const xpp = xp.toDerivative([], vars).simplify()
  // const ypp = yp.toDerivative([], vars).simplify()
  // const zpp = zp.toDerivative([], vars).simplify()

  source = source.replace(
    '##FUNS',
    Object.entries({
      x,
      y,
      z,
      w,
      // xp,
      // yp,
      // zp,
      // xpp,
      // ypp,
      // zpp,
    })
      .map(
        ([k, v]) => `float ${k}(${decl}) {
  #init_args
  return ${v.toShader()};
}`
      )
      .join('\n\n\n')
  )

  source = source.replaceAll(
    '#init_args',
    Object.keys(rt.args)
      .map(arg => `float ${arg} = arg_${arg};`)
      .join('\n')
  )

  if (window.location.search.includes('debug')) {
    console.info(
      source
        .split('\n')
        .map((s, i) => `${i + 1}: ${s}`)
        .join('\n')
    )
  }
  return source
}

export const compileShader = (rt, shaderSource, shader) => {
  const { gl } = rt
  gl.shaderSource(shader, shaderSource)
  gl.compileShader(shader)
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (!success) {
    const error = gl.getShaderInfoLog(shader)
    let relevantSource = shaderSource
    const match = error.match(/ERROR: \d+:(\d+):/)?.[1]
    if (match) {
      const errlno = parseInt(match)
      const ctx = 5
      const lines = shaderSource.split('\n')
      const start = Math.max(0, errlno - ctx)
      const end = Math.min(lines.length, errlno + ctx)
      relevantSource = lines
        .slice(start, end)
        .map((s, i) => (i === ctx - 1 ? '=>' : '  ') + s)
        .join('\n')
    }
    console.error(
      `An error occurred compiling shader: ${error}`,
      relevantSource
    )
    return error
  }
}

export const linkProgram = rt => {
  const { gl } = rt
  gl.linkProgram(rt.env.program)

  const success = gl.getProgramParameter(rt.env.program, gl.LINK_STATUS)
  if (!success) {
    const error = gl.getProgramInfoLog(rt.env.program)
    console.error(`Unable to initialize the shader program: ${error}`)
    return error
  }
}

export const recompileVertex = rt => {
  compileShader(rt, preprocess(rt, vertexSource), rt.env.vertexShader)
}

export const recompileFragment = rt => {
  const { gl } = rt
  compileShader(rt, preprocess(rt, fragmentSource), rt.env.fragmentShader)
  linkProgram(rt)
  gl.useProgram(rt.env.program) // NEEDED?

  rt.env.uniforms = Object.keys(uniformParams)
    .concat(Object.keys(rt.args).map(arg => `arg_${arg}`))
    .reduce((acc, name) => {
      acc[name] = gl.getUniformLocation(rt.env.program, name)
      return acc
    }, {})

  rt.env.uniforms.viewProjection = gl.getUniformLocation(
    rt.env.program,
    'viewProjection'
  )
  rt.env.uniforms.eye = gl.getUniformLocation(rt.env.program, 'eye')
  updateUniforms(rt)
}

export const changeProgram = rt => {
  const gl = rt.gl
  if (rt.env) {
    gl.deleteBuffer(rt.env.uvwBuffer)
    // gl.deleteBuffer(rt.env.vertexBuffer)
    gl.deleteBuffer(rt.env.indexBuffer)
    gl.deleteVertexArray(rt.env.vao)
    gl.deleteShader(rt.env.vertexShader)
    gl.deleteShader(rt.env.fragmentShader)
    gl.deleteProgram(rt.env.program)
    delete rt.env
  }

  rt.env = {
    vertexShader: gl.createShader(gl.VERTEX_SHADER),
    fragmentShader: gl.createShader(gl.FRAGMENT_SHADER),
    program: gl.createProgram(),
  }

  gl.attachShader(rt.env.program, rt.env.vertexShader)
  gl.attachShader(rt.env.program, rt.env.fragmentShader)

  recompileVertex(rt)
  recompileFragment(rt)

  rt.env.camera = {
    zoom: 8,
    fov: Math.PI / 3,
    eye: [0, 0, 0],
    rotation: ident(),
    near: 0.01,
    far: 100,
    update(offset) {
      const position = translate(0, 0, this.zoom)
      const eye = [0, 0, this.zoom, 0]
      this.eye = multiplyVector(this.rotation, eye).slice(0, 3)
      const viewMatrix = inverse(multiply(this.rotation, position))

      this.aspect = offset
        ? offset.fullWidth / offset.fullHeight
        : gl.canvas.clientWidth / gl.canvas.clientHeight

      const zoom = Math.min(this.aspect, 1)

      const bounds = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        near: this.near,
        far: this.far,
      }

      bounds.top = (this.near * Math.tan(this.fov / 2)) / zoom
      let height = 2 * bounds.top
      let width = this.aspect * height
      bounds.left = -0.5 * width

      if (offset) {
        bounds.left += (offset.x * width) / offset.fullWidth
        bounds.top -= (offset.y * height) / offset.fullHeight
        width *= offset.width / offset.fullWidth
        height *= offset.height / offset.fullHeight
      }

      bounds.bottom = bounds.top - height
      bounds.right = bounds.left + width

      const projectionMatrix = frustum(bounds)
      const viewProjection = multiply(projectionMatrix, viewMatrix)
      this.viewProjection = columnMajor(viewProjection)
      // this.viewProjectionInverse = columnMajor(inverse(viewProjection))
      gl.uniformMatrix4fv(
        rt.env.uniforms.viewProjection,
        false,
        this.viewProjection
      )
      gl.uniform3fv(rt.env.uniforms.eye, this.eye)
    },
    center() {
      this.eye = [0, 0, 0]
      this.rotation = ident()
      this.update()
    },
  }
  rt.env.camera.update()
  const geometry =
    rt.vars.length === 1
      ? tube({ radialSegments: 128, segments: ~~((32 * rt.detail) / 128) })
      : rt.vars.length === 2
        ? grid({ resolution: ~~sqrt(rt.detail) })
        : cage({ resolution: ~~cbrt(rt.detail) })

  rt.env.elements = geometry.indices.length
  rt.env.vao = gl.createVertexArray()
  gl.bindVertexArray(rt.env.vao)
  rt.env.indiceBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rt.env.indiceBuffer)
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(geometry.indices),
    gl.STATIC_DRAW
  )
  // rt.env.vertexBuffer = gl.createBuffer()
  // gl.bindBuffer(gl.ARRAY_BUFFER, rt.env.vertexBuffer)
  // rt.env.vertexLocation = gl.getAttribLocation(rt.env.program, 'vertex')
  // gl.enableVertexAttribArray(rt.env.vertexLocation)
  // gl.vertexAttribPointer(rt.env.vertexLocation, 3, gl.FLOAT, false, 0, 0)
  // gl.bufferData(
  //   gl.ARRAY_BUFFER,
  //   new Float32Array(geometry.vertices),
  //   gl.STATIC_DRAW
  // )
  rt.env.uvwBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, rt.env.uvwBuffer)
  rt.env.uvwLocation = gl.getAttribLocation(rt.env.program, 'uvw')
  gl.enableVertexAttribArray(rt.env.uvwLocation)
  gl.vertexAttribPointer(rt.env.uvwLocation, 3, gl.FLOAT, false, 0, 0)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(geometry.uvws),
    gl.STATIC_DRAW
  )
}

export const initializeGl = (rt, onContextLost, onContextRestored) => {
  let canvas = document.getElementById('webgl2')
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.id = 'webgl2'
    document.body.insertBefore(canvas, document.body.firstChild)
  }

  const gl = canvas.getContext('webgl2', {
    powerPreference: 'high-performance',
  })

  canvas.addEventListener('webglcontextlost', onContextLost, false)
  canvas.addEventListener('webglcontextrestored', onContextRestored, false)

  rt = { ...rt, gl }

  if (!gl) {
    console.error(
      'Unable to initialize WebGL. Your browser may not support it.'
    )
    return
  }
  changeProgram(rt)

  return {
    ...rt,
    gl,
  }
}

export const updateUniforms = rt => {
  const { uniforms } = rt.env

  Object.entries(uniformParams)
    .concat(
      Object.entries(rt.args).map(([arg, value]) => [
        `arg_${arg}`,
        { type: '1f', value: () => value },
      ])
    )
    .forEach(([name, params]) => {
      if (typeof params === 'string') {
        params = { type: params, value: v => v }
      }
      const { type, value } = params
      const uniform = uniforms[name]
      if (!uniform) {
        return
      }
      const v = value(rt[name], rt)
      if (type.startsWith('m')) {
        rt.gl['uniformMatrix' + type.slice(1)](uniform, false, v)
      } else {
        rt.gl['uniform' + type](uniform, v)
      }
    })
  rt.env.camera?.update()
}

export const resizeCanvasToDisplaySize = (canvas, sampling, forceSize) => {
  let rw = canvas.clientWidth
  let rh = canvas.clientHeight
  let cw = forceSize ? forceSize.width : rw * sampling
  let ch = forceSize ? forceSize.height : rh * sampling

  if (cw !== canvas.width || ch !== canvas.height) {
    cw = Math.floor(cw)
    ch = Math.floor(ch)

    canvas.width = cw
    canvas.height = ch
    return true
  }
  return !!forceSize
}

export const render = (rt, forceSize) => {
  if (!rt.gl) {
    // Context lost
    return
  }
  const { gl } = rt
  gl.uniform1f(
    rt.env.uniforms.time,
    rt.animate ? performance.now() - rt.timeref : 0
  )
  if (resizeCanvasToDisplaySize(gl.canvas, rt.supersampling, forceSize)) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.uniform2fv(rt.env.uniforms.aspect, [
      gl.canvas.width / gl.canvas.height,
      1 / Math.max(gl.canvas.width, gl.canvas.height),
    ])
  }

  gl.clearColor(0.1, 0.1, 0.1, 0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  if (rt.transparent) {
    // gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.depthMask(false)
    gl.depthFunc(gl.ALWAYS)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  } else {
    // gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
    gl.depthMask(true)
    gl.depthFunc(gl.LEQUAL)
  }
  gl.drawElements(gl.TRIANGLES, rt.env.elements, gl.UNSIGNED_SHORT, 0)
}

window.render = render
