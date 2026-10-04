// P31 (03/10): one sample per Code Formatter language, the text a formatted result must contain, and a few syntax errors
// with the line the message must name. Shared by code-formatter-lib.mjs (node, the engine) and code-formatter-page.mjs
// (the real page in Chromium and WebKit).

export const SAMPLES = [
  { lang: 'javascript', input: 'function greet(name){if(!name){return "hi"}const list=[1,2,3].map(x=>x*2);console.log(`Hello ${name}`,list)}',
    expect: ['function greet(name) {\n  if (!name) {\n    return "hi";\n  }', 'const list = [1, 2, 3].map((x) => x * 2);'] },
  { lang: 'typescript', input: 'interface User{name:string;age?:number}\nconst u:User={name:"Ada"};export function f<T>(x:T):T{return x}',
    expect: ['interface User {\n  name: string;\n  age?: number;\n}', 'export function f<T>(x: T): T {\n  return x;\n}'] },
  { lang: 'jsx', input: 'export default function App(){return <div className="app"><h1>Hello</h1><Button onClick={()=>go(1)}>Go</Button></div>}',
    expect: ['return (\n    <div className="app">\n      <h1>Hello</h1>', '<Button onClick={() => go(1)}>Go</Button>'] },
  { lang: 'json', input: '{"id":12345678901234567890,"n":1.10,"tags":["a","b"],"nested":{"ok":true}}',
    expect: ['{\n  "id": 12345678901234567890,\n  "n": 1.10,', '"nested": {\n    "ok": true\n  }'] },
  { lang: 'html', input: '<!DOCTYPE html><html><head><title>T</title><style>body{margin:0}</style></head><body><div class="a"><p>Hi</p></div></body></html>',
    expect: ['<!DOCTYPE html>', '<div class="a"><p>Hi</p></div>', 'body {\n        margin: 0;\n      }'] },
  { lang: 'xml', input: '<?xml version="1.0"?><note id="1"><to>Ada</to><body>Hi  there</body><empty/></note>',
    expect: ['<note id="1">\n  <to>Ada</to>\n  <body>Hi  there</body>\n  <empty />\n</note>'] },
  { lang: 'css', input: 'a{color:red;background:url(data:image/png;base64,iVBORw0KGgo=)}@media (max-width:600px){a{color:blue}}',
    expect: ['a {\n  color: red;\n  background: url(data:image/png;base64,iVBORw0KGgo=);\n}', '@media (max-width: 600px) {\n  a {\n    color: blue;\n  }\n}'] },
  { lang: 'scss', input: '$primary:#333;@mixin m($x){padding:$x}.nav{color:$primary;&:hover{color:red}ul{@include m(4px)}}',
    expect: ['$primary: #333;', '.nav {\n  color: $primary;\n  &:hover {\n    color: red;\n  }'] },
  { lang: 'less', input: '@primary:#333;.bordered(@w:2px){border:@w solid black}#header{color:@primary;.bordered(4px);}',
    expect: ['@primary: #333;', '#header {\n  color: @primary;\n  .bordered(4px);\n}'] },
  { lang: 'sql', input: "select id,name from users u join orders o on o.user_id=u.id where u.city='Montréal' and o.total>100 order by name",
    expect: ['SELECT\n  id,\n  name\nFROM\n  users u\n  JOIN orders o ON o.user_id = u.id\nWHERE\n  u.city = \'Montréal\''] },
  { lang: 'yaml', input: 'name:   app\nversion: 1.0\nservices:\n    web:\n        image: "nginx"\n        ports: [ "80:80" ]\n',
    expect: ['name: app\nversion: 1.0\nservices:\n  web:\n    image: "nginx"\n    ports: ["80:80"]'] },
  { lang: 'markdown', input: '# Title\n\nSome **bold** text and a [link](https://example.com).\n\n* one\n* two\n\n| a | b |\n|---|---|\n| 1 | 22 |\n',
    expect: ['# Title', '- one\n- two', '| a   | b   |\n| --- | --- |\n| 1   | 22  |'] },
  { lang: 'graphql', input: 'query GetUser($id:ID!){user(id:$id){id name posts(first:10){title}}}',
    expect: ['query GetUser($id: ID!) {\n  user(id: $id) {\n    id\n    name\n    posts(first: 10) {\n      title\n    }\n  }\n}'] },
];

