import { corsHeaders } from './_shared/anthropic';

export const handler = async () => ({
  statusCode: 200,
  headers: corsHeaders,
  body: JSON.stringify({ ok: true, service: 'witnessskills', ts: new Date().toISOString() }),
});
