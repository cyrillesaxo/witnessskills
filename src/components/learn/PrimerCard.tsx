import { ArrowRight, BookOpen, Lightbulb } from 'lucide-react';
import type { OntologyNode } from '../../lib/rct/types';
import { TIER_COLOR } from '../../lib/rct/types';

interface PrimerCardProps {
  node: OntologyNode;
  level: number;
  onStart: () => void;
}

export default function PrimerCard({ node, level, onStart }: PrimerCardProps) {
  const L = node.levels[level];
  const tc = TIER_COLOR[L.tier];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Tier accent bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${tc}66, ${tc})` }} />

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border"
                  style={{ color: tc, borderColor: `${tc}55`, background: `${tc}15` }}>
                  {L.tier}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">{node.eat.entity} · {node.eat.action}</span>
              </div>
              <h2 className="text-lg font-bold text-white">{node.label}</h2>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1">
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Gist — the concept in one sentence */}
          {node.gist && (
            <div className="flex gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-200 leading-relaxed">{node.gist}</p>
            </div>
          )}

          {/* Concrete example */}
          {node.example && (
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
              <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider mb-1">Concrete example</p>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">{node.example}</p>
            </div>
          )}

          {/* Anchor you'll start from */}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-[11px] text-emerald-400 font-mono uppercase tracking-wider mb-1">You'll start from this anchor</p>
            <code className="text-xs text-emerald-300 font-mono">{L.anchor.artifact}</code>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{L.anchor.known}</p>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-slate-500">Read the above, then prove you understand by mapping a new case onto it.</p>
            <button
              onClick={onStart}
              autoFocus
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg"
              style={{ background: `linear-gradient(135deg, ${tc}cc, ${tc}99)` }}
            >
              Start probe
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
