// WitnessSkills: Achievements & Badges System
// Inspired by balafons' Achievements.tsx and BadgeSystem UI component.
// Achievements are evaluated client-side from observable skill/probe data.

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    /** Emoji or lucide icon name */
  icon: string;
    rarity: AchievementRarity;
    /** ISO date when earned, null if not yet */
  earnedAt: string | null;
    /** 0-100 progress toward earning (if not yet earned) */
  progress: number;
    /** Target value for progress (e.g. 5 for "5 skills") */
  target: number;
}

export interface AchievementContext {
    skillCount: number;
    probeCount: number;
    streakDays: number;
    expertSkillCount: number;
    advancedSkillCount: number;
    dueReviewsCompleted: number;
    consecutiveProbesWithNoDecline: number;
    challengeCount: number;
    applicationsSent: number;
    resumeVersions: number;
}

// ---------------------------------------------------------------
// ACHIEVEMENT DEFINITIONS
// ---------------------------------------------------------------

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'earnedAt' | 'progress'>[] = [
    // ---- SKILL PORTFOLIO ----
  {
        id: 'first_skill',
        title: 'First Signal',
        description: 'Add your first skill to the portfolio.',
        icon: '🌱',
        rarity: 'common',
        target: 1,
  },
  {
        id: 'five_skills',
        title: 'Growing Stack',
        description: 'Document 5 skills in your portfolio.',
        icon: '📚',
        rarity: 'common',
        target: 5,
  },
  {
        id: 'ten_skills',
        title: 'Well-Rounded',
        description: 'Document 10 skills across different domains.',
        icon: '🎯',
        rarity: 'rare',
        target: 10,
  },
  {
        id: 'first_expert',
        title: 'Expert Mind',
        description: 'Reach expert level in any skill.',
        icon: '⭐',
        rarity: 'rare',
        target: 1,
  },
  {
        id: 'three_experts',
        title: 'Triple Mastery',
        description: 'Reach expert level in 3 skills.',
        icon: '🏆',
        rarity: 'epic',
        target: 3,
  },
    // ---- PROBING ----
  {
        id: 'first_probe',
        title: 'Tested in the Wild',
        description: 'Complete your first probe session.',
        icon: '🔬',
        rarity: 'common',
        target: 1,
  },
  {
        id: 'ten_probes',
        title: 'Rigorous Thinker',
        description: 'Complete 10 probe sessions.',
        icon: '🧪',
        rarity: 'common',
        target: 10,
  },
  {
        id: 'fifty_probes',
        title: 'Field Veteran',
        description: 'Complete 50 probe sessions.',
        icon: '🎖️',
        rarity: 'rare',
        target: 50,
  },
    // ---- SPACED REPETITION ----
  {
        id: 'first_review',
        title: 'Memory Keeper',
        description: 'Complete your first scheduled spaced-repetition review.',
        icon: '🔄',
        rarity: 'common',
        target: 1,
  },
  {
        id: 'seven_day_streak',
        title: 'Consistency Edge',
        description: 'Maintain a 7-day practice streak.',
        icon: '🔥',
        rarity: 'rare',
        target: 7,
  },
  {
        id: 'thirty_day_streak',
        title: 'Unstoppable',
        description: 'Maintain a 30-day practice streak.',
        icon: '💎',
        rarity: 'epic',
        target: 30,
  },
    // ---- CHALLENGES ----
  {
        id: 'first_challenge',
        title: 'Challenger',
        description: 'Complete your first challenge.',
        icon: '⚡',
        rarity: 'common',
        target: 1,
  },
  {
        id: 'ten_challenges',
        title: 'Battle-Tested',
        description: 'Complete 10 challenges.',
        icon: '🛡️',
        rarity: 'rare',
        target: 10,
  },
    // ---- CAREER ----
  {
        id: 'first_application',
        title: 'In the Arena',
        description: 'Send your first job application.',
        icon: '📨',
        rarity: 'common',
        target: 1,
  },
  {
        id: 'resume_versioner',
        title: 'A/B Strategist',
        description: 'Create 2 resume versions for A/B testing.',
        icon: '📊',
        rarity: 'rare',
        target: 2,
  },
    // ---- LEGENDARY ----
  {
        id: 'full_stack_witness',
        title: 'Full Stack Witness',
        description: 'Hold expert-level evidence across 5 or more skills.',
        icon: '🦁',
        rarity: 'legendary',
        target: 5,
  },
  ];