// SQL dialects: a statement only that dialect formats this way (back-quoted / bracketed names, dialect keywords).
export const SQL_DIALECT_SAMPLES = [
  { dialect: 'mysql', input: 'select `id` from `t` limit 5', expect: ['SELECT\n  `id`\nFROM\n  `t`\nLIMIT\n  5'] },
  { dialect: 'postgresql', input: 'select id::text from t where tags @> array[1]', expect: ['id::text', 'tags @> ARRAY[1]'] },
  { dialect: 'sql', input: 'select id::text from t', error: 'Line 1, column 10' }, // standard SQL has no "::": the dialect matters
  { dialect: 'transactsql', input: 'select top 5 [id] from [dbo].[t]', expect: ['TOP 5 [id]', 'FROM\n  [dbo].[t]'] },
  { dialect: 'sqlite', input: 'insert or replace into t(id) values (?1)', expect: ['INSERT OR REPLACE INTO\n  t (id)\nVALUES\n  (?1)'] },
  { dialect: 'bigquery', input: 'select * from `project.dataset.table` where struct(1 as a).a = 1', expect: ['`project.dataset.table`', 'struct(1 AS a).a = 1'] },
  { dialect: 'plsql', input: 'select id from t start with parent_id is null connect by prior id = parent_id', expect: ['START WITH parent_id IS NULL\nCONNECT BY PRIOR id = parent_id'] },
];

// Accents and emoji (P31 point 5 d): must come back untouched.
export const ACCENTS = {
  lang: 'javascript',
  input: 'const nom = "Élodie"; const ville = "Montréal"; // 🎉 fête\nconst msg = `Ça va, ${nom} ? 👋🏽`',
  expect: ['const nom = "Élodie";', 'const ville = "Montréal"; // 🎉 fête', 'const msg = `Ça va, ${nom} ? 👋🏽`;'],
};

// Syntax errors: the message must start with "Line L, column C:" (C optional where an engine gives none).
export const ERRORS = [
  { lang: 'javascript', input: 'const a = 1;\nconst b = {\n  c: 1,,\n};', line: 3, column: 8 },
  { lang: 'typescript', input: 'interface A {\n  x: number\n}\nconst y: = 2;', line: 4, column: 10 },
  { lang: 'json', input: '{\n  "a": 1,\n  b: 2\n}', line: 3, column: 3, words: 'keys need double quotes' },
  { lang: 'css', input: 'a {\n  color: red;\n  b {', line: 3 },
  { lang: 'yaml', input: 'a: 1\nb: [1, 2\nc: 3', line: 3 },
  { lang: 'graphql', input: 'query {\n  user(id: 1 {\n    name\n  }\n}', line: 2, column: 14 },
  { lang: 'sql', input: "SELECT *\nFROM t\nWHERE a = 'unterminated", line: 3 },
  { lang: 'html', input: '<div>\n  <p>hi</span>\n</div>', line: 2, column: 8 },
];

// Auto-detect: text -> expected language (every sample above, plus the iPhone case).
export const DETECT = [
  ...SAMPLES.map((s) => [s.input, s.lang]),
  [ACCENTS.input, 'javascript'],
  ['const x = 1\nlet y = { a: 1 }\nconsole.log(x, y)', 'javascript'], // the iPhone report: JavaScript must not go to JSON
  ['{ "a": 1, }', 'json'],
  ['SELECT 1 FROM dual', 'sql'],
  ['<root><child a="1"/></root>', 'xml'],
  ['type Query {\n  user(id: ID!): User\n}', 'graphql'],
  ['type User = { name: string }', 'typescript'],
];
