/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.createSourceFile('porter.ts', fs.readFileSync('lib/porter.ts', 'utf8'), ts.ScriptTarget.ES2017, true);
const node = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'getPorterType');
const compiled = ts.transpileModule(node.getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2017 } }).outputText;
const classify = new Function(`${compiled}; return getPorterType;`)();

test('emergency sources override OPD and Ward 114', () => {
  for (const source of ['ห้องอุบัติเหตุฉุกเฉิน', '(99) ห้องอุบัติเหตุฉุกเฉิน', 'ER', ' er ', 'ห้อง ER']) {
    assert.equal(classify('1', '', source), 'ER');
    assert.equal(classify('4', '114', source), 'ER');
    assert.equal(classify('0', '', source), 'ER');
  }
});

test('other sources keep the existing center rules', () => {
  assert.equal(classify('1', '', 'ห้อง X-Ray'), 'OPD');
  assert.equal(classify('4', '114', 'หอผู้ป่วย'), 'OPD');
  assert.equal(classify('4', '115', 'หอผู้ป่วย'), 'ER');
  assert.equal(classify('2', '', 'หอผู้ป่วย'), 'ER');
  assert.equal(classify('1', '', 'LASER'), 'OPD');
});
