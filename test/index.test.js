const prettier = require('prettier');
const generate = require('../dist/ast.js');
const convert = require('../dist/convert.js');

const prettierOption = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  parser: 'babel',
};

const testcase = [
  [
    // CC
    `import React from 'react';
    class Component extends React.Component {
      render() {
        return <h1>Hello, World</h1>
      }
    }
    export default Component;
    `,
    // FC
    `import React from 'react';
    const Component = (props) => {
      return <h1>Hello, World</h1>;
    };
    export default Component;
    `
  ],

  [
    // CC
    `import React from 'react';

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
        );
      }
    }
    
    export default Component;`,
    // FC
    `import React from 'react';
    const Component = (props) => {
      const hoge = 123;
    
      const [fuga, setFuga] = React.useState(456);
      return (
        <>
          <div>hoge is {hoge}</div>
          <div>fuga is {fuga}</div>
        </>
      );
    };
    export default Component;`
  ],

  [
    // CC
    `import React from 'react';
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
    export default Component;`,
    // FC
    `import React from 'react';
    const Component = (props) => {
      const [count, setCount] = React.useState(123);
      const countUp = () => {
        setCount(count + 1);
      };
      const countDown = () => {
        setCount(count - 1);
      };
      return (
        <>
          <div>current count: {count}</div>
          <button onClick={() => countUp()}>count up</button>
          <button onClick={() => countDown()}>count down</button>
        </>
      );
    };
    export default Component;`
  ]
];

testcase.forEach((_, index) => {
  test(`case ${index}`, () => {
    const input = testcase[index][0];
    const answer = testcase[index][1];
    const ast = generate.default(input);
    const output = convert.default(input, ast.body);
    expect(prettier.format(output, prettierOption)).toBe(prettier.format(answer, prettierOption));
  });
});