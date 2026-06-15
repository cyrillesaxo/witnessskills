import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, BarChart3, Plus, X, Brain, Sparkles } from 'lucide-react';
import { AUDIT_SEED, type AuditItem } from '../../lib/rct/auditSeed';
import { auditStorageKey, domainToAuditNodes, domainToEpistemics } from '../../lib/rct/auditUtils';
import type { Domain } from '../../lib/rct/types';

interface CoverageAuditorProps {
  domain: Domain;
  domainKey: string;
  onTrainNode?: (nodeId: string) => void;
  onBuildGap?: (question: string) => void;
}

export default function CoverageAuditor({ domain, domainKey, onTrainNode, onBuildGap }: CoverageAuditorProps) {
  const auditNodes = useMemo(() => domainToAuditNodes(domain), [domain]);
  const epistemics = useMemo(() => domainToEpistemics(domain), [domain]);
  const storageKey = auditStorageKey(domainKey);
  const isMaven = domainKey === 'maven';

  const [items, setItems] = useState<AuditItem[]>(isMaven ? AUDIT_SEED : []);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [sort, setSort] = useState<'freq' | 'gap'>('freq');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draft, setDraft] = useState({ q: '', freq: 1, nodes: [] as string[], trap: '' });

  useEffect(() => {
    setLoaded(false);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        setItems(isMaven ? AUDIT_SEED : []);
      }
    } catch {
      setItems(isMaven ? AUDIT_SEED : []);
    }
    setLoaded(true);
  }, [storageKey, isMaven]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch { /* */ }
  }, [items, loaded, storageKey]);

  const nodeById = useMemo(() => Object.fromEntries(auditNodes.map(n => [n.id, n])), [auditNodes]);

  const coverage = useMemo(() => {
    const c = Object.fromEntries(auditNodes.map(n => [n.id, { count: 0, freq: 0 }]));
    items.forEach(it => it.nodes.forEach(nid => {
      if (c[nid]) { c[nid].count++; c[nid].freq += it.freq; }
    }));
    return c;
  }, [items, auditNodes]);

  const uncovered = useMemo(() => items.filter(it => it.nodes.length === 0).sort((a, b) => b.freq - a.freq), [items]);
  const orphanNodes = useMemo(() => auditNodes.filter(n => coverage[n.id]?.count === 0), [auditNodes, coverage]);
  const maxFreq = Math.max(...auditNodes.map(n => coverage[n.id]?.freq || 0), 1);
  const totalFreq = items.reduce((a, it) => a + it.freq, 0);
  const coveredFreq = items.filter(it => it.nodes.length > 0).reduce((a, it) => a + it.freq, 0);
  const coveragePct = totalFreq ? Math.round((coveredFreq / totalFreq) * 100) : 0;

  const sortedItems = useMemo(() => {
    const arr = [...items];
    if (sort === 'freq') arr.sort((a, b) => b.freq - a.freq);
    if (sort === 'gap') arr.sort((a, b) => a.nodes.length - b.nodes.length || b.freq - a.freq);
    return arr;
  }, [items, sort]);

  const resetSeed = () => setItems(isMaven ? AUDIT_SEED : []);

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
            <BarChart3 className="w-3.5 h-3.5" />Coverage Auditor
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">What the ontology misses</h2>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Auditing <span className="text-white font-medium">{domain.name}</span> ({auditNodes.length} nodes).
            Gaps found here become nodes to build in <button onClick={() => onBuildGap?.('')} className="text-amber-400 hover:underline">Generate</button>
            {' '}or skills to train in <span className="text-emerald-400">Learn</span>.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-5xl font-bold font-mono text-emerald-400">{coveragePct}<span className="text-lg">%</span></div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">demand covered</div>
          <div className="text-[10px] font-mono text-amber-500/80 mt-2">
            {items.length ? `${items.length} questions` : 'no questions yet'}
          </div>
        </div>
      </div>

      {!items.length && !isMaven && (
        <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-amber-200/90">
          No audit questions for this generated domain yet. Add real questions from your field, or use Generate to expand the ontology.
        </div>
      )}

      <div className="backdrop-blur-xl bg-slate-800/20 border border-slate-700/40 rounded-2xl p-5 mb-6">
        <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-4">Node coverage by demand</h3>
        {auditNodes.map(n => {
          const cov = coverage[n.id] || { count: 0, freq: 0 };
          const w = Math.round((cov.freq / maxFreq) * 100);
          const status = cov.count === 0 ? 'orphan' : cov.freq < 3 ? 'thin' : 'ok';
          const epi = epistemics[n.id] || [];
          const trapCount = epi.reduce((a, l) => a + l.traps.length, 0);
          const open = expanded === n.id;
          const inLearn = domain.nodes.some(dn => dn.id === n.id);
          return (
            <div key={n.id} className="border-t border-slate-800/60 pt-2 first:border-0 first:pt-0">
              <div className="flex items-center gap-4 py-2">
                <div className="w-48 shrink-0">
                  <div className="text-sm font-semibold text-white">{n.label}</div>
                  <div className="text-xs text-slate-500">{n.note}</div>
                </div>
                <div className="flex-1 h-6 bg-slate-900/60 rounded-md overflow-hidden relative">
                  <div className="h-full rounded-md transition-all duration-400 opacity-85"
                    style={{ width: `${w}%`, background: status === 'orphan' ? '#e25b8f' : status === 'thin' ? '#f2a43c' : '#2fd3a5' }} />
                  <span className="absolute left-2 top-0 leading-6 text-[11px] font-mono text-slate-200">{cov.count} q · weight {cov.freq}</span>
                </div>
                <div className="w-28 text-right flex flex-col items-end gap-1">
                  {status === 'orphan' && <span className="text-xs font-mono text-pink-400">⚠ no demand</span>}
                  {status === 'thin' && <span className="text-xs font-mono text-amber-400">thin</span>}
                  {status === 'ok' && <span className="text-xs font-mono text-emerald-400">✓ validated</span>}
                  {inLearn && onTrainNode && (
                    <button onClick={() => onTrainNode(n.id)} className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300">
                      <Brain className="w-3 h-3" /> train
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => setExpanded(open ? null : n.id)} className="text-[11px] font-mono text-slate-500 hover:text-slate-300 pl-52 pb-2">
                {open ? '▾' : '▸'} witness / deceptive witness · {epi.length} witness{epi.length !== 1 ? 'es' : ''} · {trapCount} trap{trapCount !== 1 ? 's' : ''}
              </button>
              {open && (
                <div className="ml-52 mb-3 p-3 bg-slate-900/40 border border-slate-700/40 rounded-lg">
                  {epi.length === 0 && <div className="text-xs text-slate-500 italic">No levels authored for this node.</div>}
                  {epi.map((lvl, i) => (
                    <div key={i} className="flex gap-3 py-2 border-t border-slate-800/40 first:border-0">
                      <span className="w-12 shrink-0 font-mono text-[10.5px] font-bold text-slate-400 pt-0.5">{lvl.tier}</span>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex gap-2 text-xs"><span className="shrink-0 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded font-mono text-[9.5px] font-bold">witness</span><span className="text-slate-300">{lvl.witness || '—'}</span></div>
                        {lvl.traps.length === 0
                          ? <div className="flex gap-2 text-xs"><span className="shrink-0 px-1.5 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-300 rounded font-mono text-[9.5px] font-bold">deceptive</span><span className="text-pink-400/70">none authored ⚠</span></div>
                          : lvl.traps.map((t, j) => (
                            <div key={j} className="flex gap-2 text-xs"><span className="shrink-0 px-1.5 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-300 rounded font-mono text-[9.5px] font-bold">deceptive</span><span className="text-slate-400">"{t}"</span></div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="backdrop-blur-xl bg-pink-500/5 border border-pink-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-pink-400 font-mono text-sm font-bold mb-2">
            <AlertTriangle className="w-4 h-4" />Missing nodes · {uncovered.length}
          </div>
          <p className="text-xs text-slate-400 mb-3">Questions with no node — build coverage in Generate.</p>
          {uncovered.map((it, i) => (
            <div key={i} className="text-xs text-slate-300 py-1.5 border-t border-slate-800/40 flex justify-between gap-2">
              <span><b>×{it.freq}</b> {it.q}</span>
              {onBuildGap && (
                <button onClick={() => onBuildGap(it.q)} className="shrink-0 flex items-center gap-1 text-amber-400 hover:text-amber-300">
                  <Sparkles className="w-3 h-3" /> build
                </button>
              )}
            </div>
          ))}
          {uncovered.length === 0 && <div className="text-xs text-slate-500 italic">No uncovered questions.</div>}
        </div>
        <div className="backdrop-blur-xl bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <div className="text-amber-400 font-mono text-sm font-bold mb-2">Over-built nodes · {orphanNodes.length}</div>
          <p className="text-xs text-slate-400 mb-3">Nodes with no real-demand question — train them anyway or add audit data.</p>
          {orphanNodes.map(n => (
            <div key={n.id} className="text-xs text-slate-300 py-1.5 border-t border-slate-800/40 flex justify-between gap-2">
              <span>{n.label} <span className="text-slate-500">— {n.note}</span></span>
              {onTrainNode && domain.nodes.some(dn => dn.id === n.id) && (
                <button onClick={() => onTrainNode(n.id)} className="shrink-0 text-emerald-400 hover:text-emerald-300">train</button>
              )}
            </div>
          ))}
          {orphanNodes.length === 0 && <div className="text-xs text-slate-500 italic">Every node has demand.</div>}
        </div>
      </div>

      <div className="backdrop-blur-xl bg-slate-800/20 border border-slate-700/40 rounded-2xl p-5">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400">Question → node mapping ({items.length})</h3>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSort('freq')} className={`text-xs px-3 py-1.5 rounded-lg border ${sort === 'freq' ? 'bg-slate-700/60 border-slate-500 text-white' : 'border-slate-700 text-slate-400'}`}>by frequency</button>
            <button onClick={() => setSort('gap')} className={`text-xs px-3 py-1.5 rounded-lg border ${sort === 'gap' ? 'bg-slate-700/60 border-slate-500 text-white' : 'border-slate-700 text-slate-400'}`}>gaps first</button>
            {isMaven && (
              <button onClick={resetSeed} className="text-xs px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg hover:text-slate-200">reset seed</button>
            )}
            <button onClick={() => setShowAdd(s => !s)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg">
              <Plus className="w-3 h-3" />{showAdd ? 'close' : 'add question'}
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="mb-4 p-4 bg-slate-900/40 border border-slate-700/40 rounded-xl space-y-3">
            <input className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/60 rounded-lg text-white text-sm" placeholder="Paste a real question…" value={draft.q} onChange={e => setDraft(d => ({ ...d, q: e.target.value }))} />
            <input className="w-20 px-3 py-2 bg-slate-900/50 border border-slate-600/60 rounded-lg text-white text-sm" type="number" min={1} placeholder="weight" value={draft.freq} onChange={e => setDraft(d => ({ ...d, freq: Number(e.target.value) || 1 }))} />
            <div className="flex flex-wrap gap-2">
              {auditNodes.map(n => (
                <button key={n.id} onClick={() => setDraft(d => ({ ...d, nodes: d.nodes.includes(n.id) ? d.nodes.filter(x => x !== n.id) : [...d.nodes, n.id] }))}
                  className={`text-xs px-2.5 py-1 rounded-full border ${draft.nodes.includes(n.id) ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-700 text-slate-400'}`}>{n.label}</button>
              ))}
            </div>
            <input className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/60 rounded-lg text-white text-sm" placeholder="deceptive witness (optional)…" value={draft.trap} onChange={e => setDraft(d => ({ ...d, trap: e.target.value }))} />
            <button onClick={() => { if (!draft.q.trim()) return; setItems(x => [...x, { ...draft, freq: Number(draft.freq) || 1, real: true, src: 'added by you' }]); setDraft({ q: '', freq: 1, nodes: [], trap: '' }); setShowAdd(false); }}
              className="text-xs px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">Add to audit</button>
          </div>
        )}

        <div className="space-y-0">
          {sortedItems.map((it, i) => {
            const realIndex = items.indexOf(it);
            return (
              <div key={i} className={`flex items-start gap-3 py-3 border-t border-slate-800/40 ${it.nodes.length === 0 ? 'bg-pink-500/5' : ''}`}>
                <span className="w-8 shrink-0 font-mono text-xs text-slate-500">×{it.freq}</span>
                <span className="flex-1 text-sm text-slate-300 leading-relaxed">{it.q}</span>
                <span className="w-48 shrink-0 flex flex-wrap gap-1 justify-end">
                  {it.nodes.length === 0
                    ? <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 bg-pink-500/10 border border-pink-500/30 text-pink-300 rounded">NO NODE</span>
                    : it.nodes.map(nid => <span key={nid} className="text-[10.5px] font-mono px-2 py-0.5 bg-slate-700/60 border border-slate-600/40 text-slate-300 rounded">{nodeById[nid]?.label || nid}</span>)}
                </span>
                <button onClick={() => setItems(x => x.filter((_, j) => j !== realIndex))} className="text-slate-600 hover:text-red-400"><X className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
