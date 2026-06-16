import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, BarChart3, Sparkles, Plus, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import LearningTool from '../components/learn/LearningTool';
import CoverageAuditor from '../components/audit/CoverageAuditor';
import GeneratorPanel from '../components/learn/GeneratorPanel';
import { DOMAINS } from '../lib/rct/mavenOntology';
import { hydrateGenerated } from '../lib/rct/domainGenerator';
import type { Domain } from '../lib/rct/types';

type Tab = 'learn' | 'audit' | 'generate';

const TABS: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: 'learn', label: 'Learn', icon: Brain },
  { id: 'audit', label: 'Audit', icon: BarChart3 },
  { id: 'generate', label: 'Generate', icon: Sparkles },
];

const TAB_STYLES: Record<Tab, string> = {
  learn: 'text-emerald-400 border-b-2 border-emerald-400',
  audit: 'text-violet-400 border-b-2 border-violet-400',
  generate: 'text-amber-400 border-b-2 border-amber-400',
};

function parseTab(value: string | null): Tab | null {
  if (value === 'learn' || value === 'audit' || value === 'generate') return value;
  return null;
}

const LS_KEY = 'ws_custom_domains';

function loadCustomDomains(): Domain[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.map((r) => hydrateGenerated(r as Parameters<typeof hydrateGenerated>[0]));
  } catch {
    return [];
  }
}

function saveCustomDomains(domains: Domain[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(domains));
  } catch { /* storage full or unavailable */ }
}

export default function Learn() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => parseTab(searchParams.get('tab')) ?? 'learn');

  const [domainKey, setDomainKey] = useState('maven');
  const [customDomains, setCustomDomains] = useState<Domain[]>(() => loadCustomDomains());

  // Build full domain map: built-ins + custom
  const allDomains: Record<string, Domain> = {
    ...DOMAINS,
    ...Object.fromEntries(customDomains.map(d => [d.root, d])),
  };
  const domain: Domain = allDomains[domainKey] ?? DOMAINS.maven;

  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [generatePrompt, setGeneratePrompt] = useState('');

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    const node = searchParams.get('node');
    const urlTab = parseTab(searchParams.get('tab'));
    if (node) {
      setFocusNodeId(node);
      setTab('learn');
    } else if (urlTab) {
      setTab(urlTab);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('node');
    next.delete('tab');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount only

  const switchTab = useCallback((id: Tab) => {
    setTab(id);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (id === 'learn') next.delete('tab');
      else next.set('tab', id);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const loadDomain = useCallback((_dom: Domain, key: string) => {
    setDomainKey(key);
    switchTab('learn');
  }, [switchTab]);

  const handleNewDomain = useCallback((dom: Domain, key: string) => {
    // Persist generated domain to localStorage and make it selectable
    setCustomDomains(prev => {
      const updated = [...prev.filter(d => d.root !== dom.root), dom];
      saveCustomDomains(updated);
      return updated;
    });
    setDomainKey(key);
    switchTab('learn');
  }, [switchTab]);

  const removeCustomDomain = useCallback((root: string) => {
    setCustomDomains(prev => {
      const updated = prev.filter(d => d.root !== root);
      saveCustomDomains(updated);
      return updated;
    });
    setDomainKey(prev => (prev === root ? 'maven' : prev));
  }, []);

  const handleTrainNode = useCallback((nodeId: string) => {
    setFocusNodeId(nodeId);
    switchTab('learn');
  }, [switchTab]);

  const handleBuildGap = useCallback((prompt: string) => {
    setGeneratePrompt(prompt);
    switchTab('generate');
  }, [switchTab]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  useDocumentTitle('Learn · WitnessSkills');

  const tabSwitcher = (
    <div className="flex items-center gap-1 p-1 bg-slate-800/40 border border-slate-700/40 rounded-xl">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => switchTab(id)}
          className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg transition-colors $\{
            tab === id ? TAB_STYLES[id] : 'text-slate-400 hover:text-slate-200'
          }`}>
          <Icon className="w-3.5 h-3.5" />{label}
        </button>
      ))}
    </div>
  );

  // Training selector: built-in + custom trainings + New button
  const allTrainings = [
    ...Object.entries(DOMAINS).map(([k, d]) => ({ key: k, name: d.name, custom: false })),
    ...customDomains.map(d => ({ key: d.root, name: d.name, custom: true })),
  ];

  const trainingSwitcher = (
    <div className="flex flex-wrap items-center gap-1.5 mt-2 mb-4">
      {allTrainings.map(({ key, name, custom }) => (
        <span key={key}
          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors $\{
            domainKey === key
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-500/50'
          }`}
          onClick={() => setDomainKey(key)}
        >
          {name}
          {custom && (
            <button
              className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); removeCustomDomain(key); }}
              title="Remove training"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
      <button
        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 hover:border-slate-400 transition-colors"
        onClick={() => switchTab('generate')}
      >
        <Plus className="w-3 h-3" /> New training
      </button>
    </div>
  );

  return (
    <AppShell
      trail={[{ label: 'Dashboard', href: '/' }, { label: 'Learn' }]}
      subNav={tabSwitcher}
      onSignOut={handleSignOut}
      actions={
        <span className="hidden lg:inline text-xs font-mono text-slate-500">
          {domain.name}{domain.generated ? ' · generated' : ''}
        </span>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {trainingSwitcher}
        {tab === 'learn' && (
          <LearningTool
            key={domainKey}
            domain={domain}
            domainKey={domainKey}
            focusNodeId={focusNodeId}
            onFocusHandled={() => setFocusNodeId(null)}
          />
        )}
        {tab === 'audit' && (
          <CoverageAuditor
            domain={domain}
            domainKey={domainKey}
            onTrainNode={handleTrainNode}
            onBuildGap={handleBuildGap}
          />
        )}
        {tab === 'generate' && (
          <GeneratorPanel
            current={domain}
            domainKey={domainKey}
            onLoad={handleNewDomain}
            initialPrompt={generatePrompt}
            onPromptConsumed={() => setGeneratePrompt('')}
          />
        )}
      </div>
    </AppShell>
  );
}
