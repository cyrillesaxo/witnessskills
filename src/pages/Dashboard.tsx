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
        if (!skill) {
                    return {
                                    skillId: '',
                                    skillName: 'Unknown',
                                    proficiencyLevel: 'NOVICE',
                                    masteryScore: 0,
                                    decayRate: 0.3,
                                    improvementRate: 0,
                                    evidenceCount: 0,
                                    streak: 0,
                                    lastPracticed: null,
                                    nextReviewDate: null,
                                    retentionPct: 0,
                                    trend: 'STABLE',
                    };
        }
        const proficiency = levelToProficiency(skill.level);
        const baseScore = { NOVICE: 0.10, BEGINNER: 0.30, INTERMEDIATE: 0.55, ADVANCED: 0.75, EXPERT: 0.95 }[proficiency] ?? 0.10;
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
    const flagHealth = getFlag('VITE_FLAG_SKILL_HEALTH');
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
                                      expertSkillCount: skills.filter(s => s.level === 'expert').length,
                                      evidenceCount: skills.filter(s => !!s.evidence).length,
                                      sm2CardCount: sm2Cards.length,
                                      streakDays: 0,
                      };
                const evaluated = evaluateAchievements(ctx);
                const earned = loadEarnedAchievements();
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
                                // Only fetch skills — the activities table does not exist yet
                    const skillsRes = await supabase
                                    .from('skills')
                                    .select('id, name, level, domain, evidence, rct_node_id')
                                    .eq('user_id', user!.id)
                                    .order('created_at', { ascending: false });

                    if (skillsRes.error) throw skillsRes.error;
                                const loadedSkills = (skillsRes.data ?? []) as Skill[];
                                setSkills(loadedSkills);
                                logger.info('Dashboard: data loaded', { skillCount: loadedSkills.length, userId: user?.id });
                                // Recent activity is not available yet (activities table not in schema)
                    setRecentActivity([]);
                } catch (e) {
                                const msg = e instanceof Error ? e.message : String(e);
                                logger.error('Dashboard: failed to load user data', { userId: user?.id }, e instanceof Error ? e : new Error(msg));
                                setError(msg);
                } finally {
                                setLoading(false);
                }
    }

    // ---- Mastery records (derived from skills + sm2 cards)
    const masteryRecords: SkillMasteryRecord[] = (skills ?? []).filter(Boolean).map(buildMasteryRecord);
        const sm2Map = new Map(sm2Cards.map(c => [c.skillId, c]));

    // ---- Stats
    const expertCount    = (skills ?? []).filter(s => s.level === 'expert').length;
        const advancedCount  = (skills ?? []).filter(s => s.level === 'advanced').length;
        const earnedCount    = (achievements ?? []).filter(a => !!a.earnedAt).length;
        const dueCount       = sm2Cards.filter(c => new Date(c.nextReviewAt).getTime() <= Date.now()).length;

    // ---- Tabs config
    const tabs: { id: DashboardTab; label: string; show: boolean }[] = [
        { id: 'overview',      label: 'Overview',      show: true },
        { id: 'health',        label: 'Skill Health',  show: flagHealth },
        { id: 'achievements',  label: 'Achievements',  show: flagAchievements },
            ];

    if (loading) {
                return (
                                <AppShell>
                                                <div className="flex items-center justify-center min-h-[60vh]">
                                                                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                                                </div>div>
                                </AppShell>AppShell>
                            );
    }
    
        if (error) {
                    return (
                                    <AppShell>
                                                    <div className="flex items-center justify-center min-h-[60vh]">
                                                                        <div className="text-center">
                                                                                                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                                                                                                <p className="text-slate-300">{error}</p>p>
                                                                                                <button onClick={loadData} className="mt-4 text-teal-400 hover:text-teal-300 text-sm">
                                                                                                                            Try again
                                                                                                    </button>button>
                                                                        </div>div>
                                                    </div>div>
                                    </AppShell>AppShell>
                                );
        }
    
        // ---------------------------------------------------------------
        // SUB-COMPONENTS (inline for co-location)
        // ---------------------------------------------------------------
    
        function EmptyState() {
                    return (
                                    <div className="text-center py-12">
                                                    <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                                    <p className="text-slate-400 text-sm">No skills yet</p>p>
                                                    <Link to="/skills" className="mt-2 inline-block text-teal-400 hover:text-teal-300 text-sm">
                                                                        Add your first skill →
                                                    </Link>Link>
                                    </div>div>
                                );
        }
    
        function StatCard({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: number; alert?: boolean }) {
                    return (
                                    <div className={`flex items-center gap-3 bg-slate-800/40 border rounded-xl px-4 py-3 ${alert ? 'border-amber-500/40' : 'border-slate-700/50'}`}>
                                                    <div className="text-teal-400">{icon}</div>div>
                                                    <div>
                                                                        <p className="text-lg font-bold text-white leading-none">{value}</p>p>
                                                                        <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>p>
                                                    </div>div>
                                    </div>div>
                                );
        }
    
        function SkillCard({ skill, onOpenGraph }: { skill: Skill; onOpenGraph: () => void }) {
                    return (
                                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/60 transition-all duration-200 group">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                                        <p className="text-sm font-medium text-slate-200 truncate">{skill.name}</p>p>
                                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 flex-shrink-0 capitalize">
                                                                            {skill.level}
                                                                        </span>span>
                                                    </div>div>
                                        {skill.domain && (
                                                            <p className="text-[11px] text-slate-500 mb-2 truncate">{skill.domain}</p>p>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        {skill.evidence ? (
                                                                <span className="text-[10px] text-teal-400 flex items-center gap-1">
                                                                                            <Award className="w-3 h-3" /> Evidence
                                                                </span>span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-600">No evidence</span>span>
                                                                        )}
                                                        {skill.rct_node_id && (
                                                                <button
                                                                                                onClick={onOpenGraph}
                                                                                                className="text-[10px] text-slate-500 hover:text-teal-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                            >
                                                                                            <Target className="w-3 h-3" /> Graph
                                                                </button>button>
                                                                        )}
                                                    </div>div>
                                    </div>div>
                                );
        }
    
        function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
                    return (
                                    <Link
                                                        to={to}
                                                        className="flex flex-col items-center gap-2 bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-teal-500/30 hover:bg-slate-800/60 transition-all duration-200 group"
                                                    >
                                                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                                                        {icon}
                                                    </div>div>
                                                    <span className="text-[11px] text-slate-400 group-hover:text-slate-300">{label}</span>span>
                                    </Link>Link>
                                );
        }
    
        // ---------------------------------------------------------------
        // RENDER
        // ---------------------------------------------------------------
    
        return (
                    <AppShell>
                                <div className="space-y-6">
                                
                                    {/* Header */}
                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                                            <h1 className="text-xl font-bold text-white">Dashboard</h1>h1>
                                                                                            <p className="text-sm text-slate-400 mt-0.5">
                                                                                                {skills.length} skill{skills.length !== 1 ? 's' : ''} tracked
                                                                                                </p>p>
                                                                    </div>div>
                                                                    <button
                                                                                                onClick={() => signOut().then(() => navigate('/login'))}
                                                                                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                                                                                            >
                                                                                            Sign out
                                                                    </button>button>
                                                </div>div>
                                
                                    {/* Stats row */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                                    <StatCard icon={<Brain className="w-4 h-4" />} label="Total skills" value={skills.length} />
                                                                    <StatCard icon={<Star className="w-4 h-4" />} label="Expert" value={expertCount} />
                                                                    <StatCard icon={<Trophy className="w-4 h-4 text-purple-400" />} label="Badges" value={earnedCount} />
                                                                    <StatCard icon={<Zap className="w-4 h-4 text-blue-400" />} label="Reviews due" value={dueCount} alert={dueCount > 0} />
                                                </div>div>
                                
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
                                                                                </button>button>
                                                                        ))}
                                            </div>div>
                                                )}
                                
                                    {/* Tab: Overview */}
                                    {activeTab === 'overview' && (
                                            <div className="space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                                                    <h2 className="text-sm font-semibold text-slate-300">Your Skills</h2>h2>
                                                                                                    <Link to="/skills" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                                                                                                                                        View all <ChevronRight className="w-3 h-3" />
                                                                                                        </Link>Link>
                                                                    </div>div>
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
                                                                                </div>div>
                                                                    )}
                                            </div>div>
                                                )}
                                
                                    {/* Tab: Skill Health */}
                                    {activeTab === 'health' && flagHealth && (
                                            <div className="space-y-3">
                                                                    <p className="text-xs text-slate-500">
                                                                                                    Mastery scores, retention estimates, and review nudges powered by spaced repetition.
                                                                    </p>p>
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
                                                                                </div>div>
                                                                    )}
                                            </div>div>
                                                )}
                                
                                    {/* Tab: Achievements */}
                                    {activeTab === 'achievements' && flagAchievements && (
                                            <AchievementsPanel achievements={achievements ?? []} />
                                        )}
                                
                                    {/* Quick actions */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                                    <QuickAction to="/learn"         icon={<Brain className="w-4 h-4" />}      label="Learn" />
                                                                    <QuickAction to="/challenge"     icon={<Zap className="w-4 h-4" />}        label="Challenge" />
                                                                    <QuickAction to="/apply/gaps"    icon={<Target className="w-4 h-4" />}     label="Gap Analysis" />
                                                                    <QuickAction to="/apply/resume"  icon={<TrendingUp className="w-4 h-4" />} label="Resume" />
                                                </div>div>
                                
                                </div>div>
                    
                        {/* Ontology Modal */}
                        {graphSkill && (
                                        <OntologyGraphModal
                                                                skillName={graphSkill.name}
                                                                skillLevel={graphSkill.level}
                                                                onClose={() => setGraphSkill(null)}
                                                            />
                                    )}
                    </AppShell>AppShell>
                );
}</AppShell>
