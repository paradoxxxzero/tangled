import { useEffect, useRef } from 'react'
import { allParams, compileParams, uniformParams } from '../default'
import {
  recompileFragment,
  recompileVertex,
  render,
  updateUniforms,
  changeProgram,
} from '../render'

const params = (runtime, keys) => keys.map(key => runtime[key])
const argValue = args =>
  Object.entries(args)
    .map(([key, arg]) => `${key}|${arg}`)
    .join('#')

export const useRender = (runtime, setRuntime) => {
  useEffect(() => {
    setRuntime(runtime => {
      changeProgram(runtime)
      return runtime
    })
  }, [
    runtime.x_resolution,
    runtime.y_resolution,
    runtime.z_resolution,
    runtime.x_faces,
    runtime.y_faces,
    runtime.z_faces,
    runtime.vars,
    setRuntime,
  ])

  useEffect(() => {
    setRuntime(runtime => {
      recompileVertex(runtime)
      recompileFragment(runtime)
      return runtime
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...params(runtime, compileParams), setRuntime])

  useEffect(() => {
    setRuntime(runtime => {
      updateUniforms(runtime)
      return runtime
    })
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...params(runtime, Object.keys(uniformParams)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    argValue(runtime.args),
    setRuntime,
  ])

  useEffect(() => {
    if (!runtime.gl.canvas) {
      return
    }
    // Resize observer calls render on setup
    const resizeObserver = new ResizeObserver(() => {
      render(runtime)
    })
    resizeObserver.observe(runtime.gl.canvas, { box: 'content-box' })

    return () => resizeObserver.disconnect()
  }, [runtime, runtime.gl.canvas])

  const raf = useRef(null)
  useEffect(() => {
    if (runtime.animate) {
      runtime.timeref = performance.now()
      const loop = () => {
        render(runtime)
        raf.current = requestAnimationFrame(loop)
      }

      loop()
      return () => {
        cancelAnimationFrame(raf.current)
        raf.current = null
      }
    }
  }, [runtime.animate])

  useEffect(
    () => {
      setRuntime(runtime => {
        render(runtime)
        return runtime
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    params(runtime, allParams)
  )
}
