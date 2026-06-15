import type { GradeResult, AuthorGradeResult } from './types';

const FN_BASE = '/.netlify/functions';

interface GradeParams {
  kind: 'witness' | 'anti';
  anchorKnown: string;
  newCase: string;
  prompt: string;
  expectedMapping?: string;
  trap?: string | null;
  answer: string;
  fallback: (answer: string) => boolean;
}

export async function gradeConvergence(params: GradeParams): Promise<GradeResult> {
  const { answer, fallback } = params;
  try {
    const res = await fetch(`${FN_BASE}/rct-grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (['converged', 'shallow', 'trap', 'off'].includes(data.verdict)) {
        return { verdict: data.verdict, reason: data.reason || '', graded: 'model' };
      }
    }
  } catch { /* fall through */ }

  const ok = fallback(answer);
  return { verdict: ok ? 'converged' : 'off', reason: 'keyword check', graded: 'fallback' };
}

interface AuthorParams {
  target: 'witness' | 'deceptive';
  artifact: string;
  newCase: string;
  expert: string;
  studentText: string;
}

export async function gradeAuthoring(params: AuthorParams): Promise<AuthorGradeResult> {
  try {
    const res = await fetch(`${FN_BASE}/rct-author`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (['strong', 'partial', 'weak'].includes(data.grade)) {
        return { grade: data.grade, note: data.note || '', graded: 'model' };
      }
    }
  } catch { /* fall through */ }

  return { grade: 'partial', note: 'offline — compare against the expert pair yourself', graded: 'fallback' };
}
