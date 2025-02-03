import { uniformParams, compileConstants } from './default'
import fragmentSource from './shaders/fragment.glsl?raw'
import includesSource from './shaders/includes.glsl?raw'
import globalsSource from './shaders/globals.glsl?raw'
import renderSource from './shaders/render.glsl?raw'
import vertexSource from './shaders/vertex.glsl?raw'
import oitVertexSource from './shaders/oit/vertex.glsl?raw'
import oitFragmentSource from './shaders/oit/fragment.glsl?raw'
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
export const storage = (rt, rb, type) => {
  const { gl } = rt
  gl.bindRenderbuffer(gl.RENDERBUFFER, rb)

  gl.renderbufferStorage(
    gl.RENDERBUFFER,
    type,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight
  )
  gl.bindRenderbuffer(gl.RENDERBUFFER, null)
}

export const textureFull = (rt, type, scale = null) => {
  const { gl } = rt

  const width = scale
    ? ~~(scale * gl.drawingBufferWidth)
    : gl.drawingBufferWidth
  const height = scale
    ? ~~(scale * gl.drawingBufferHeight)
    : gl.drawingBufferHeight
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    scale ? gl.LINEAR : gl.NEAREST
  )
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    scale ? gl.LINEAR : gl.NEAREST
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texStorage2D(gl.TEXTURE_2D, 1, type, width, height)
  return { texture, width, height }
}

const tex = rt => {
  const { gl } = rt
  if (rt.env.fb.base) {
    gl.deleteFramebuffer(rt.env.fb.base)
    rt.env.fb.base = null
  }
  if (rt.env.fb.oit) {
    gl.deleteFramebuffer(rt.env.fb.oit)
    rt.env.fb.oit = null
  }
  if (rt.env.rb.base) {
    gl.deleteRenderbuffer(rt.env.rb.base)
    rt.env.rb.base = null
  }
  if (rt.env.rb.depth) {
    gl.deleteRenderbuffer(rt.env.rb.depth)
    rt.env.rb.depth = null
  }
  if (rt.env.textures.oitAccum) {
    gl.deleteTexture(rt.env.textures.oitAccum.texture)
    rt.env.textures.oitAccum = null
  }
  if (rt.env.textures.oitReveal) {
    gl.deleteTexture(rt.env.textures.oitReveal.texture)
    rt.env.textures.oitReveal = null
  }
  if (!rt.transparent) {
    return
  }
  gl.activeTexture(gl.TEXTURE0)
  rt.env.fb.base = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, rt.env.fb.base)
  rt.env.rb.base = gl.createRenderbuffer()
  storage(rt, rt.env.rb.base, gl.RGBA8)
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.RENDERBUFFER,
    rt.env.rb.base
  )

  rt.env.rb.depth = gl.createRenderbuffer()
  storage(rt, rt.env.rb.depth, gl.DEPTH_COMPONENT24)
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    rt.env.rb.depth
  )

  rt.env.fb.oit = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, rt.env.fb.oit)
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    rt.env.rb.depth
  )
  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1])

  rt.env.textures.oitAccum = textureFull(rt, gl.RGBA16F)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    rt.env.textures.oitAccum.texture,
    0
  )

  rt.env.textures.oitReveal = textureFull(rt, gl.R16F)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT1,
    gl.TEXTURE_2D,
    rt.env.textures.oitReveal.texture,
    0
  )
}

