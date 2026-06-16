export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export async function callAnthropic(system: string, user: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Anthropic API error: ' + res.status + ' ' + err);
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const block = data.content[0];
  if (!block || block.type !== 'text') throw new Error('Unexpected response type from Anthropic');
  return block.text;
}

export function parseJsonResponse<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?[\r\n]*/i, '').replace(/[\r\n]*```$/i, '').trim();
  return JSON.parse(cleaned) as T;
}
