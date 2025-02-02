import React, { useCallback, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './tangled/App.jsx'
import './index.css'
import { defaultParams } from './tangled/default.js'
import { filterParams } from './tangled/params.js'
import { arrayEquals } from './utils.js'
import { presets } from './tangled/presets.js'
// import 'https://greggman.github.io/webgl-lint/webgl-lint.js'

const parseParams = () => {
  const { location } = window
  if (location.hash) {
    try {
      const hash = JSON.parse(atob(location.hash.slice(1)))
      return filterParams({ ...defaultParams, ...hash }).params
    } catch (e) {
      console.warn(e)
      location.hash = ''
    }
  }
  const allPresets = presets
    .map(p =>
      p.subforms ? p.subforms.map(s => s.params).concat(p.params) : p.params
    )
    .flat(1)
  return filterParams(allPresets[~~(allPresets.length * Math.random())], null)
    .params
}
const syncParams = (params, replace = false) => {
  const hash = '#' + btoa(JSON.stringify(params))
  window.history[replace ? 'replaceState' : 'pushState'](null, null, hash)
}

const AppWithHistory = () => {
  const [params, setParams] = useState(parseParams())
  const popstate = useCallback(
    e => {
      const newParams = parseParams()
      if (newParams) {
        Object.entries(newParams).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            if (arrayEquals(v, params[k])) {
              newParams[k] = params[k]
            }
          }
        })

        setParams(newParams)
      }
    },
    [params]
  )

  const updateParams = useCallback((newParams, full = false) => {
    setParams(params => {
      // Check if there is one new newParams
      if (
        !Object.entries(newParams).filter(([k, v]) => {
          if (Array.isArray(v)) {
            return !arrayEquals(v, params[k])
          }
          if (typeof v === 'object' && v !== null) {
            return !arrayEquals(Object.entries(v), Object.entries(params[k]))
          }
          return params[k] !== v
        }).length
      ) {
        return params
      }
      const { params: finalParams, badParams } = filterParams(
        full
          ? newParams
          : {
              ...params,
              ...newParams,
            },
        full ? [] : Object.keys(newParams),
        params
      )
      if (!badParams.length) {
        syncParams(
          finalParams,
          Object.keys(newParams).length === 1 && newParams.matrix
        )
      }
      return finalParams
    })
  }, [])

  useEffect(() => {
    window.addEventListener('popstate', popstate)
    return () => {
      window.removeEventListener('popstate', popstate)
    }
  }, [popstate])

  return <App params={params} updateParams={updateParams} />
}
ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <AppWithHistory />
  // </React.StrictMode>
)
