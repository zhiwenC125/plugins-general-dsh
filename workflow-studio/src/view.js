import { graphWaves, runName, RUN_KIND } from './graph.js';

const h = (...args) => React.createElement(...args);
const { useState, useRef, useMemo, useEffect } = React;
const button = (label, onClick, extra = {}) => h('button', { type: 'button', onClick, ...extra }, label);


// Keep the resident native Chat and composer untouched. The canvas is a sibling
// of their scrollport, mounted from the session header's independent slot.
function StudioCanvasPortal(props) {
  const anchor = useRef(null);
  const [container, setContainer] = useState(null);
  const view = props.useStore(value => value.view);
  const active = view == null || view === 'chat' || view === 'workflow-studio';
  React.useLayoutEffect(() => {
    const root = anchor.current?.closest('[data-phase]');
    if (!root) return;
    const sync = () => setContainer(root.querySelector('[data-conversation-content]'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true });
    return () => observer.disconnect();
  }, [props.sessionId]);
  useEffect(() => { if (view === 'workflow-studio') props.restoreChat(); }, [view]);
  return h(React.Fragment, null,
    h('span', { ref: anchor, hidden: true }),
    active && container ? ReactDOM.createPortal(h(StudioView, props), container) : null);
}

/** Workflow canvas with the native conversation mounted in its right sidebar. */
function StudioView(props) {
  const { t } = props;
  const rows = props.useStudio(v => v);
  const sessions = props.useSessions(v => v);
  const running = props.useSession(v => v.running);
  const [selectedNode, setSelectedNode] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [offset, setOffset] = useState({ x: 36, y: 80, scale: 1 });
  const [positions, setPositions] = useState({});
  const viewport = useRef(null), gesture = useRef(null);
  const focused = useRef(null), wasRunning = useRef(false);

  const versions = rows.filter(r => r.data.type === 'result');
  const selected = versions.find(r => r.key === selectedVersion) ?? versions.at(-1);
  const plan = selected?.data.plan;
  const result = selected?.data.kind === RUN_KIND ? selected.data : null;
  const liveRun = plan ? rows.filter(r => r.data.type === 'run' && r.data.name === runName(plan)).at(-1)?.data : null;
  const run = result ? rows.find(r => r.data.type === 'run' && r.data.runId === result.runId)?.data : liveRun;

  const statusFor = n => run?.members.find(m => m.phase === n.id)?.status ?? (run && run.status !== 'running' ? 'blocked' : 'ready');
  const runRunning = run?.status === 'running';

  // Fit once on entry/new workflow and at the start of an interaction. Streaming
  // updates never reclaim the viewport after the user has panned or moved nodes.
  useEffect(() => {
    if (plan && (focused.current !== plan.id || (running && !wasRunning.current))) {
      fit(); focused.current = plan.id;
    }
    wasRunning.current = running;
  }, [plan?.id, running]);

  const layout = useMemo(() => {
    if (!plan) return {};
    try { return Object.fromEntries(graphWaves(plan).flatMap((wave, x) => wave.map((n, y) => [n.id, { x: x * 320, y: y * 300 }]))); }
    catch { return Object.fromEntries(plan.nodes.map((n, i) => [n.id, { x: i * 320, y: 0 }])); }
  }, [plan]);
  const pos = n => positions[n.id] ?? layout[n.id] ?? { x: 0, y: 0 };

  function selectNode(id) { setSelectedNode(id); setExpanded(prev => ({ ...prev, [id]: true })); setError(''); }
  function toggleExpand(id) { setExpanded(prev => ({ ...prev, [id]: false })); if (selectedNode === id) setSelectedNode(null); }

  async function submitRun() {
    if (!plan || busy || runRunning) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await props.send(t('runRequest'), undefined);
      setNotice(t('pending'));
    } catch (e) { setError(String(e.message ?? e)); }
    finally { setBusy(false); }
  }
  function openChildFor(childId) {
    if (!childId) { setError(t('noChild')); return; }
    const child = sessions.byId?.[childId];
    if (!child) { setError(t('unknown')); return; }
    const mode = sessions.projectionsBySession?.[childId]?.values?.subagent?.mode;
    props.openChild({ parentSessionId: props.sessionId, childSessionId: childId, ...(mode ? { mode } : {}) });
  }
  function fit() {
    if (!plan || !viewport.current) return;
    const bounds = plan.nodes.map(n => pos(n));
    const left = Math.min(...bounds.map(p => p.x)), top = Math.min(...bounds.map(p => p.y));
    const width = Math.max(...bounds.map(p => p.x + 260)) - left;
    const height = Math.max(...bounds.map(p => p.y + 260)) - top;
    const w = viewport.current.clientWidth, h = viewport.current.clientHeight;
    const scale = Math.min(1, Math.max(0.15, Math.min((w - 64) / width, (h - 100) / height)));
    setOffset({ x: (w - width * scale) / 2 - left * scale, y: Math.max(24, (h - height * scale) / 2 - 25) - top * scale, scale });
  }
  function wheel(e) {
    if (!e.ctrlKey && !e.metaKey) { setOffset(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY })); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    setOffset(v => { const scale = Math.max(0.25, Math.min(2, v.scale * Math.exp(-e.deltaY / 500))); return { scale, x: x - (x - v.x) * scale / v.scale, y: y - (y - v.y) * scale / v.scale }; });
  }
  function begin(e, id) {
    if (e.button !== 0 || e.target.closest('button,input,select,textarea')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { id, x: e.clientX, y: e.clientY, start: id ? pos({ id }) : offset };
    if (id) setSelectedNode(id);
    e.stopPropagation();
  }
  function move(e) {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (g.id) setPositions(p => ({ ...p, [g.id]: { x: g.start.x + dx / offset.scale, y: g.start.y + dy / offset.scale } }));
    else setOffset(p => ({ ...p, x: g.start.x + dx, y: g.start.y + dy }));
  }

  function progress(status) {
    return h('div', { className: 'ws-progress' }, h('div', { className: `ws-progress-fill ws-fill-${status}`, style: status === 'completed' || status === 'failed' ? { width: '100%' } : status === 'running' ? undefined : { width: '0%' } }));
  }

  function nodeCard(n) {
    const status = statusFor(n);
    const isOpen = expanded[n.id] === true || status === 'running' || n.id === selectedNode;
    const out = result?.outputs?.[n.id];
    const tr = result?.traces?.[n.id];
    const member = run?.members.find(m => m.phase === n.id);
    const childId = member?.childId ?? out?.childId;
    const liveCalls = member?.calls;
    const liveTool = member?.lastTool;
    const upstreamIds = plan.edges.filter(e => e.to === n.id).map(e => e.from);
    return h('article', {
      key: n.id,
      className: `ws-node ${selectedNode === n.id ? 'ws-selected' : ''} ${isOpen ? 'ws-open' : ''}`,
      'data-status': status,
      style: { left: pos(n).x, top: pos(n).y },
      onPointerDown: e => begin(e, n.id),
    },
      h('div', { className: 'ws-node-top' }, h('span', { className: 'ws-dot' }), h('span', null, t(status)), childId && h('span', { className: 'ws-node-child' }, `· ${childId.slice(0, 8)}`)),
      progress(status),
      h('button', { className: 'ws-node-title', onClick: () => selectNode(n.id) }, n.label),
      h('p', { className: 'ws-node-role' }, n.role),
      h('div', { className: 'ws-inout' },
        h('div', { className: 'ws-io' }, h('span', { className: 'ws-io-tag' }, t('in')), h('div', { className: 'ws-io-text' }, n.task)),
        h('div', { className: 'ws-io' }, h('span', { className: 'ws-io-tag ws-io-out' }, t('out')), h('div', { className: 'ws-io-text' }, out?.text ?? n.output)),
      ),
      h('div', { className: 'ws-node-tools' }, `${n.skills.length} ${t('skillsCount')} · ${n.tools.length} ${t('toolsCount')}`),
      status === 'running' && liveCalls != null && h('div', { className: 'ws-live' }, `${t('calls')}: ${liveCalls}${liveTool ? ` · ${liveTool}` : ''}`),
      isOpen && h('div', { className: 'ws-node-detail' },
        h('h4', null, t('task')), h('p', { className: 'ws-detail-text' }, n.task),
        upstreamIds.length
          ? h('div', null, h('h4', null, t('upstream')), h('p', { className: 'ws-detail-text' }, upstreamIds.map(id => plan.nodes.find(x => x.id === id)?.label ?? id).join(' → ')))
          : h('p', { className: 'ws-help' }, t('noEdges')),
        h('h4', null, t('actual')), h('pre', { className: 'ws-result' }, out?.text ?? t('noOutput')),
        tr?.length
          ? h('div', null, h('h4', null, t('trace')), tr.slice(0, 6).map((call, i) => h('div', { key: i, className: 'ws-call' }, `${call.isError ? '×' : '✓'} ${call.name}`)))
          : h('p', { className: 'ws-help' }, t('noTrace')),
        childId && h('button', { className: 'ws-child-btn', onClick: () => openChildFor(childId) }, t('openChild')),
        h('button', { className: 'ws-collapse', onClick: () => toggleExpand(n.id) }, t('collapse')),
      ),
    );
  }

  return h('section', { className: 'ws-root', 'data-workflow-studio': true },
    h('header', { className: 'ws-header' },
      h('div', null, h('h2', null, plan?.title ?? t('title')), h('p', null, plan ? (run ? `${t(run.status)} · ${run.runId?.slice(0, 8)}` : t('ready')) : t('subtitle'))),
      h('div', { className: 'ws-actions' },
        versions.length > 1 && h('select', {
          className: 'ws-history', value: selected?.key ?? '', 'aria-label': t('history'),
          onChange: e => { setSelectedVersion(e.target.value); setSelectedNode(null); setPositions({}); setError(''); },
        }, versions.map(v => h('option', { key: v.key, value: v.key }, `v${v.data.plan.revision} · ${v.data.status ? t(v.data.status) : t('ready')}`))),
        plan && button(t('run'), submitRun, { className: 'ws-primary', disabled: busy || runRunning }),
        button(t('reset'), fit)),
    ),
    (error || notice) && h('div', { className: error ? 'ws-notice ws-error' : 'ws-notice', role: error ? 'alert' : 'status' }, error || notice),
    h('div', { className: 'ws-body' },
      h('div', {
        className: 'ws-canvas', ref: viewport, onWheel: wheel, onPointerDown: e => begin(e), onPointerMove: move,
        onPointerUp: () => { gesture.current = null; }, onPointerCancel: () => { gesture.current = null; }, tabIndex: 0, 'aria-label': t('tab'),
      },
        !plan
          ? h('div', { className: 'ws-empty' }, h('div', { className: 'ws-symbol' }, '◇'), h('h3', null, t('empty')), h('p', null, t('emptyHelp')))
          : h('div', { className: 'ws-world', style: { transform: `translate(${offset.x}px, ${offset.y}px) scale(${offset.scale})` } },
              h('svg', { className: 'ws-edges', width: 1, height: 1, 'aria-hidden': true }, plan.edges.map(e => {
                const a = pos({ id: e.from }), b = pos({ id: e.to });
                return h('path', { key: `${e.from}-${e.to}`, d: `M ${a.x + 260} ${a.y + 90} C ${a.x + 292} ${a.y + 90}, ${b.x - 32} ${b.y + 90}, ${b.x} ${b.y + 90}`, className: statusFor({ id: e.from }) === 'completed' ? 'ws-edge-done' : '' });
              })),
              plan.nodes.map(nodeCard)),
        h('div', { className: 'ws-controls' },
          button('−', () => setOffset(o => ({ ...o, scale: Math.max(0.25, o.scale - 0.1) })), { 'aria-label': t('zoomOut') }),
          h('span', null, `${Math.round(offset.scale * 100)}%`),
          button('+', () => setOffset(o => ({ ...o, scale: Math.min(2, o.scale + 0.1) })), { 'aria-label': t('zoomIn') }),
          button(t('reset'), fit))),
  ));
}
