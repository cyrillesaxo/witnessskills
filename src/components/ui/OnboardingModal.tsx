import { useEffect, useRef } from 'react';
import { X, Anchor, ArrowRight, ShieldAlert } from 'lucide-react';

const STORAGE_KEY = 'witnessSkills.onboarded';

export function hasOnboarded(): boolean {
  try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
}

export function markOnboarded(): void {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
}

interface OnboardingModalProps {
  onStart: () => void;
}

export default function OnboardingModal({ onStart }: OnboardingModalProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    btnRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleStart(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function handleStart() {
    markOnboarded();
    onStart();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to WitnessSkills"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <button
            onClick={handleStart}
            className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-xl font-bold text-white mb-1">Welcome to WitnessSkills</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            This isn't a flashcard app. You prove understanding by mapping <em>new situations</em> onto things you already know — then defending against traps designed to fool you.
          </p>
        </div>

        {/* Steps */}
        <div className="px-6 pb-5 space-y-3">
          <div className="flex gap-3 items-start p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Anchor className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-200">1. Anchor</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                You're shown something concrete you already know — a real artifact like a pom.xml or a git commit.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-200">2. New case — converge</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                A new situation appears. Your job: explain it by mapping it onto the anchor. If the mapping holds, you've converged.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 rounded-xl bg-red-500/5 border border-red-500/20">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-200">3. Anti-witness — survive the trap</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                A mutation that <em>looks</em> right but isn't. Spot the deceptive witness to prove you really understand — not just pattern-matched.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">Takes ~3 minutes per node · No account data needed to start</p>
          <button
            ref={btnRef}
            onClick={handleStart}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-teal-900/30"
          >
            Start training
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
