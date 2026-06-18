import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import OnboardingModal, { hasOnboarded } from '../components/ui/OnboardingModal';
import LearningTool from '../components/learn/LearningTool';
import GeneratorPanel from '../components/learn/GeneratorPanel';
import TrainingTable, { type TrainingRow } from '../components/learn/TrainingTable';
import SpacedRepetitionPanel from '../components/learn/SpacedRepetitionPanel';
import CoverageAuditor from '../components/audit/CoverageAuditor';
import { supabase } from '../lib/supabase';
import { getFlag } from '../lib/flags';
import { DOMAINS } from '../lib/rct/mavenOntology';
import type { Domain } from '../lib/rct/types';

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------

interface SkillRow {
  id: string;
  name: string;
  level: string;
}

type LearnTab = 'train' | 'audit' | 'reviews';

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------

const BUILTIN_ROWS: TrainingRow[] = Object.entries(DOMAINS).map(([key, domain]) => ({
  key,
  name: domain.name,
  domain,
  custom: false,
}));

// ---------------------------------------------------------------
// AUDIT TAB (needs its own state so domain selector works)
// ---------------------------------------------------------------

function AuditTab() {
  const domainEntries = Object.entries(DOMAINS);
  const [idx, setIdx] = useState(0);
  const [key, domain] = domainEntries[idx];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1">
        {domainEntries.map(([k, d], i) => (
          <button
            key={k}
            onClick={() => setIdx(i)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              idx === i
                ? 'bg-teal-600/20 text-teal-300 border-teal-500/30'
                : 'text-slate-400 border-slate-700/50 hover:text-slate-300'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>
      <CoverageAuditor domain={domain} domainKey={key} />
    </div>
  );
}

// ---------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------

export default function Learn() {
  useDocumentTitle('Learn');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Feature flags
  const flagSR = getFlag('VITE_FLAG_SPACED_REPETITION');

  // Tab state — read from ?tab= query param
  const tabParam = searchParams.get('tab') as LearnTab | null;
  const [activeTab, setActiveTab] = useState<LearnTab>(
    tabParam === 'audit' ? 'audit' : tabParam === 'reviews' ? 'reviews' : 'train',
  );

  // Training selection state
  const [trainingRows, setTrainingRows] = useState<TrainingRow[]>(BUILTIN_ROWS);
  const [selectedKey, setSelectedKey] = useState<string>('maven');
  const learningToolRef = useRef<HTMLDivElement>(null);

  // Focus node from URL param (e.g. ?node=React)
  const nodeParam = searchParams.get('node');
  const [pendingFocusNode, setPendingFocusNode] = useState<string | null>(nodeParam ?? null);

  const selectedRow = trainingRows.find(r => r.key === selectedKey) ?? trainingRows[0];
  const activeDomain: Domain = selectedRow?.domain ?? DOMAINS.maven;
  const activeDomainKey: string = selectedRow?.key ?? 'maven';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadSkills();
    if (!hasOnboarded()) setShowOnboarding(true);
  }, [user, navigate]);

  // Sync tab to URL
  useEffect(() => {
    if (activeTab !== 'train') {
      setSearchParams({ tab: activeTab }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [activeTab, setSearchParams]);

  async function loadSkills() {
    setLoadingSkills(true);
    try {
      const { data } = await supabase
        .from('skills')
        .select('id, name, level')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      setSkills((data ?? []) as SkillRow[]);
    } catch {
      // non-fatal
    } finally {
      setLoadingSkills(false);
    }
  }

  function handleLoadDomain(domain: Domain, key: string) {
    const existing = trainingRows.find(r => r.key === key);
    if (!existing) {
      setTrainingRows(prev => [...prev, { key, name: domain.name, domain, custom: true }]);
    }
    setSelectedKey(key);
  }

  function handleSelectTraining(key: string) {
    setSelectedKey(key);
    setTimeout(() => {
      learningToolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleRemoveRow(key: string) {
    setTrainingRows(prev => prev.filter(r => r.key !== key));
    if (selectedKey === key) setSelectedKey('maven');
  }

  const tabs: { id: LearnTab; label: string; show: boolean }[] = [
    { id: 'train',   label: 'Train',   show: true },
    { id: 'audit',   label: 'Audit',   show: true },
    { id: 'reviews', label: 'Reviews', show: flagSR },
  ];

  if (loadingSkills) {
    return (
      <AppShell onSignOut={signOut}>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
        </div>
      </AppShell>
    );
  }

  return (
    <>
    <AppShell onSignOut={signOut}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Learn</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Train on ontology nodes, audit coverage, and review scheduled skills.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 border-b border-slate-700/50 pb-2">
          {tabs.filter(t => t.show).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm px-4 py-1.5 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ---- Tab: Train ---- */}
        {activeTab === 'train' && (
          <div className="space-y-6">
            <GeneratorPanel
              current={activeDomain}
              domainKey={activeDomainKey}
              onLoad={handleLoadDomain}
            />

            <TrainingTable
              rows={trainingRows}
              selectedKey={selectedKey}
              onSelect={handleSelectTraining}
              onRemove={handleRemoveRow}
              onNewTraining={() => {
                const el = document.querySelector<HTMLInputElement>('input[placeholder*="domain"]');
                el?.focus();
              }}
            />

            <div ref={learningToolRef}>
            <LearningTool
              domain={activeDomain}
              domainKey={activeDomainKey}
              focusNodeId={pendingFocusNode}
              onFocusHandled={() => setPendingFocusNode(null)}
            />
            </div>
          </div>
        )}

        {/* ---- Tab: Audit ---- */}
        {activeTab === 'audit' && (
          <AuditTab />
        )}

        {/* ---- Tab: Reviews (Spaced Repetition) ---- */}
        {activeTab === 'reviews' && flagSR && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              SM-2 spaced repetition — rate your recall after each probe to auto-schedule the next review.
            </p>
            <SpacedRepetitionPanel
              skillNames={skills.map(s => ({ id: s.id, name: s.name }))}
            />
          </div>
        )}

      </div>
    </AppShell>

    {showOnboarding && (
      <OnboardingModal onStart={() => setShowOnboarding(false)} />
    )}
    </>
  );
}
