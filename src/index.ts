import prettier from 'prettier'
import argv from 'minimist'
import fs from 'fs'
import get_ast_from_code from './ast'
import convert_cc_to_fc from './convert'

const prettierOption = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  parser: 'babel',
}

const { path } = argv(process.argv.slice(2))

if (path === undefined || path === true) {
  console.log('\x1b[31mplease set the file path using argument:\x1b[0m', '--path=PATH')
  process.exit()
}

if (!fs.existsSync(path)) {
  console.log('\x1b[31mno such file:\x1b[0m', path)
  process.exit()
}

const file = fs.readFileSync(path)
const code = file.toString()

console.log('\nInput:\n')
console.log('\x1b[36m%s\x1b[0m', prettier.format(code, prettierOption))

const ast: any = get_ast_from_code(code)
const result: string = prettier.format(convert_cc_to_fc(code, ast.body), prettierOption)

console.log('Output:\n')
console.log('\x1b[35m%s\x1b[0m', result)
