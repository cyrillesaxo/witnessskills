// WitnessSkills: SkillHealthCard
// Inspired by balafons' PredictiveAnalyticsDashboard.tsx.
// Shows skill health, retention %, trend, and next-review nudge.
// Rendered on the Dashboard when VITE_FLAG_SKILL_HEALTH is on.

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Brain, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { SkillMasteryRecord } from '../../lib/mastery';
import { PROFICIENCY_LABELS } from '../../lib/mastery';
import type { SM2Card } from '../../lib/spacedRepetition';
import { liveRetention, dueLabelFor, cardUrgencyClass } from '../../lib/spacedRepetition';

// ---------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------

interface SkillHealthCardProps {
    mastery: SkillMasteryRecord;
    sm2Card?: SM2Card;
    onReviewNow?: (skillId: string) => void;
    onViewProbe?: (skillId: string) => void;
    className?: string;
}

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------

function TrendIcon({ trend }: { trend: SkillMasteryRecord['trend'] }) {
    if (trend === 'IMPROVING') return <TrendingUp className="w-3.5 h-3.5 text-teal-400" />;
    if (trend === 'DECLINING') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
}

function trendLabel(trend: SkillMasteryRecord['trend']): string {
    if (trend === 'IMPROVING') return 'Improving';
    if (trend === 'DECLINING') return 'Declining';
    return 'Stable';
}

function trendColor(trend: SkillMasteryRecord['trend']): string {
    if (trend === 'IMPROVING') return 'text-teal-400';
    if (trend === 'DECLINING') return 'text-red-400';
    return 'text-slate-400';
}

function RetentionBar({ pct, urgencyClass }: { pct: number; urgencyClass: string }) {
    return (
          <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
                <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                                      pct >= 65 ? 'bg-teal-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
          </div>
        );
}

// ---------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------

export default function SkillHealthCard({
    mastery,
    sm2Card,
    onReviewNow,
    onViewProbe,
    className = '',
}: SkillHealthCardProps) {
    const prof = PROFICIENCY_LABELS[mastery.proficiencyLevel];
    const now  = Date.now();
  
    const retPct      = sm2Card ? liveRetention(sm2Card, now) : mastery.retentionPct;
    const dueLabel    = sm2Card ? dueLabelFor(sm2Card, now)    : null;
    const urgency     = sm2Card ? cardUrgencyClass(sm2Card, now) : 'text-teal-400';
    const isOverdue   = sm2Card ? new Date(sm2Card.nextReviewAt).getTime() <= now : false;
  
    return (
          <div
                  className={`relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/70 transition-all duration-200 group ${className}`}
                >
            {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                                  <Brain className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                  <span className="text-sm font-semibold text-slate-200 truncate">
                                    {mastery.skillName}
                                  </span>
                        </div>
                        <span
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${prof.bg} ${prof.color} border-transparent flex-shrink-0`}
                                  >
                          {prof.label}
                        </span>
                </div>
          
            {/* Mastery score bar */}
                <div className="mb-3">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                  <span>Mastery</span>
                                  <span>{Math.round(mastery.masteryScore * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                                  <div
                                                className="h-1.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-400 transition-all duration-500"
                                                style={{ width: `${Math.round(mastery.masteryScore * 100)}%` }}
                                              />
                        </div>
                </div>
          
            {/* Retention + trend row */}
                <div className="flex items-center justify-between mb-3 text-[11px]">
                        <div>
                                  <span className="text-slate-400">Retention </span>
                                  <span className={urgency + ' font-semibold'}>{retPct}%</span>
                                  <RetentionBar pct={retPct} urgencyClass={urgency} />
                        </div>
                        <div className="flex items-center gap-1">
                                  <TrendIcon trend={mastery.trend} />
                                  <span className={trendColor(mastery.trend) + ' font-medium'}>
                                    {trendLabel(mastery.trend)}
                                  </span>
                        </div>
                </div>
          
            {/* Evidence + streak */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                        <span>🔬 {mastery.evidenceCount} probe{mastery.evidenceCount !== 1 ? 's' : ''}</span>
                  {mastery.streak > 0 && (
                            <span className="text-amber-400">🔥 {mastery.streak} streak</span>
                        )}
                </div>
          
            {/* Review nudge */}
            {sm2Card && (
                          <div className={`flex items-center justify-between text-[11px] rounded-lg px-2.5 py-1.5 ${
                                      isOverdue
                                        ? 'bg-red-500/10 border border-red-500/20'
                                        : 'bg-slate-700/40 border border-slate-600/20'
                          }`}>
                                    <div className="flex items-center gap-1.5">
                                      {isOverdue
                                                      ? <AlertTriangle className="w-3 h-3 text-red-400" />
                                                      : <Clock className="w-3 h-3 text-slate-400" />
                                      }
                                                <span className={isOverdue ? 'text-red-300' : 'text-slate-400'}>
                                                  {dueLabel}
                                                </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {onReviewNow && isOverdue && (
                                          <button
                                                            onClick={() => onReviewNow(mastery.skillId)}
                                                            className="text-teal-400 hover:text-teal-300 font-medium underline underline-offset-2"
                                                          >
                                                          Review
                                          </button>
                                                )}
                                      {onViewProbe && (
                                          <button
                                                            onClick={() => onViewProbe(mastery.skillId)}
                                                            className="text-slate-400 hover:text-slate-300"
                                                          >
                                                          Probe →
                                          </button>
                                                )}
                                    </div>
                          </div>
                )}
          
            {/* No SM2 card yet — prompt to start */}
            {!sm2Card && mastery.evidenceCount === 0 && (
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>No probes yet — start learning to track memory.</span>
                          </div>
                )}
          </div>
        );
}
