import { float, VARS } from './math'

const tokens = {
  whitespace: /^\s+/,
  float: /^([0-9]+([.][0-9]*)?|[.][0-9]+)/,
  integer: /^[0-9]+/,
  operator: /^(\*\*|[+\-*/%]|\^{1,2}|\|-\|)/,
  unaryPrefix: /^~/,
  unarySuffix: /^#/,
  identifier: /^[a-zA-Z_][a-zA-Z0-9_]*'*/,
  pipe: /^\|/,
  lparen: /^\(/,
  rparen: /^\)/,
  comma: /^,/,
}
const precedence = {
  '+': 1,
  '-': 2,
  '*': 3,
  '/': 4,
  '%': 5,
  '~': 5,
  '^': 6,
  '^^': 6,
}

class Token {
  constructor(type, value, start, end) {
    this.type = type
    this.value = value
    this.start = start
    this.end = end
  }

  toString() {
    return `<${this.type}: ${this.value} at ${this.start}-${this.end}>`
  }
}

export const consts = [
  'PI',
  'TAU',
  'ETA',
  'PHI',
  'GAMMA',
  'E',
  'SQRT2',
  'SQRT3',
  'LN10',
  'LN2',
  'LEMNISCATE',
  'GAUSS',
]

const shaderBinary = {
  // '+': 'add',
  // '-': 'sub',
  // '*': 'mul',
  // '/': 'div',
  '%': 'mod',
  '^': 'pow',
}

export const functionShader = {
  sqrt: 'sqrt',
  cos: 'cos',
  sin: 'sin',
  tan: 'tan',
  acos: 'acos',
  asin: 'asin',
  atan: 'atan',
  cosh: 'cosh',
  sinh: 'sinh',
  tanh: 'tanh',
  acosh: 'acosh',
  asinh: 'asinh',
  atanh: 'atanh',
  log: 'log',
  exp: 'exp',
  abs: 'abs',
  mod: 'mod',
}
const opFunctions = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '%': (a, b) => a % b,
  '^': (a, b) => a ** b,
}

const shaderUnary = {
  '-': '-',
  abs: 'abs',
  sign: 'sign',
}

class BinaryOp {
  constructor(type, left, right) {
    this.type = type
    this.left = left
    this.right = right
  }
  is(other) {
    return (
      this.type === other.type &&
      this.left.is(other.left) &&
      this.right.is(other.right)
    )
  }
  clone(replace = null, value = null) {
    let left = this.left
    let right = this.right

    if (replace) {
      if (left.is(replace)) {
        left = value
      }
      if (right.is(replace)) {
        right = value
      }
    }
    return new BinaryOp(
      this.type,
      left.clone(replace, value),
      right.clone(replace, value)
    )
  }
  toTree() {
    return `<${this.type}: ${this.left.toTree()} ${this.right.toTree()}>`
  }

  toString() {
    let left = this.left.toString()
    let right = this.right.toString()
    if (
      (this.left instanceof BinaryOp &&
        precedence[this.left.type] < precedence[this.type]) ||
      (precedence[this.left.type] === precedence[this.type] &&
        ['-', '/', '^', '^^'].includes(this.type))
    ) {
      left = `(${left})`
    }
    if (
      (this.right instanceof BinaryOp &&
        precedence[this.right.type] < precedence[this.type]) ||
      (precedence[this.right.type] === precedence[this.type] &&
        ['-', '/', '^', '^^'].includes(this.type))
    ) {
      right = `(${right})`
    }
    if (['^', '^^'].includes(this.type)) {
      return `${left}${this.type}${right}`
    }
    return `${left} ${this.type} ${right}`
  }

