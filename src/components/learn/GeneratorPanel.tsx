import { useState, useCallback, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { Domain } from '../../lib/rct/types';
import { generateDomain, domainKeyFromName } from '../../lib/rct/domainGenerator';
import { DOMAINS } from '../../lib/rct/mavenOntology';

interface GeneratorPanelProps {
  current: Domain;
  domainKey: string;
  onLoad: (domain: Domain, key: string) => void;
  initialPrompt?: string;
  onPromptConsumed?: () => void;
}

export default function GeneratorPanel({ current, domainKey, onLoad, initialPrompt, onPromptConsumed }: GeneratorPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<{ name: string; count: number } | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      onPromptConsumed?.();
    }
  }, [initialPrompt, onPromptConsumed]);

  const run = useCallback(async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const domain = await generateDomain(prompt, context);
      const key = domainKeyFromName(domain.name) + ':' + Date.now().toString(36);
      setLastMeta({ name: domain.name, count: domain.nodes.length });
      onLoad({ ...domain, grounded: !!context.trim() }, key);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed';
      setErr(msg.includes('not configured')
        ? 'AI generation requires ANTHROPIC_API_KEY on Netlify. Use the Maven seed domain meanwhile.'
        : msg);
    } finally {
      setBusy(false);
    }
  }, [prompt, context, busy, onLoad]);

  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
        <Sparkles className="w-3.5 h-3.5" />Domain Generator
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Generate a skill ontology</h2>
      <p className="text-slate-400 text-sm max-w-2xl leading-relaxed mb-6">
        Describe a skill domain. The model builds an RCT-faithful ontology — anchors, witnesses,
        deceptive-witness traps — and loads it instantly into Learn. Generated traps are unreviewed;
        play them before trusting.
      </p>

      <label className="block text-sm font-medium text-slate-300 mb-2">What domain?</label>
      <input
        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/60 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 mb-4"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="e.g. Git branching & merge conflict resolution"
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run(); }}
      />

      <label className="block text-sm font-medium text-slate-300 mb-2">
        Paste context <span className="text-slate-500 font-normal">(optional grounding)</span>
      </label>
      <textarea
        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/60 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y mb-4"
        rows={6}
        value={context}
        onChange={e => setContext(e.target.value)}
        placeholder="Paste reference material. Leave blank for free generation."
      />

      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={run}
          disabled={busy || !prompt.trim()}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? 'Generating…' : '⚡ Generate & load'}
        </button>
        <span className="text-xs font-mono text-slate-500">⌘/Ctrl + Enter</span>
        {context.trim()
          ? <span className="text-xs font-mono text-emerald-400">● grounded</span>
          : <span className="text-xs font-mono text-amber-400">○ ungrounded</span>}
      </div>

      {err && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-200">{err}</div>
      )}
      {lastMeta && !err && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-200">
          ✓ Loaded <b>{lastMeta.name}</b> — {lastMeta.count} nodes. Switch to <b>Learn</b> to play it.
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-800/60">
        <span className="text-xs font-mono text-slate-500">Currently loaded: </span>
        <span className="text-sm text-white font-medium">{current.name}</span>
        {current.generated && <span className="ml-2 text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded">generated</span>}
        {domainKey !== 'maven' && (
          <button
            onClick={() => onLoad(DOMAINS.maven, 'maven')}
            className="ml-3 text-xs px-2 py-1 border border-slate-700/60 text-slate-400 rounded-lg hover:text-emerald-400"
          >
            ↺ back to Maven seed
          </button>
        )}
      </div>

      <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-200/80 leading-relaxed">
        <b className="text-amber-300">Note:</b> Set <code className="bg-slate-900/60 px-1 rounded">ANTHROPIC_API_KEY</code> in
        Netlify environment variables to enable AI generation and model grading. Without it, Learn uses keyword fallback grading.
      </div>
    </div>
  );
}
