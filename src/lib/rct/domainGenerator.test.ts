import { describe, it, expect } from 'vitest';
import { hydrateGenerated, domainKeyFromName } from './domainGenerator';

describe('domainGenerator', () => {
  it('hydrateGenerated builds accept functions from keywords', () => {
    const domain = hydrateGenerated({
      name: 'Test Domain',
      root: 'a',
      nodes: [{
        id: 'a',
        eat: { entity: 'x', action: 'y', target: 'z' },
        label: 'Alpha',
        requires: [],
        col: 0,
        row: 0,
        levels: [{
          tier: 'Junior',
          anchor: { artifact: 'art', known: 'known' },
          newCase: 'new',
          witness: { prompt: 'p', acceptKeywords: ['central'], rejectKeywords: ['wrong'] },
          antiwitness: { mutation: 'm', prompt: 'ap', trap: 't', acceptKeywords: ['mirror'] },
          hints: ['h1', 'h2'],
        }],
      }],
    });

    expect(domain.generated).toBe(true);
    expect(domain.nodes[0].levels[0].witness.accept('downloaded from central')).toBe(true);
    expect(domain.nodes[0].levels[0].witness.accept('wrong answer')).toBe(false);
    expect(domain.nodes[0].levels[0].antiwitnesses?.[0].accept('mirror intercepts')).toBe(true);
  });

  it('domainKeyFromName slugifies names', () => {
    expect(domainKeyFromName('Apache Maven')).toBe('gen:apache-maven');
    expect(domainKeyFromName('C++ / Templates')).toMatch(/^gen:c/);
  });
});