  toShader() {
    // if (
    //   this.type === '^' &&
    //   (this.right.type === 'number' ||
    //     (this.right instanceof UnaryOp && this.right.operand.type === 'number'))
    // ) {
    //   let k = 0
    //   if (this.right instanceof UnaryOp) {
    //     k = this.right.operand.value * (this.right.type === '-' ? -1 : 1)
    //   } else {
    //     k = this.right.value
    //   }
    //   if (k % 1 === 0) {
    //     if (k === 1) {
    //       return this.left.toShader()
    //     }
    //     if (k > 0 && k < 10) {
    //       return `pow${k}(${this.left.toShader()})`
    //     } else {
    //       return `pow(${this.left.toShader()}, ${k})`
    //     }
    //   } else {
    //     return `pow(${this.left.toShader()}, ${k})`
    //   }
    // }
    if (shaderBinary[this.type]) {
      return `${shaderBinary[this.type]}(${this.left.toShader()}, ${this.right.toShader()})`
    }
    return `(${this.left.toShader()} ${this.type} ${this.right.toShader()})`
  }
  toDerivative(wrt_funs, wrt_vars) {
    const wrt = [...wrt_funs, ...wrt_vars]
    if (['+', '-'].includes(this.type)) {
      return new BinaryOp(
        this.type,
        this.left.toDerivative(wrt_funs, wrt_vars),
        this.right.toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.type === '*') {
      return new BinaryOp(
        '+',
        new BinaryOp(
          '*',
          this.left.toDerivative(wrt_funs, wrt_vars),
          this.right
        ),
        new BinaryOp(
          '*',
          this.left,
          this.right.toDerivative(wrt_funs, wrt_vars)
        )
      )
    }
    if (this.type === '/') {
      return new BinaryOp(
        '/',
        new BinaryOp(
          '-',
          new BinaryOp(
            '*',
            this.left.toDerivative(wrt_funs, wrt_vars),
            this.right
          ),
          new BinaryOp(
            '*',
            this.left,
            this.right.toDerivative(wrt_funs, wrt_vars)
          )
        ),
        new BinaryOp('^', this.right, new Leaf('number', 2))
      )
    }
    if (this.type === '^') {
      return new BinaryOp(
        '*',
        new BinaryOp(
          '^',
          this.left,
          new BinaryOp('-', this.right, new Leaf('number', 1))
        ),
        new BinaryOp(
          '+',
          new BinaryOp(
            '*',
            this.right,
            this.left.toDerivative(wrt_funs, wrt_vars)
          ),
          new BinaryOp(
            '*',
            new BinaryOp('*', this.left, new FunctionOp('log', [this.left])),
            this.right.toDerivative(wrt_funs, wrt_vars)
          )
        )
      )
    }

    return new BinaryOp(
      this.type,
      this.left.toDerivative(wrt_funs, wrt_vars),
      this.right.toDerivative(wrt_funs, wrt_vars)
    )
  }
  simplify() {
    const left = this.left.simplify()
    const right = this.right.simplify()
    if (this.type === '+') {
      if (left.type === 'number' && left.value === 0) {
        return right
      }
      if (right.type === 'number' && right.value === 0) {
        return left
      }
    }
    if (this.type === '-') {
      if (left.type === 'number' && left.value === 0) {
        return new UnaryOp('-', right).simplify()
      }
      if (right.type === 'number' && right.value === 0) {
        return left
      }
    }

    if (this.type === '*') {
      if (
        (left.type === 'number' && left.value === 0) ||
        (right.type === 'number' && right.value === 0)
      ) {
        return new Leaf('number', 0)
      }
      if (left.type === 'number' && left.value === 1) {
        return right
      }
      if (right.type === 'number' && right.value === 1) {
        return left
      }
    }
    if (this.type === '/') {
      if (left.type === 'number' && left.value === 0) {
        return new Leaf('number', 0)
      }
      if (right.type === 'number' && right.value === 1) {
        return left
      }
    }
    if (
      this.type === '^' &&
      (right.type === 'number' ||
        (right instanceof UnaryOp && right.operand.type === 'number'))
    ) {
      let k = 0
      if (right instanceof UnaryOp) {
        k = right.operand.value * (right.type === '-' ? -1 : 1)
      } else {
        k = right.value
      }
      if (k === 0) {
        return new Leaf('number', 1)
      }
      if (k === 1) {
        return left
      }
      if (left.type === '^' && left.right.type === 'number') {
        return new BinaryOp(
          '^',
          left.left,
          new Leaf('number', left.right.value * k)
        ).simplify()
      }
    }

    if (right.type === 'number' && left.type === 'number') {
      const op = this.type === '**' ? '^' : this.type
      const result = opFunctions[op](left.value, right.value)
      if (result % 1 === 0) {
        return new Leaf('number', opFunctions[op](left.value, right.value))
      }
      return this
    }
    return new BinaryOp(this.type, left, right)
  }
}

class UnaryOp {
  constructor(type, operand) {
    this.type = type
    this.operand = operand
  }

