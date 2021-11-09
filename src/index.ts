import acorn from 'acorn'
import jsx from 'acorn-jsx'
import escodegen from 'escodegen'
import prettier from 'prettier'
import { EOL } from 'os'

const prettierOption = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  parser: 'babel',
}

const get_ast_from_code = (code: string, option = { ecmaVersion: 2017, allowImportExportEverywhere: true }) => {
  const parser: any = acorn.Parser.extend(jsx())
  let ast = null

  try {
    ast = parser.parse(code, option)
  } catch (err) {
    console.log('ParseError:', err)
    ast = parser.parse_dammit(code, option)
  }

  return ast
}

const insert_new_line = (baseText: string, newText: string): string => {
  if (baseText[baseText.length - 1] === EOL) {
    return `${baseText}${newText}`
  } else {
    return `${baseText}${EOL}${newText}`
  }
}

const analyze = (rawCode: string, body: any) => {
  let code = ''

  if (body === undefined) {
    return code
  }

  for (const token of Array.isArray(body) ? body : [body]) {
    switch (token.type) {
      case 'ImportDeclaration': {
        code = insert_new_line(code, `${escodegen.generate(token)}\n`)
        break
      }

      case 'ClassDeclaration': {
        code = insert_new_line(code, `const ${token.id.name} = (props) => {\n`)
        const classBody = token.body

        if (classBody.type === 'ClassBody') {
          code = insert_new_line(code, analyze(rawCode, classBody.body))
        }
        break
      }

      case 'ExportDefaultDeclaration': {
        code = insert_new_line(code, `export default ${token.declaration.name}`)
        break
      }

      case 'MethodDefinition': {
        if (token.kind === 'constructor') {
          const value = token.value
          const blockStatement = value.body

          // Class 内部で定義されてるメソッドを FC 用に変換
          for (const token of Array.isArray(blockStatement.body) ? blockStatement.body : [blockStatement.body]) {
            if (token?.expression?.callee?.type === 'Super') continue // super() を無視
            code = insert_new_line(code, analyze(rawCode, token))
          }
        }

        if (token.kind === 'method') {
          if (token.key.name === 'render') {
            const blockStatement = token.value.body
            code = insert_new_line(code, `${rawCode.slice(blockStatement.body[0].start, blockStatement.body[0].end).replace(/this\./g, '')}\n}\n`)
          } else {
            code = insert_new_line(code, `const ${token.key.name} = () => {\n`)
          }
        }
        break
      }

        case 'ExpressionStatement': {
          const operator = token.expression.operator
          const left = token.expression.left
          const right = token.expression.right

          if (operator === '=') {
            // this プロパティに対する代入
            if (left.type === 'MemberExpression' && left.object.type === 'ThisExpression') {
              if (left.property.name === 'state') {
                // state を hooks に置き換える
                for (const {key, value} of right.properties) {
                  const name = key.name
                  code = insert_new_line(code, `const [${name}, set${name[0].toUpperCase()}${name.slice(1, name.length)}] = React.useState(${value.raw})\n`)
                }
              } else {
                code = insert_new_line(code, `const ${left.property.name} = ${escodegen.generate(right)}\n`)
              }
            }
          }
          break
        }
    }
  }

  return code
}

const code = `
  import React from 'react';

  class Component extends React.Component {
    constructor(props) {
      super(props);
      this.hoge = 123;
      this.state = {
        fuga: 456,
      };
    }
    render() {
      return (
        <>
          <div>hoge is {this.hoge}</div>
          <div>fuga is {this.fuga}</div>
        </>
      )
    }
  }
cl
  export default Component;
`

console.log('\nInput:\n')
console.log('\x1b[36m%s\x1b[0m', prettier.format(code, prettierOption))

const ast = get_ast_from_code(code)
const result = prettier.format(analyze(code, ast.body), prettierOption)

console.log('Output:\n')
console.log('\x1b[35m%s\x1b[0m', result)

export default analyze