// WitnessSkills: Feature Flags
// Inspired by balafons' flags.ts pattern.
// Flags are read from Vite env, with optional localStorage/test overrides.
//
// Usage:
//   import { getFlag } from '../lib/flags';
//   if (getFlag('VITE_FLAG_SPACED_REPETITION')) { ... }
//
// Enable locally:
//   localStorage.setItem('VITE_FLAG_SPACED_REPETITION', 'true')
// Disable:
//   localStorage.removeItem('VITE_FLAG_SPACED_REPETITION')

export type FeatureFlag =
  | 'VITE_FLAG_SPACED_REPETITION'   // Spaced repetition panel + SM-2 scheduling in Learn
    | 'VITE_FLAG_SKILL_HEALTH'         // Skill health / predictive nudges on Dashboard
      | 'VITE_FLAG_ACHIEVEMENTS'         // Achievements & badges system
        | 'VITE_FLAG_SKILL_MASTERY'        // Enriched skill mastery proficiency levels
          | 'VITE_FLAG_SKILL_TRANSFER'       // Skill transfer coefficients on graph edges
            | 'VITE_FLAG_LEADERBOARD';         // Leaderboard (future social feature)

            /** Test-time overrides: set globalThis.__TEST_FLAG_OVERRIDES__ = { VITE_FLAG_...: true } */
            declare global {
              // eslint-disable-next-line no-var
                var __TEST_FLAG_OVERRIDES__: Partial<Record<FeatureFlag, boolean>> | undefined;
                }

                export function getFlag(flag: FeatureFlag): boolean {
                  // 1. Test overrides (highest priority)
                    if (typeof globalThis.__TEST_FLAG_OVERRIDES__ !== 'undefined') {
                        const override = globalThis.__TEST_FLAG_OVERRIDES__[flag];
                            if (typeof override === 'boolean') return override;
                              }

                                // 2. localStorage runtime toggle (dev convenience)
                                  try {
                                      const stored = localStorage.getItem(flag);
                                          if (stored !== null) return stored === 'true';
                                            } catch {
                                                // SSR / restricted env — fall through
                                                  }

                                                    // 3. Vite env (set in .env.local for persistent local dev)
                                                      const envVal = (import.meta.env as Record<string, string>)[flag];
                                                        if (typeof envVal === 'string') return envVal === 'true';

                                                          // 4. Defaults — which flags are on by default in production
                                                            const defaults: Record<FeatureFlag, boolean> = {
                                                                VITE_FLAG_SPACED_REPETITION: true,   // on: extends existing retention.ts
                                                                    VITE_FLAG_SKILL_HEALTH:      true,   // on: enriches existing Dashboard
                                                                        VITE_FLAG_ACHIEVEMENTS:      true,   // on: motivational layer
                                                                            VITE_FLAG_SKILL_MASTERY:     true,   // on: richer proficiency model
                                                                                VITE_FLAG_SKILL_TRANSFER:    false,  // off: needs ontology edge data
                                                                                    VITE_FLAG_LEADERBOARD:       false,  // off: social feature, future work
                                                                                      };

                                                                                        return defaults[flag] ?? false;
                                                                                        }

                                                                                        /** Utility: returns all flags with their current resolved values (useful for debug UI) */
                                                                                        export function getAllFlags(): Record<FeatureFlag, boolean> {
                                                                                          const flags: FeatureFlag[] = [
                                                                                              'VITE_FLAG_SPACED_REPETITION',
                                                                                                  'VITE_FLAG_SKILL_HEALTH',
                                                                                                      'VITE_FLAG_ACHIEVEMENTS',
                                                                                                          'VITE_FLAG_SKILL_MASTERY',
                                                                                                              'VITE_FLAG_SKILL_TRANSFER',
                                                                                                                  'VITE_FLAG_LEADERBOARD',
                                                                                                                    ];
                                                                                                                      return Object.fromEntries(flags.map(f => [f, getFlag(f)])) as Record<FeatureFlag, boolean>;
                                                                                                                      }
