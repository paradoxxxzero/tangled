import { arrayEquals } from '../utils'
import { defaultParams } from './default'
import { VARS } from './math'

export const filterParams = (maybeBadParams, changed = [], oldParams) => {
  const params = {
    ...maybeBadParams,
  }
  const badParams = []
  if (changed === null) {
    changed = Object.keys(params)
  }
  // Remove bad params
  Object.entries(params).forEach(([key, value]) => {
    if (typeof defaultParams[key] === 'number') {
      if (value === '' || isNaN(value)) {
        delete params[key]
        badParams.push(key)
      }
    } else if (Array.isArray(defaultParams[key])) {
      // // arrays of arrays of numbers
      // if (Array.isArray(value[0])) {
      //   if (value.find(c => c.find(d => value === '' || isNaN(d)))) {
      //     delete params[key]
      //     badParams.push(key)
      //   }
      // } else {
      //   // arrays of numbers
      //   if (value.find(c => value === '' || isNaN(c))) {
      //     delete params[key]
      //     badParams.push(key)
      //   }
      // }
    }
  })

  const funs = ['xfun', 'yfun', 'zfun', 'wfun']
  if (funs.some(fun => changed.includes(fun))) {
    const args = [
      ...new Set(
        funs
          .map(fun => vars(ast(params[fun])).filter(a => a.length === 1))
          .flat(1)
      ),
    ].sort()

    const newVars = []
    for (let i = 0; i < VARS.length; i++) {
      const var_ = VARS[i]
      if (args.includes(var_)) {
        newVars.push(var_)
      } else {
        break
      }
    }
    if (!arrayEquals(newVars, params.vars)) {
      params.vars = newVars
    }

    const currentArguments = Object.keys(params.args)
    if (!arrayEquals(args, currentArguments)) {
      params.args = args.reduce((acc, a) => {
        if (!params.vars.includes(a)) {
          acc[a] = params.args[a] || 1
        }
        return acc
      }, {})
    }

    const move = params.move.filter(m => currentArguments.includes(m))
    if (move.length < 2) {
      const remainingArgs = currentArguments.filter(a => !move.includes(a))
      for (let i = 0; i < remainingArgs.length; i++) {
        move.push(remainingArgs[i])
        if (move.length > 1) {
          break
        }
      }
      params.move = move
    }
  }
  return { params, badParams }
}
