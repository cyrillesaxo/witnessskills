// WitnessSkills: AchievementsPanel
// Inspired by balafons' Achievements.tsx + BadgeSystem UI component.
// Displays earned achievements and progress toward locked ones.
// Used on Dashboard / Profile when VITE_FLAG_ACHIEVEMENTS is on.

import { useState } from 'react';
import { Trophy, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import type { Achievement, AchievementRarity } from '../../lib/achievements';
import { RARITY_STYLES } from '../../lib/achievements';

// ---------------------------------------------------------------
// BADGE CARD
// ---------------------------------------------------------------

interface BadgeCardProps {
        achievement: Achievement;
}

function BadgeCard({ achievement }: BadgeCardProps) {
        const { border, glow, label } = RARITY_STYLES[achievement.rarity];
        const isEarned = !!achievement.earnedAt;

    return (
                <div
                                className={`relative rounded-xl border p-3 transition-all duration-200 ${border} ${glow} ${
                                                    isEarned
                                                        ? 'bg-slate-800/70'
                                                        : 'bg-slate-900/50 opacity-70 grayscale'
                                }`}
                                title={achievement.description}
                            >
                    {/* Locked overlay */}
                    {!isEarned && (
                                                <div className="absolute top-2 right-2">
                                                                    <Lock className="w-3 h-3 text-slate-600" />
                                                </div>
                            )}
                
                    {/* Icon */}
                            <div className="text-2xl mb-1.5 text-center">{achievement.icon}</div>
                
                    {/* Title */}
                            <p className="text-xs font-semibold text-slate-200 text-center truncate">
                                {achievement.title}
                            </p>
                
                    {/* Rarity tag */}
                            <p className={`text-[10px] text-center mt-0.5 ${
                                                achievement.rarity === 'legendary' ? 'text-amber-400' :
                                                achievement.rarity === 'epic' ? 'text-purple-400' :
                                                achievement.rarity === 'rare' ? 'text-blue-400' :
                                                'text-slate-500'
                            }`}>
                                {label}
                            </p>
                
                    {/* Progress bar if not earned */}
                    {!isEarned && achievement.progress < 100 && (
                                                <div className="mt-2">
                                                                    <div className="w-full bg-slate-700/60 rounded-full h-1">
                                                                                            <div
                                                                                                                            className="h-1 rounded-full bg-teal-600 transition-all duration-500"
                                                                                                                            style={{ width: `${achievement.progress}%` }}
                                                                                                                        />
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-500 text-center mt-0.5">{achievement.progress}%</p>
                                                </div>
                            )}
                
                    {/* Earned date */}
                    {isEarned && achievement.earnedAt && (
                                                <p className="text-[10px] text-teal-400 text-center mt-1">
                                                    {new Date(achievement.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                            )}
                </div>
            );
}

// ---------------------------------------------------------------
// PANEL
// ---------------------------------------------------------------

interface AchievementsPanelProps {
        achievements: Achievement[];
        className?: string;
}

type FilterTab = 'all' | 'earned' | 'in-progress';

export default function AchievementsPanel({
        achievements = [],
        className = '',
}: AchievementsPanelProps) {
        const [filter, setFilter] = useState<FilterTab>('all');
        const [showRarityFilter, setShowRarityFilter] = useState(false);
        const [rarityFilter, setRarityFilter] = useState<AchievementRarity | 'all'>('all');
    
        const safeAchievements = achievements ?? [];
        const earnedCount = safeAchievements.filter(a => !!a.earnedAt).length;
        const totalCount = safeAchievements.length;
    
        const filtered = safeAchievements.filter(a => {
                    const tabOk = filter === 'all' || (filter === 'earned' ? !!a.earnedAt : !a.earnedAt && a.progress > 0);
                    const rarityOk = rarityFilter === 'all' || a.rarity === rarityFilter;
                    return tabOk && rarityOk;
        });
    
        const overallPct = totalCount ? Math.round((earnedCount / totalCount) * 100) : 0;
    
        return (
                    <div className={`space-y-4 ${className}`}>
                        {/* Progress header */}
                                <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                                    <Trophy className="w-4 h-4 text-amber-400" />
                                                                    <span className="text-sm font-semibold text-slate-200">
                                                                        {earnedCount} / {totalCount} earned
                                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-400">{overallPct}% complete</span>
                                </div>
                    
                        {/* Progress bar */}
                                <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                                                <div
                                                                        className="h-1.5 rounded-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-500"
                                                                        style={{ width: `${overallPct}%` }}
                                                                    />
                                </div>
                    
                        {/* Filter tabs */}
                                <div className="flex gap-1.5 flex-wrap">
                                    {(['all', 'earned', 'in-progress'] as FilterTab[]).map(tab => (
                                            <button
                                                                        key={tab}
                                                                        onClick={() => setFilter(tab)}
                                                                        className={`text-xs px-3 py-1 rounded-lg transition-all capitalize ${
                                                                                                        filter === tab
                                                                                                            ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                                                                                                            : 'text-slate-400 hover:text-slate-300 border border-transparent'
                                                                        }`}
                                                                    >
                                                {tab === 'in-progress' ? 'In progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                            </button>
                                        ))}
                                
                                    {/* Rarity filter toggle */}
                                                <button
                                                                        onClick={() => setShowRarityFilter(v => !v)}
                                                                        className="text-xs px-3 py-1 rounded-lg border border-transparent text-slate-400 hover:text-slate-300 flex items-center gap-1 ml-auto"
                                                                    >
                                                                    Rarity {showRarityFilter ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>
                                </div>
                    
                        {showRarityFilter && (
                                        <div className="flex gap-1.5 flex-wrap">
                                            {(['all', 'common', 'rare', 'epic', 'legendary'] as (AchievementRarity | 'all')[]).map(r => (
                                                                    <button
                                                                                                    key={r}
                                                                                                    onClick={() => setRarityFilter(r)}
                                                                                                    className={`text-xs px-3 py-1 rounded-lg transition-all capitalize ${
                                                                                                                                        rarityFilter === r
                                                                                                                                            ? 'bg-slate-700 text-slate-200 border border-slate-500/40'
                                                                                                                                            : 'text-slate-500 hover:text-slate-400 border border-transparent'
                                                                                                        }`}
                                                                                                >
                                                                        {r}
                                                                    </button>
                                                                ))}
                                        </div>
                                )}
                    
                        {/* Badge grid */}
                        {filtered.length === 0 ? (
                                        <div className="text-center py-8">
                                                            <Trophy className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                                            <p className="text-xs text-slate-500">No achievements match this filter</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {filtered.map(a => (
                                                                    <BadgeCard key={a.id} achievement={a} />
                                                                ))}
                                        </div>
                                )}
                    </div>
                );
}
