import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import type { OntologyNode } from '../../lib/rct/types';
import { TIER_COLOR } from '../../lib/rct/types';

interface QuizItem {
  kind: 'w' | 'dw';
  question: string;
  trap: string;
  real: string;
  explanation: string;
  tier: string;
  tierColor: string;
}

function buildNodeQuiz(node: OntologyNode): QuizItem[] {
  const items: QuizItem[] = [];
  for (const L of node.levels) {
    const tc = TIER_COLOR[L.tier];
    const aws = L.antiwitnesses || (L.antiwitness ? [L.antiwitness] : []);

    items.push({
      kind: 'w',
      question: `Given: ${L.anchor.artifact} — ${L.newCase}`,
      real: L.witness.prompt,
      trap: `The answer would be the same as if nothing had changed in ${L.anchor.artifact}.`,
      explanation: L.anchor.known,
      tier: L.tier,
      tierColor: tc,
    });

    for (const aw of aws) {
      items.push({
        kind: 'dw',
        question: aw.mutation,
        real: aw.prompt,
        trap: aw.trap,
        explanation: aw.example || `The trap is: "${aw.trap}"`,
        tier: L.tier,
        tierColor: tc,
      });
    }
  }
  return items;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface QuizState {
  picked: 'real' | 'trap' | null;
  revealed: boolean;
}

interface QuizPanelProps {
  node: OntologyNode;
  onDone: () => void;
}

export default function QuizPanel({ node, onDone }: QuizPanelProps) {
  const items = useMemo(() => shuffle(buildNodeQuiz(node)).slice(0, 6), [node]);
  const [idx, setIdx] = useState(0);
  const [qState, setQState] = useState<QuizState>({ picked: null, revealed: false });
  const [score, setScore] = useState({ ruleHeld: 0, dwCleared: 0 });
  const [done, setDone] = useState(false);

  const item = items[idx];

  const options = useMemo(() => {
    const pair = [
      { label: item.real, value: 'real' as const },
      { label: item.trap, value: 'trap' as const },
    ];
    return Math.random() < 0.5 ? pair : [pair[1], pair[0]];
  }, [item]);

  function pick(v: 'real' | 'trap') {
    if (qState.picked !== null) return;
    const correct = v === 'real';
    setQState({ picked: v, revealed: true });
    if (correct) {
      setScore(s => ({
        ruleHeld: item.kind === 'w' ? s.ruleHeld + 1 : s.ruleHeld,
        dwCleared: item.kind === 'dw' ? s.dwCleared + 1 : s.dwCleared,
      }));
    }
  }

  function next() {
    if (idx + 1 >= items.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setQState({ picked: null, revealed: false });
    }
  }

  function restart() {
    setIdx(0);
    setQState({ picked: null, revealed: false });
    setScore({ ruleHeld: 0, dwCleared: 0 });
    setDone(false);
  }

  const wItems = items.filter(i => i.kind === 'w').length;
  const dwItems = items.filter(i => i.kind === 'dw').length;

  if (done) {
    const total = items.length;
    const correct = score.ruleHeld + score.dwCleared;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 space-y-4">
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold font-mono text-emerald-400">{pct}%</div>
          <div className="text-sm text-slate-400">{correct}/{total} correct</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
            <div className="text-lg font-bold text-emerald-300">{score.ruleHeld}/{wItems}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">rules held</div>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-center">
            <div className="text-lg font-bold text-rose-300">{score.dwCleared}/{dwItems}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">traps cleared</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={restart} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-slate-700/60 border border-slate-600/40 text-slate-300 hover:text-white transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Retry quiz
          </button>
          <button onClick={onDone} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-teal-600/20 border border-teal-500/30 text-teal-300 hover:bg-teal-600/30 transition-colors">
            Back to probe <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 space-y-3">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {items.map((it, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${
              i < idx ? 'bg-emerald-500 w-4' : i === idx ? 'w-4' : 'bg-slate-700 w-3'
            }`} style={i === idx ? { background: item.tierColor, width: 16 } : undefined} />
          ))}
        </div>
        <span className="text-[11px] font-mono text-slate-500">{idx + 1}/{items.length}</span>
      </div>

      {/* Kind tag */}
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${
          item.kind === 'w'
            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
            : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
        }`}>
          {item.kind === 'w' ? 'reinforce the rule' : 'misconception check'}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
          style={{ color: item.tierColor, borderColor: `${item.tierColor}44`, background: `${item.tierColor}15` }}>
          {item.tier}
        </span>
      </div>

      {/* Question */}
      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <p className="text-sm text-amber-100/90 leading-relaxed">{item.question}</p>
      </div>

      <p className="text-xs text-slate-400">Which response correctly maps onto the anchor?</p>

      {/* Options */}
      <div className="space-y-2">
        {options.map(opt => {
          const isPicked = qState.picked === opt.value;
          const isCorrect = opt.value === 'real';
          let cls = 'border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800/40';
          if (qState.revealed) {
            if (isCorrect) cls = 'border-emerald-500/50 bg-emerald-500/8 text-emerald-200';
            else if (isPicked) cls = 'border-red-500/50 bg-red-500/8 text-red-200';
            else cls = 'border-slate-700/30 text-slate-500 opacity-50';
          }
          return (
            <button
              key={opt.value}
              onClick={() => pick(opt.value)}
              disabled={qState.picked !== null}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-all flex items-start gap-2 ${cls}`}
            >
              {qState.revealed && (
                isCorrect
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  : isPicked
                    ? <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    : <span className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {qState.revealed && (
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1">Why</p>
          <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
        </div>
      )}

      {/* Next */}
      {qState.revealed && (
        <button onClick={next} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-teal-600/20 border border-teal-500/30 text-teal-300 hover:bg-teal-600/30 transition-colors">
          {idx + 1 < items.length ? 'Next question' : 'See results'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
