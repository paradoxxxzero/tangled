import { useCallback, useEffect, useState } from 'react'

export default function Formula({
  name,
  label,
  togglerName,
  toggler,
  value,
  maxWidth = 50,
  onChange,
  ...props
}) {
  const defaultValue = useCallback(() => `${value}`, [value])

  const [raw, setRaw] = useState(defaultValue)

  useEffect(() => {
    setRaw(defaultValue())
    setValid(true)
  }, [defaultValue, value])

  const [valid, setValid] = useState(true)

  const update = useCallback(
    newRaw => {
      setRaw(newRaw)
      try {
        ast(newRaw)
      } catch (e) {
        console.warn('Syntax error in formula', e)
        setValid(false)
        return
      }

      setValid(true)
      onChange(name, newRaw)
    },
    [onChange, name]
  )

  const handleChange = event => {
    const raw = event.target.value
    update(raw)
  }

  const handleCheckBoxChange = event => {
    onChange(event.target.name, event.target.checked)
  }

  return (
    <label className={`formula ${valid ? 'valid' : 'invalid'}`}>
      {label && <span className="formula-label">{label}</span>}
      {togglerName && (
        <input
          type="checkbox"
          name={togglerName}
          checked={toggler}
          onChange={handleCheckBoxChange}
        />
      )}
      {(!togglerName || toggler) && (
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
      )}
    </label>
  )
}
