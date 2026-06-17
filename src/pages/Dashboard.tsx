// WitnessSkills: Dashboard.tsx
// Updated to integrate SkillHealthCard (VITE_FLAG_SKILL_HEALTH)
// and AchievementsPanel (VITE_FLAG_ACHIEVEMENTS) from balafons-inspired features.

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Brain, BookOpen, Target, TrendingUp, Award, ChevronRight,
    Loader2, AlertCircle, Zap, Trophy, Star,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import OntologyGraphModal from '../components/ui/OntologyGraphModal';
import SkillHealthCard from '../components/ui/SkillHealthCard';
import AchievementsPanel from '../components/ui/AchievementsPanel';
import { supabase } from '../lib/supabase';
import { getFlag } from '../lib/flags';
import { logger } from '../lib/logger';
import {
    levelToProficiency,
    computeDecayedScore,
    inferTrend,
    type SkillMasteryRecord,
} from '../lib/mastery';
import {
    loadSM2Cards,
    type SM2Card,
} from '../lib/spacedRepetition';
import {
    evaluateAchievements,
    loadEarnedAchievements,
    saveEarnedAchievements,
    mergeEarnedDates,
    type Achievement,
    type AchievementContext,
} from '../lib/achievements';

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------

interface Skill {
    id: string;
    name: string;
    level: string;
    domain: string | null;
    evidence: string | null;
    rct_node_id: string | null;
}

interface RecentActivity {
    id: string;
    type: string;
    description: string;
    created_at: string;
}

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------

function buildMasteryRecord(skill: Skill): SkillMasteryRecord {
    const proficiency = levelToProficiency(skill.level);
    const baseScore = { NOVICE: 0.10, BEGINNER: 0.30, INTERMEDIATE: 0.55, ADVANCED: 0.75, EXPERT: 0.95 }[proficiency];
    // Without probe history, use the level as the base; decay 0.3/30d for non-experts
  const decayRate = proficiency === 'EXPERT' ? 0.15 : 0.3;
    const masteryScore = computeDecayedScore(baseScore, 7, decayRate); // assume 1 week old
  return {
        skillId: skill.id,
        skillName: skill.name,
        proficiencyLevel: proficiency,
        masteryScore,
        decayRate,
        improvementRate: 0,
        evidenceCount: skill.evidence ? 1 : 0,
        streak: 0,
        lastPracticed: null,
        nextReviewDate: null,
        retentionPct: Math.round(masteryScore * 100),
        trend: 'STABLE',
  };
}

// ---------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------

type DashboardTab = 'overview' | 'health' | 'achievements';