  is(other) {
    return this.type === other.type && this.operand.is(other.operand)
  }
  clone(replace = null, value = null) {
    let op = this.operand

    if (replace) {
      if (op.is(replace)) {
        op = value
      }
    }
    return new UnaryOp(this.type, op.clone(replace, value))
  }

  toTree() {
    return `<${this.type}: ${this.operand.toTree()}>`
  }
  toString() {
    let op = this.operand.toString()
    if (
      (this.operand instanceof BinaryOp &&
        precedence[this.operand.type] < precedence[this.type]) ||
      (precedence[this.operand.type] === precedence[this.type] &&
        ['-', '/', '^'].includes(this.type))
    ) {
      op = `(${op})`
    }
    return `${this.type}${op}`
  }
  toShader() {
    if (this.type === '+') {
      return this.operand.toShader()
    }
    return `${shaderUnary[this.type]}(${this.operand.toShader()})`
  }
  toDerivative(wrt_funs, wrt_vars) {
    return new UnaryOp(this.type, this.operand.toDerivative(wrt_funs, wrt_vars))
  }
  simplify() {
    const operand = this.operand.simplify()
    if (this.type === '+') {
      return operand
    }
    if (this.type === "'") {
      return operand.toDerivative([], VARS).simplify()
    }
    if (this.type === '#') {
      return new BinaryOp(
        '/',
        operand,
        operand.toDerivative([], VARS)
      ).simplify()
    }
    if (this.type === '-' && operand.type === 'number') {
      return new Leaf('number', -operand.value)
    }
    if (
      operand instanceof UnaryOp &&
      ['-', '~'].includes(this.type) &&
      operand.type === this.type
    ) {
      return operand.operand
    }

    return new UnaryOp(this.type, operand)
  }
}

class FunctionOp {
  constructor(name, args) {
    this.name = name
    this.args = args
    this.type = 'function'
  }
  is(other) {
    return (
      this.type === other.type &&
      this.name === other.name &&
      this.args.every((a, i) => a.is(other.args[i]))
    )
  }
  clone(replace = null, value = null) {
    return new FunctionOp(
      this.name,
      this.args.map(a => a.clone(replace, value))
    )
  }
  toTree() {
    return `<${this.name}(): ${this.args.map(a => a.toTree()).join(', ')}>`
  }
  toString() {
    return `${this.name}(${this.args.map(a => a.toString()).join(', ')})`
  }
  toShader() {
    if (
      ['sum', 'product'].includes(this.name) &&
      this.args.length === 4 &&
      this.args[0].type === 'identifier' &&
      this.args[1].type === 'number' &&
      this.args[2].type === 'number'
    ) {
      const [identifier, start, end, expr] = this.args
      let node = new Leaf('number', this.name === 'sum' ? 0 : 1)
      for (let i = start.value; i <= end.value; i++) {
        node = new BinaryOp(
          this.name === 'sum' ? '+' : '*',
          node,
          expr.clone(identifier, new Leaf('number', i))
        )
      }
      return node.simplify().toShader()
    }
    if (this.args.length === 0) {
      return `${functionShader[this.name] || this.name}()`
    }
    return `${functionShader[this.name] || this.name}(${this.args.map(a => a.toShader()).join(', ')})`
  }
  toDerivative(wrt_funs, wrt_vars) {
    if (this.name === 'log') {
      return new BinaryOp(
        '/',
        this.args[0].toDerivative(wrt_funs, wrt_vars),
        this.args[0]
      )
    }
    if (this.name === 'exp') {
      return new BinaryOp(
        '*',
        this,
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.name === 'abs') {
      return new BinaryOp(
        '*',
        new FunctionOp('sign', this.args),
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.name === 'sqrt') {
      return new BinaryOp(
        '/',
        this.args[0].toDerivative(wrt_funs, wrt_vars),
        new BinaryOp('*', new Leaf('number', 2), this)
      )
    }
    if (this.name === 'sin') {
      return new BinaryOp(
        '*',
        new FunctionOp('cos', this.args),
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.name === 'cos') {
      return new BinaryOp(
        '*',
        new UnaryOp('-', new FunctionOp('sin', this.args)),
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.name === 'tan') {
      return new BinaryOp(
        '/',
        this.args[0].toDerivative(wrt_funs, wrt_vars),
        new BinaryOp(
          '^',
          new FunctionOp('cos', this.args),
          new Leaf('number', 2)
        )
      )
    }
    if (this.name === 'asin') {
      return new BinaryOp(
        '/',
        this.args[0].toDerivative(wrt_funs, wrt_vars),
        new BinaryOp(
          '^',
          new BinaryOp(
            '-',
            new Leaf('number', 1),
            new BinaryOp('^', this.args[0], new Leaf('number', 2))
          ),
          new Leaf('number', 0.5)
        )
      )
    }
    if (this.name === 'acos') {
      return new BinaryOp(
        '/',
        new UnaryOp('-', this.args[0].toDerivative(wrt_funs, wrt_vars)),
        new BinaryOp(
          '^',
          new BinaryOp(
            '-',
            new Leaf('number', 1),
            new BinaryOp('^', this.args[0], new Leaf('number', 2))
          ),
          new Leaf('number', 0.5)
        )
      )
    }
    if (this.name === 'atan') {
      return new BinaryOp(
        '/',
        this.args[0].toDerivative(wrt_funs, wrt_vars),
        new BinaryOp(
          '+',
          new Leaf('number', 1),
          new BinaryOp('^', this.args[0], new Leaf('number', 2))
        )
      )
    }
    if (this.name === 'sinh') {
      return new BinaryOp(
        '*',
        new FunctionOp('cosh', this.args),
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.name === 'cosh') {
      return new BinaryOp(
        '*',
        new FunctionOp('sinh', this.args),
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.name === 'tanh') {
      return new BinaryOp(
        '/',
        this.args[0].toDerivative(wrt_funs, wrt_vars),
        new BinaryOp(
          '^',
          new FunctionOp('cosh', this.args),
          new Leaf('number', 2)
        )
      )
    }
    if (this.name === 'asinh') {
      return new BinaryOp(
        '/',
        this.args[0].toDerivative(wrt_funs, wrt_vars),
        new BinaryOp(
          '^',
          new BinaryOp(
            '+',
            new BinaryOp('^', this.args[0], new Leaf('number', 2)),
            new Leaf('number', 1)
          ),
          new Leaf('number', 0.5)
        )
      )
    }
    if (this.name === 'acosh') {
      return new BinaryOp(
        '/',
        this.args[0].toDerivative(wrt_funs, wrt_vars),
        new BinaryOp(
          '^',
          new BinaryOp(
            '-',
            new BinaryOp('^', this.args[0], new Leaf('number', 2)),
            new Leaf('number', 1)
          ),
          new Leaf('number', 0.5)
        )
      )
    }
    if (this.name === 'atanh') {
      return new BinaryOp(
        '/',
        this.args[0].toDerivative(wrt_funs, wrt_vars),
        new BinaryOp(
          '-',
          new Leaf('number', 1),
          new BinaryOp('^', this.args[0], new Leaf('number', 2))
        )
      )
    }
    if (this.name === 'log2') {
      return new BinaryOp(
        '/',
        new FunctionOp('log', [new Leaf('number', 2)]),
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.name === 'log10') {
      return new BinaryOp(
        '/',
        new FunctionOp('log', [new Leaf('number', 10)]),
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.name === 'sn') {
      return new BinaryOp(
        '*',
        new BinaryOp(
          '*',
          new FunctionOp('cn', this.args),
          new FunctionOp('dn', this.args)
        ),
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.name === 'cn') {
      return new BinaryOp(
        '*',
        new BinaryOp(
          '*',
          new UnaryOp('-', new FunctionOp('sn', this.args)),
          new FunctionOp('dn', this.args)
        ),
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (this.name === 'dn') {
      return new BinaryOp(
        '*',
        new BinaryOp(
          '*',
          new BinaryOp(
            '*',
            new UnaryOp('-', this.args[1] || new Leaf('number', 0.8)),
            new FunctionOp('sn', this.args)
          ),
          new FunctionOp('cn', this.args)
        ),
        this.args[0].toDerivative(wrt_funs, wrt_vars)
      )
    }
    if (['re', 'im'].includes(this.name)) {
      return new FunctionOp(
        this.name,
        this.args.map(a => a.toDerivative(wrt_funs, wrt_vars))
      )
    }
    if (this.name === 'sign') {
      return new Leaf('number', 0)
    }

    return new BinaryOp(
      '*',
      new FunctionOp(`${this.name}'`, this.args),
      this.args[0].toDerivative(wrt_funs, wrt_vars)
    )
  }
  simplify() {
    const args = this.args.map(a => a.simplify())
    return new FunctionOp(this.name, args)
  }
}

class Leaf {
  constructor(type, value) {
    this.type = type
    this.value = value
  }
  is(other) {
    return this.type === other.type && this.value === other.value
  }
  clone(replace, value) {
    return new Leaf(this.type, this.value)
  }
  toTree() {
    return `<${this.type}: ${this.value}>`
  }
  toString() {
    return `${this.value}`
  }
  toShader() {
    if (consts.includes(this.value)) {
      return this.value
    }
    if (this.type === 'identifier') {
      return this.value.replace(/'/g, '_prime')
    }
    return float(this.value)
  }
  toDerivative(wrt_funs, wrt_vars) {
    const wrt = [...wrt_funs, ...wrt_vars]
    if (this.type === 'identifier' && this.value === 'i') {
      return new Leaf('number', 0)
    }
    if (this.type === 'identifier' && wrt.includes(this.value)) {
      if (wrt_vars.includes(this.value)) {
        return new Leaf('number', 1)
      }
      return new Leaf('identifier', `${this.value}'`)
    }
    return new Leaf('number', 0)
  }
  simplify() {
    return this
  }
}

const readToken = (input, i) => {
  const tokensRegexps = Object.entries(tokens)
  for (let j = 0; j < tokensRegexps.length; j++) {
    const [type, regexp] = tokensRegexps[j]
    const result = input.slice(i).match(regexp)
    if (result !== null) {
      const text = result[0]
      return new Token(type, text, i, i + text.length)
    }
  }
  throw new SyntaxError('Tokenization error at index ' + i + ' in ' + input)
}

const tokenize = input => {
  let tokens = []
  for (let i = 0; i < input.length; ) {
    const token = readToken(input, i)
    i = token.end
    if (token.type !== 'whitespace') {
      tokens.push(token)
    }
  }
  return tokens
}

// Create the ast from the tokens
const parse = tokens => {
  let i = 0
  const expression = () => {
    let node = term()
    while (i < tokens.length) {
      const token = tokens[i]
      if (!token) {
        throw new SyntaxError('Unexpected EOF')
      }
      if (
        token.type === 'operator' &&
        ['+', '-', '|-|'].includes(token.value)
      ) {
        i++
        node = new BinaryOp(token.value, node, term())
      } else {
        break
      }
    }
    return node
  }
  const term = () => {
    let node = exponentiation()
    while (i < tokens.length) {
      const token = tokens[i]
      if (!token) {
        throw new SyntaxError('Unexpected EOF')
      }
      if (token.type === 'operator' && ['*', '/', '%'].includes(token.value)) {
        i++
        node = new BinaryOp(token.value, node, exponentiation())
      } else if (['lparen', 'identifier'].includes(token.type)) {
        node = new BinaryOp('*', node, exponentiation())
      } else {
        break
      }
    }
    return node
  }
  const exponentiation = () => {
    let node = suffix()
    while (i < tokens.length) {
      const token = tokens[i]
      if (!token) {
        throw new SyntaxError('Unexpected EOF')
      }
      if (
        token.type === 'operator' &&
        ['^', '**', '^^'].includes(token.value)
      ) {
        i++
        node = new BinaryOp(
          token.value === '**' ? '^' : token.value,
          node,
          exponentiation()
        )
      } else {
        break
      }
    }
    return node
  }
  const suffix = () => {
    let node = factor()
    while (i < tokens.length) {
      const token = tokens[i]
      if (!token) {
        throw new SyntaxError('Unexpected EOF')
      }
      if (token.type === 'unarySuffix') {
        i++
        node = new UnaryOp(token.value, node)
      } else {
        break
      }
    }
    return node
  }
  const factor = () => {
    const token = tokens[i]
    if (!token) {
      throw new SyntaxError('Unexpected EOF')
    }
    if (token.type === 'lparen') {
      i++
      const node = expression()
      if (tokens[i]?.type !== 'rparen') {
        throw new SyntaxError('Expected ) at ' + (tokens[i]?.start || 'EOF'))
      }
      i++
      return node
    } else if (token.type === 'pipe') {
      i++
      const node = expression()
      if (tokens[i]?.type !== 'pipe') {
        throw new SyntaxError('Expected | at ' + (tokens[i]?.start || 'EOF'))
      }
      i++
      return new FunctionOp('abs', [node])
    } else if (token.type === 'unaryPrefix') {
      i++
      return new UnaryOp(token.value, exponentiation())
    } else if (token.type === 'operator' && '+-'.includes(token.value)) {
      i++
      return new UnaryOp(token.value, exponentiation())
    } else if (token.type === 'float' || token.type === 'integer') {
      i++
      return new Leaf('number', parseFloat(token.value))
    } else if (token.type === 'identifier') {
      i++
      const identifier = new Leaf('identifier', token.value)
      if (tokens[i]?.type === 'lparen') {
        i++
        const args = []
        while (tokens[i]?.type !== 'rparen') {
          args.push(expression())
          if (!tokens[i]) {
            throw new SyntaxError('Expected ) at EOF')
          }
          if (tokens[i]?.type === 'comma') {
            i++
          }
        }
        i++
        return new FunctionOp(identifier.value, args)
      }
      return identifier
    } else {
      throw new SyntaxError(`Unexpected token ${token}`)
    }
  }
  const ast = expression()
  if (i !== tokens.length) {
    throw new SyntaxError(`Unexpected EOF ${tokens[i]}`)
  }
  return ast
}

export const vars = (ast_, ids = []) => {
  if (ast_.type === 'identifier' && !ids.includes(ast_.value)) {
    ids.push(ast_.value)
  }
  if (ast_.left) {
    ids = vars(ast_.left, ids)
  }
  if (ast_.right) {
    ids = vars(ast_.right, ids)
  }
  if (ast_.args) {
    const args = [...ast_.args]
    let iter_var = null
    if (['sum', 'product'].includes(ast_.name)) {
      iter_var = args.shift().value
    }
    args.forEach(arg => {
      ids = vars(arg, ids).filter(arg => arg != iter_var)
    })
  }
  if (ast_.operand) {
    ids = vars(ast_.operand, ids)
  }

  return ids
}

export const ast = s => parse(tokenize(s)).simplify()
export const derive = (s, wrt_funs = VARS, wrt_vars = []) =>
  parse(tokenize(s)).simplify().toDerivative(wrt_funs, wrt_vars).simplify()

window.tokenize = tokenize
window.parse = parse
window.ast = ast
window.vars = vars
window.derive = derive
window.astRaw = s => parse(tokenize(s))
