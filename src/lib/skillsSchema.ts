/** True when Supabase errors likely mean RCT columns are not migrated yet. */
export function isRctMigrationError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('rct_') ||
    (m.includes('column') && m.includes('source')) ||
    (m.includes('column') && m.includes('skills'))
  );
}
