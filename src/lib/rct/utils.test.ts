import { describe, it, expect } from 'vitest';
import { norm, hasAny, hasAll, storageKeyFor } from './utils';

describe('rct utils', () => {
  it('norm lowercases and collapses whitespace', () => {
    expect(norm('  Hello   World ')).toBe('hello world');
  });

  it('hasAny matches substrings', () => {
    expect(hasAny('downloaded from central', ['central', 'missing'])).toBe(true);
    expect(hasAny('local only', ['central'])).toBe(false);
  });

  it('hasAll requires every keyword', () => {
    expect(hasAll('central and .m2 cache', ['central', '.m2'])).toBe(true);
    expect(hasAll('central only', ['central', '.m2'])).toBe(false);
  });

  it('storageKeyFor namespaces domain progress', () => {
    expect(storageKeyFor('maven')).toBe('witnessskills-rct-v1:maven');
    expect(storageKeyFor('')).toBe('witnessskills-rct-v1:maven');
  });
});
