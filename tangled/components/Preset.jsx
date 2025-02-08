import { memo, useEffect, useState } from 'react'
import Preview from './Preview'

const getNodeText = node => {
  if (['string', 'number'].includes(typeof node)) {
    return node
  }
  if (node instanceof Array) {
    return node.map(getNodeText).join('')
  }
  if (typeof node === 'object' && node) {
    return getNodeText(node.props.children)
  }
}
const match = (name, search) => {
  if (search === '*') {
    return true
  }
  if (typeof name === 'string') {
    return getNodeText(name).toLowerCase().includes(search.toLowerCase())
  }
  return false
}
export default memo(function Preset({
  name,
  index,
  params,
  search,
  subforms = [],
  sub = false,
  shown,
  onPreset,
}) {
  const [subshown, setSubshown] = useState(false)
  const [visible, setVisible] = useState(true)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (open) {
      setSubshown(true)
    }
  }, [open])

  useEffect(() => {
    if (!search) {
      setVisible(true)
      setOpen(false)
      return
    }
    if (subforms.length && subforms.some(({ name }) => match(name, search))) {
      setVisible(true)
      setOpen(true)
      return
    }
    if (match(name, search)) {
      setVisible(true)
      return
    }
    setVisible(false)
    setOpen(false)
  }, [name, search, subforms])

  return (
    <div style={{ display: visible ? 'block' : 'none' }}>
      <div
        className={`preset${sub ? ' sub' : ''}`}
        onClick={() => onPreset(params, index)}
      >
        <div
          className={`preset-header preset-name-${
            subforms.length ? 'button' : 'only'
          }`}
        >
          {subforms.length ? (
            <button
              className={`preset-toggle ${open ? 'open' : 'closed'}`}
              onClick={e => {
                e.stopPropagation()
                setOpen(!open)
              }}
            >
              {open ? '-' : '+'}
            </button>
          ) : null}
          <div className="preset-content-preview">
            <div className="preset-content">
              <span className="preset-name">{name}</span>
              <code className="preset-formula">
                {!['', '0'].includes(params.xfn) ? (
                  <>
                    <span className="preset-assignment">x(t) = </span>{' '}
                    {params.xfn}
                    <br />
                  </>
                ) : null}
                {!['', '0'].includes(params.yfn) ? (
                  <>
                    <span className="preset-assignment">y(t) = </span>{' '}
                    {params.yfn}
                    <br />
                  </>
                ) : null}
                {!['', '0'].includes(params.zfn) ? (
                  <>
                    <span className="preset-assignment">z(t) = </span>{' '}
                    {params.zfn}
                    <br />
                  </>
                ) : null}
                {!['', '0'].includes(params.wfn) ? (
                  <>
                    <span className="preset-assignment">w(t) = </span>{' '}
                    {params.wfn}
                    <br />
                  </>
                ) : null}
              </code>
            </div>
            {shown ? <Preview params={params} /> : null}
          </div>
        </div>
      </div>
      <div className="subforms" style={{ display: open ? 'block' : 'none' }}>
        {subforms.map((subform, i) => (
          <Preset
            key={i}
            {...subform}
            sub
            search={search}
            shown={shown && subshown}
            onPreset={onPreset}
          />
        ))}
      </div>
    </div>
  )
})
