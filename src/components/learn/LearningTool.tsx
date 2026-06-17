import { useState, useMemo, useCallback, useEffect } from 'react';
import { Brain, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { Domain, NodeState, AuthoringState } from '../../lib/rct/types';
import { STAGES } from '../../lib/rct/types';
import { gradeConvergence } from '../../lib/rct/grading';
import { DAY, dueIn, nextInterval, freshNodeState } from '../../lib/rct/retention';
import { storageKeyFor } from '../../lib/rct/utils';
import { upsertRctEvidence } from '../../lib/rct/skillsSync';
import { isRctMigrationError } from '../../lib/skillsSchema';
import { useAuth } from '../../context/useAuth';
import Graph from './Graph';
import Probe from './Probe';

interface LearningToolProps {
  domain: Domain;
  domainKey: string;
  focusNodeId?: string | null;
  onFocusHandled?: () => void;
}

export default function LearningTool({ domain, domainKey, focusNodeId, onFocusHandled }: LearningToolProps) {
  const { user } = useAuth();
  const nodes = domain.nodes;
  const STORAGE_KEY = storageKeyFor(domainKey);
  const byId = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);

  const [state, setState] = useState<Record<string, NodeState>>(() => {
    const s: Record<string, NodeState> = {};
    nodes.forEach(n => { s[n.id] = freshNodeState(n.requires); });
    return s;
  });
  const [active, setActive] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; phase: string; msg: string; awIndex?: number; graded?: string } | null>(null);
  const [grading, setGrading] = useState(false);
  const [hintTier, setHintTier] = useState(0);
  const [compressed, setCompressed] = useState(false);
  const [showPom, setShowPom] = useState(false);
  const [epistemicStage, setEpistemicStage] = useState(0);
  const [authoring, setAuthoring] = useState<AuthoringState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [clockOffset, setClockOffset] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');
  const [focusNotice, setFocusNotice] = useState('');

  const simNow = now + clockOffset;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setLoaded(false);
    const fresh: Record<string, NodeState> = {};
    nodes.forEach(n => { fresh[n.id] = freshNodeState(n.requires); });
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.__stage !== undefined) setEpistemicStage(saved.__stage);
        const nodeState = saved.__nodes || saved;
        Object.keys(nodeState).forEach(id => {
          if (fresh[id]) fresh[id] = { ...fresh[id], ...nodeState[id] };
        });
      }
    } catch { /* first run */ }
    setState(fresh);
    setActive(null);
    setAnswer('');
    setFeedback(null);
    setHintTier(0);
    setAuthoring(null);
    setLoaded(true);
  }, [STORAGE_KEY, nodes]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ __nodes: state, __stage: epistemicStage }));
    } catch { /* storage unavailable */ }
  }, [state, epistemicStage, loaded, STORAGE_KEY]);

  const view = useMemo(() => {
    const s: Record<string, NodeState> = {};
    nodes.forEach(n => { s[n.id] = { ...state[n.id] }; });
    nodes.forEach(n => {
      const st = s[n.id];
      if (st.cleared >= 0) {
        const overdue = -dueIn(st, simNow);
        const interval = nextInterval(st.reps || 0, st.cret);
        if (overdue > interval) {
          st.cleared -= 1;
          st.reps = Math.max(0, (st.reps || 0) - 1);
          st.lastRetrieved = simNow;
        }
      }
    });
    nodes.forEach(n => {
      if (!s[n.id].unlocked && n.requires.every(r => s[r].cleared >= 0)) s[n.id].unlocked = true;
    });
    return s;
  }, [state, simNow, nodes]);

  const dueQueue = useMemo(() =>
    nodes
      .filter(n => view[n.id].cleared >= 0 && dueIn(view[n.id], simNow) <= 0)
      .map(n => ({ id: n.id, label: n.label, overdueDays: Math.round(-dueIn(view[n.id], simNow) / DAY) }))
      .sort((a, b) => b.overdueDays - a.overdueDays),
    [view, nodes, simNow],
  );

  const fullySat = useCallback((id: string) => view[id].cleared >= view[id].depth && view[id].cleared >= 0, [view]);

  const regions = useMemo(() => {
    const sat = new Set(nodes.filter(n => fullySat(n.id)).map(n => n.id));
    const seen = new Set<string>();
    const out: { ids: string[]; meanCret: number }[] = [];
    const adj = (id: string) => [
      ...byId[id].requires,
      ...nodes.filter(m => m.requires.includes(id)).map(m => m.id),
    ].filter(x => sat.has(x));

    sat.forEach(id => {
      if (seen.has(id)) return;
      const stack = [id], g: string[] = [];
      while (stack.length) {
        const c = stack.pop()!;
        if (seen.has(c)) continue;
        seen.add(c);
        g.push(c);
        adj(c).forEach(x => !seen.has(x) && stack.push(x));
      }
      out.push({ ids: g, meanCret: g.reduce((a, id) => a + view[id].cret, 0) / g.length });
    });
    return out;
  }, [view, nodes, byId, fullySat]);

  const open = useCallback((id: string) => {
    if (!view[id].unlocked) return;
    setActive(id);
    setAnswer('');
    setFeedback(null);
    setHintTier(0);
    setAuthoring(null);
  }, [view]);

  const tryOpen = useCallback((id: string) => {
    if (view[id]?.unlocked) {
      setFocusNotice('');
      open(id);
      return;
    }
    const n = byId[id];
    if (!n) return;
    const missing = n.requires.find(r => view[r]?.cleared < 0);
    setFocusNotice(
      missing
        ? `Clear "${byId[missing].label}" first to unlock "${n.label}".`
        : `"${n.label}" is not unlocked yet — complete its prerequisites on the graph.`,
    );
  }, [view, byId, open]);

  useEffect(() => {
    if (!focusNodeId || !loaded) return;
    if (view[focusNodeId]?.unlocked) {
      open(focusNodeId);
      setFocusNotice('');
      onFocusHandled?.();
    } else if (byId[focusNodeId]) {
      const n = byId[focusNodeId];
      const missing = n.requires.find(r => view[r]?.cleared < 0);
      setFocusNotice(
        missing
          ? `Clear "${byId[missing].label}" first to unlock "${n.label}".`
          : `"${n.label}" is not unlocked yet — complete its prerequisites on the graph.`,
      );
      onFocusHandled?.();
    }
  }, [focusNodeId, loaded, view, open, onFocusHandled, byId]);

  // BUG-006: Close node modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active) {
        setActive(null);
        setAnswer('');
        setFeedback(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);


  const probeLevel = useCallback((id: string) => Math.min(view[id].depth, Math.max(0, view[id].cleared + 1)), [view]);

  const route = useCallback((n: typeof nodes[0]) => {
    const missing = n.requires.find(r => view[r].cleared < 0);
    if (missing) return { action: 'prereq', msg: `Clear "${byId[missing].label}" first, then this maps cleanly.` };
    const weak = n.requires.find(r => view[r].cret < 0.5);
    if (weak) return { action: 'reanchor', msg: `Revisit "${byId[weak].label}" so the anchor is solid.` };
    return { action: 'hint', msg: "You hold the anchor — the gap is the mapping itself. Here's a concrete bridge:" };
  }, [view, byId]);

  const submit = useCallback(async () => {
    if (!active) return;
    const n = byId[active];
    const lvl = probeLevel(active);
    const L = n.levels[lvl];
    const phase = feedback?.phase || 'witness';
    const aws = L.antiwitnesses || (L.antiwitness ? [L.antiwitness] : []);
    if (!answer.trim() || grading) return;

    setGrading(true);
    setState(s => ({ ...s, [active]: { ...s[active], attempts: s[active].attempts + 1 } }));

    if (phase === 'witness') {
      const g = await gradeConvergence({
        kind: 'witness',
        anchorKnown: L.anchor.known,
        newCase: L.newCase,
        prompt: L.witness.prompt,
        expectedMapping: L.hints[0],
        trap: null,
        answer,
        fallback: L.witness.accept,
      });
      setGrading(false);
      if (g.verdict === 'converged') {
        setFeedback({ ok: true, phase: 'anti', awIndex: 0, graded: g.graded,
          msg: `Mapped onto ${L.anchor.artifact} — convergence reached. Now survive the mutation${aws.length > 1 ? 's' : ''}.` });
        setAnswer('');
        setHintTier(0);
      } else if (g.verdict === 'shallow') {
        setState(s => ({ ...s, [active]: { ...s[active], shallowHits: s[active].shallowHits + 1 } }));
        setFeedback({ ok: false, phase: 'witness', graded: g.graded,
          msg: `True, but not anchored — connect it to ${L.anchor.artifact}. That's a shallow witness.` });
      } else {
        const r = route(n);
        if (r.action === 'hint') setHintTier(t => Math.max(t, 1));
        setFeedback({ ok: false, phase: 'witness', graded: g.graded, msg: r.msg });
      }
    } else {
      const idx = feedback?.awIndex || 0;
      const aw = aws[idx];
      const g = await gradeConvergence({
        kind: 'anti',
        anchorKnown: L.anchor.known,
        newCase: aw.mutation,
        prompt: aw.prompt,
        expectedMapping: L.hints[0],
        trap: aw.trap,
        answer,
        fallback: aw.accept,
      });
      setGrading(false);
      if (g.verdict === 'converged') {
        const nextIdx = idx + 1;
        if (nextIdx < aws.length) {
          setState(s => ({ ...s, [active]: { ...s[active], awSurvived: Math.max(s[active].awSurvived, nextIdx), lastRetrieved: simNow } }));
          setFeedback({ ok: true, phase: 'anti', awIndex: nextIdx, graded: g.graded,
            msg: `Survived mutation ${nextIdx}/${aws.length}. ${aws.length - nextIdx} to go.` });
          setAnswer('');
          setHintTier(0);
        } else {
          let newCret = 1;
          setState(s => {
            const st = s[active];
            const levelCret = Math.max(0, 1 - 0.3 * st.hintsUsed - 0.1 * Math.max(0, st.attempts - aws.length - 1) - 0.2 * st.shallowHits);
            const clearedCount = lvl + 1;
            newCret = (st.cret * Math.max(0, clearedCount - 1) + levelCret) / clearedCount;
            return { ...s, [active]: { ...st, cleared: Math.max(st.cleared, lvl), awSurvived: Math.max(st.awSurvived, aws.length), lastRetrieved: simNow, reps: (st.reps || 0) + 1, cret: newCret, attempts: 0, hintsUsed: 0, shallowHits: 0 } };
          });
          setFeedback({ ok: true, phase: 'witness', graded: g.graded,
            msg: `${L.tier} cleared — survived all mutations. Corroborated understanding, not recall.` });
          setAnswer('');
          setHintTier(0);
          setAuthoring(null);
          if (newCret >= 0.75) {
            setEpistemicStage(st => Math.min(STAGES.length - 1, st + 1));
          }
          if (user) {
            void upsertRctEvidence(user.id, domain.name, n, lvl, newCret).then(result => {
              if (!result.ok) setSyncNotice(result.error);
              else setSyncNotice('');
            });
          }
        }
      } else if (g.verdict === 'shallow') {
        setState(s => ({ ...s, [active]: { ...s[active], shallowHits: s[active].shallowHits + 1 } }));
        setFeedback({ ok: false, phase: 'anti', awIndex: idx, graded: g.graded,
          msg: 'True in general, but you did not anchor it to what changed. Re-map onto the mutated artifact.' });
      } else if (g.verdict === 'trap') {
        setFeedback({ ok: false, phase: 'anti', awIndex: idx, graded: g.graded,
          msg: "That's the deceptive witness — what a green build would reward. It fails on this mutation." });
      } else {
        setFeedback({ ok: false, phase: 'anti', awIndex: idx, graded: g.graded,
          msg: 'The mutated artifact broke the easy answer. Re-map onto the anchor — what concretely changed?' });
      }
    }
  }, [active, byId, probeLevel, answer, feedback, route, grading, simNow, user, domain.name]);

  const decompress = useCallback((id: string) => {
    setState(s => {
      const n = byId[id];
      if (s[id].depth >= n.levels.length - 1) return s;
      return { ...s, [id]: { ...s[id], depth: s[id].depth + 1 } };
    });
    setFeedback(null);
    setAnswer('');
    setHintTier(0);
  }, [byId]);

  const recompress = useCallback((id: string) => {
    setState(s => {
      if (s[id].depth <= 0) return s;
      const d = s[id].depth - 1;
      return { ...s, [id]: { ...s[id], depth: d, cleared: Math.min(s[id].cleared, d) } };
    });
    setFeedback(null);
    setAnswer('');
    setHintTier(0);
  }, []);

  const totalLevels = nodes.reduce((a, n) => a + n.levels.length, 0);
  const clearedLevels = nodes.reduce((a, n) => a + Math.max(0, view[n.id].cleared + 1), 0);
  const regimePct = Math.round((clearedLevels / totalLevels) * 100);

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <Brain className="w-3.5 h-3.5" />RCT Epistemic Engine
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">Map the unknown onto the known</h2>
          <p className="text-slate-400 text-sm max-w-xl leading-snug">
            Every node starts from a <span className="text-emerald-300">concrete artifact you already understand</span>,
            then asks you to converge a new case onto it. Abstraction is the second hint you earn.
            Domain: <span className="text-white font-medium">{domain.name}</span>.
          </p>
          {domain.helloPom && (
            <button onClick={() => setShowPom(v => !v)} className="mt-3 text-xs text-slate-400 border border-slate-700/60 rounded-lg px-3 py-1.5 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
              {showPom ? <><ChevronUp className="w-3 h-3 inline mr-1" />Hide anchor POM</> : <><ChevronDown className="w-3 h-3 inline mr-1" />Show anchor POM</>}
            </button>
          )}
          {focusNotice && (
            <div className="mt-3 flex items-start gap-2 text-xs text-cyan-300/90 bg-cyan-500/10 border border-cyan-500/25 rounded-lg px-3 py-2">
              <span className="flex-1">{focusNotice}</span>
              <button onClick={() => setFocusNotice('')} className="text-cyan-400/70 hover:text-cyan-200 shrink-0" aria-label="Dismiss">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {syncNotice && (
            <div className="mt-3 flex items-start gap-2 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
              <span className="flex-1">
                Portfolio sync failed: {syncNotice}
                {isRctMigrationError(syncNotice) && ' — apply migration 20260615000001_add_rct_fields_to_skills.sql in Supabase.'}
              </span>
              <button onClick={() => setSyncNotice('')} className="text-amber-400/70 hover:text-amber-200 shrink-0" aria-label="Dismiss">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {showPom && domain.helloPom && (
            <pre className="mt-3 p-4 bg-slate-950/60 border border-slate-700/40 rounded-xl text-xs text-emerald-300/80 font-mono overflow-x-auto max-w-xl">{domain.helloPom}</pre>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-5xl font-bold font-mono text-emerald-400">{regimePct}<span className="text-lg">%</span></div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">convergence</div>
          <div className="text-xs font-mono text-purple-300 mt-2">{STAGES[epistemicStage].name} · stage {epistemicStage + 1}/{STAGES.length}</div>
          <button onClick={() => setCompressed(c => !c)} title={compressed ? "Expand — show cached node details again" : "Compress mastered — hide already-cleared nodes to reduce visual clutter"} className="mt-3 text-xs px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-lg hover:bg-teal-500/20">
            {compressed ? '◇ expand cached' : '◆ compress mastered'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-400 mb-2 py-2 border-y border-slate-800/60">
        {[['Junior', '#7d8aa3'], ['Mid', '#f2a43c'], ['Senior', '#2fd3a5']].map(([t, c]) => (
          <span key={t} className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: c }} />{t}</span>
        ))}
        <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-pink-400" />deceptive witness</span>
        <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-cyan-400" />compressed regime</span>
      </div>

      <div className="backdrop-blur-xl bg-slate-800/20 border border-slate-700/40 rounded-2xl p-4 overflow-x-auto">
        <Graph nodes={nodes} view={view} active={active} compressed={compressed} regions={regions}
          onOpen={tryOpen} fullySat={fullySat} onDecompress={decompress} onRecompress={recompress} dueQueue={dueQueue} />
      </div>

      <div className="mt-4 flex flex-col sm:flex-row justify-between gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <div className="flex-1">
          <div className="font-mono text-xs uppercase tracking-wider text-amber-400 mb-2">Due for retrieval</div>
          {dueQueue.length === 0 ? (
            <span className="text-sm text-slate-400">
              {clearedLevels === 0 ? 'Clear a node first — then it enters the retention schedule.' : 'Nothing due. Everything is still fresh.'}
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dueQueue.map(d => (
                <button key={d.id} onClick={() => open(d.id)}
                  className="text-xs px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg hover:bg-amber-500/20">
                  {d.label}{d.overdueDays > 0 ? <span className="text-pink-400"> · {d.overdueDays}d overdue</span> : <span className="text-amber-400"> · due</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="font-mono text-[10.5px] text-slate-500">simulate time · +{Math.round(clockOffset / DAY)}d</span>
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={() => setClockOffset(o => o + DAY)} className="text-xs px-2 py-1 bg-slate-700/60 rounded-lg text-slate-300">+1 day</button>
            <button onClick={() => setClockOffset(o => o + 7 * DAY)} className="text-xs px-2 py-1 bg-slate-700/60 rounded-lg text-slate-300">+1 week</button>
            <button onClick={() => setClockOffset(0)} className="text-xs px-2 py-1 bg-slate-700/60 rounded-lg text-slate-300">reset</button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500 font-mono flex flex-wrap justify-between gap-2">
        <span><b className="text-slate-400">{clearedLevels}</b>/{totalLevels} levels cleared · <b className="text-slate-400">{dueQueue.length}</b> due now</span>
        <span>Cleared nodes sync as evidence in your Skills portfolio.</span>
      </div>

      {active && byId[active] && (
        <Probe node={byId[active]} view={view[active]} level={probeLevel(active)}
          phase={(feedback?.phase as 'witness' | 'anti') || 'witness'}
          answer={answer} setAnswer={setAnswer} feedback={feedback}
          onSubmit={submit} onClose={() => setActive(null)} grading={grading}
          onDecompress={() => decompress(active)} onRecompress={() => recompress(active)}
          hintTier={hintTier} setHintTier={setHintTier}
          onHint={() => setState(s => ({ ...s, [active]: { ...s[active], hintsUsed: s[active].hintsUsed + 1 } }))}
          stage={epistemicStage} authoring={authoring} setAuthoring={setAuthoring} />
      )}
    </div>
  );
}
