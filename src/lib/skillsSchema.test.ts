import { describe, it, expect } from 'vitest';
import { isRctMigrationError } from './skillsSchema';

describe('skillsSchema', () => {
  it('detects missing RCT column errors', () => {
    expect(isRctMigrationError('column skills.rct_node_id does not exist')).toBe(true);
    expect(isRctMigrationError('Could not find the source column')).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isRctMigrationError('JWT expired')).toBe(false);
  });
});
