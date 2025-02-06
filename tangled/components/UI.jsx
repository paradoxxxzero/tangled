import { useCallback, useEffect, useState, Fragment } from 'react'

import { controls, palettes } from '../default.js'
import { makeBigPng } from '../export.js'
import {
  contrastIcon,
  eyeIcon,
  noContrastIcon,
  playIcon,
  presetsIcon,
  stopIcon,
} from '../icons'
import { ident, rotate } from '../matrix.js'
import { presets } from '../presets.js'
import { render } from '../render.js'
import Number from './Number.jsx'
import Presets from './Presets'
import Select from './Select.jsx'
import Formula from './Formula.jsx'
import Declaration from './Declaration.jsx'
import { VARS } from '../math.js'
import Boolean from './Boolean.jsx'

const getShowUI = () => {
  try {
    return localStorage.getItem('showUI') || 'simple'
  } catch (e) {
    console.error(e)
    return 'simple'
  }
}

const nextMoves = (move, args) => {
  const last = args.indexOf(move.slice(-1)[0])
  return args.concat(args).slice(last + 1, last + 3)
}
export default function UI({ runtime, params, setRuntime, updateParams }) {
  const [showUI, setShowUI] = useState(getShowUI)
  const [showPresets, setShowPresets] = useState(false)
  const [presetIndex, setPresetIndex] = useState(0)
  const [readable, setReadable] = useState(false)

  const openPresets = useCallback(() => {
    updateParams({
      animate: false,
    })
    setShowPresets(true)
  }, [updateParams])
  const closePresets = useCallback(() => {
    setShowPresets(false)
  }, [])

  const handlePreset = useCallback(
    (preset, index) => {
      updateParams(preset, true)
      setPresetIndex(index)
      closePresets()
    },
    [updateParams, closePresets]
  )

  const handleChange = useCallback(
    (name, value) => {
      updateParams({ [name]: value })
    },
    [updateParams]
  )

  const handleUI = useCallback(
    () =>
      setShowUI(showUI => {
        const newShowUI = {
          simple: 'advanced',
          advanced: 'full',
          full: 'empty',
          empty: 'simple',
        }[showUI]
        try {
          localStorage.setItem('showUI', newShowUI)
        } catch (e) {
          console.error(e)
        }
        return newShowUI
      }),
    []
  )

  const handleReadable = useCallback(() => {
    setReadable(readable => !readable)
  }, [])

  useEffect(() => {
    const keydown = e => {
      if (e.target.tagName === 'INPUT') {
        return
      }
      if (e.key === 'ArrowLeft' && e.ctrlKey && presetIndex > 0) {
        let prevPreset = presetIndex - 1
        while (presets[prevPreset].type) {
          if (prevPreset < 2) {
            return
          }
          prevPreset--
        }
        handlePreset(presets[prevPreset].params, prevPreset)
      } else if (
        e.key === 'ArrowRight' &&
        e.ctrlKey &&
        presetIndex < presets.length - 1
      ) {
        let nextPresets = presetIndex + 1
        while (presets[nextPresets].type) {
          if (nextPresets > presets.length - 2) {
            return
          }
          nextPresets++
        }

        handlePreset(presets[nextPresets].params, nextPresets)
      }
    }
    window.addEventListener('keydown', keydown)
    return () => {
      window.removeEventListener('keydown', keydown)
    }
  }, [handlePreset, presetIndex])

  const exportImage = useCallback(async () => {
    closePresets()
    const res = window.prompt('Select image resolution', '5000x5000')
    if (!res || !res.includes('x')) {
      console.error('Invalid resolution')
      return
    }
    const [width, height] = res.split('x').map(x => parseInt(x))
    if (isNaN(width) || isNaN(height)) {
      console.error('Invalid resolution')
      return
    }

    const url = await makeBigPng(runtime, width, height)
    if (url) {
      const a = document.createElement('a')
      document.body.appendChild(a)
      a.style.display = 'none'
      a.href = url
      a.download = `${document.title}-${width}x${height}`
      a.click()
    }
  }, [closePresets, runtime])

  const args = Object.keys(params.args)

  return (
    <>
      <Presets
        open={showPresets}
        onPreset={handlePreset}
        onExportImage={exportImage}
        closePresets={closePresets}
      />
      <main
        className={
          'ui' +
          (readable ? ' readable ' : '') +
          (runtime.error ? ' error' : '')
        }
        title={runtime.error}
      >
        <div className="ui-row ui-row-top">
          <aside className="controls">
            <div className="subcontrols">
              <button className="button" onClick={handleUI}>
                {eyeIcon}
              </button>
              {['advanced', 'full'].includes(showUI) ? (
                <button className="button" onClick={handleReadable}>
                  {readable ? contrastIcon : noContrastIcon}
                </button>
              ) : null}
              {['simple', 'advanced', 'full'].includes(showUI) ? (
                <button
                  className="button"
                  onClick={() =>
                    updateParams({
                      animate: !params.animate,
                    })
                  }
                >
                  {params.animate ? stopIcon : playIcon}
                </button>
              ) : null}
              {['simple', 'advanced', 'full'].includes(showUI) ? (
                <>
                  <button
                    className="button"
                    onClick={() =>
                      updateParams({
                        control:
                          controls[
                            (controls.indexOf(params.control) + 1) %
                              controls.length
                          ],
                      })
                    }
                  >
                    {params.control}
                  </button>
                  <button
                    className="button"
                    onClick={() => {
                      if (params.control === '3d') {
                        runtime.env.camera.rotation = ident()
                        runtime.env.camera.zoom = 8
                        runtime.env.camera.update()
                        render(runtime)
                        return
                      }
                      updateParams({
                        matrix: ident(),
                        anakata: 10,
                      })
                    }}
                  >
                    🕀
                  </button>
                </>
              ) : null}
            </div>
          </aside>
          {['simple', 'advanced', 'full'].includes(showUI) ? (
            <aside className="formulas">
              <Formula
                label={
                  <Declaration name="x" vars={params.vars} args={params.args} />
                }
                name="xfun"
                value={params.xfun}
                onChange={handleChange}
              />
              <Formula
                label={
                  <Declaration name="y" vars={params.vars} args={params.args} />
                }
                name="yfun"
                value={params.yfun}
                onChange={handleChange}
              />
              <Formula
                label={
                  <Declaration name="z" vars={params.vars} args={params.args} />
                }
                name="zfun"
                value={params.zfun}
                onChange={handleChange}
              />
              <Formula
                label={
                  <Declaration name="w" vars={params.vars} args={params.args} />
                }
                name="wfun"
                value={params.wfun}
                onChange={handleChange}
              />
            </aside>
          ) : null}
        </div>
        <div className="ui-row ui-row-middle">
          {['simple', 'advanced', 'full'].includes(showUI) ? (
            <aside className="view">
              <Select
                label="Palette"
                name="palette"
                value={params.palette}
                options={palettes}
                onChange={handleChange}
              />
              {['full'].includes(showUI) ? (
                <Number
                  name="offset"
                  label="Offset"
                  min={0}
                  step={10}
                  value={params.offset}
                  onChange={handleChange}
                />
              ) : null}
              {['full'].includes(showUI) ? (
                <Number
                  name="velocity"
                  label="Velocity"
                  min={0}
                  step={10}
                  value={params.velocity}
                  onChange={handleChange}
                />
              ) : null}
              {['full'].includes(showUI) ? (
                <Number
                  name="hue"
                  label="Hue"
                  min={0}
                  max={360}
                  step={10}
                  value={params.hue}
                  onChange={handleChange}
                />
              ) : null}
              {['full'].includes(showUI) ? (
                <Number
                  name="saturation"
                  label="Saturation"
                  min={0}
                  step={10}
                  value={params.saturation}
                  onChange={handleChange}
                />
              ) : null}
              {['full'].includes(showUI) ? (
                <Number
                  name="lightness"
                  label="Lightness"
                  min={0}
                  step={10}
                  value={params.lightness}
                  onChange={handleChange}
                />
              ) : null}
              {['full'].includes(showUI) ? (
                <Number
                  name="celShading"
                  label="Cel Shading"
                  min={0}
                  value={params.celShading}
                  onChange={handleChange}
                />
              ) : null}
              {['advanced', 'full'].includes(showUI) && params.animate ? (
                <Number
                  name="speed"
                  label="Speed"
                  min={0}
                  value={params.speed}
                  onChange={handleChange}
                />
              ) : null}
              <Number
                name="supersampling"
                label="Supersampling"
                min={0}
                step={0.1}
                value={params.supersampling}
                onChange={handleChange}
              />
            </aside>
          ) : null}
          {['simple', 'advanced', 'full'].includes(showUI) ? (
            <aside className="params">
              <Number
                name="x_resolution"
                label="X Resolution"
                value={params.x_resolution}
                onChange={handleChange}
              />
              <Number
                name="y_resolution"
                label="Y Resolution"
                value={params.y_resolution}
                onChange={handleChange}
              />
              {params.vars.length > 2 ? (
                <>
                  <Number
                    name="z_resolution"
                    label="Z Resolution"
                    value={params.z_resolution}
                    onChange={handleChange}
                  />
                  <Boolean
                    name="x_faces"
                    label="X Faces"
                    value={params.x_faces}
                    onChange={handleChange}
                  />
                  <Boolean
                    name="y_faces"
                    label="Y Faces"
                    value={params.y_faces}
                    onChange={handleChange}
                  />
                  <Boolean
                    name="z_faces"
                    label="Z Faces"
                    value={params.z_faces}
                    onChange={handleChange}
                  />
                </>
              ) : null}
              <Number
                name="thickness"
                label="Thickness"
                step={10}
                value={params.thickness}
                onChange={handleChange}
              />
              <Number
                name="alpha"
                step={10}
                min={0}
                max={100}
                label="Transparent"
                toggler={params.transparent}
                togglerName="transparent"
                value={params.alpha}
                onChange={handleChange}
              />
              {['advanced', 'full'].includes(showUI) ? (
                <>
                  <Number
                    name="gridScale"
                    label="Grid"
                    toggler={params.grid}
                    togglerName="grid"
                    value={params.gridScale}
                    onChange={handleChange}
                  />
                  {params.grid ? (
                    <>
                      <Number
                        name="gridWidth"
                        label="Grid Width"
                        step={10}
                        value={params.gridWidth}
                        onChange={handleChange}
                      />
                      <Number
                        name="subgridScale"
                        label="SubGrid"
                        toggler={params.subgrid}
                        togglerName="subgrid"
                        value={params.subgridScale}
                        onChange={handleChange}
                      />
                      {params.subgrid ? (
                        <Number
                          name="subgridWidth"
                          label="SubGrid Width"
                          step={10}
                          value={params.subgridWidth}
                          onChange={handleChange}
                        />
                      ) : null}
                      <Boolean
                        name="invertGrid"
                        label="Invert Grid"
                        value={params.invertGrid}
                        onChange={handleChange}
                      />
                    </>
                  ) : null}
                </>
              ) : null}
            </aside>
          ) : null}
        </div>
        <div className="ui-row ui-row-bottom">
          {['simple', 'advanced', 'full'].includes(showUI) ? (
            <button
              className="preset-button button"
              onClick={openPresets}
              title="Presets"
            >
              {presetsIcon}
            </button>
          ) : null}
          {['advanced', 'full'].includes(showUI) && (
            <aside className="bounds">
              {['advanced', 'full'].includes(showUI) && (
                <aside className="bounds">
                  {args.sort().map(arg => (
                    <Number
                      key={arg}
                      name={arg}
                      label={arg}
                      arg
                      step={0.1}
                      min={-Infinity}
                      value={params.args}
                      onChange={handleChange}
                    />
                  ))}
                </aside>
              )}
              {VARS.filter(v => params.vars.includes(v)).map(v => (
                <Fragment key={v}>
                  <Number
                    name={`${v}min`}
                    min={-Infinity}
                    max={params[`${v}max`]}
                    step={0.1}
                    label={`${v} Min`}
                    value={params[`${v}min`]}
                    onChange={handleChange}
                  />
                  <Number
                    name={`${v}max`}
                    min={params[`${v}min`]}
                    max={Infinity}
                    step={0.1}
                    label={`${v} Max`}
                    value={params[`${v}max`]}
                    onChange={handleChange}
                  />
                </Fragment>
              ))}
            </aside>
          )}
          {['simple', 'advanced', 'full'].includes(showUI) ? (
            <button
              className={`space-button button${
                runtime.processing ? ' processing' : ''
              }`}
              onClick={() =>
                params.control === 'arg'
                  ? updateParams({
                      move: nextMoves(params.move, args),
                    })
                  : params.control === '4d'
                    ? updateParams({
                        rotation: (params.rotation + 1) % 3,
                      })
                    : null
              }
            >
              {params.control === 'arg' ? (
                <>
                  𝚫<sub>{params.move}</sub>
                </>
              ) : (
                <>
                  🗘<sub>{params.control === '4d' ? params.rotation : ''}</sub>
                </>
              )}
            </button>
          ) : null}
        </div>
      </main>
    </>
  )
}
