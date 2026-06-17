// WitnessSkills: SpacedRepetitionPanel
// Inspired by balafons' SpacedRepetitionDashboard.tsx and SPARQ SpacedRepetitionPanel.tsx.
// Shows due reviews, memory strength, and lets users self-rate after a probe.
// Mounted inside the Learn page tab when VITE_FLAG_SPACED_REPETITION is on.

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Brain, Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Star } from 'lucide-react';
import {
    type SM2Card,
    type ReviewQuality,
    loadSM2Cards,
    saveSM2Cards,
    upsertSM2Card,
    getDueCards,
    dueLabelFor,
    liveRetention,
    cardUrgencyClass,
    sm2Review,
    createSM2Card,
} from '../../lib/spacedRepetition';

// ---------------------------------------------------------------
// REVIEW QUALITY PICKER
// ---------------------------------------------------------------

const QUALITY_OPTIONS: { q: ReviewQuality; label: string; desc: string; color: string }[] = [
  { q: 0, label: '0', desc: 'Complete blank', color: 'bg-red-600 hover:bg-red-500' },
  { q: 1, label: '1', desc: 'Wrong, saw answer', color: 'bg-red-500 hover:bg-red-400' },
  { q: 2, label: '2', desc: 'Wrong, easy recall', color: 'bg-orange-500 hover:bg-orange-400' },
  { q: 3, label: '3', desc: 'Correct, hard', color: 'bg-amber-500 hover:bg-amber-400' },
  { q: 4, label: '4', desc: 'Correct, hesitated', color: 'bg-teal-600 hover:bg-teal-500' },
  { q: 5, label: '5', desc: 'Perfect recall', color: 'bg-emerald-600 hover:bg-emerald-500' },
  ];

interface QualityPickerProps {
    onSelect: (q: ReviewQuality) => void;
}

