const acorn = require('acorn');
const jsx = require('acorn-jsx');
const escodegen = require('escodegen');

const get_ast_from_code = (code: string, option = { ecmaVersion: 2017, allowImportExportEverywhere: true }) => {
  const parser = acorn.Parser.extend(jsx());
  let ast = null;

  try {
    ast = parser.parse(code, option);
  } catch (err) {
    console.log('ParseError:', err);
    ast = parser.parse_dammit(code, option);
  }

  return ast;
}

const analyze = (rawCode: string, body: any) => {
  let code = '';

  if (body === undefined) {
    return code;
  }

  for (const token of Array.isArray(body) ? body : [body]) {
    switch (token.type) {
      case 'ClassDeclaration':
        code += `const ${token.id.name} = (props) => {\n`;
        const classBody = token.body;

        if (classBody.type === 'ClassBody') {
          code += analyze(rawCode, classBody.body);
        }
        break;

      case 'MethodDefinition':
        if (token.kind === 'constructor') {
          const value = token.value;
          const blockStatement = value.body;

          // Class 内部で定義されてるメソッドを FC 用に変換
          for (const token of Array.isArray(blockStatement.body) ? blockStatement.body : [blockStatement.body]) {
            if (token?.expression?.callee?.type === 'Super') continue; // super() を無視
          }

          // console.log('params', params, 'body', blockStatement);
          // console.log(params.map((param: any) => escodegen.generate(param)).join('\n'));
        }

        if (token.kind === 'method') {
          if (token.key.name === 'render') {
            const blockStatement = token.value.body;
            code += `${rawCode.slice(blockStatement.body[0].start, blockStatement.body[0].end)}\n}`;
          } else {
            code += `const ${token.key.name} = () => {\n`;
          }
        }
        break;
    }
  }

  return code;
}

const code = `
  import React from 'react';

  class Component extends React.Component {
    constructor(props) {
      super(props);
    }
    render() {
      return <h1>Hello, World</h1>
    }
  }

  export default Component;
`;

const ast = get_ast_from_code(code);
console.log(analyze(code, ast.body));