export default function Dashboard() {
    useDocumentTitle('Dashboard');
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

  const [skills, setSkills] = useState<Skill[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [graphSkill, setGraphSkill] = useState<{ name: string; level: string } | null>(null);
    const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Feature flags
  const flagHealth       = getFlag('VITE_FLAG_SKILL_HEALTH');
    const flagAchievements = getFlag('VITE_FLAG_ACHIEVEMENTS');

  // SM-2 cards (loaded client-side)
  const [sm2Cards, setSm2Cards] = useState<SM2Card[]>([]);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
        if (!user) { navigate('/login'); return; }
        loadData();
        setSm2Cards(loadSM2Cards());
  }, [user, navigate]);

  useEffect(() => {
        if (!flagAchievements || skills.length === 0) return;
        const ctx: AchievementContext = {
                skillCount: skills.length,
                probeCount: 0, // will grow as probe data is wired
                streakDays: 0,
                expertSkillCount: skills.filter(s => s.level === 'expert').length,
                advancedSkillCount: skills.filter(s => s.level === 'advanced').length,
                dueReviewsCompleted: 0,
                consecutiveProbesWithNoDecline: 0,
                challengeCount: 0,
                applicationsSent: 0,
                resumeVersions: 0,
        };
        const earned = loadEarnedAchievements();
        const evaluated = evaluateAchievements(ctx);
        const merged = mergeEarnedDates(evaluated, earned);
        // Persist newly earned
                const newlyEarned = merged.filter(a => !!a.earnedAt && !earned.find(e => e.id === a.id));
        if (newlyEarned.length) {
                saveEarnedAchievements([...earned, ...newlyEarned.map(a => ({ id: a.id, earnedAt: a.earnedAt! }))]);
        }
        setAchievements(merged);
  }, [skills, flagAchievements]);

  async function loadData() {
        setLoading(true);
        setError(null);
        try {
                const [skillsRes, activityRes] = await Promise.all([
                          supabase
                            .from('skills')
                            .select('id, name, level, domain, evidence, rct_node_id')
                            .eq('user_id', user!.id)
                            .order('created_at', { ascending: false }),
                          supabase
                            .from('activities')
                            .select('id, type, description, created_at')
                            .eq('user_id', user!.id)
                            .order('created_at', { ascending: false })
                            .limit(5),
                        ]);
                if (skillsRes.error) throw skillsRes.error;
                const loadedSkills = (skillsRes.data ?? []) as Skill[];
                setSkills(loadedSkills);
                logger.info('Dashboard: data loaded', { skillCount: loadedSkills.length, userId: user?.id });
                if (activityRes.error) {
                          logger.warn('Dashboard: failed to load recent activity', { userId: user?.id, code: activityRes.error.code }, activityRes.error);
                } else {
                          setRecentActivity((activityRes.data ?? []) as RecentActivity[]);
                }
        } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                logger.error('Dashboard: failed to load user data', { userId: user?.id }, e instanceof Error ? e : new Error(msg));
                setError(msg);
        } finally {
                setLoading(false);
        }
  }

  // ---- Mastery records (derived from skills + sm2 cards)
  const masteryRecords: SkillMasteryRecord[] = skills.map(buildMasteryRecord);
    const sm2Map = new Map(sm2Cards.map(c => [c.skillId, c]));

  // ---- Stats
  const expertCount   = skills.filter(s => s.level === 'expert').length;
    const advancedCount = skills.filter(s => s.level === 'advanced').length;
    const earnedCount   = achievements.filter(a => !!a.earnedAt).length;
    const dueCount      = sm2Cards.filter(c => new Date(c.nextReviewAt).getTime() <= Date.now()).length;

  // ---- Tabs config
  const tabs: { id: DashboardTab; label: string; show: boolean }[] = [
    { id: 'overview',      label: 'Overview',     show: true },
    { id: 'health',        label: 'Skill Health',  show: flagHealth },
    { id: 'achievements',  label: 'Achievements',  show: flagAchievements },
      ];

  if (loading) {
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
                        <div className="flex items-center justify-between">
                                  <div>
                                              <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
                                              <p className="text-sm text-slate-400 mt-0.5">
                                                {user?.email ?? 'Welcome back'}
                                              </p>
                                  </div>
                          {dueCount > 0 && (
                        <Link
                                        to="/learn"
                                        className="flex items-center gap-1.5 text-xs bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-1.5 rounded-xl hover:bg-red-500/20 transition-all"
                                      >
                                      <Brain className="w-3.5 h-3.5" />
                          {dueCount} review{dueCount !== 1 ? 's' : ''} due
                        </Link>
                                  )}
                        </div>
                
                  {/* Error */}
                  {error && (
                      <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                        )}
                
                  {/* Stats row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <StatCard icon={<BookOpen className="w-4 h-4 text-teal-400" />} label="Skills" value={skills.length} />
                                  <StatCard icon={<Star className="w-4 h-4 text-amber-400" />} label="Expert" value={expertCount} />
                                  <StatCard icon={<Trophy className="w-4 h-4 text-purple-400" />} label="Badges" value={earnedCount} />
                                  <StatCard icon={<Zap className="w-4 h-4 text-blue-400" />} label="Reviews due" value={dueCount} alert={dueCount > 0} />
                        </div>
                
                  {/* Tabs */}
                  {(flagHealth || flagAchievements) && (
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
                        )}
                
                  {/* Tab: Overview */}
                  {activeTab === 'overview' && (
                      <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                                <h2 className="text-sm font-semibold text-slate-300">Your Skills</h2>
                                                <Link to="/skills" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                                                                View all <ChevronRight className="w-3 h-3" />
                                                </Link>
                                  </div>
                        {skills.length === 0 ? (
                                      <EmptyState />
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {skills.slice(0, 6).map(skill => (
                                                          <SkillCard
                                                                                key={skill.id}
                                                                                skill={skill}
                                                                                onOpenGraph={() => setGraphSkill({ name: skill.name, level: skill.level })}
                                                                              />
                                                        ))}
                                      </div>
                                  )}
                      </div>
                        )}
                
                  {/* Tab: Skill Health */}
                  {activeTab === 'health' && flagHealth && (
                      <div className="space-y-3">
                                  <p className="text-xs text-slate-500">
                                                Mastery scores, retention estimates, and review nudges powered by spaced repetition.
                                  </p>
                        {masteryRecords.length === 0 ? (
                                      <EmptyState />
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {masteryRecords.map(m => (
                                                          <SkillHealthCard
                                                                                key={m.skillId}
                                                                                mastery={m}
                                                                                sm2Card={sm2Map.get(m.skillId)}
                                                                                onViewProbe={() => navigate('/learn')}
                                                                              />
                                                        ))}
                                      </div>
                                  )}
                      </div>
                        )}
                
                  {/* Tab: Achievements */}
                  {activeTab === 'achievements' && flagAchievements && (
                      <AchievementsPanel achievements={achievements} />
                    )}
                
                  {/* Quick actions */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                  <QuickAction to="/learn"    icon={<Brain className="w-4 h-4" />}      label="Learn"        />
                                  <QuickAction to="/challenge" icon={<Zap className="w-4 h-4" />}       label="Challenge"    />
                                  <QuickAction to="/apply/gaps" icon={<Target className="w-4 h-4" />}   label="Gap Analysis" />
                                  <QuickAction to="/apply/resume" icon={<TrendingUp className="w-4 h-4" />} label="Resume" />
                        </div>
                </div>
          
            {/* Ontology Modal */}
            {graphSkill && (
                    <OntologyGraphModal
                                skillName={graphSkill.name}
                                level={graphSkill.level}
                                onClose={() => setGraphSkill(null)}
                              />
                  )}
          </AppShell>
        );
}