function QualityPicker({ onSelect }: QualityPickerProps) {
    return (
          <div className="mt-3">
                <p className="text-xs text-slate-400 mb-2 text-center">How well did you recall this skill?</p>
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {QUALITY_OPTIONS.map(({ q, label, desc, color }) => (
                      <button
                                    key={q}
                                    onClick={() => onSelect(q)}
                                    title={desc}
                                    className={`w-10 h-10 rounded-lg text-sm font-bold text-white transition-all ${color} flex flex-col items-center justify-center`}
                                  >
                        {label}
                      </button>
                    ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 text-center">0 = blackout &rarr; 5 = perfect</p>
          </div>
        );
}

// ---------------------------------------------------------------
// CARD ROW
// ---------------------------------------------------------------

interface CardRowProps {
    card: SM2Card;
    onReview: (card: SM2Card, q: ReviewQuality) => void;
}

function CardRow({ card, onReview }: CardRowProps) {
    const [expanded, setExpanded] = useState(false);
    const now      = Date.now();
    const live     = liveRetention(card, now);
    const urgency  = cardUrgencyClass(card, now);
    const dueLabel = dueLabelFor(card, now);
    const isOverdue = new Date(card.nextReviewAt).getTime() <= now;
  
    return (
          <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700/50 bg-slate-800/40'
          }`}>
                <div
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                          onClick={() => setExpanded(e => !e)}
                        >
                  {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    isOverdue ? 'bg-red-500/20' : 'bg-teal-500/10'
                        }`}>
                          {isOverdue
                                        ? <AlertTriangle className="w-4 h-4 text-red-400" />
                                        : <Brain className="w-4 h-4 text-teal-400" />
                          }
                        </div>
                
                  {/* Name + due */}
                        <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-200 truncate">{card.skillName}</p>
                                  <p className={`text-[11px] ${urgency}`}>{dueLabel}</p>
                        </div>
                
                  {/* Retention bar */}
                        <div className="w-16 flex-shrink-0">
                                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                              <span>Ret.</span>
                                              <span className={urgency}>{live}%</span>
                                  </div>
                                  <div className="w-full bg-slate-700/50 rounded-full h-1">
                                              <div
                                                              className={`h-1 rounded-full ${live >= 65 ? 'bg-teal-500' : live >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                              style={{ width: `${live}%` }}
                                                            />
                                  </div>
                        </div>
                
                  {/* Interval */}
                        <div className="flex-shrink-0 text-center hidden sm:block">
                                  <p className="text-[10px] text-slate-500">Interval</p>
                                  <p className="text-xs text-slate-300">{card.intervalDays}d</p>
                        </div>
                
                  {/* Expand */}
                        <div className="flex-shrink-0 text-slate-500">
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                </div>
          
            {/* Quality picker */}
            {expanded && (
                    <div className="px-4 pb-4 border-t border-slate-700/30">
                              <QualityPicker onSelect={q => { onReview(card, q); setExpanded(false); }} />
                    </div>
                )}
          </div>
        );
}

// ---------------------------------------------------------------
// PANEL
// ---------------------------------------------------------------

interface SpacedRepetitionPanelProps {
    /** skill names currently in the user's portfolio — used to seed cards */
    skillNames?: { id: string; name: string }[];
    className?: string;
}

export default function SpacedRepetitionPanel({
    skillNames = [],
    className = '',
}: SpacedRepetitionPanelProps) {
    const [cards, setCards] = useState<SM2Card[]>([]);
    const [lastReviewed, setLastReviewed] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const now = Date.now();
  
    // Load and seed
    useEffect(() => {
          const stored = loadSM2Cards();
          const storedIds = new Set(stored.map(c => c.skillId));
          // Create cards for any new skills not yet tracked
          const seeded = skillNames
                  .filter(s => !storedIds.has(s.id))
                  .map(s => createSM2Card(s.id, s.name));
          const all = [...stored, ...seeded];
          if (seeded.length) saveSM2Cards(all);
          setCards(all);
    }, [skillNames]);
  
    const handleReview = useCallback((card: SM2Card, q: ReviewQuality) => {
          const { updated } = sm2Review(card, q, Date.now());
          const next = upsertSM2Card(cards, updated);
          saveSM2Cards(next);
          setCards(next);
          setLastReviewed(card.skillName);
          setTimeout(() => setLastReviewed(null), 3000);
    }, [cards]);
  
    const due    = getDueCards(cards, now);
    const nonDue = cards.filter(c => new Date(c.nextReviewAt).getTime() > now);
    const shown  = showAll ? [...due, ...nonDue] : due;
  
    // Stats
    const avgRetention = cards.length
          ? Math.round(cards.reduce((s, c) => s + liveRetention(c, now), 0) / cards.length)
          : 0;
  
    return (
          <div className={`space-y-4 ${className}`}>
            {/* Header stats */}
                <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                                  <p className="text-2xl font-bold text-red-400">{due.length}</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">Due now</p>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                                  <p className="text-2xl font-bold text-teal-400">{cards.length}</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">Tracked skills</p>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                                  <p className="text-2xl font-bold text-slate-200">{avgRetention}%</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">Avg retention</p>
                        </div>
                </div>
          
            {/* Success toast */}
            {lastReviewed && (
                    <div className="flex items-center gap-2 text-sm text-teal-300 bg-teal-500/10 border border-teal-500/20 rounded-xl px-3 py-2 animate-pulse">
                              <CheckCircle className="w-4 h-4" />
                              <span>Reviewed <strong>{lastReviewed}</strong> — next interval updated.</span>
                    </div>
                )}
          
            {/* Cards */}
            {shown.length === 0 && due.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                              <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
                              <p>All caught up! No reviews due right now.</p>
                      {cards.length === 0 && skillNames.length === 0 && (
                                  <p className="text-xs mt-1">Add skills to your portfolio to start tracking.</p>
                              )}
                    </div>
                )}
          
            {shown.map(card => (
                    <CardRow key={card.skillId} card={card} onReview={handleReview} />
                  ))}
          
            {/* Show / hide non-due */}
            {nonDue.length > 0 && (
                    <button
                                onClick={() => setShowAll(s => !s)}
                                className="w-full text-xs text-slate-500 hover:text-slate-400 flex items-center justify-center gap-1 py-2"
                              >
                      {showAll
                                    ? <><ChevronUp className="w-3 h-3" /> Hide upcoming ({nonDue.length})</>
                                    : <><ChevronDown className="w-3 h-3" /> Show upcoming ({nonDue.length})</>
                      }
                    </button>
                )}
          
            {/* Legend */}
                <div className="flex items-center gap-4 text-[10px] text-slate-600 justify-center pt-1">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-teal-500" /> SM-2 algorithm</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Ebbinghaus curve</span>
                        <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Auto-schedules</span>
                </div>
          </div>
        );
}
