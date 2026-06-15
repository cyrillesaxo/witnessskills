import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import { isRctMigrationError } from '../lib/skillsSchema';
import AppShell from '../components/ui/AppShell';
import { skillsToMarkdown, downloadMarkdown } from '../lib/portfolioExport';
import { Plus, Trash2, BookOpen, Search, Filter, ChevronDown, Award, X, Save, Loader2, Pencil, Brain, Download, AlertCircle, ArrowUpDown, RefreshCw } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidence: string;
  tags: string[];
  source?: string;
  rct_node_id?: string;
  rct_domain?: string;
  rct_tier?: string;
  rct_cret?: number;
  rct_cleared_at?: string;
  created_at: string;
}

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  advanced: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  expert: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};
const LEVEL_DOT: Record<string, string> = {
  beginner: 'bg-blue-400',
  intermediate: 'bg-amber-400',
  advanced: 'bg-emerald-400',
  expert: 'bg-purple-400',
};

const INPUT_CLS = 'w-full px-4 py-3 bg-slate-900/50 border border-slate-600/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-slate-500 transition-all duration-300';
const LABEL_CLS = 'block text-sm font-medium text-slate-300 mb-2';

const EMPTY_FORM = { name: '', level: 'beginner' as Skill['level'], evidence: '', tags: '' };

type SortKey = 'newest' | 'oldest' | 'name' | 'level';

const LEVEL_RANK: Record<Skill['level'], number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};

