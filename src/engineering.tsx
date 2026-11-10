import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { ARCHITECTURES, STUDIES, type Architecture, type ArchNode, type Study } from './engineeringData';

const NODE_W = 200, NODE_H = 90, COL = 245, ROW = 135, PAD = 15;
const VB_W = PAD * 2 + COL * 3 + NODE_W - 30, VB_H = PAD * 2 + ROW * 2 + NODE_H - 30;
const pos = (n: ArchNode) => ({ x: PAD + n.col * COL, y: PAD + n.row * ROW });

/** Point where the line from a's centre towards b's centre leaves a's rectangle. */
function anchor(a: ArchNode, b: ArchNode) {
  const pa = pos(a), pb = pos(b);
  const cx = pa.x + NODE_W / 2, cy = pa.y + NODE_H / 2;
  const dx = pb.x + NODE_W / 2 - cx, dy = pb.y + NODE_H / 2 - cy;
  const t = Math.min(dx !== 0 ? (NODE_W / 2) / Math.abs(dx) : Infinity, dy !== 0 ? (NODE_H / 2) / Math.abs(dy) : Infinity);
  return { x: cx + dx * t, y: cy + dy * t };
}

/** Interactive diagram for one project: click a component, or trace a request step by step. */
export function ArchExplorer({ arch, onStudy }: { arch: Architecture; onStudy: (id: string) => void }) {
  const byId = useMemo(() => new Map(arch.nodes.map(n => [n.id, n])), [arch]);
  const [selected, setSelected] = useState<string>(arch.nodes[1]?.id ?? arch.nodes[0].id);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const uid = useId();

  const flow = arch.flows.find(f => f.id === flowId) ?? null;
  const startFlow = (id: string) => { setFlowId(id); setStep(0); setPlaying(false); };
  const stopFlow = () => { setFlowId(null); setStep(0); setPlaying(false); };

  // Autoplay: advance every 2.2 s, stop on the last step.
  useEffect(() => {
    if (!playing || !flow) return;
    if (step >= flow.steps.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), 2200);
    return () => clearTimeout(t);
  }, [playing, step, flow]);

  const visited = new Set(flow ? flow.steps.slice(0, step + 1).map(s => s.node) : []);
  const current = flow ? flow.steps[step].node : null;
  const litEdges = new Set<string>();
  if (flow) for (let i = 0; i < step; i++) {
    const a = flow.steps[i].node, b = flow.steps[i + 1].node;
    litEdges.add(`${a}>${b}`); litEdges.add(`${b}>${a}`);
  }
  const focusId = current ?? selected;
  const focus = byId.get(focusId)!;

  const pick = (id: string) => { setSelected(id); if (flow) stopFlow(); };
  const onNodeKey = (id: string) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(id); }
  };

  return (
    <div className="exp-body">
      <div className="archwrap">
        <svg className="arch" viewBox={`0 0 ${VB_W} ${VB_H}`} role="group" aria-label={`${arch.label} architecture diagram. Use Tab to move between components.`}>
          <defs>
            <marker id={`${uid}-arr`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" className="arrowhead" />
            </marker>
          </defs>
          {arch.edges.map(([a, b]) => {
            const na = byId.get(a)!, nb = byId.get(b)!;
            const p1 = anchor(na, nb), p2 = anchor(nb, na);
            const lit = litEdges.has(`${a}>${b}`);
            return <line key={`${a}-${b}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className={`edge${lit ? ' lit' : ''}`} markerEnd={`url(#${uid}-arr)`} />;
          })}
          {arch.nodes.map(n => {
            const { x, y } = pos(n);
            const cls = ['node', `k-${n.kind}`, focusId === n.id ? 'sel' : '', visited.has(n.id) ? 'seen' : '', current === n.id ? 'now' : ''].join(' ');
            return (
              <g key={n.id} className={cls} transform={`translate(${x} ${y})`} role="button" tabIndex={0}
                aria-pressed={focusId === n.id} aria-label={`${n.label}: ${n.sub}`}
                onClick={() => pick(n.id)} onKeyDown={onNodeKey(n.id)}>
                <rect width={NODE_W} height={NODE_H} rx="12" className="box" />
                <rect width="6" height={NODE_H} rx="3" className="stripe" />
                <text x="22" y="38" className="nlabel">{n.label}</text>
                <text x="22" y="62" className="nsub">{n.sub}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <aside className="exp-panel" aria-live="polite">
        {flow ? (
          <>
            <h4>{flow.name}</h4>
            <p className="stepcount">Step {step + 1} of {flow.steps.length} · {byId.get(flow.steps[step].node)!.label}</p>
            <p>{flow.steps[step].text}</p>
            <div className="exp-actions">
              <button type="button" className="btn g" onClick={() => { setPlaying(false); setStep(s => Math.max(0, s - 1)); }} disabled={step === 0}>Back</button>
              {playing
                ? <button type="button" className="btn g" onClick={() => setPlaying(false)}>Pause</button>
                : <button type="button" className="btn p" onClick={() => { if (step >= flow.steps.length - 1) setStep(0); setPlaying(true); }}>{step >= flow.steps.length - 1 ? 'Replay' : 'Play'}</button>}
              <button type="button" className="btn g" onClick={() => { setPlaying(false); setStep(s => Math.min(flow.steps.length - 1, s + 1)); }} disabled={step >= flow.steps.length - 1}>Next</button>
              <button type="button" className="btn g" onClick={stopFlow}>Exit trace</button>
            </div>
          </>
        ) : (
          <>
            <h4>{focus.label}</h4>
            <p className="stepcount">{focus.sub}</p>
            <p>{focus.desc}</p>
            <div className="chips">{focus.tech.map(t => <span key={t}>{t}</span>)}</div>
            {focus.study && (
              <button type="button" className="btn g" onClick={() => onStudy(focus.study!)}>
                Engineering note: {STUDIES.find(s => s.id === focus.study)?.title}
              </button>
            )}
          </>
        )}
        <div className="exp-flows">
          <span>Trace a request</span>
          {arch.flows.map(f => (
            <button key={f.id} type="button" className={`btn g${flowId === f.id ? ' on' : ''}`} aria-pressed={flowId === f.id} onClick={() => startFlow(f.id)}>{f.name}</button>
          ))}
        </div>
      </aside>
    </div>
  );
}

/** Short engineering notes for one project; each opens to the mechanism and the trade-off. */
export function StudyList({ studies, openId, setOpenId }: { studies: Study[]; openId: string | null; setOpenId: (id: string | null) => void }) {
  return (
    <div className="studies">
      {studies.map(s => (
        <details key={s.id} id={`eng-${s.id}`} className="study" open={openId === s.id}
          onToggle={e => { const o = (e.currentTarget as HTMLDetailsElement).open; setOpenId(o ? s.id : (openId === s.id ? null : openId)); }}>
          <summary>
            <span className="stitle">{s.title}</span>
            <span className="chips">{s.tags.map(t => <span key={t}>{t}</span>)}</span>
          </summary>
          <div className="sbody">
            <p className="sctx">{s.context}</p>
            <h5>How it works</h5>
            {s.mechanism.map((m, i) => <p key={i}>{m}</p>)}
            <h5>Trade-off</h5>
            <p>{s.tradeoffs}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
