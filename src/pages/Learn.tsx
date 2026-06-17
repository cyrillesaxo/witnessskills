// WitnessSkills: Learn.tsx
// Updated to add "Reviews" tab powered by SpacedRepetitionPanel
// when VITE_FLAG_SPACED_REPETITION is on.

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import LearningTool from '../components/learn/LearningTool';
import Graph from '../components/learn/Graph';
import GeneratorPanel from '../components/learn/GeneratorPanel';
import TrainingTable from '../components/learn/TrainingTable';
import SpacedRepetitionPanel from '../components/learn/SpacedRepetitionPanel';
import { CoverageAuditor } from '../components/audit/CoverageAuditor';
import { supabase } from '../lib/supabase';
import { getFlag } from '../lib/flags';
import { GIT_DOMAIN, GRADLE_DOMAIN, DOCKER_DOMAIN, NPM_DOMAIN, TS_DOMAIN, SQL_DOMAIN, NODEJS_DOMAIN, REACT_DOMAIN } from '../lib/rct/builtinDomains';
import type { Domain } from '../lib/rct/types';
const DOMAINS = [GIT_DOMAIN, GRADLE_DOMAIN, DOCKER_DOMAIN, NPM_DOMAIN, TS_DOMAIN, SQL_DOMAIN, NODEJS_DOMAIN, REACT_DOMAIN];

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
// COMPONENT
// ---------------------------------------------------------------

export default function Learn() {
    useDocumentTitle('Learn');
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

  const [skills, setSkills] = useState<SkillRow[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(true);

  // Feature flags
  const flagSR = getFlag('VITE_FLAG_SPACED_REPETITION');

  // Tab state — read from ?tab= query param
  const tabParam = searchParams.get('tab') as LearnTab | null;
    const [activeTab, setActiveTab] = useState<LearnTab>(
          tabParam === 'audit' ? 'audit' : tabParam === 'reviews' ? 'reviews' : 'train',
        );

  // Training selection state
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
    const [selectedTraining, setSelectedTraining] = useState<{ domain: Domain; nodeId: string } | null>(null);
    const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
        if (!user) { navigate('/login'); return; }
        loadSkills();
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

  function handleSelectTraining(domain: Domain, nodeId: string) {
        setSelectedDomain(domain);
        setSelectedTraining({ domain, nodeId });
        // Auto-scroll to graph
      setTimeout(() => graphRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  const tabs: { id: LearnTab; label: string; show: boolean }[] = [
    { id: 'train',   label: 'Train',   show: true },
    { id: 'audit',   label: 'Audit',   show: true },
    { id: 'reviews', label: 'Reviews', show: flagSR },
      ];

  if (loadingSkills) {
        return (
                <AppShell user={user} onSignOut={signOut}>
                          <div className="flex items-center justify-center min-h-64">
                                    <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                          </div>
                </AppShell>
              );
  }
  
    return (
          <AppShell user={user} onSignOut={signOut}>
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
                        {/* Generator + training table */}
                                  <GeneratorPanel skills={skills} onSelect={handleSelectTraining} />
                      
                                  <TrainingTable
                                                  domains={DOMAINS}
                                                  onSelect={handleSelectTraining}
                                                />
                      
                        {/* Graph + LearningTool */}
                        {selectedDomain && (
                                      <div ref={graphRef} className="space-y-4">
                                                      <Graph
                                                                          domain={selectedDomain}
                                                                          selectedNodeId={selectedTraining?.nodeId ?? null}
                                                                          onSelectNode={nodeId => setSelectedTraining({ domain: selectedDomain, nodeId })}
                                                                        />
                                        {selectedTraining && (
                                                          <LearningTool
                                                                                domain={selectedTraining.domain}
                                                                                nodeId={selectedTraining.nodeId}
                                                                                userId={user?.id ?? ''}
                                                                              />
                                                        )}
                                      </div>
                                  )}
                      </div>
                        )}
                
                  {/* ---- Tab: Audit ---- */}
                  {activeTab === 'audit' && (
                      <CoverageAuditor userId={user?.id ?? ''} />
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
        );
}
