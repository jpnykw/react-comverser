import { Parser } from 'acorn'
import jsx from 'acorn-jsx'
import type { Node } from 'estree'

type astType = Node | null

const generate = (code: string, option: acorn.Options = {
  ecmaVersion: 2020,
  allowImportExportEverywhere: true
}): astType => {
  const parser = Parser.extend(jsx())
  let ast: astType = null

  try {
    ast = parser.parse(code, option) as Node
  } catch (err) {
    console.log('ParseError:', err)
    // ast = parser.parse_dammit(code, option)
  }

  return ast
}

export default generate