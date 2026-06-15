export type Tier = 'Junior' | 'Mid' | 'Senior';

export interface Witness {
  prompt: string;
  example?: string;
  accept: (answer: string) => boolean;
}

export interface Antiwitness {
  mutation: string;
  prompt: string;
  trap: string;
  example?: string;
  accept: (answer: string) => boolean;
}

export interface NodeLevel {
  tier: Tier;
  anchor: { artifact: string; known: string };
  newCase: string;
  witness: Witness;
  antiwitness?: Antiwitness;
  antiwitnesses?: Antiwitness[];
  hints: [string, string];
}

export interface OntologyNode {
  id: string;
  eat: { entity: string; action: string; target: string };
  label: string;
  gist?: string;
  example?: string;
  requires: string[];
  col: number;
  row: number;
  levels: NodeLevel[];
}

export interface Domain {
  name: string;
  root: string;
  nodes: OntologyNode[];
  helloPom?: string;
  generated?: boolean;
  grounded?: boolean;
}

export interface NodeState {
  depth: number;
  cleared: number;
  unlocked: boolean;
  lastRetrieved: number;
  cret: number;
  awSurvived: number;
  attempts: number;
  hintsUsed: number;
  shallowHits: number;
  reps: number;
}

export type GradeVerdict = 'converged' | 'shallow' | 'trap' | 'off';

export interface GradeResult {
  verdict: GradeVerdict;
  reason: string;
  graded: 'model' | 'fallback';
}

export interface AuthorGradeResult {
  grade: 'strong' | 'partial' | 'weak';
  note: string;
  graded: 'model' | 'fallback';
}

export interface AuthoringState {
  witText?: string;
  witGrade?: AuthorGradeResult;
  witRevealed?: boolean;
  trapText?: string;
  trapGrade?: AuthorGradeResult;
  revealed?: boolean;
  pickedReal?: boolean;
}

export const STAGES = [
  { id: 0, name: 'Recognize', blurb: 'See the witness and the deceptive witness.' },
  { id: 1, name: 'Discriminate', blurb: 'Pick which statement is the real witness vs the trap.' },
  { id: 2, name: 'Author the trap', blurb: 'Write the deceptive witness, then compare against an expert.' },
  { id: 3, name: 'Author both', blurb: 'Write witness and trap from scratch, then self-correct.' },
] as const;

export const TIER_COLOR: Record<Tier, string> = {
  Junior: '#7d8aa3',
  Mid: '#f2a43c',
  Senior: '#2fd3a5',
};
