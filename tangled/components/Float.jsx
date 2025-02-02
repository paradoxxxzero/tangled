import { useCallback, useEffect, useState } from 'react'

export default function Float({
  name,
  label,
  min = 0,
  max = Infinity,
  value,
  toggler,
  maxWidth = 5,
  togglerName,
  onChange,
  ...props
}) {
  const [raw, setRaw] = useState(`${value}`)

  useEffect(() => {
    try {
      if (value !== parseFloat(raw)) {
        setRaw(`${value}`)
        setValid(true)
      }
    } catch (e) {
      console.warn(e)
      setValid(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const [valid, setValid] = useState(true)

  const update = useCallback(
    newRaw => {
      setRaw(newRaw)
      if (
        !newRaw ||
        !newRaw.match(/^\s*-?\s*(\d+(\.\d*)?|\.\d+)(e-?\d+)?\s*$/)
      ) {
        setValid(false)
        return
      }
      const parsed = parseFloat(newRaw)
      if (isNaN(parsed) || parsed < min || parsed > max) {
        setValid(false)
      } else {
        setValid(true)
        onChange(name, parsed)
      }
    },
    [max, min, name, onChange]
  )

  const handleChange = event => {
    const raw = event.target.value
    update(raw)
  }

  const handleCheckBoxChange = event => {
    onChange(event.target.name, event.target.checked)
  }

  return (
    <label className={`number ${valid ? 'valid' : 'invalid'}`}>
      {label && <span className="number-label">{label}</span>}
      {togglerName && (
        <input
          type="checkbox"
          name={togglerName}
          checked={toggler}
          onChange={handleCheckBoxChange}
        />
      )}
      {(!togglerName || toggler) && (
        <div className="number-control">
          <input
            type="text"
            name={name}
            value={raw}
            style={{
              width: `${raw.length + 0.3}ch`,
              maxWidth: `${maxWidth}ch`,
            }}
            onChange={handleChange}
            {...props}
          />
        </div>
      )}
    </label>
  )
}
