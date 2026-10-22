/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner uses CommonJS. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function compile(path) {
  return ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
}

function setup() {
  const cacheModule = { exports: {} };
  new Function('exports', compile('lib/porter-dashboard-cache.ts'))(cacheModule.exports);
  const cache = cacheModule.exports;
  const effects = [];
  const timers = new Map();
  const controllerRef = { current: null };
  let timerId = 0;
  let requests = 0;
  let respond;
  const window = {
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval() { return 0; }, clearInterval() {},
  };
  const mockedRequire = name => {
    if (name === 'react') return {
      useCallback: fn => fn, useRef: () => controllerRef,
      useState: () => ['', () => {}],
      useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
      useEffect: fn => effects.push(fn),
    };
    if (name === 'next/navigation') return { useRouter: () => ({ replace() {}, refresh() {} }) };
    if (name === '@/lib/porter-dashboard-cache') return cache;
    if (name === '@/components/porter-dashboard') return { __esModule: true, default: function Dashboard() {} };
    return require(name);
  };
  const target = { exports: {} };
  new Function('require', 'exports', 'window', 'document', 'fetch', compile('components/porter-dashboard-loader.tsx'))(
    mockedRequire, target.exports, window,
    { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    async () => { requests++; return new Promise(resolve => { respond = resolve; }); },
  );
  const render = () => {
    effects.length = 0;
    return target.exports.default({ expectedStaffNo: 'L0281', viewMode: 'ศูนย์เปล ER' });
  };
  const start = () => {
    const cleanups = effects.map(fn => fn());
    for (const [id, timer] of [...timers]) if (timer.delay === 0) { timers.delete(id); timer.fn(); }
    return () => cleanups.forEach(cleanup => cleanup?.());
  };
  return { cache, render, start, requests: () => requests, respond: value => respond(value) };
}

const snapshot = {
  staffNo: 'L0281', staffName: 'เจ้าหน้าที่ทดสอบ',
  jobs: [{ reqNo: 'A' }], alertJobs: [{ reqNo: 'A' }], hasActiveJob: false,
};

test('back navigation renders cached user and jobs before the API responds, then replaces them', async () => {
  const env = setup();
  const key = env.cache.dashboardCacheKey('l0281', 'ศูนย์เปล ER');
  env.cache.saveDashboardSnapshot(key, snapshot);
  const screen = env.render();
  assert.equal(screen.props.staffName, snapshot.staffName);
  assert.equal(screen.props.jobs.length, 1);
  const cleanup = env.start();
  assert.equal(env.requests(), 1);
  assert.equal(env.render().props.jobs.length, 1);
  env.respond({ ok: true, status: 200, json: async () => ({ success: true, ...snapshot, jobs: [], alertJobs: [] }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(env.render().props.jobs.length, 0);
  assert.equal(env.render().props.staffName, snapshot.staffName);
  cleanup();
});

test('first visit waits for data instead of showing an empty dashboard', () => {
  const env = setup();
  assert.equal(env.render().type, 'main');
  assert.equal(env.render().props.children.props.children, 'กำลังโหลดข้อมูล...');
});

test('cache is isolated by employee and view and notifies subscribers', () => {
  const { cache } = setup();
  let updates = 0;
  const unsubscribe = cache.subscribeDashboardCache(() => updates++);
  const key = cache.dashboardCacheKey('L0281', 'ศูนย์เปล ER');
  cache.saveDashboardSnapshot(key, snapshot);
  assert.equal(cache.getDashboardSnapshot(cache.dashboardCacheKey('l0281', 'ศูนย์เปล ER')), snapshot);
  assert.equal(cache.getDashboardSnapshot(cache.dashboardCacheKey('F3939', 'ศูนย์เปล ER')), null);
  assert.equal(cache.getDashboardSnapshot(cache.dashboardCacheKey('L0281', 'finished')), null);
  assert.equal(cache.getServerDashboardSnapshot(), null);
  assert.equal(updates, 1);
  unsubscribe();
  cache.saveDashboardSnapshot(key, snapshot);
  assert.equal(updates, 1);
});

test('unmounted requests cannot overwrite the cached dashboard', async () => {
  const env = setup();
  const key = env.cache.dashboardCacheKey('L0281', 'ศูนย์เปล ER');
  env.cache.saveDashboardSnapshot(key, snapshot);
  env.render();
  const cleanup = env.start();
  cleanup();
  env.respond({ ok: true, status: 200, json: async () => ({ success: true, ...snapshot, jobs: [] }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(env.cache.getDashboardSnapshot(key), snapshot);
});

test('accept removes waiting cards across centers but preserves history and other employees', () => {
  const { cache } = setup();
  for (const view of ['ศูนย์เปล ER', 'ศูนย์เปล OPD', 'finished']) {
    cache.saveDashboardSnapshot(cache.dashboardCacheKey('L0281', view), snapshot);
  }
  const otherKey = cache.dashboardCacheKey('F3939', 'ศูนย์เปล ER');
  cache.saveDashboardSnapshot(otherKey, { ...snapshot, staffNo: 'F3939' });
  cache.removeWaitingDashboardJob('l0281', 'A', true);
  for (const view of ['ศูนย์เปล ER', 'ศูนย์เปล OPD']) {
    const updated = cache.getDashboardSnapshot(cache.dashboardCacheKey('L0281', view));
    assert.equal(updated.jobs.length, 0);
    assert.equal(updated.alertJobs.length, 0);
    assert.equal(updated.hasActiveJob, true);
  }
  assert.equal(cache.getDashboardSnapshot(cache.dashboardCacheKey('L0281', 'finished')).jobs.length, 1);
  assert.equal(cache.getDashboardSnapshot(otherKey).jobs.length, 1);
  assert.equal(cache.getDashboardSnapshot(otherKey).hasActiveJob, false);
});
