'use strict'

const secret = {
  tokens: Symbol('interpolate tokens')
}

module.exports = function interpolate (node) {
  if (node.nodeType !== 3) return
  node.$require('expression')
  node.$using('interpolate')

  node[secret.tokens] = parseValue(node.nodeValue)
  node[secret.tokens].forEach(processToken, node)
}

function processToken (token, index, tokens) {
  if (typeof token === 'object') {
    const expression = this.$compileExpression(token.expression)
    if (token.observed) {
      this.$observe(() => interpolateToken(token, expression(), tokens, this))
    } else {
      interpolateToken(token, expression(), tokens, this)
    }
  }
}

function interpolateToken (token, value, tokens, node) {
  if (value === undefined) value = ''
  if (token.value !== value) {
    token.value = value
    node.nodeValue = tokens.map(tokenToString).join('')
  }
}

function tokenToString (token) {
  return (typeof token === 'object') ? token.value : token
}

function parseValue (string) {
  const tokens = []
  let expression = false
  let anchor = 0
  let depth = 0
  let char
  let token

  for (let i = 0; i < string.length; i++) {
    char = string.charAt(i)

    if (expression) {
      if (char === '{') {
        depth++
      } else if (char === '}') {
        depth--
      }

      if (depth === 0) {
        token.expression = string.slice(anchor, i)
        tokens.push(token)
        anchor = i + 1
        expression = false
      }
    } else {
      if (i === string.length - 1) {
        tokens.push(string.slice(anchor, i + 1))
      } else if ((char === '$' || char === '@') && string.charAt(i + 1) === '{') {
        tokens.push(string.slice(anchor, i))
        token = {observed: (char === '@')}
        anchor = i + 2
        depth = 0
        expression = true
      }
    }
  }
  return tokens
}