// ---------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------

function StatCard({
    icon, label, value, alert = false,
}: { icon: React.ReactNode; label: string; value: number; alert?: boolean }) {
    return (
          <div className={`rounded-xl border p-3 text-center ${
                  alert ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/60 border-slate-700/50'
          }`}>
                <div className="flex items-center justify-center mb-1">{icon}</div>
                <p className={`text-xl font-bold ${alert ? 'text-red-300' : 'text-slate-100'}`}>{value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
          </div>
        );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    return (
          <Link
                  to={to}
                  className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all text-sm text-slate-300 hover:text-slate-100"
                >
                <span className="text-teal-400">{icon}</span>
            {label}
          </Link>
        );
}

function SkillCard({
    skill,
    onOpenGraph,
}: { skill: Skill; onOpenGraph: () => void }) {
    const levelColors: Record<string, string> = {
          beginner: 'text-slate-400 bg-slate-500/20',
          intermediate: 'text-blue-300 bg-blue-500/20',
          advanced: 'text-purple-300 bg-purple-500/20',
          expert: 'text-amber-300 bg-amber-500/20',
    };
    const color = levelColors[skill.level] ?? 'text-slate-400 bg-slate-500/20';
  
    return (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 hover:border-slate-600/70 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-slate-200 truncate">{skill.name}</p>
                        <button
                                    onClick={onOpenGraph}
                                    title="View skill ontology graph"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                  <Brain className="w-3.5 h-3.5 text-teal-400 hover:text-teal-300" />
                        </button>
                </div>
                <div className="flex items-center gap-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${color}`}>
                          {skill.level}
                        </span>
                  {skill.domain && (
                      <span className="text-[11px] text-slate-500 truncate">{skill.domain}</span>
                        )}
                </div>
            {skill.evidence && (
                    <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">{skill.evidence}</p>
                )}
          </div>
        );
}

function EmptyState() {
    return (
          <div className="text-center py-8 text-slate-500 text-sm">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No skills yet.</p>
                <Link to="/skills" className="text-teal-400 hover:text-teal-300 text-xs mt-1 inline-block">
                        Add your first skill →
                </Link>
          </div>
        );
}
