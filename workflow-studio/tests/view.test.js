import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { graphWaves, runName, RUN_KIND, samplePlan } from '../src/graph.js';

// Small hook driver: exercise viewport transitions without a browser or model.
function viewHarness() {
  const states = [], refs = [], effects = [];
  let cursor = 0, pending = [];
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity).filter(Boolean) }),
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useRef(initial) { const i = cursor++; return refs[i] ??= { current: initial }; },
    useMemo(fn) { cursor++; return fn(); },
    useEffect(fn, deps) { const i = cursor++; if (!effects[i] || deps.some((v, j) => v !== effects[i][j])) { effects[i] = deps; pending.push(fn); } },
  };
  const source = readFileSync(new URL('../src/view.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
  const View = vm.runInNewContext(`${source}\nStudioView`, { React, graphWaves, runName, RUN_KIND });
  let rows = [], running = false;
  const props = { t: key => key, useStudio: fn => fn(rows), useSessions: fn => fn({}), useSession: fn => fn({ running }), mountChat() {} };
  const all = node => [node, ...node.children.filter(x => typeof x === 'object').flatMap(all)];
  function render() {
    cursor = 0; pending = [];
    const tree = View(props);
    all(tree).find(n => n.props.className === 'ws-canvas').props.ref.current = { clientWidth: 800, clientHeight: 650 };
    pending.forEach(fn => fn());
    return tree;
  }
  return { render, all, setPlan(plan) { rows = [{ key: 'plan', data: { type: 'result', plan } }]; }, setRunning(value) { running = value; } };
}

test('first published graph is fitted; streaming revisions preserve manual viewport and node positions', () => {
  const v = viewHarness();
  const find = (tree, className) => v.all(tree).find(n => n.props.className === className);
  v.render();
  const plan = samplePlan(); v.setPlan(plan); v.setRunning(true); v.render();
  let tree = v.render();
  const fitted = find(tree, 'ws-world').props.style.transform;
  find(tree, 'ws-canvas').props.onWheel({ ctrlKey: false, metaKey: false, deltaX: 100, deltaY: 80 });
  tree = v.render();
  const panned = find(tree, 'ws-world').props.style.transform;
  assert.notEqual(panned, fitted);
  v.setPlan({ ...plan, revision: 2 }); tree = v.render();
  assert.equal(find(tree, 'ws-world').props.style.transform, panned);
  const card = v.all(tree).find(n => n.type === 'article');
  card.props.onPointerDown({ button: 0, target: { closest: () => null }, currentTarget: { setPointerCapture() {} }, pointerId: 1, clientX: 10, clientY: 10, stopPropagation() {} });
  find(tree, 'ws-canvas').props.onPointerMove({ clientX: 80, clientY: 50 });
  find(tree, 'ws-canvas').props.onPointerUp();
  tree = v.render();
  const movedLeft = v.all(tree).find(n => n.type === 'article').props.style.left;
  assert.ok(movedLeft > 0);
  v.all(tree).find(n => n.type === 'button' && n.children.includes('reset')).props.onClick();
  tree = v.render();
  assert.equal(v.all(tree).find(n => n.type === 'article').props.style.left, movedLeft);
  assert.equal(v.all(tree).filter(n => n.type === 'textarea').length, 0, 'Studio must not create a second composer');
  assert.equal(v.all(tree).filter(n => n.type === 'aside').length, 0, 'Native chat stays resident beside the canvas');
});

test('a new interaction fits once, without following each running update', () => {
  const v = viewHarness(); v.setPlan(samplePlan()); v.render();
  let tree = v.render();
  const canvas = v.all(tree).find(n => n.props.className === 'ws-canvas');
  canvas.props.onWheel({ deltaX: 200, deltaY: 200 }); tree = v.render();
  const transform = () => v.all(tree).find(n => n.props.className === 'ws-world').props.style.transform;
  const manual = transform();
  v.setRunning(true); v.render(); tree = v.render();
  assert.notEqual(transform(), manual);
  canvas.props.onWheel({ deltaX: 10, deltaY: 20 }); tree = v.render();
  const duringRun = transform(); tree = v.render(); assert.equal(transform(), duringRun);
});
