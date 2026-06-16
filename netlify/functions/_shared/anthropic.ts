import Anthropic from '@anthropic-ai/sdk';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const apiKey = process.env.ANTHROPIC_API_KEY;

export async function callAnthropic(system: string, user: string): Promise<string> {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic');
  return block.text;
}

export function parseJsonResponse<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?[\r\n]*/i, '').replace(/[\r\n]*```$/i, '').trim();
  return JSON.parse(cleaned) as T;
}
