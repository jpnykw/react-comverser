import prettier from 'prettier'
import get_ast_from_code from './ast'
import convert_cc_to_fc from './convert'

const prettierOption = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  parser: 'babel',
}

const code: string = `
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

  export default Component;
`

console.log('\nInput:\n')
console.log('\x1b[36m%s\x1b[0m', prettier.format(code, prettierOption))

const ast: any = get_ast_from_code(code)
const result: string = prettier.format(convert_cc_to_fc(code, ast.body), prettierOption)

console.log('Output:\n')
console.log('\x1b[35m%s\x1b[0m', result)
