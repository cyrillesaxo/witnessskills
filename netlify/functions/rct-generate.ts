import { callAnthropic, parseJsonResponse, corsHeaders } from './_shared/anthropic';

const ONTOLOGY_SCHEMA = `Return ONLY strict JSON, no markdown:
{"name":str,"root":nodeId,"helloPom":str|null,"nodes":[{"id":str,"eat":{"entity":str,"action":str,"target":str},"label":str,"gist":str,"example":str,"requires":[nodeId],"col":int,"row":int,"levels":[{"tier":"Junior|Mid|Senior","anchor":{"artifact":str,"known":str},"newCase":str,"witness":{"prompt":str,"example":str,"acceptKeywords":[str],"rejectKeywords":[str]},"antiwitnesses":[{"mutation":str,"prompt":str,"trap":str,"example":str,"acceptKeywords":[str],"rejectKeywords":[str]}],"hints":[concreteStr,abstractStr]}]}]}
Rules: 5-8 nodes forming a DAG. Root has requires:[]. col 0-5, row 0-3. Each node needs >=1 level. acceptKeywords = 3-8 lowercase substrings for correct answers; rejectKeywords = trap substrings that must NOT pass.`;

export const handler = async (event: { httpMethod: string; body: string | null }) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { prompt, context } = JSON.parse(event.body || '{}') as { prompt?: string; context?: string };
    if (!prompt?.trim()) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'prompt required' }) };
    }

    const sys =
      'You build skill ontologies for a learning tool grounded in Regime Convergence Theory. ' +
      'Understanding = mapping an UNKNOWN new case onto a KNOWN concrete anchor. ' +
      'A WITNESS maps the new case onto the anchor. A DECEPTIVE WITNESS is seductive — makes learners FEEL correct while wrong. ' +
      'Anchors must be CONCRETE artifacts. Hints go concrete-first, abstraction-second. ' +
      ONTOLOGY_SCHEMA;

    const user = `DOMAIN TO BUILD AN ONTOLOGY FOR:\n${prompt}\n\n${context ? 'GROUNDING CONTEXT:\n' + context : '(no extra context)'}`;

    const text = await callAnthropic(sys, user, 4000);
    const parsed = parseJsonResponse(text) as { nodes?: unknown[]; root?: string; name?: string };

    if (!parsed.nodes?.length) throw new Error('No nodes returned');
    if (!parsed.root) {
      const rootNode = (parsed.nodes as { id: string; requires?: string[] }[]).find(n => !(n.requires || []).length);
      parsed.root = rootNode?.id || (parsed.nodes[0] as { id: string }).id;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ...parsed, generated: true }),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Generation failed';
    const status = msg.includes('not configured') ? 503 : 500;
    return { statusCode: status, headers: corsHeaders, body: JSON.stringify({ error: msg }) };
  }
};
