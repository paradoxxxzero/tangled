const formatArgs = argsdict => {
  const args = Object.keys(argsdict)
    .filter(arg => arg != 'z')
    .sort()
  if (!args.length) {
    return null
  }
  if (args.length === 1) {
    return args[0]
  }
  return `{${args.join(', ')}}`
}
export default function Declaration({ name, vars, args }) {
  const fargs = formatArgs(args)

  return (
    <>
      {name}
      {fargs ? <sub>{fargs}</sub> : null}({vars.join(', ')}) =
    </>
  )
}
