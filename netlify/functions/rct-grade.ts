import { callAnthropic, parseJsonResponse, corsHeaders } from './_shared/anthropic';

interface GradeBody {
  kind: 'witness' | 'anti';
  anchorKnown: string;
  newCase: string;
  prompt: string;
  expectedMapping?: string;
  trap?: string | null;
  answer: string;
}

export const handler = async (event: { httpMethod: string; body: string | null }) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body: GradeBody = JSON.parse(event.body || '{}');
    const sys =
      "You grade a learner's answer in a skill tool built on Regime Convergence Theory. " +
      "Understanding = mapping an UNKNOWN new case onto a KNOWN anchor the learner already holds. " +
      "Distinguish genuine mapping from keyword pattern-matching. " +
      "An answer that states a true fact WITHOUT connecting it to the anchor is 'shallow', NOT 'converged'. " +
      'Reply ONLY with strict JSON: {"verdict":"converged|shallow|trap|off","reason":"<=14 words"}. No prose, no markdown.';

    const user = `KNOWN ANCHOR: ${body.anchorKnown}
${body.kind === 'anti' ? 'MUTATED CASE' : 'NEW CASE'}: ${body.newCase}
QUESTION ASKED: ${body.prompt}
A CONVERGED ANSWER WOULD: ${body.expectedMapping || '(see hints)'}
THE DECEPTIVE TRAP ANSWER IS: ${body.trap || '(none)'}
LEARNER'S ANSWER: ${body.answer}

Judge: did they map onto the anchor (converged), state a true fact without anchoring (shallow), give the trap (trap), or miss (off)?`;

    const text = await callAnthropic(sys, user, 256);
    const parsed = parseJsonResponse(text) as { verdict?: string; reason?: string };

    if (!['converged', 'shallow', 'trap', 'off'].includes(parsed.verdict || '')) {
      throw new Error('Invalid verdict from model');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ verdict: parsed.verdict, reason: parsed.reason || '', graded: 'model' }),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Grading failed';
    const status = msg.includes('not configured') ? 503 : 500;
    return { statusCode: status, headers: corsHeaders, body: JSON.stringify({ error: msg }) };
  }
};