export default function Skills() {
  useDocumentTitle('Skills');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRct, setEditingRct] = useState(false);
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchSkills();
  }, [user]);

  useEffect(() => {
    const id = searchParams.get('skill');
    if (!id || loading || skills.length === 0) return;
    const skill = skills.find(s => s.id === id);
    if (!skill) return;
    setDetailSkill(skill);
    const next = new URLSearchParams(searchParams);
    next.delete('skill');
    setSearchParams(next, { replace: true });
  }, [skills, loading, searchParams, setSearchParams]);

  async function fetchSkills() {
    setLoading(true);
    setFetchError('');
    const { data, error: err } = await supabase.from('skills').select('*').order('created_at', { ascending: false });
    if (err) {
      setFetchError(err.message);
      setSkills([]);
    } else {
      setSkills(data || []);
    }
    setLoading(false);
  }

  function openAdd() {
    setEditingId(null);
    setEditingRct(false);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(skill: Skill) {
    setEditingId(skill.id);
    setEditingRct(skill.source === 'rct');
    setForm({
      name: skill.name,
      level: skill.level,
      evidence: skill.evidence || '',
      tags: (skill.tags || []).join(', '),
    });
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setEditingRct(false);
    setForm(EMPTY_FORM);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        level: form.level,
        evidence: form.evidence.trim(),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (editingId) {
        const { error: err } = await supabase.from('skills').update(payload).eq('id', editingId);
        if (err) throw err;
        setSkills(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } : s));
      } else {
        const { data, error: err } = await supabase.from('skills').insert({
          user_id: user!.id,
          ...payload,
          source: 'manual',
        }).select().single();
        if (err) throw err;
        if (data) setSkills(prev => [data as Skill, ...prev]);
      }

      closeForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setError(isRctMigrationError(msg)
        ? `${msg} — run supabase/setup_all.sql if RCT fields are missing.`
        : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this skill?')) return;
    const { error: err } = await supabase.from('skills').delete().eq('id', id);
    if (err) setFetchError(err.message);
    else {
      if (detailSkill?.id === id) setDetailSkill(null);
      setSkills(prev => prev.filter(s => s.id !== id));
    }
  }

  const hasActiveFilters = !!(search || filterLevel || filterSource);

  const filtered = useMemo(() => {
    const list = skills.filter(s => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
      const matchLevel = !filterLevel || s.level === filterLevel;
      const matchSource = !filterSource || (filterSource === 'rct' ? s.source === 'rct' : s.source !== 'rct');
      return matchSearch && matchLevel && matchSource;
    });

    const sorted = [...list];
    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'level':
        sorted.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level]);
        break;
      default:
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return sorted;
  }, [skills, search, filterLevel, filterSource, sortBy]);

  function handleExport() {
    const exportSet = hasActiveFilters ? filtered : skills;
    const md = skillsToMarkdown(exportSet, user?.email);
    const date = new Date().toISOString().slice(0, 10);
    const suffix = hasActiveFilters ? '-filtered' : '';
    downloadMarkdown(md, `witnessskills-portfolio-${date}${suffix}.md`);
  }

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  if (!user) return null;

  return (
    <AppShell
      trail={[{ label: 'Dashboard', href: '/' }, { label: 'My Skills' }]}
      onSignOut={handleSignOut}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={fetchSkills} disabled={loading} title="Refresh skills"
            className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-400 border border-slate-700/60 px-3 py-1.5 rounded-lg disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {skills.length > 0 && (
            <button onClick={handleExport} title={hasActiveFilters ? `Export ${filtered.length} filtered skills` : 'Export all skills'}
              className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-400 border border-slate-700/60 px-3 py-1.5 rounded-lg">
              <Download className="w-4 h-4" />
              Export{hasActiveFilters ? ` (${filtered.length})` : ''}
            </button>
          )}
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add</span>
          </button>
        </div>
      }
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Skills Portfolio</h1>
              <p className="text-slate-400 text-sm">
                {hasActiveFilters
                  ? `Showing ${filtered.length} of ${skills.length} skills`
                  : `${skills.length} skill${skills.length !== 1 ? 's' : ''} documented`}
              </p>
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
              <span className="flex-1">{fetchError}</span>
              <button onClick={fetchSkills} className="text-xs font-medium text-red-300 hover:text-red-200 border border-red-500/30 px-3 py-1.5 rounded-lg shrink-0">
                Retry
              </button>
            </div>
            {isRctMigrationError(fetchError) && (
              <p className="mt-2 text-amber-300/90 text-sm bg-amber-500/10 border border-amber-500/25 px-4 py-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  RCT fields may be missing — run migration{' '}
                  <code className="text-amber-200 text-xs">supabase/setup_all.sql</code>{' '}
                  (fresh) or <code className="text-amber-200 text-xs">20260615000001_add_rct_fields_to_skills.sql</code>{' '}
                  (existing) in the Supabase SQL editor, then refresh.
                </span>
              </p>
            )}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search skills..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/40 border border-slate-700/40 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-800/40 border border-slate-700/40 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none cursor-pointer">
                <option value="">All levels</option>
                {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-800/40 border border-slate-700/40 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none cursor-pointer">
                <option value="">All sources</option>
                <option value="rct">RCT evidence</option>
                <option value="manual">Manual</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
                className="pl-10 pr-8 py-2.5 bg-slate-800/40 border border-slate-700/40 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none cursor-pointer">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option>
                <option value="level">Highest level</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            {hasActiveFilters && (
              <button onClick={() => { setSearch(''); setFilterLevel(''); setFilterSource(''); }}
                className="text-sm text-slate-400 hover:text-emerald-400 border border-slate-700/60 px-3 py-2.5 rounded-xl whitespace-nowrap">
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-slate-600" />
              </div>
              <h3 className="text-slate-300 font-semibold mb-2">{search || filterLevel || filterSource ? 'No skills match your filters' : 'No skills yet'}</h3>
              <p className="text-slate-500 text-sm mb-6">
                {search || filterLevel || filterSource ? 'Try adjusting your search or filter' : 'Add a skill manually or clear nodes in Learn to sync RCT evidence'}
              </p>
              {hasActiveFilters && (
                <button onClick={() => { setSearch(''); setFilterLevel(''); setFilterSource(''); }}
                  className="text-sm text-emerald-400 hover:text-emerald-300">
                  Clear filters
                </button>
              )}
              {!search && !filterLevel && !filterSource && (
                <div className="flex gap-3 justify-center">
                  <button onClick={openAdd} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Add skill</button>
                  <Link to="/learn" className="bg-purple-500/10 border border-purple-500/30 text-purple-300 px-6 py-2.5 rounded-xl text-sm font-semibold">Go to Learn</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(skill => (
                <div key={skill.id}
                  onClick={() => setDetailSkill(skill)}
                  className="group backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 hover:border-slate-600/60 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${LEVEL_DOT[skill.level]}`} />
                      <h3 className="font-semibold text-white truncate">{skill.name}</h3>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(skill)} className="text-slate-600 hover:text-emerald-400 p-1" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(skill.id)} className="text-slate-600 hover:text-red-400 p-1" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${LEVEL_COLORS[skill.level]}`}>
                      {skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
                    </span>
                    {skill.source === 'rct' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-purple-500/20 text-purple-300 border-purple-500/30">
                        RCT{skill.rct_tier ? ` · ${skill.rct_tier}` : ''}{skill.rct_cret != null ? ` · C_ret ${Number(skill.rct_cret).toFixed(2)}` : ''}
                      </span>
                    )}
                  </div>
                  {skill.evidence && (
                    <p className="text-slate-400 text-sm leading-relaxed mb-3 line-clamp-3">{skill.evidence}</p>
                  )}
                  {skill.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {skill.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-700/60 text-slate-400 text-xs rounded-md border border-slate-600/40">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/40">
                    <span className="text-xs text-slate-600">{new Date(skill.created_at).toLocaleDateString()}</span>
                    {skill.source === 'rct' && skill.rct_node_id && (
                      <Link to={`/learn?node=${skill.rct_node_id}`}
                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
                        <Brain className="w-3 h-3" /> retrain
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeForm} />
            <div className="relative w-full max-w-lg backdrop-blur-xl bg-slate-800/90 border border-slate-700/60 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit Skill' : 'Add New Skill'}</h2>
                </div>
                <button onClick={closeForm} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
              </div>

              {editingRct && (
                <p className="text-xs text-purple-300/80 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 mb-4">
                  RCT-synced skill — name is managed by Learn. You can update level, evidence notes, and tags.
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={LABEL_CLS}>Skill name *</label>
                  <input type="text" required value={form.name} readOnly={editingRct}
                    onChange={e => setForm({ ...form, name: e.target.value })} className={INPUT_CLS + (editingRct ? ' opacity-60 cursor-not-allowed' : '')}
                    placeholder="e.g. React, Data Analysis" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Proficiency level *</label>
                  <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value as Skill['level'] })} className={INPUT_CLS + ' cursor-pointer'}>
                    {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Evidence & proof</label>
                  <textarea value={form.evidence} onChange={e => setForm({ ...form, evidence: e.target.value })} className={INPUT_CLS} rows={4}
                    placeholder="Describe your evidence…" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Tags <span className="text-slate-500 font-normal">(comma-separated)</span></label>
                  <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className={INPUT_CLS} placeholder="e.g. frontend, typescript" />
                </div>
                {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeForm} className="flex-1 px-4 py-3 bg-slate-700/60 text-slate-300 rounded-xl font-medium">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Skill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {detailSkill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetailSkill(null)}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg max-h-[85vh] overflow-auto backdrop-blur-xl bg-slate-800/95 border border-slate-700/60 rounded-2xl shadow-2xl p-6"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setDetailSkill(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold text-white mb-1 pr-8">{detailSkill.name}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-2.5 py-1 rounded-lg border ${LEVEL_COLORS[detailSkill.level]}`}>
                  {detailSkill.level.charAt(0).toUpperCase() + detailSkill.level.slice(1)}
                </span>
                {detailSkill.source === 'rct' && (
                  <span className="text-xs px-2.5 py-1 rounded-lg border bg-purple-500/20 text-purple-300 border-purple-500/30">
                    RCT{detailSkill.rct_tier ? ` · ${detailSkill.rct_tier}` : ''}{detailSkill.rct_cret != null ? ` · C_ret ${Number(detailSkill.rct_cret).toFixed(2)}` : ''}
                  </span>
                )}
              </div>
              {detailSkill.evidence ? (
                <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900/40 border border-slate-700/40 rounded-xl p-4 mb-4 font-sans">{detailSkill.evidence}</pre>
              ) : (
                <p className="text-sm text-slate-500 italic mb-4">No evidence documented yet.</p>
              )}
              {detailSkill.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {detailSkill.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-700/60 text-slate-400 text-xs rounded-md border border-slate-600/40">{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-slate-700/40">
                <button onClick={() => { setDetailSkill(null); openEdit(detailSkill); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/60 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-700">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                {detailSkill.source === 'rct' && detailSkill.rct_node_id && (
                  <Link to={`/learn?node=${detailSkill.rct_node_id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-medium hover:bg-purple-500/20">
                    <Brain className="w-4 h-4" /> Retrain
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
    </AppShell>
  );
}
