/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(path, mocks = {}) {
  const output = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const target = { exports: {} };
  new Function('require', 'exports', output)(name => name in mocks ? mocks[name] : require(name), target.exports);
  return target.exports;
}

const job = {
  reqNo: 'Req20261022-001', locSource: 'ห้อง X-Ray', locDest: '(99) ห้องอุบัติเหตุฉุกเฉิน',
  locAct: 'ย้ายผู้ป่วย', bedType: 'รถนอน', bedNo: '15', equipment: 'ถังออกซิเจน',
  detail: 'ผู้ป่วยต้องได้รับการดูแล\nระหว่างเคลื่อนย้าย', remark: 'ติดต่อเจ้าหน้าที่ก่อนรับ',
  fastTrack: '2', fastTrackText: 'FastTrack', createdAtShort: '09:17',
};

function setup() {
  const states = [];
  let cursor = 0;
  let complete;
  const calls = [], routes = [], removals = [], notices = [];
  const Card = () => null;
  const Dashboard = load('components/porter-dashboard.tsx', {
    react: {
      useRef(initial) { const index = cursor++; return states[index] ??= { current: initial }; },
      useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => states[index] = value]; },
    },
    'next/navigation': { useRouter: () => ({ replace: path => routes.push(path) }) },
    sweetalert2: { fire: options => notices.push(options) },
    '@/components/porter-header': { default: () => null, __esModule: true },
    '@/components/porter-waiting-job-card': { default: Card, __esModule: true },
    '@/lib/porter-live': { acceptPorterJob: input => { calls.push(input); return new Promise(resolve => complete = resolve); } },
    '@/lib/porter-dashboard-cache': { removeWaitingDashboardJob: (...args) => removals.push(args) },
    '@/lib/porter-alert': { getTimeOnly: value => value, useNewJobAlert() {} },
  }).default;
  function findCard(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === Card) return node;
    const children = Array.isArray(node) ? node : React.Children.toArray(node.props?.children);
    for (const child of children) { const found = findCard(child); if (found) return found; }
    return null;
  }
  return {
    render(extra = {}) { cursor = 0; return findCard(Dashboard({ staffNo: 'l0281', staffName: 'ทดสอบ', jobs: [job], ...extra })); },
    calls, routes, removals, notices,
    async resolve(result) { complete(result); await new Promise(resolve => setImmediate(resolve)); },
  };
}

test('card shows all details with no navigation link and a real accept button', () => {
  const icons = load('components/porter-icons.tsx');
  const Card = load('components/porter-waiting-job-card.tsx', {
    '@/components/porter-icons': icons,
    '@/lib/porter-alert': { getTimeOnly: value => value },
    './porter-waiting-job-card.module.css': { __esModule: true, default: new Proxy({}, { get: (_, name) => name }) },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Card, { job, index: 0, busy: false, disabled: false, onAccept() {} }));
  for (const value of [job.reqNo, job.locSource, job.locDest, job.locAct, job.bedType, job.bedNo, job.equipment, job.detail, job.remark, 'รับงาน / เริ่ม']) {
    assert.ok(html.includes(value), `Missing ${value}`);
  }
  assert.ok(html.includes('<button'));
  assert.ok(!html.includes('<a '));
});

test('accept sends the correct job only once and goes straight to current work', async () => {
  const env = setup();
  const card = env.render();
  card.props.onAccept();
  card.props.onAccept();
  assert.equal(env.calls.length, 1);
  assert.deepEqual(env.calls[0], { staffNo: 'l0281', reqNo: job.reqNo });
  assert.equal(env.render().props.disabled, true);
  await env.resolve({ success: true });
  assert.deepEqual(env.routes, ['/mobile-porter/current']);
  assert.deepEqual(env.removals, [['l0281', job.reqNo, true]]);
});

test('connection failure preserves the job and unlocks its button with an error', async () => {
  const env = setup();
  env.render().props.onAccept();
  await env.resolve({ success: false, code: 'REQUEST_FAILED', message: 'เชื่อมต่อไม่ได้' });
  const card = env.render();
  assert.equal(card.props.disabled, false);
  assert.equal(card.props.error, 'เชื่อมต่อไม่ได้');
  assert.equal(env.removals.length, 0);
  assert.equal(env.routes.length, 0);
});

test('a job accepted by another employee is removed and does not navigate', async () => {
  const env = setup();
  env.render().props.onAccept();
  await env.resolve({ success: false, code: 'ALREADY_ASSIGNED', message: 'มีผู้รับงานแล้ว' });
  assert.deepEqual(env.removals, [['l0281', job.reqNo]]);
  assert.equal(env.routes.length, 0);
  assert.equal(env.notices.length, 1);
  assert.equal(env.render().props.disabled, false);
});

test('employee with an active job is directed to current work without accepting again', () => {
  const env = setup();
  env.render({ allowNewJobAlerts: false }).props.onAccept();
  assert.equal(env.calls.length, 0);
  assert.deepEqual(env.routes, ['/mobile-porter/current']);
});
