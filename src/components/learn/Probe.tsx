import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { OntologyNode, NodeState, AuthoringState, Antiwitness } from '../../lib/rct/types';
import { TIER_COLOR } from '../../lib/rct/types';
import { gradeAuthoring } from '../../lib/rct/grading';

interface ProbeProps {
  node: OntologyNode;
  view: NodeState;
  level: number;
  phase: 'witness' | 'anti';
  answer: string;
  setAnswer: (v: string) => void;
  feedback: { ok: boolean; phase: string; msg: string; awIndex?: number; graded?: string } | null;
  onSubmit: () => void;
  onClose: () => void;
  grading: boolean;
  onDecompress: () => void;
  onRecompress: () => void;
  hintTier: number;
  setHintTier: (fn: (t: number) => number) => void;
  onHint: () => void;
  stage: number;
  authoring: AuthoringState | null;
  setAuthoring: (v: AuthoringState | null | ((a: AuthoringState | null) => AuthoringState | null)) => void;
}

export default function Probe({
  node, view, level, phase, answer, setAnswer, feedback, onSubmit, onClose,
  grading, onDecompress, onRecompress, hintTier, setHintTier, onHint,
  stage, authoring, setAuthoring,
}: ProbeProps) {
  const L = node.levels[level];
  const isAnti = phase === 'anti';
  const tc = TIER_COLOR[L.tier];
  const aws = L.antiwitnesses || (L.antiwitness ? [L.antiwitness] : []);
  const awIdx = feedback?.awIndex || 0;
  const aw = aws[Math.min(awIdx, aws.length - 1)];

  const discriminatePair = useDiscriminatePair(aw);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto backdrop-blur-xl bg-slate-800/95 border border-slate-700/60 rounded-2xl shadow-2xl p-6"
        onClick={e => e.stopPropagation()} role="dialog">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-2xl leading-none">×</button>

        <div className="font-mono text-xs text-slate-400 mb-1">
          <span style={{ color: tc }}>{node.eat.entity}</span> · {node.eat.action} → {node.eat.target}
        </div>
        <h2 className="text-xl font-bold text-white mb-3">{node.label}</h2>

        {(node.gist || node.example) && (
          <div className="mb-4 p-3 bg-slate-900/40 border border-slate-700/40 rounded-xl">
            {node.gist && <p className="text-sm text-slate-300 mb-1">{node.gist}</p>}
            {node.example && <p className="text-xs text-slate-500 font-mono">{node.example}</p>}
          </div>
        )}

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {node.levels.map((Lv, i) => (
            <span key={i} className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${
              i === level ? 'text-slate-950' : i <= view.depth ? 'border-current' : 'opacity-35 border-slate-600 text-slate-500'
            }`} style={i === level ? { background: TIER_COLOR[Lv.tier], borderColor: TIER_COLOR[Lv.tier] } : { color: TIER_COLOR[Lv.tier], borderColor: TIER_COLOR[Lv.tier] }}>
              {Lv.tier}{view.cleared >= i ? ' ✓' : ''}
            </span>
          ))}
          <span className="ml-auto flex gap-2">
            <button onClick={onRecompress} disabled={view.depth <= 0} className="text-xs px-2 py-1 bg-slate-700/60 rounded-lg text-slate-300 disabled:opacity-30">− simpler</button>
            <button onClick={onDecompress} disabled={view.depth >= node.levels.length - 1} className="text-xs px-2 py-1 bg-slate-700/60 rounded-lg text-slate-300 disabled:opacity-30">+ deeper</button>
          </span>
        </div>

        <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <div className="font-mono text-xs text-emerald-400 mb-1">Known anchor · <code className="bg-slate-900/60 px-1.5 py-0.5 rounded text-emerald-300">{L.anchor.artifact}</code></div>
          <p className="text-sm text-emerald-100/80 leading-relaxed">{L.anchor.known}</p>
        </div>

        {!isAnti ? (
          <>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500 mb-2">New case · converge onto the anchor</div>
            <p className="text-sm text-amber-200/90 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-3">{L.newCase}</p>

            {stage >= 3 && (
              <div className="mb-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                <div className="text-xs text-purple-300 mb-2">First, author the witness — what concrete result would <i>prove</i> understanding?</div>
                <textarea
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/60 rounded-lg text-white text-sm"
                  rows={2} placeholder="Write your test of understanding…"
                  value={authoring?.witText || ''}
                  onChange={e => setAuthoring(a => ({ ...(a || {}), witText: e.target.value }))}
                />
                <button
                  disabled={grading || !authoring?.witText}
                  onClick={async () => {
                    const g = await gradeAuthoring({ target: 'witness', artifact: L.anchor.artifact, newCase: L.newCase, expert: L.witness.prompt, studentText: authoring!.witText! });
                    setAuthoring(a => ({ ...(a || {}), witGrade: g, witRevealed: true }));
                  }}
                  className="mt-2 text-xs px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-lg disabled:opacity-40"
                >
                  Grade my witness & compare
                </button>
                {authoring?.witGrade && (
                  <div className={`mt-2 p-2 rounded-lg text-xs ${authoring.witGrade.grade === 'strong' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200'}`}>
                    <b>Coach ({authoring.witGrade.grade}):</b> {authoring.witGrade.note}
                  </div>
                )}
                {authoring?.witRevealed && (
                  <div className="mt-2 p-2 bg-slate-900/40 rounded-lg text-xs text-purple-200">
                    <b>Expert's witness asks:</b> "{L.witness.prompt}"
                  </div>
                )}
              </div>
            )}

            <p className="text-base text-white font-medium mb-2">{L.witness.prompt}</p>
            {L.witness.example && (
              <details className="mb-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                <summary className="cursor-pointer p-2 text-xs font-mono text-emerald-400">▸ See a worked example (sibling case)</summary>
                <p className="px-3 pb-3 text-xs text-emerald-200/80 leading-relaxed">{L.witness.example}</p>
              </details>
            )}
          </>
        ) : aw ? (
          <>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-amber-400 mb-2">
              The artifact mutates{aws.length > 1 ? ` · ${awIdx + 1} of ${aws.length}` : ''}
            </div>
            <p className="text-sm text-amber-200/90 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-3">{aw.mutation}</p>
            <p className="text-base text-white font-medium mb-2">{aw.prompt}</p>

            {stage === 0 && (
              <div className="mb-3 p-3 bg-pink-500/5 border border-pink-500/20 rounded-lg text-sm text-pink-200">
                <b>Deceptive witness on offer:</b> "{aw.trap}"
              </div>
            )}

            {stage === 1 && (
              <div className="mb-4 p-3 bg-slate-900/40 border border-slate-700/40 rounded-xl">
                <div className="text-xs text-slate-400 mb-2">Which is the deceptive witness — the seductive false signal?</div>
                {discriminatePair.map((o, i) => (
                  <label key={i} className="flex gap-2 items-start text-sm text-slate-300 py-1.5 cursor-pointer">
                    <input type="radio" name="disc" onChange={() => setAuthoring({ pickedReal: o.real, revealed: true })} />
                    <span>"{o.t}"</span>
                  </label>
                ))}
                {authoring?.revealed && (
                  <div className={`mt-2 p-2 rounded-lg text-xs ${authoring.pickedReal ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200'}`}>
                    {authoring.pickedReal
                      ? "✓ That's the real deceptive witness — seductive, not a strawman."
                      : "Not quite — you picked the strawman. The trap feels like success."}
                  </div>
                )}
              </div>
            )}

            {stage >= 2 && (
              <div className="mb-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                <div className="text-xs text-purple-300 mb-2">Author the deceptive witness — what would make someone <i>think</i> they understood, while being wrong?</div>
                <textarea
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/60 rounded-lg text-white text-sm"
                  rows={2} placeholder="Write the seductive false signal…"
                  value={authoring?.trapText || ''}
                  onChange={e => setAuthoring(a => ({ ...(a || {}), trapText: e.target.value }))}
                />
                <button
                  disabled={grading || !authoring?.trapText}
                  onClick={async () => {
                    const g = await gradeAuthoring({ target: 'deceptive', artifact: L.anchor.artifact, newCase: aw.mutation, expert: aw.trap, studentText: authoring!.trapText! });
                    setAuthoring(a => ({ ...(a || {}), trapGrade: g, revealed: true }));
                  }}
                  className="mt-2 text-xs px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-lg disabled:opacity-40"
                >
                  Grade my trap & compare
                </button>
                {authoring?.trapGrade && (
                  <div className={`mt-2 p-2 rounded-lg text-xs ${authoring.trapGrade.grade === 'strong' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200'}`}>
                    <b>Coach ({authoring.trapGrade.grade}):</b> {authoring.trapGrade.note}
                  </div>
                )}
                {authoring?.revealed && (
                  <div className="mt-2 p-2 bg-slate-900/40 rounded-lg text-xs text-purple-200">
                    <b>Expert's deceptive witness:</b> "{aw.trap}"
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}

        {view.cleared >= level && !isAnti && (
          <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-200">
            ✓ Converged at {L.tier}. Go + deeper for the next tier, or revisit to keep it fresh.
          </div>
        )}

        <textarea
          className="w-full mt-3 px-4 py-3 bg-slate-900/50 border border-slate-600/60 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y"
          rows={3} value={answer} placeholder="Map it onto the anchor, in your own words…"
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              if (!grading && answer.trim()) onSubmit();
            }
          }}
        />

        {feedback && (
          <div className={`mt-3 p-3 rounded-xl border text-sm leading-relaxed ${feedback.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-red-500/10 border-red-500/30 text-red-200'}`}>
            {feedback.msg}
          </div>
        )}

        {isAnti && feedback && aw?.example && (
          <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <div className="font-mono text-[10.5px] uppercase text-amber-400 mb-1">Why that trap is seductive</div>
            <p className="text-xs text-amber-200/80 leading-relaxed">{aw.example}</p>
          </div>
        )}

        <div className="flex gap-2 mt-3 flex-wrap">
          {hintTier < 1 && (
            <button onClick={() => { setHintTier(t => Math.max(t, 1)); onHint(); }}
              className="text-xs px-3 py-1.5 bg-slate-700/60 border border-slate-600/40 rounded-lg text-slate-300 hover:text-white">
              Hint ① concrete bridge
            </button>
          )}
          {hintTier >= 1 && hintTier < 2 && (
            <button onClick={() => { setHintTier(t => Math.max(t, 2)); onHint(); }}
              className="text-xs px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300">
              Hint ② the abstraction
            </button>
          )}
        </div>
        {hintTier >= 1 && <div className="mt-2 p-3 bg-slate-900/40 border border-slate-700/40 rounded-lg text-xs text-slate-300"><b>Concrete:</b> {L.hints[0]}</div>}
        {hintTier >= 2 && <div className="mt-2 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg text-xs text-purple-200"><b>Abstract:</b> {L.hints[1]}</div>}

        <div className="flex items-center gap-3 mt-4">
          <button onClick={onSubmit} disabled={grading || !answer.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
            {grading && <Loader2 className="w-4 h-4 animate-spin" />}
            {grading ? 'Judging convergence…' : isAnti ? 'Submit mapping' : 'Submit convergence'}
          </button>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">⌘/Ctrl + Enter</span>
          {feedback?.graded === 'fallback' && <span className="text-xs text-slate-500 font-mono">offline · keyword check</span>}
          {feedback?.graded === 'model' && <span className="text-xs text-emerald-500/80 font-mono">model graded</span>}
        </div>
      </div>
    </div>
  );
}

const STRAWMAN = 'This concept is just hard and rarely matters in practice.';

function useDiscriminatePair(aw: Antiwitness | undefined) {
  const [pair, setPair] = useState<{ t: string; real: boolean }[]>([]);

  useEffect(() => {
    if (!aw) {
      setPair([]);
      return;
    }
    setPair(
      Math.random() < 0.5
        ? [{ t: aw.trap, real: true }, { t: STRAWMAN, real: false }]
        : [{ t: STRAWMAN, real: false }, { t: aw.trap, real: true }],
    );
  }, [aw]);

  return pair;
}
