import { callAnthropic, parseJsonResponse, corsHeaders } from './_shared/anthropic';

interface AuthorBody {
  target: 'witness' | 'deceptive';
  artifact: string;
  newCase: string;
  expert: string;
  studentText: string;
}

export const handler = async (event: { httpMethod: string; body: string | null }) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body: AuthorBody = JSON.parse(event.body || '{}');
    const sys =
      'You coach learning epistemics, not domain facts. A WITNESS is concrete evidence that proves understanding — NOT a restatement of the concept. ' +
      'A DECEPTIVE WITNESS is a seductive false signal that makes a learner FEEL they understand while being wrong. ' +
      'Judge ONLY epistemic quality, not perfect domain detail. ' +
      'Reply ONLY strict JSON: {"grade":"strong|partial|weak","note":"<=18 words"}. No markdown.';

    const user = `THEY ARE AUTHORING A: ${body.target === 'deceptive' ? 'DECEPTIVE WITNESS' : 'WITNESS'}
CONCRETE ARTIFACT: ${body.artifact}
THE CASE: ${body.newCase}
AN EXPERT'S VERSION (calibration only): ${body.expert}
STUDENT WROTE: ${body.studentText}

Grade strong/partial/weak with a one-line epistemic note.`;

    const text = await callAnthropic(sys, user, 256);
    const parsed = parseJsonResponse(text) as { grade?: string; note?: string };

    if (!['strong', 'partial', 'weak'].includes(parsed.grade || '')) {
      throw new Error('Invalid grade from model');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ grade: parsed.grade, note: parsed.note || '', graded: 'model' }),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Authoring grade failed';
    const status = msg.includes('not configured') ? 503 : 500;
    return { statusCode: status, headers: corsHeaders, body: JSON.stringify({ error: msg }) };
  }
};
