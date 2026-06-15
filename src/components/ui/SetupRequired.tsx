import BackgroundGlow from './BackgroundGlow';
import { Zap, AlertCircle } from 'lucide-react';
export default function SetupRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <BackgroundGlow />
      <div className="relative z-10 max-w-md w-full backdrop-blur-xl bg-slate-800/40 border border-amber-500/25 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Configuration required</h1>
        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
          WitnessSkills needs Supabase credentials. Copy <code className="text-amber-200 text-xs">.env.example</code> to{' '}
          <code className="text-amber-200 text-xs">.env</code> and set:
        </p>
        <ul className="text-left text-xs font-mono text-slate-300 bg-slate-900/50 border border-slate-700/40 rounded-xl p-4 mb-5 space-y-1">
          <li>VITE_SUPABASE_URL</li>
          <li>VITE_SUPABASE_ANON_KEY</li>
        </ul>
        <p className="text-xs text-slate-500 flex items-start gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          Then run <code className="text-slate-400">supabase/setup_all.sql</code> in your Supabase SQL editor for the skills schema.
        </p>
        <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
          className="inline-block mt-5 text-sm text-emerald-400 hover:text-emerald-300">
          Open Supabase dashboard →
        </a>
      </div>
    </div>
  );
}
