// WitnessSkills: Skill Mastery Types
// Inspired by balafons' SkillMasteryDashboard.tsx.
// Enriches the existing flat skill level model with proficiency tiers,
// decay tracking, evidence counting, and transfer coefficients.

// ---------------------------------------------------------------
// PROFICIENCY
// ---------------------------------------------------------------

/** Five-tier mastery continuum aligned with balafons' model */
export type ProficiencyLevel = 'NOVICE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

/** Maps the existing WitnessSkills Level to a ProficiencyLevel */
export function levelToProficiency(level: string): ProficiencyLevel {
  switch (level) {
      case 'beginner':     return 'BEGINNER';
          case 'intermediate': return 'INTERMEDIATE';
              case 'advanced':     return 'ADVANCED';
                  case 'expert':       return 'EXPERT';
                      default:             return 'NOVICE';
                        }
                        }

                        export function proficiencyToLevel(p: ProficiencyLevel): string {
                          switch (p) {
                              case 'NOVICE':       return 'beginner';
                                  case 'BEGINNER':     return 'beginner';
                                      case 'INTERMEDIATE': return 'intermediate';
                                          case 'ADVANCED':     return 'advanced';
                                              case 'EXPERT':       return 'expert';
                                                }
                                                }

                                                /** 0-1 float representing where on the continuum the skill sits */
                                                export function proficiencyToScore(p: ProficiencyLevel): number {
                                                  const map: Record<ProficiencyLevel, number> = {
                                                      NOVICE:       0.10,
                                                          BEGINNER:     0.30,
                                                              INTERMEDIATE: 0.55,
                                                                  ADVANCED:     0.75,
                                                                      EXPERT:       0.95,
                                                                        };
                                                                          return map[p];
                                                                          }

                                                                          export const PROFICIENCY_LABELS: Record<ProficiencyLevel, { label: string; color: string; bg: string }> = {
                                                                            NOVICE:       { label: 'Novice',       color: 'text-slate-400',  bg: 'bg-slate-500/20'  },
                                                                              BEGINNER:     { label: 'Beginner',     color: 'text-blue-300',   bg: 'bg-blue-500/20'   },
                                                                                INTERMEDIATE: { label: 'Intermediate', color: 'text-teal-300',   bg: 'bg-teal-500/20'   },
                                                                                  ADVANCED:     { label: 'Advanced',     color: 'text-purple-300', bg: 'bg-purple-500/20' },
                                                                                    EXPERT:       { label: 'Expert',       color: 'text-amber-300',  bg: 'bg-amber-500/20'  },
                                                                                    };

                                                                                    // ---------------------------------------------------------------
                                                                                    // SKILL MASTERY RECORD
                                                                                    // ---------------------------------------------------------------

                                                                                    /**
                                                                                     * Enriched per-skill mastery record.
                                                                                      * This extends the base Skill (from Skills.tsx) with learning-science fields
                                                                                       * derived from the user's RCT probe history and spaced-repetition data.
                                                                                        */
                                                                                        export interface SkillMasteryRecord {
                                                                                          skillId: string;
                                                                                            skillName: string;
                                                                                              proficiencyLevel: ProficiencyLevel;
                                                                                                /** 0-1 float — overall mastery score combining evidence strength + recency */
                                                                                                  masteryScore: number;
                                                                                                    /** How fast the skill decays without practice (0-1, higher = faster decay) */
                                                                                                      decayRate: number;
                                                                                                        /** Positive improvement velocity per week (0-1) */
                                                                                                          improvementRate: number;
                                                                                                            /** Number of confirmed evidence / probe sessions */
                                                                                                              evidenceCount: number;
                                                                                                                /** Consecutive successful probe sessions */
                                                                                                                  streak: number;
                                                                                                                    /** ISO date of the last probe/review */
                                                                                                                      lastPracticed: string | null;
                                                                                                                        /** ISO date when next review is recommended */
                                                                                                                          nextReviewDate: string | null;
                                                                                                                            /** 0-100 estimated current retention percentage */
                                                                                                                              retentionPct: number;
                                                                                                                                /** IMPROVING | STABLE | DECLINING — 30-day trend */
                                                                                                                                  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
                                                                                                                                  }
                                                                                                                                  
                                                                                                                                  // ---------------------------------------------------------------
                                                                                                                                  // SKILL TRANSFER
                                                                                                                                  // ---------------------------------------------------------------
                                                                                                                                  
                                                                                                                                  /**
                                                                                                                                   * Describes how mastery of one skill accelerates another.
                                                                                                                                    * Stored in the ontology graph as edge metadata.
                                                                                                                                     */
                                                                                                                                     export interface SkillTransfer {
                                                                                                                                       sourceSkillId: string;
                                                                                                                                         targetSkillId: string;
                                                                                                                                           /** 0-1 — fraction of effort saved when learning target after mastering source */
                                                                                                                                             transferCoefficient: number;
                                                                                                                                               commonConcepts: string[];
                                                                                                                                                 /** Human-readable e.g. "~40% faster" */
                                                                                                                                                   expectedAcceleration: string;
                                                                                                                                                   }
                                                                                                                                                   
                                                                                                                                                   // ---------------------------------------------------------------
                                                                                                                                                   // SKILL GAP (for GapAnalyzer integration)
                                                                                                                                                   // ---------------------------------------------------------------
                                                                                                                                                   
                                                                                                                                                   export interface SkillGap {
                                                                                                                                                     skillName: string;
                                                                                                                                                       currentProficiency: ProficiencyLevel;
                                                                                                                                                         targetProficiency: ProficiencyLevel;
                                                                                                                                                           gapScore: number;
                                                                                                                                                             estimatedHours: number;
                                                                                                                                                               priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
                                                                                                                                                                 prerequisites: string[];
                                                                                                                                                                   recommendations: string[];
                                                                                                                                                                   }
                                                                                                                                                                   
                                                                                                                                                                   // ---------------------------------------------------------------
                                                                                                                                                                   // HELPERS
                                                                                                                                                                   // ---------------------------------------------------------------
                                                                                                                                                                   
                                                                                                                                                                   /**
                                                                                                                                                                    * Compute a simple decay-adjusted mastery score given:
                                                                                                                                                                     * - base score (0-1) from probe results
                                                                                                                                                                      * - daysSincePractice
                                                                                                                                                                       * - decayRate (0-1 per 30 days)
                                                                                                                                                                        */
                                                                                                                                                                        export function computeDecayedScore(
                                                                                                                                                                          baseScore: number,
                                                                                                                                                                            daysSincePractice: number,
                                                                                                                                                                              decayRate: number,
                                                                                                                                                                              ): number {
                                                                                                                                                                                const decayFactor = Math.exp(-decayRate * daysSincePractice / 30);
                                                                                                                                                                                  return Math.max(0, Math.min(1, baseScore * decayFactor));
                                                                                                                                                                                  }
                                                                                                                                                                                  
                                                                                                                                                                                  /**
                                                                                                                                                                                   * Infer trend direction from a list of recent scores (oldest → newest).
                                                                                                                                                                                    */
                                                                                                                                                                                    export function inferTrend(
                                                                                                                                                                                      recentScores: number[],
                                                                                                                                                                                      ): 'IMPROVING' | 'STABLE' | 'DECLINING' {
                                                                                                                                                                                        if (recentScores.length < 2) return 'STABLE';
                                                                                                                                                                                          const first = recentScores.slice(0, Math.ceil(recentScores.length / 2));
                                                                                                                                                                                            const last  = recentScores.slice(Math.floor(recentScores.length / 2));
                                                                                                                                                                                              const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
                                                                                                                                                                                                const diff = avg(last) - avg(first);
                                                                                                                                                                                                  if (diff > 0.05) return 'IMPROVING';
                                                                                                                                                                                                    if (diff < -0.05) return 'DECLINING';
                                                                                                                                                                                                      return 'STABLE';
                                                                                                                                                                                                      }
