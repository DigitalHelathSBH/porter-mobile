/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const compiled = ts.transpileModule(fs.readFileSync('lib/porter-alert.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, esModuleInterop: true },
}).outputText;

function setup(storage = new Map(), unavailable = false) {
  const alerts = [];
  const window = { sessionStorage: {
    getItem(key) { if (unavailable) throw Error('disabled'); return storage.get(key) ?? null; },
    setItem(key, value) { if (unavailable) throw Error('disabled'); storage.set(key, value); },
  } };
  const load = () => {
    const target = { exports: {} };
    const mockedRequire = name => {
      if (name === 'react') return { useEffect: fn => fn() };
      if (name === 'sweetalert2') return { fire: value => alerts.push(value) };
      return require(name);
    };
    new Function('require', 'exports', 'module', 'window', compiled)(mockedRequire, target.exports, target, window);
    return target.exports.useNewJobAlert;
  };
  return { alerts, load };
}

const job = (reqNo, isHeadJob = false) => ({ reqNo, isHeadJob, fastTrack: '0' });

test('initial loading and back navigation do not alert for existing jobs', () => {
  const { alerts, load } = setup();
  let hook = load();
  hook([], '');
  hook([job('A')], 'L0281');
  assert.equal(alerts.length, 0);
  hook([job('A'), job('B')], 'L0281');
  assert.equal(alerts.length, 1);
  hook([], '');
  hook([job('A'), job('B')], 'l0281');
  assert.equal(alerts.length, 1);
  // Reload the module to simulate refreshing the browser tab.
  hook = load();
  hook([job('A'), job('B')], 'L0281');
  assert.equal(alerts.length, 1);
  hook([job('A'), job('B'), job('C')], 'L0281');
  assert.equal(alerts.length, 2);
});

test('queue removal, duplicate rows, excluded jobs and head jobs do not alert again', () => {
  const { alerts, load } = setup();
  const hook = load();
  hook([job('A')], 'L0281');
  hook([], 'L0281');
  hook([job('A')], 'L0281');
  assert.equal(alerts.length, 0);
  hook([job('B'), job('B'), job('H', true), job('X')], 'L0281', 'X');
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].title, 'มีเคสใหม่ค่ะ');
  hook([job('H', true), job('X')], 'L0281');
  assert.equal(alerts.length, 1);
});

test('each employee has a separate baseline and memory works without storage', () => {
  const { alerts, load } = setup(new Map(), true);
  const hook = load();
  hook([job('A')], 'L0281');
  hook([job('A'), job('B')], 'L0281');
  hook([], '');
  hook([job('A'), job('B')], 'L0281');
  assert.equal(alerts.length, 1);
  hook([job('A'), job('B')], 'F3939');
  assert.equal(alerts.length, 1);
  hook([job('A'), job('B'), job('C')], 'F3939');
  assert.equal(alerts.length, 2);
});

test('detail and dashboard share history; active work suppresses alerts without removing jobs', () => {
  const { alerts, load } = setup();
  const hook = load();
  const waitingJobs = [job('A'), job('B')];
  hook([job('A')], 'L0281');
  // A new job arrives while looking at A's details.
  hook(waitingJobs, 'L0281', 'A');
  assert.equal(alerts.length, 1);
  // Back to the dashboard, then finished tab: no repeat.
  hook(waitingJobs, 'L0281');
  hook(waitingJobs, 'L0281');
  assert.equal(alerts.length, 1);
  // Work accepted: record the queue without displaying notifications.
  const busyJobs = [...waitingJobs, job('C')];
  hook(busyJobs, 'L0281', undefined, false);
  assert.equal(alerts.length, 1);
  hook(busyJobs, 'L0281');
  assert.equal(alerts.length, 1);
  hook([...busyJobs, job('D')], 'L0281');
  assert.equal(alerts.length, 2);
  assert.deepEqual(waitingJobs.map(item => item.reqNo), ['A', 'B']);
  assert.deepEqual(busyJobs.map(item => item.reqNo), ['A', 'B', 'C']);
});