export const changeProgram = rt => {
  const gl = rt.gl
  if (rt.env) {
    if (rt.env.fb.oit) {
      gl.deleteFramebuffer(rt.env.fb.oit)
      rt.env.fb.oit = null
    }
    if (rt.env.fb.base) {
      gl.deleteFramebuffer(rt.env.fb.base)
    }

    if (rt.env.rb.base) {
      gl.deleteRenderbuffer(rt.env.rb.base)
      rt.env.rb.base = null
    }
    if (rt.env.rb.depth) {
      gl.deleteRenderbuffer(rt.env.rb.depth)
      rt.env.rb.depth = null
    }
    if (rt.env.textures.oitAccum) {
      gl.deleteTexture(rt.env.textures.oitAccum.texture)
      rt.env.textures.oitAccum = null
    }
    if (rt.env.textures.oitReveal) {
      gl.deleteTexture(rt.env.textures.oitReveal.texture)
      rt.env.textures.oitReveal = null
    }
    gl.deleteBuffer(rt.env.uvwBuffer)
    // gl.deleteBuffer(rt.env.vertexBuffer)
    gl.deleteBuffer(rt.env.indexBuffer)
    gl.deleteVertexArray(rt.env.vao)
    gl.deleteShader(rt.env.vertexShader)
    gl.deleteShader(rt.env.fragmentShader)
    gl.deleteProgram(rt.env.oitProgram)
    gl.deleteProgram(rt.env.program)
    delete rt.env
  }

  rt.env = {
    vertexShader: gl.createShader(gl.VERTEX_SHADER),
    fragmentShader: gl.createShader(gl.FRAGMENT_SHADER),
    program: gl.createProgram(),
    oitVertexShader: gl.createShader(gl.VERTEX_SHADER),
    oitFragmentShader: gl.createShader(gl.FRAGMENT_SHADER),
    oitProgram: gl.createProgram(),
    fb: {
      base: null,
      oit: null,
    },
    rb: {
      base: null,
      depth: null,
    },
    textures: {
      oitAccum: null,
      oitReveal: null,
    },
  }
  gl.attachShader(rt.env.oitProgram, rt.env.oitVertexShader)
  gl.attachShader(rt.env.oitProgram, rt.env.oitFragmentShader)
  compileShader(rt, oitVertexSource, rt.env.oitVertexShader)
  compileShader(rt, oitFragmentSource, rt.env.oitFragmentShader)
  gl.linkProgram(rt.env.oitProgram)
  gl.useProgram(rt.env.oitProgram)
  gl.uniform1i(gl.getUniformLocation(rt.env.oitProgram, 'accumTexture'), 0)
  gl.uniform1i(gl.getUniformLocation(rt.env.oitProgram, 'revealageTexture'), 1)

  gl.attachShader(rt.env.program, rt.env.vertexShader)
  gl.attachShader(rt.env.program, rt.env.fragmentShader)
  recompileVertex(rt)
  recompileFragment(rt)
  gl.useProgram(rt.env.program)

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
  tex(rt)
}

export const initializeGl = (rt, onContextLost, onContextRestored) => {
  let canvas = document.getElementById('webgl2')
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.id = 'webgl2'
    document.body.insertBefore(canvas, document.body.firstChild)
  }

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: true,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  })
  gl.getExtension('EXT_color_buffer_float')

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
  if (
    resizeCanvasToDisplaySize(gl.canvas, rt.supersampling, forceSize) ||
    rt.transparent !== !!rt.env.fb.oit
  ) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    tex(rt)
    gl.useProgram(rt.env.program)
    gl.uniform2fv(rt.env.uniforms.aspect, [
      gl.canvas.width / gl.canvas.height,
      1 / Math.max(gl.canvas.width, gl.canvas.height),
    ])
  }

  gl.clearColor(...rt.background)
  gl.clearDepth(1)

  if (rt.transparent) {
    gl.disable(gl.BLEND)
    gl.enable(gl.DEPTH_TEST)
    gl.depthMask(true)
    gl.depthFunc(gl.LESS)
    gl.bindFramebuffer(gl.FRAMEBUFFER, rt.env.fb.base)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.depthMask(false)
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA)
    gl.bindFramebuffer(gl.FRAMEBUFFER, rt.env.fb.oit)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(rt.env.program)
    gl.bindVertexArray(rt.env.vao)
    gl.drawElements(gl.TRIANGLES, rt.env.elements, gl.UNSIGNED_SHORT, 0)
    gl.depthMask(true)
    gl.depthFunc(gl.ALWAYS)
    gl.blendFunc(gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA)

    gl.bindFramebuffer(gl.FRAMEBUFFER, rt.env.fb.base)
    gl.useProgram(rt.env.oitProgram)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, rt.env.textures.oitAccum.texture)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, rt.env.textures.oitReveal.texture)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rt.env.fb.base)
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
    gl.blitFramebuffer(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    )
    gl.useProgram(rt.env.program)
  } else {
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.BLEND)
    gl.depthMask(true)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.drawElements(gl.TRIANGLES, rt.env.elements, gl.UNSIGNED_SHORT, 0)
  }
}

window.render = render
