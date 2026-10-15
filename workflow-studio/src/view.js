import { layoutFor, orchestratorPosition } from './layout.js';

const h = (...args) => React.createElement(...args);
const { useEffect, useMemo, useRef, useState } = React;

function statusText(status, t) {
  return t(status in { running: 1, completed: 1, failed: 1, cancelled: 1, interrupted: 1 } ? status : 'interrupted');
}

function phaseName(phase, t) {
  return phase === null || phase === '' ? t('unassigned') : phase;
}

function compact(text, fallback, limit = 92) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return fallback;
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

/** Dedicated Workflow view driven by durable workflow and child Session facts. */
function StudioView(props) {
  const snapshot = props.useWorkflowStudio(value => value);
  const runs = snapshot.runs;
  const [requestedRun, setRequestedRun] = useState(null);
  const run = runs.find(candidate => candidate.runId === requestedRun) ?? runs.at(-1);
  const [selectedSeq, setSelectedSeq] = useState(null);
  const selected = run?.members.find(member => member.seq === selectedSeq) ?? null;
  const [previews, setPreviews] = useState({});
  const selectedPreview = selected ? previews[selected.childId] : null;
  const [unavailableChild, setUnavailableChild] = useState(false);
  const [offset, setOffset] = useState({ x: 28, y: 28, scale: 1 });
  const viewport = useRef(null);
  const gesture = useRef(null);
  const previousRun = useRef(null);
  const positions = useMemo(() => run ? layoutFor(run) : new Map(), [run]);
  const rootPosition = useMemo(() => run ? orchestratorPosition(run) : { x: 48, y: 116 }, [run]);
  const childKey = run?.members.map(member => member.childId).join('\u0000') ?? '';

  useEffect(() => {
    setPreviews({});
    if (!run) return undefined;
    return props.watchChildren(run.members.map(member => member.childId), setPreviews);
  }, [run?.runId, childKey]);

  function fit() {
    if (!run || !viewport.current || run.members.length === 0) {
      setOffset({ x: 28, y: 28, scale: 1 });
      return;
    }
    const points = [rootPosition, ...positions.values()];
    const left = Math.min(...points.map(point => point.x));
    const top = 24;
    const right = Math.max(...points.map(point => point.x + 280));
    const bottom = Math.max(...points.map(point => point.y + 172));
    const width = right - left;
    const height = bottom - top;
    const availableWidth = viewport.current.clientWidth - 64;
    const availableHeight = viewport.current.clientHeight - 64;
    const scale = Math.min(1, Math.max(0.28, Math.min(availableWidth / width, availableHeight / height)));
    setOffset({
      x: (viewport.current.clientWidth - width * scale) / 2 - left * scale,
      y: Math.max(24, (viewport.current.clientHeight - height * scale) / 2) - top * scale,
      scale,
    });
  }

  useEffect(() => {
    if (!run || previousRun.current === run.runId) return;
    previousRun.current = run.runId;
    setSelectedSeq(null);
    setUnavailableChild(false);
    fit();
  }, [run?.runId]);

  function beginPan(event) {
    if (event.button !== 0 || event.target.closest('button,select')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { x: event.clientX, y: event.clientY, start: offset };
  }

  function movePan(event) {
    const current = gesture.current;
    if (!current) return;
    setOffset({ ...current.start, x: current.start.x + event.clientX - current.x, y: current.start.y + event.clientY - current.y });
  }

  function wheel(event) {
    event.preventDefault();
    if (!event.ctrlKey && !event.metaKey) {
      setOffset(current => ({ ...current, x: current.x - event.deltaX, y: current.y - event.deltaY }));
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    setOffset(current => {
      const scale = Math.max(0.28, Math.min(1.8, current.scale * Math.exp(-event.deltaY / 500)));
      return { scale, x: pointerX - (pointerX - current.x) * scale / current.scale, y: pointerY - (pointerY - current.y) * scale / current.scale };
    });
  }

  function openSelected() {
    if (selected) setUnavailableChild(!props.openChild(selected.childId));
  }

  const t = props.t;
  return h('section', { className: 'ws-root', 'data-workflow-studio': true },
    h('header', { className: 'ws-header' },
      h('div', { className: 'ws-heading' },
        h('div', { className: 'ws-title-row' },
          h('h2', null, run?.name || t('title')),
          run && h('span', { className: `ws-status ws-status-${run.status}` }, statusText(run.status, t))),
        h('p', null, t('live'))),
      h('div', { className: 'ws-actions' },
        runs.length > 1 && h('select', {
          value: run?.runId ?? '', 'aria-label': t('latest'), onChange: event => setRequestedRun(event.target.value),
        }, runs.map((candidate, index) => h('option', { key: candidate.runId, value: candidate.runId },
          `${index + 1}. ${candidate.name} · ${statusText(candidate.status, t)}`))),
        h('button', { type: 'button', onClick: fit }, t('fit')))),
    !run
      ? h('div', { className: 'ws-empty' },
          h('div', { className: 'ws-empty-icon', 'aria-hidden': true }, '⌘'),
          h('h3', null, t('empty')),
          h('p', null, t('emptyHelp')))
      : h('div', { className: 'ws-content' },
          h('div', {
            className: 'ws-canvas', ref: viewport, tabIndex: 0, onWheel: wheel,
            onPointerDown: beginPan, onPointerMove: movePan,
            onPointerUp: () => { gesture.current = null; }, onPointerCancel: () => { gesture.current = null; },
          },
            run.members.length === 0
              ? h('div', { className: 'ws-waiting' }, h('span', { className: 'ws-spinner' }), t('waiting'))
              : h('div', { className: 'ws-world', style: { transform: `translate(${offset.x}px, ${offset.y}px) scale(${offset.scale})` } },
                  h('svg', { className: 'ws-phase-links', width: 1, height: 1, 'aria-label': t('relation') },
                    h('defs', null, h('marker', { id: 'ws-arrow', markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: 'auto' },
                      h('path', { d: 'M0,0 L8,4 L0,8 Z', className: 'ws-arrow-head' }))),
                    run.members.map(member => {
                      const position = positions.get(member.seq);
                      const x1 = rootPosition.x + 280;
                      const y1 = rootPosition.y + 78;
                      const x2 = position.x;
                      const y2 = position.y + 78;
                      return h('path', { key: member.seq, className: 'ws-agent-link', markerEnd: 'url(#ws-arrow)',
                        d: `M ${x1} ${y1} C ${x1 + 54} ${y1}, ${x2 - 54} ${y2}, ${x2} ${y2}` });
                    })),
                  h('div', { className: 'ws-root-node', style: { left: rootPosition.x, top: rootPosition.y } },
                    h('span', { className: 'ws-node-kicker' }, t('orchestratorRole')),
                    h('strong', null, props.orchestrator.title),
                    h('span', { className: 'ws-node-id' }, props.orchestrator.id),
                    h('p', null, t('orchestratorHelp'))),
                  run.phases.map((phase, index) => h('div', { key: phase.key, className: 'ws-phase-label', style: { left: 430 + index * 360, top: 30 } },
                    h('span', { className: 'ws-phase-index' }, index + 1),
                    h('span', null, phaseName(phase.phase, t)),
                    h('small', null, `${phase.members.length} ${t('members')}`))),
                  run.members.map(member => {
                    const position = positions.get(member.seq);
                    const preview = previews[member.childId];
                    const runtime = [preview?.provider, preview?.model].filter(Boolean).join(' · ') || t('subagent');
                    const inputFallback = preview?.limited ? t('previewLimited') : t('loadingInput');
                    return h('button', {
                      type: 'button', key: member.seq,
                      className: `ws-node ${selected?.seq === member.seq ? 'ws-node-selected' : ''}`,
                      'data-status': member.status, style: { left: position.x, top: position.y },
                      onClick: event => { event.stopPropagation(); setSelectedSeq(member.seq); setUnavailableChild(false); },
                      onDoubleClick: event => { event.stopPropagation(); setUnavailableChild(!props.openChild(member.childId)); },
                    },
                      h('span', { className: 'ws-node-top' },
                        h('span', { className: 'ws-dot' }), h('span', null, statusText(member.status, t)),
                        h('span', { className: 'ws-runtime' }, runtime)),
                      h('strong', null, member.label || t('unnamed')),
                      h('span', { className: 'ws-io' }, h('b', null, t('input')), compact(preview?.input, inputFallback)),
                      h('span', { className: 'ws-io' }, h('b', null, t('output')), compact(preview?.output, member.status === 'running' ? t('generating') : t('noOutput'))),
                      preview?.files?.length > 0 && h('span', { className: 'ws-file-count' }, t('filesCount', { count: preview.files.length })),
                      h('span', { className: 'ws-progress' }, h('span', { className: 'ws-progress-fill' })));
                  })),
            h('div', { className: 'ws-legend' }, t('relation')),
            h('div', { className: 'ws-controls' },
              h('button', { type: 'button', 'aria-label': t('zoomOut'), onClick: () => setOffset(value => ({ ...value, scale: Math.max(0.28, value.scale - 0.1) })) }, '−'),
              h('span', null, `${Math.round(offset.scale * 100)}%`),
              h('button', { type: 'button', 'aria-label': t('zoomIn'), onClick: () => setOffset(value => ({ ...value, scale: Math.min(1.8, value.scale + 0.1) })) }, '+'))),
          selected && h('aside', { className: 'ws-inspector' },
            h('div', { className: 'ws-inspector-head' },
              h('h3', null, t('details')),
              h('button', { type: 'button', onClick: () => { setSelectedSeq(null); setUnavailableChild(false); }, 'aria-label': t('close') }, '×')),
            h('span', { className: `ws-status ws-status-${selected.status}` }, statusText(selected.status, t)),
            h('h4', null, selected.label || t('unnamed')),
            h('dl', null,
              h('dt', null, t('phase')), h('dd', null, phaseName(selected.phase ?? null, t)),
              h('dt', null, t('runtime')), h('dd', null, [selectedPreview?.provider, selectedPreview?.model].filter(Boolean).join(' · ') || t('subagent')),
              h('dt', null, t('childSession')), h('dd', { className: 'ws-mono' }, selected.childId)),
            h('section', { className: 'ws-preview-section' }, h('h5', null, t('input')),
              h('pre', null, selectedPreview?.input || (selectedPreview?.limited ? t('previewLimited') : t('loadingInput')))),
            h('section', { className: 'ws-preview-section' }, h('h5', null, t('output')),
              h('pre', null, selectedPreview?.output || (selected.status === 'running' ? t('generating') : t('noOutput')))),
            h('section', { className: 'ws-preview-section' },
              h('h5', null, t('artifacts')),
              selectedPreview?.files?.length
                ? h('div', { className: 'ws-artifacts' }, selectedPreview.files.map(path => h('button', {
                    type: 'button', key: path, title: path, onClick: () => props.openFile(selected.childId, path),
                  }, path)))
                : h('p', { className: 'ws-hint' }, t('noArtifacts'))),
            h('button', { type: 'button', className: 'ws-open-child', onClick: openSelected }, t('openChild')),
            unavailableChild && h('p', { className: 'ws-child-unavailable', role: 'status' }, t('childUnavailable')),
            h('p', { className: 'ws-hint' }, t('phaseHint')))));
}
