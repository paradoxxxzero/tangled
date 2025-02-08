import { memo, useEffect, useRef } from 'react'
import {
  recompileFragment,
  recompileVertex,
  preprocess,
  render,
  changeProgram,
} from '../render'
import { defaultParams } from '../default'

const previewSize = {
  width: 300,
  height: 150,
}

const offScreenCanvas = document.createElement('canvas')
offScreenCanvas.width = previewSize.width
offScreenCanvas.height = previewSize.height

const previewer = {
  locked: false,
  gl: null,
  env: null,
  queue: [],
  init() {
    this.gl = offScreenCanvas.getContext('webgl2')
  },
  render(params) {
    if (!this.gl) {
      this.init()
    }
    const rt = {
      gl: this.gl,
      ...defaultParams,
      ...params,
      transparent: false,
      opacity: 100,
      grid: false,
      background: [0, 0, 0, 1],
    }
    changeProgram(rt)
    rt.env.camera.update({
      x: 0,
      y: 0,
      fullWidth: previewSize.width,
      fullHeight: previewSize.height,
      width: previewSize.width,
      height: previewSize.height,
    })
    render(rt, previewSize)
    const pixels = new Uint8Array(previewSize.width * previewSize.height * 4)
    this.gl.readPixels(
      0,
      0,
      previewSize.width,
      previewSize.height,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      pixels
    )

    if (rt.env) {
      this.gl.deleteBuffer(rt.env.uvwBuffer)
      // this.gl.deleteBuffer(rt.env.vertexBuffer)
      this.gl.deleteBuffer(rt.env.indexBuffer)
      this.gl.deleteVertexArray(rt.env.vao)
      this.gl.deleteShader(rt.env.vertexShader)
      this.gl.deleteShader(rt.env.fragmentShader)
      this.gl.deleteProgram(rt.env.program)
      // delete rt.env
    }
    return pixels
  },
}

export default memo(function Preview({ params }) {
  const canvas = useRef()

  useEffect(() => {
    setTimeout(() => {
      if (!canvas.current) {
        return
      }
      const pixels = previewer.render(params)
      canvas.current.width = previewSize.width
      canvas.current.height = previewSize.height
      const ctx = canvas.current.getContext('2d')
      const imageData = new ImageData(
        new Uint8ClampedArray(pixels),
        previewSize.width,
        previewSize.height
      )
      ctx.putImageData(imageData, 0, 0)
    }, 0)
  }, [params])

  return <canvas ref={canvas} className="preview" style={previewSize} />
})
