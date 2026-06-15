interface ExportSkill {
  name: string;
  level: string;
  evidence: string;
  tags: string[];
  source?: string;
  rct_tier?: string;
  rct_cret?: number;
  rct_cleared_at?: string;
  created_at: string;
}

export function skillsToMarkdown(skills: ExportSkill[], userEmail?: string): string {
  const lines: string[] = [
    '# WitnessSkills Portfolio',
    '',
    userEmail ? `**Account:** ${userEmail}` : '',
    `**Exported:** ${new Date().toLocaleString()}`,
    `**Skills:** ${skills.length}`,
    '',
    '---',
    '',
  ].filter(Boolean);

  for (const s of skills) {
    lines.push(`## ${s.name}`);
    lines.push('');
    lines.push(`- **Level:** ${s.level}`);
    if (s.source === 'rct') {
      lines.push(`- **Source:** RCT convergence${s.rct_tier ? ` (${s.rct_tier})` : ''}`);
      if (s.rct_cret != null) lines.push(`- **C_ret:** ${Number(s.rct_cret).toFixed(2)}`);
      if (s.rct_cleared_at) lines.push(`- **Cleared:** ${new Date(s.rct_cleared_at).toLocaleDateString()}`);
    } else {
      lines.push('- **Source:** Manual entry');
    }
    if (s.tags?.length) lines.push(`- **Tags:** ${s.tags.join(', ')}`);
    lines.push(`- **Documented:** ${new Date(s.created_at).toLocaleDateString()}`);
    lines.push('');
    if (s.evidence?.trim()) {
      lines.push('### Evidence');
      lines.push('');
      lines.push(s.evidence.trim());
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
