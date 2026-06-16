import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, BarChart3, Sparkles } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import LearningTool from '../components/learn/LearningTool';
import CoverageAuditor from '../components/audit/CoverageAuditor';
import GeneratorPanel from '../components/learn/GeneratorPanel';
import { DOMAINS } from '../lib/rct/mavenOntology';
import type { Domain } from '../lib/rct/types';

type Tab = 'learn' | 'audit' | 'generate';

const TABS: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: 'learn', label: 'Learn', icon: Brain },
  { id: 'audit', label: 'Audit', icon: BarChart3 },
  { id: 'generate', label: 'Generate', icon: Sparkles },
];

const TAB_STYLES: Record<Tab, string> = {
  learn: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  audit: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  generate: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
};

function parseTab(value: string | null): Tab | null {
  if (value === 'learn' || value === 'audit' || value === 'generate') return value;
  return null;
}

export default function Learn() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => parseTab(searchParams.get('tab')) ?? 'learn');
  useDocumentTitle(tab === 'learn' ? 'Learn' : tab === 'audit' ? 'Audit' : 'Generate');
  const [domainKey, setDomainKey] = useState('maven');
  const domain: Domain = (DOMAINS as Record<string, Domain>)[domainKey] ?? DOMAINS.maven;
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount deep links once

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

  const handleTrainNode = useCallback((nodeId: string) => {
    setFocusNodeId(nodeId);
    switchTab('learn');
  }, [switchTab]);

  const handleBuildGap = useCallback((question: string) => {
    if (question) setGeneratePrompt(question);
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
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            tab === id ? TAB_STYLES[id] : 'text-slate-400 hover:text-slate-200'
          }`}>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
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
            onLoad={loadDomain}
            initialPrompt={generatePrompt}
            onPromptConsumed={() => setGeneratePrompt('')}
          />
        )}
      </div>
    </AppShell>
  );
}
