import prettier from 'prettier'
import get_ast_from_code from './ast'
import convert_cc_to_fc from './convert'

const prettierOption = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  parser: 'babel',
}

const code = `
  import React from 'react';
  class Component extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        count: 123,
      };
    }
    countUp() {
      this.setState({
        count: this.state.count + 1,
      });
    }
    countDown() {
      this.setState({
        count: this.state.count - 1,
      });
    }
    render() {
      return (
        <>
          <div>current count: {this.state.count}</div>
          <button onClick={() => this.countUp()}>count up</button>
          <button onClick={() => this.countDown()}>count down</button>
        </>
      );
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