// ---------------------------------------------------------------
// EVALUATOR
// ---------------------------------------------------------------

/**
 * Evaluate which achievements have been earned or have progress
 * given the current user context.
 */
export function evaluateAchievements(ctx: AchievementContext): Achievement[] {
    return ACHIEVEMENT_DEFINITIONS.map(def => {
          const { current, earned } = scoreAchievement(def.id, ctx, def.target);
          return {
                  ...def,
                  earnedAt: earned ? new Date().toISOString() : null,
                  progress: Math.min(100, Math.round((current / def.target) * 100)),
          };
    });
}

function scoreAchievement(
    id: string,
    ctx: AchievementContext,
    target: number,
  ): { current: number; earned: boolean } {
    let current = 0;
    switch (id) {
      case 'first_skill':
      case 'five_skills':
      case 'ten_skills':
              current = ctx.skillCount; break;
      case 'first_expert':
      case 'three_experts':
      case 'full_stack_witness':
              current = ctx.expertSkillCount; break;
      case 'first_probe':
      case 'ten_probes':
      case 'fifty_probes':
              current = ctx.probeCount; break;
      case 'first_review':
              current = ctx.dueReviewsCompleted; break;
      case 'seven_day_streak':
      case 'thirty_day_streak':
              current = ctx.streakDays; break;
      case 'first_challenge':
      case 'ten_challenges':
              current = ctx.challengeCount; break;
      case 'first_application':
              current = ctx.applicationsSent; break;
      case 'resume_versioner':
              current = ctx.resumeVersions; break;
      default:
              current = 0;
    }
    return { current, earned: current >= target };
}

// ---------------------------------------------------------------
// RARITY DISPLAY
// ---------------------------------------------------------------

export const RARITY_STYLES: Record<AchievementRarity, { border: string; glow: string; label: string }> = {
    common:    { border: 'border-slate-500/40',  glow: '',                              label: 'Common'    },
    rare:      { border: 'border-blue-500/50',   glow: 'shadow-blue-500/20 shadow-lg',  label: 'Rare'      },
    epic:      { border: 'border-purple-500/50', glow: 'shadow-purple-500/20 shadow-lg', label: 'Epic'     },
    legendary: { border: 'border-amber-500/60',  glow: 'shadow-amber-500/30 shadow-xl', label: 'Legendary' },
};

// ---------------------------------------------------------------
// PERSISTENCE
// ---------------------------------------------------------------

const ACH_KEY = 'ws_achievements_earned';

export interface EarnedRecord {
    id: string;
    earnedAt: string;
}

export function loadEarnedAchievements(): EarnedRecord[] {
    try {
          const raw = localStorage.getItem(ACH_KEY);
          return raw ? (JSON.parse(raw) as EarnedRecord[]) : [];
    } catch {
          return [];
    }
}

export function saveEarnedAchievements(records: EarnedRecord[]): void {
    try {
          localStorage.setItem(ACH_KEY, JSON.stringify(records));
    } catch { /* quota */ }
}

export function mergeEarnedDates(
    achievements: Achievement[],
    records: EarnedRecord[],
  ): Achievement[] {
    const map = new Map(records.map(r => [r.id, r.earnedAt]));
    return achievements.map(a => ({
          ...a,
          earnedAt: a.earnedAt ?? map.get(a.id) ?? null,
    }));
}
