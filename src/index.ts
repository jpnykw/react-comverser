const acorn = require('acorn');
const jsx = require('acorn-jsx');

const get_ast_from_code = (code: string, option = { ecmaVersion: 2017 }) => {
  const parser = acorn.Parser.extend(jsx());
  let ast = null;

  try {
    ast = parser.parse(code, option);
  } catch (e) {
    ast = parser.parse_dammit(code, option);
  }

  return ast;
}

const code = `
const func = (x, y) => {
  const z = x * y;
  return x + y * z;
}
`;

console.dir(get_ast_from_code(code), { depth: null });