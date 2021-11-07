const acorn = require('acorn');
const jsx = require('acorn-jsx');
const escodegen = require('escodegen');
const prettier = require('prettier');

const prettierOption = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  parser: 'babel',
};

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
      case 'ImportDeclaration':
        // console.log(token);
        code += `${escodegen.generate(token)}\n`;
        break;

      case 'ClassDeclaration':
        code += `const ${token.id.name} = (props) => {\n`;
        const classBody = token.body;

        if (classBody.type === 'ClassBody') {
          code += analyze(rawCode, classBody.body);
        }
        break;

      case 'ExportDefaultDeclaration':
        code += `export default ${token.declaration.name}`;
        break;

      case 'MethodDefinition':
        if (token.kind === 'constructor') {
          const value = token.value;
          const blockStatement = value.body;

          // Class 内部で定義されてるメソッドを FC 用に変換
          for (const token of Array.isArray(blockStatement.body) ? blockStatement.body : [blockStatement.body]) {
            if (token?.expression?.callee?.type === 'Super') continue; // super() を無視
            code += analyze(rawCode, token);
            // console.log(token);
          }

          // console.log('params', params, 'body', blockStatement);
          // console.log(params.map((param: any) => escodegen.generate(param)).join('\n'));
        }

        if (token.kind === 'method') {
          if (token.key.name === 'render') {
            const blockStatement = token.value.body;
            code += `${rawCode.slice(blockStatement.body[0].start, blockStatement.body[0].end)}\n}\n`;
          } else {
            code += `const ${token.key.name} = () => {\n`;
          }
        }
        break;

        case 'ExpressionStatement':
          const operator = token.expression.operator;
          const left = token.expression.left;
          const right = token.expression.right;

          if (operator === '=') {
            // this プロパティに対する代入
            if (left.type === 'MemberExpression' && left.object.type === 'ThisExpression') {
              if (left.property.name === 'state') {
                // state を hooks に置き換える
                for (const {key, value} of right.properties) {
                  const name = key.name;
                  code += `const [${name}, set${name[0].toUpperCase()}${name.slice(1, name.length)}] = React.useState(${value.raw})\n`;
                }
              } else {
                code += `const ${left.property.name} = ${escodegen.generate(right)}\n`;
              }
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
      this.hoge = 123;
      this.state = {
        fuga: 456,
      };
    }
    render() {
      return <h1>Hello, World</h1>
    }
  }

  export default Component;
`;

console.log('\nInput:\n');
console.log('\x1b[36m%s\x1b[0m', prettier.format(code, prettierOption));

const ast = get_ast_from_code(code);
const result = prettier.format(analyze(code, ast.body), prettierOption);

console.log('Output:\n');
console.log('\x1b[35m%s\x1b[0m', result);
