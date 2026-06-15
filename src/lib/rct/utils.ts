export const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

export const hasAll = (a: string, words: string[]) => {
  const x = norm(a);
  return words.every(k => x.includes(k));
};

export const hasAny = (a: string, words: string[]) => {
  const x = norm(a);
  return words.some(k => x.includes(k));
};

export const storageKeyFor = (key: string) => `witnessskills-rct-v1:${key || 'maven'}`;
