import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, BookOpen, Search, Filter, ChevronDown, Award, Zap, ArrowLeft, X, Save, Loader2 } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidence: string;
  tags: string[];
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

function BackgroundGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 to-emerald-500/10 rounded-full blur-3xl" />
    </div>
  );
}

const INPUT_CLS = 'w-full px-4 py-3 bg-slate-900/50 border border-slate-600/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-slate-500 transition-all duration-300';
const LABEL_CLS = 'block text-sm font-medium text-slate-300 mb-2';

export default function Skills() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [form, setForm] = useState({ name: '', level: 'beginner' as Skill['level'], evidence: '', tags: '' });
  const [error, setError] = useState('');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchSkills();
  }, [user]);

  async function fetchSkills() {
    setLoading(true);
    const { data } = await supabase.from('skills').select('*').order('created_at', { ascending: false });
    setSkills(data || []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { error: err } = await supabase.from('skills').insert({
        user_id: user!.id,
        name: form.name.trim(),
        level: form.level,
        evidence: form.evidence.trim(),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      if (err) throw err;
      setForm({ name: '', level: 'beginner', evidence: '', tags: '' });
      setShowForm(false);
      fetchSkills();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this skill?')) return;
    await supabase.from('skills').delete().eq('id', id);
    fetchSkills();
  }

  const filtered = skills.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchLevel = !filterLevel || s.level === filterLevel;
    return matchSearch && matchLevel;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-x-hidden">
      <BackgroundGlow />
      <div className="relative z-10 bg-grid-pattern min-h-screen">
        <nav className="border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/40 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Dashboard</span>
                </Link>
                <span className="text-slate-700">/</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-semibold text-white">My Skills</span>
                </div>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all duration-200"
              >
                <Plus className="w-4 h-4" /> Add Skill
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Skills Portfolio</h1>
              <p className="text-slate-400 text-sm">{skills.length} skill{skills.length !== 1 ? 's' : ''} documented</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search skills..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/40 border border-slate-700/40 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={filterLevel}
                onChange={e => setFilterLevel(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-800/40 border border-slate-700/40 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none cursor-pointer"
              >
                <option value="">All levels</option>
                {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Skills Grid */}
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
              <h3 className="text-slate-300 font-semibold mb-2">{search || filterLevel ? 'No skills match your filters' : 'No skills yet'}</h3>
              <p className="text-slate-500 text-sm mb-6">{search || filterLevel ? 'Try adjusting your search or filter' : 'Add your first skill to get started'}</p>
              {!search && !filterLevel && (
                <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
                  Add your first skill
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(skill => (
                <div key={skill.id} className="group backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 hover:border-slate-600/60 hover:bg-slate-800/50 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${LEVEL_DOT[skill.level]}`} />
                      <h3 className="font-semibold text-white truncate">{skill.name}</h3>
                    </div>
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all duration-200 ml-2 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${LEVEL_COLORS[skill.level]}`}>
                      {skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
                    </span>
                  </div>
                  {skill.evidence && (
                    <p className="text-slate-400 text-sm leading-relaxed mb-3 line-clamp-3">{skill.evidence}</p>
                  )}
                  {skill.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skill.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-700/60 text-slate-400 text-xs rounded-md border border-slate-600/40">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-700/40">
                    <span className="text-xs text-slate-600">{new Date(skill.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Skill Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <div className="relative w-full max-w-lg backdrop-blur-xl bg-slate-800/90 border border-slate-700/60 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Add New Skill</h2>
                </div>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className={LABEL_CLS}>Skill name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={INPUT_CLS} placeholder="e.g. React, Data Analysis, Project Management" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Proficiency level *</label>
                  <select value={form.level} onChange={e => setForm({...form, level: e.target.value as Skill['level']})} className={INPUT_CLS + ' cursor-pointer'}>
                    {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Evidence & proof</label>
                  <textarea value={form.evidence} onChange={e => setForm({...form, evidence: e.target.value})} className={INPUT_CLS} rows={3} placeholder="Describe your evidence: projects completed, certifications, measurable results..." />
                </div>
                <div>
                  <label className={LABEL_CLS}>Tags <span className="text-slate-500 font-normal">(comma-separated)</span></label>
                  <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className={INPUT_CLS} placeholder="e.g. frontend, typescript, team-lead" />
                </div>
                {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 bg-slate-700/60 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Add Skill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
