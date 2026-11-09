/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.createSourceFile('porter.ts', fs.readFileSync('lib/porter.ts', 'utf8'), ts.ScriptTarget.ES2017, true);
const node = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'getPorterType');
const compiled = ts.transpileModule(node.getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2017 } }).outputText;
const classify = new Function(`${compiled}; return getPorterType;`)();

test('source code 99 and porter 5 are the new ER center', () => {
  for (const source of ['99', ' 99 ']) {
    assert.equal(classify('1', '', source), 'ER');
    assert.equal(classify('4', '114', source), 'ER');
    assert.equal(classify('0', '', source), 'ER');
  }
  assert.equal(classify('5', '114', '123'), 'ER');
  assert.equal(classify('5', '', ''), 'ER');
});

test('other sources keep the existing center rules', () => {
  assert.equal(classify('1', '', 'ห้อง X-Ray'), 'OPD');
  assert.equal(classify('4', '114', 'หอผู้ป่วย'), 'OPD');
  assert.equal(classify('4', '115', '123'), 'IPD');
  assert.equal(classify('2', '', '123'), 'IPD');
  assert.equal(classify('1', '', 'LASER'), 'OPD');
  assert.equal(classify('1', '', 'ER'), 'OPD');
  assert.equal(classify('1', '', 'ห้องอุบัติเหตุฉุกเฉิน'), 'OPD');
});

test('waiting queries use the same ER boundary and exclude it from IPD and OPD', async () => {
  const captured = [];
  const target = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('lib/porter.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  }).outputText;
  const mockedRequire = name => {
    if (name === 'server-only' || name === 'mssql') return {};
    if (name === '@/lib/porter-staff') return { normalizeStaffNo: value => String(value).toUpperCase() };
    if (name === '@/lib/db') return { getDb: async () => ({ request: () => ({ query: async sql => { captured.push(sql); return { recordset: [] }; } }) }) };
    throw Error(`Unexpected module ${name}`);
  };
  new Function('require', 'exports', code)(mockedRequire, target.exports);
  for (const center of ['ศูนย์เปล IPD', 'ศูนย์เปล OPD', 'ศูนย์เปล ER']) await target.exports.getWaitingJobs(center);
  for (const sql of captured) {
    assert.ok(sql.includes("ISNULL(C.LocSource, ''))) = '99'"));
    assert.ok(sql.includes("WS.porter), ''))) = '5'"));
  }
  const filters = captured.map(sql => sql.slice(sql.indexOf('WHERE'), sql.lastIndexOf('ORDER BY')));
  assert.match(filters[0], /NOT/);
  assert.match(filters[1], /NOT/);
  assert.ok(filters[0].includes(") = '2'"));
  assert.ok(filters[1].includes(") = '1'"));
  assert.ok(!filters[2].includes(") = '2'"));
  assert.ok(!filters[2].includes(") = '1'"));
});
