// WitnessSkills: PackSpec for DW-Location Tracking
// Adapted from RegimeReader's UserPackSpec model.
// Tracks where the learner's search stops (per defeater location),
// which teaching moves unstick them, and exports a portable profile.

import type { DwLocation } from './rct/types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DW_LOCATIONS: DwLocation[] = [
  'depth', 'breadth', 'channel', 'frame', 'implicature',
];

export const MIN_OBS = 3;       // observations before a gap drives action
export const MIN_MOVE_OBS = 3;  // observations before a move is "certified"

const SPACING_DAYS = [1, 3, 7, 16, 35]; // expanding interval ladder

// ─── Move definitions (pedagogy ladder) ────────────────────────────────────────

export interface PedagogyMove {
  key: string;
  label: string;
  icon: string;
  basis: string;
  blurb: string;
}

export const MOVES: PedagogyMove[] = [
  { key: 'socratic',  label: 'Nudge',          icon: '?',  basis: 'self-explanation (Chi): asking why before being told',           blurb: 'A question that points at the boundary without giving the answer.' },
  { key: 'contrast',  label: 'Contrast',        icon: '⇄', basis: 'contrasting cases (Bjork): the defeated twin beside the claim',   blurb: 'The same claim shown next to the version that defeats it.' },
  { key: 'analogy',   label: 'Analogy',         icon: '≈',  basis: 'analogical transfer (Gentner): map to a domain you already hold', blurb: 'The structure restated in terms you already understand.' },
  { key: 'worked',    label: 'Worked example',  icon: '▦',  basis: 'worked-example effect (Sweller): full solution, then fade',       blurb: 'The full closure revealed once; the next item fades a step.' },
  { key: 'formal',    label: 'Formal',          icon: '∴',  basis: 'precise statement, last — for whom it lands',                    blurb: 'The constraint stated exactly, in the framework's own terms.' },
];

export const MOVE_KEYS = MOVES.map(m => m.key);

// ─── PackSpec types ────────────────────────────────────────────────────────────

export interface LocationRecord {
  n: number;
  hits: number;
  streak: number;
  last: number | null;
  due: number | null;
}

export interface MoveRecord {
  shown: number;
  worked: number;
  last: number | null;
}

export interface AssessmentResult {
  soundAcc: number;
  locAcc: number;
  n: number;
  at: number;
}

export interface PackSpecDW {
  loc: Record<DwLocation, LocationRecord>;
  moves: Record<string, MoveRecord>;
  fadeRate: number;      // 0.5–1.5; 1.0 = balanced
  sessions: number;
  assessments: AssessmentResult[];
  updated: number;
}

const PACKSPEC_DW_KEY = 'witnessskills.packspecDW.v1';

// ─── Factory ──────────────────────────────────────────────────────────────────

function emptyLocRec(): LocationRecord {
  return { n: 0, hits: 0, streak: 0, last: null, due: null };
}

function emptyMoveRec(): MoveRecord {
  return { shown: 0, worked: 0, last: null };
}

export function emptyPackSpecDW(): PackSpecDW {
  const loc = {} as Record<DwLocation, LocationRecord>;
  DW_LOCATIONS.forEach(l => { loc[l] = emptyLocRec(); });
  const moves = {} as Record<string, MoveRecord>;
  MOVES.forEach(m => { moves[m.key] = emptyMoveRec(); });
  return { loc, moves, fadeRate: 1, sessions: 0, assessments: [], updated: Date.now() };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

export function loadPackSpecDW(): PackSpecDW {
  try {
    const raw = localStorage.getItem(PACKSPEC_DW_KEY);
    if (!raw) return emptyPackSpecDW();
    const ps = JSON.parse(raw) as PackSpecDW;
    // backfill missing fields
    const base = emptyPackSpecDW();
    DW_LOCATIONS.forEach(l => { if (!ps.loc[l]) ps.loc[l] = emptyLocRec(); });
    MOVES.forEach(m => { if (!ps.moves[m.key]) ps.moves[m.key] = emptyMoveRec(); });
    if (ps.fadeRate == null) ps.fadeRate = 1;
    if (!ps.assessments) ps.assessments = [];
    return { ...base, ...ps };
  } catch { return emptyPackSpecDW(); }
}

export function savePackSpecDW(ps: PackSpecDW): void {
  try { localStorage.setItem(PACKSPEC_DW_KEY, JSON.stringify(ps)); } catch {}
}

export function exportPackSpecDW(ps: PackSpecDW): void {
  const blob = new Blob(
    [JSON.stringify({ kind: 'witnessskills-packspec-dw', v: 1, exported: Date.now(), packspec: ps }, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ws-profile-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function mergeImportedPackSpec(imported: unknown): PackSpecDW {
  const base = emptyPackSpecDW();
  try {
    const src = (imported as { packspec?: PackSpecDW }) .packspec ?? (imported as PackSpecDW);
    if (src && src.loc) {
      DW_LOCATIONS.forEach(l => { if (src.loc[l]) base.loc[l] = { ...base.loc[l], ...src.loc[l] }; });
      MOVES.forEach(m => { if (src.moves?.[m.key]) base.moves[m.key] = { ...base.moves[m.key], ...src.moves[m.key] }; });
      if (src.fadeRate != null) base.fadeRate = src.fadeRate;
      if (src.sessions) base.sessions = src.sessions;
      if (src.assessments) base.assessments = src.assessments;
    }
  } catch {}
  return base;
}

// ─── Reach + confidence ───────────────────────────────────────────────────────

export interface LocationStats {
  n: number;
  hits: number;
  reach: number;      // Laplace-smoothed: (hits+1)/(n+2)
  confidence: number; // min(1, n/MIN_OBS)
}

export function locationStats(rec: LocationRecord): LocationStats {
  const { n, hits } = rec;
  const reach = (hits + 1) / (n + 2);
  const confidence = Math.min(1, n / MIN_OBS);
  return { n, hits, reach, confidence };
}

// ─── Record an observation ────────────────────────────────────────────────────

export function recordObservationDW(
  ps: PackSpecDW,
  loc: DwLocation,
  correct: boolean
): PackSpecDW {
  const next: PackSpecDW = { ...ps, loc: { ...ps.loc }, updated: Date.now() };
  const rec: LocationRecord = { ...next.loc[loc] };
  rec.n += 1;
  if (correct) { rec.hits += 1; rec.streak = (rec.streak || 0) + 1; }
  else { rec.streak = 0; }
  rec.last = Date.now();
  const step = Math.min(rec.streak, SPACING_DAYS.length) - 1;
  const days = correct ? (SPACING_DAYS[Math.max(0, step)] ?? 35) : 0.5;
  rec.due = Date.now() + days * 24 * 60 * 60 * 1000;
  next.loc[loc] = rec;
  return next;
}

// ─── Spaced review queue ──────────────────────────────────────────────────────

export interface DueLocation {
  loc: DwLocation;
  overdueDays: number;
  reach: number;
}

export function dueForReviewDW(ps: PackSpecDW): DueLocation[] {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  return DW_LOCATIONS
    .map(l => {
      const rec = ps.loc[l];
      const s = locationStats(rec);
      if (rec.n === 0 || !rec.due || rec.due > now) return null;
      return { loc: l, overdueDays: (now - rec.due) / DAY, reach: s.reach };
    })
    .filter((x): x is DueLocation => x !== null)
    .sort((a, b) => b.overdueDays - a.overdueDays || a.reach - b.reach);
}

// ─── Blind spots ──────────────────────────────────────────────────────────────

export type BlindSpotTier = 'certified' | 'tentative' | 'unprobed';

export interface BlindSpot extends LocationStats {
  loc: DwLocation;
  tier: BlindSpotTier;
}

export function blindSpotsDW(ps: PackSpecDW): BlindSpot[] {
  return DW_LOCATIONS
    .map(l => {
      const s = locationStats(ps.loc[l]);
      const tier: BlindSpotTier =
        s.confidence >= 1 ? 'certified' : s.n > 0 ? 'tentative' : 'unprobed';
      return { loc: l, ...s, tier };
    })
    .sort((a, b) => a.reach - b.reach || b.n - a.n);
}

// ─── Move efficacy ────────────────────────────────────────────────────────────

export interface MoveStats {
  shown: number;
  worked: number;
  efficacy: number;   // Laplace-smoothed
  confidence: number;
}

export function moveStatsDW(rec: MoveRecord): MoveStats {
  const { shown, worked } = rec;
  const efficacy = (worked + 1) / (shown + 2);
  const confidence = Math.min(1, shown / MIN_MOVE_OBS);
  return { shown, worked, efficacy, confidence };
}

export function recordMoveDW(
  ps: PackSpecDW,
  moveKey: string,
  workedOut: boolean
): PackSpecDW {
  const next: PackSpecDW = { ...ps, moves: { ...ps.moves }, updated: Date.now() };
  const rec: MoveRecord = { ...(next.moves[moveKey] ?? emptyMoveRec()) };
  rec.shown += 1;
  if (workedOut) rec.worked += 1;
  rec.last = Date.now();
  next.moves[moveKey] = rec;
  return next;
}

export function leadMoveDW(ps: PackSpecDW): { key: string; reason: 'default' | 'learned'; efficacy?: number } {
  const certified = MOVES
    .map(m => ({ ...m, ...moveStatsDW(ps.moves[m.key] ?? emptyMoveRec()) }))
    .filter(m => m.confidence >= 1);
  if (certified.length === 0) return { key: MOVES[0].key, reason: 'default' };
  const best = certified.sort((a, b) => b.efficacy - a.efficacy)[0];
  if (best.efficacy < 0.55) return { key: MOVES[0].key, reason: 'default' };
  return { key: best.key, reason: 'learned', efficacy: best.efficacy };
}

export function pedagogyProfileDW(ps: PackSpecDW) {
  return MOVES.map(m => {
    const s = moveStatsDW(ps.moves[m.key] ?? emptyMoveRec());
    const tier: 'certified' | 'tentative' | 'unprobed' =
      s.confidence >= 1 ? 'certified' : s.shown > 0 ? 'tentative' : 'unprobed';
    return { ...m, ...s, tier };
  });
}

// ─── Assessment scoring ───────────────────────────────────────────────────────

export interface AssessmentItem {
  id: string;
  stem: string;
  deceptive: boolean;
  location: DwLocation | null;
  why: string;
  discriminator?: string;
  check?: string;
}

export interface AssessmentAnswer {
  deceptive?: boolean;
  location?: DwLocation | null;
}

export function scoreAssessmentDW(
  items: AssessmentItem[],
  answers: Record<string, AssessmentAnswer>
): { soundAcc: number; locAcc: number; n: number } {
  let soundCorrect = 0, locItems = 0, locCorrect = 0;
  items.forEach(it => {
    const a = answers[it.id];
    if (!a || a.deceptive === undefined) return;
    if (a.deceptive === it.deceptive) soundCorrect++;
    if (it.deceptive && it.location) {
      locItems++;
      if (a.location === it.location) locCorrect++;
    }
  });
  return {
    soundAcc: items.length ? soundCorrect / items.length : 0,
    locAcc: locItems ? locCorrect / locItems : 0,
    n: items.length,
  };
}
