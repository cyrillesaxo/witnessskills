import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, BarChart3, Sparkles } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import LearningTool from '../components/learn/LearningTool';
import CoverageAuditor from '../components/audit/CoverageAuditor';
import GeneratorPanel from '../components/learn/GeneratorPanel';
import TrainingTable, { type TrainingRow } from '../components/learn/TrainingTable';
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

interface StoredTraining {
  key: string;
  raw: Parameters<typeof hydrateGenerated>[0];
}

const LS_KEY = 'ws_custom_trainings_v2';

function loadCustomTrainings(): Array<{ key: string; domain: Domain }> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredTraining[];
    return parsed.map(({ key, raw: r }) => ({ key, domain: hydrateGenerated(r) }));
  } catch {
    return [];
  }
}

function saveCustomTrainings(trainings: Array<{ key: string; domain: Domain }>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(trainings.map(({ key, domain: d }) => ({
      key,
      raw: { name: d.name, root: d.root, helloPom: d.helloPom ?? null, nodes: d.nodes.map(n => ({
        id: n.id, label: n.label, description: n.description, tier: n.tier,
        keywords: n.keywords, negativeKeywords: n.negativeKeywords, prerequisites: n.prerequisites,
      })) },
    }))));
  } catch { /* storage full */ }
}

export default function Learn() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => parseTab(searchParams.get('tab')) ?? 'learn');

  const [domainKey, setDomainKey] = useState('maven');
  const [customTrainings, setCustomTrainings] = useState<Array<{ key: string; domain: Domain }>>(
    () => loadCustomTrainings()
  );

  const allDomains: Record<string, Domain> = {
    ...Object.fromEntries(Object.entries(DOMAINS)),
    ...Object.fromEntries(customTrainings.map(({ key, domain }) => [key, domain])),
  };
  const domain: Domain = allDomains[domainKey] ?? DOMAINS.maven;

  // Build table rows: built-ins first, then custom
  const tableRows: TrainingRow[] = [
    ...Object.entries(DOMAINS).map(([k, d]) => ({ key: k, name: d.name, domain: d, custom: false })),
    ...customTrainings.map(({ key, domain: d }) => ({ key, name: d.name, domain: d, custom: true })),
  ];

  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [generatePrompt, setGeneratePrompt] = useState('');

  useDocumentTitle(tab === 'learn' ? 'Learn' : tab === 'audit' ? 'Audit' : 'Generate');

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

  const handleNewDomain = useCallback((dom: Domain, key: string) => {
    setCustomTrainings(prev => {
      const updated = [...prev.filter(t => t.key !== key), { key, domain: dom }];
      saveCustomTrainings(updated);
      return updated;
    });
    setDomainKey(key);
    switchTab('learn');
  }, [switchTab]);

  const handleSelectTraining = useCallback((key: string) => {
    setDomainKey(key);
    switchTab('learn');
  }, [switchTab]);

  const removeCustomTraining = useCallback((key: string) => {
    setCustomTrainings(prev => {
      const updated = prev.filter(t => t.key !== key);
      saveCustomTrainings(updated);
      return updated;
    });
    setDomainKey(prev => (prev === key ? 'maven' : prev));
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

  const tabSwitcher = (
    <div className="flex items-center gap-1 p-1 bg-slate-800/40 border border-slate-700/40 rounded-xl">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => switchTab(id)}
          className={'flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg transition-colors ' + (
            tab === id ? TAB_STYLES[id] : 'text-slate-400 hover:text-slate-200'
          )}>
          <Icon className="w-3.5 h-3.5" />{label}
        </button>
      ))}
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
        <TrainingTable
          rows={tableRows}
          selectedKey={domainKey}
          onSelect={handleSelectTraining}
          onRemove={removeCustomTraining}
          onNewTraining={() => switchTab('generate')}
        />
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
