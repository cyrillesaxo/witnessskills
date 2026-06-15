/** Strip markdown fences and parse JSON from model responses. */
export function parseJsonResponse(text: string): unknown {
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
