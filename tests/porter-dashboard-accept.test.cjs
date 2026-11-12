/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(path, mocks = {}, window = { dispatchEvent() {} }) {
  const output = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const target = { exports: {} };
  new Function('require', 'exports', 'window', output)(name => name in mocks ? mocks[name] : require(name), target.exports, window);
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
  const calls = [], routes = [], removals = [], notices = [], activeUpdates = [], events = [];
  const action = input => { calls.push(input); return new Promise(resolve => complete = resolve); };
  const Card = () => null;
  const Dashboard = load('components/porter-dashboard.tsx', {
    react: {
      useEffect() {},
      useRef(initial) { const index = cursor++; return states[index] ??= { current: initial }; },
      useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => states[index] = value]; },
    },
    'next/navigation': { useRouter: () => ({ replace: path => routes.push(path) }) },
    sweetalert2: { fire: options => notices.push(options) },
    '@/components/porter-header': { default: () => null, __esModule: true },
    '@/components/porter-waiting-job-card': { default: Card, __esModule: true },
    '@/lib/porter-live': { acceptPorterJob: action, cancelPorterJob: action, finishPorterJob: action },
    '@/lib/porter-dashboard-cache': {
      removeWaitingDashboardJob: (...args) => removals.push(args),
      setDashboardActiveJobs: (...args) => activeUpdates.push(args),
    },
    '@/lib/porter-alert': { getTimeOnly: value => value, useNewJobAlert() {} },
  }, { dispatchEvent: event => events.push(event.type) }).default;
  function findCard(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === Card) return node;
    const children = Array.isArray(node) ? node : React.Children.toArray(node.props?.children);
    for (const child of children) { const found = findCard(child); if (found) return found; }
    return null;
  }
  return {
    screen(extra = {}) { cursor = 0; return Dashboard({ staffNo: 'l0281', staffName: 'ทดสอบ', jobs: [job], ...extra }); },
    render(extra = {}) { cursor = 0; return findCard(Dashboard({ staffNo: 'l0281', staffName: 'ทดสอบ', jobs: [job], ...extra })); },
    calls, routes, removals, notices, activeUpdates, events,
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
  const readOnly = renderToStaticMarkup(React.createElement(Card, { job, index: 0, hideAccept: true, onAccept() {} }));
  assert.ok(readOnly.includes(job.locSource));
  assert.ok(!readOnly.includes('<button'));
  const active = renderToStaticMarkup(React.createElement(Card, { job, index: 0, active: true, onAccept() {} }));
  assert.ok(active.includes('ยกเลิกงาน'));
  assert.ok(active.includes('เสร็จสิ้นงาน'));
  assert.ok(!active.includes('รับงาน / เริ่ม'));
  const headJob = renderToStaticMarkup(React.createElement(Card, { job: { ...job, isHeadJob: true }, index: 0, active: true, onAccept() {} }));
  assert.ok(!headJob.includes('ยกเลิกงาน'));
  assert.ok(headJob.includes('เสร็จสิ้นงาน'));
  const detail = renderToStaticMarkup(React.createElement(Card, { job, index: 0, active: true, readOnly: true, onAccept() {} }));
  assert.ok(!detail.includes('<button'));
  assert.ok(detail.includes(job.locSource));
  for (const [bedType, className] of [
    ['เฉพาะเจ้าหน้าที่', 'staffVehicle'], ['รถนั่ง', 'chairVehicle'],
    ['รถนอน', 'bedVehicle'], ['รถนั่งพร้อมเสาน้ำเกลือ', 'ivVehicle'],
  ]) {
    const colored = renderToStaticMarkup(React.createElement(Card, { job: { ...job, bedType }, index: 0, onAccept() {} }));
    assert.ok(colored.includes(`transport ${className}`));
  }
  assert.ok(active.includes('inProgress'));
  assert.ok(active.indexOf('กำลังดำเนินการ') < active.indexOf('badges'));
});

test('accept sends the correct job once and stays on dashboard with active controls', async () => {
  const env = setup();
  const card = env.render();
  card.props.onAccept();
  card.props.onAccept();
  assert.equal(env.calls.length, 1);
  assert.deepEqual(env.calls[0], { staffNo: 'l0281', reqNo: job.reqNo });
  assert.equal(env.render().props.disabled, true);
  assert.ok(card.props.detailHref.includes(encodeURIComponent(job.reqNo)));
  await env.resolve({ success: true });
  assert.deepEqual(env.routes, []);
  assert.deepEqual(env.activeUpdates, [['l0281', [job]]]);
  assert.deepEqual(env.events, ['porter-assignment-changed']);
  const active = env.render({ activeJobs: [job] });
  assert.equal(active.props.active, true);
  assert.equal(typeof active.props.onCancel, 'function');
  assert.equal(typeof active.props.onFinish, 'function');
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

test('other jobs hide accept while an employee is working, without navigation', () => {
  const env = setup();
  env.render({ allowNewJobAlerts: false }).props.onAccept();
  assert.equal(env.calls.length, 0);
  assert.equal(env.render({ allowNewJobAlerts: false }).props.hideAccept, true);
  assert.deepEqual(env.routes, []);
});

for (const action of ['onFinish', 'onCancel']) {
  test(`${action} updates active jobs and refreshes without leaving the dashboard`, async () => {
    const env = setup();
    const card = env.render({ activeJobs: [job] });
    card.props[action]();
    await env.resolve({ success: true });
    assert.deepEqual(env.activeUpdates, [['l0281', []]]);
    assert.deepEqual(env.routes, []);
    assert.deepEqual(env.events, ['porter-assignment-changed']);
    assert.equal(env.render().props.hideAccept, false);
  });
}

test('failed finish keeps the active card and shows the failure', async () => {
  const env = setup();
  env.render({ activeJobs: [job] }).props.onFinish();
  await env.resolve({ success: false, code: 'REQUEST_FAILED', message: 'บันทึกไม่ได้' });
  assert.equal(env.activeUpdates.length, 0);
  const card = env.render({ activeJobs: [job] });
  assert.equal(card.props.active, true);
  assert.equal(card.props.error, 'บันทึกไม่ได้');
  assert.equal(card.props.disabled, false);
});

test('tabs show IPD, OPD, ER and finished in order, with independent selected views', () => {
  const env = setup();
  for (const view of ['ศูนย์เปล IPD', 'ศูนย์เปล OPD', 'ศูนย์เปล ER', 'finished']) {
    const html = renderToStaticMarkup(env.screen({ viewMode: view }));
    const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>([^<]+)<\/button>/g)];
    assert.deepEqual(tabs.map(tab => tab[1]), ['ศูนย์เปล IPD', 'ศูนย์เปล OPD', 'ศูนย์เปล ER', 'เสร็จสิ้น']);
    const selected = tabs.filter(tab => tab[0].includes('aria-selected="true"'));
    assert.equal(selected.length, 1);
    assert.equal(selected[0][1], view === 'finished' ? 'เสร็จสิ้น' : view);
  }
});
