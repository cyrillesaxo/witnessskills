import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain, Plus, X, ChevronDown, BookOpen, Tag,
  ExternalLink, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import OntologyGraphModal from '../components/ui/OntologyGraphModal';
import { supabase } from '../lib/supabase';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
type Level = typeof LEVELS[number];

const LEVEL_STYLES: Record<Level, string> = {
  beginner: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  intermediate: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  advanced: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  expert: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

interface Skill {
  id: string;
  name: string;
  level: Level;
  domain: string | null;
  evidence: string | null;
  tags: string[] | null;
  rct_node_id: string | null;
}

export default function Skills() {
  useDocumentTitle('Skills Portfolio');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  // OntologyGraphModal state
  const [graphSkill, setGraphSkill] = useState<{ name: string; level: string } | null>(null);

  // Add-skill form state
  const [form, setForm] = useState({
    name: '',
    level: 'intermediate' as Level,
    domain: '',
    evidence: '',
    tags: '',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadSkills();
  }, [user, navigate]);

  async function loadSkills() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('skills')
        .select('id, name, level, domain, evidence, tags, rct_node_id')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setSkills((data ?? []) as Skill[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveErr(null);
    setSaveOk(false);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { error: err } = await supabase.from('skills').insert({
        user_id: user!.id,
        name: form.name.trim(),
        level: form.level,
        domain: form.domain.trim() || null,
        evidence: form.evidence.trim() || null,
        tags: tags.length ? tags : null,
      });
      if (err) throw err;
      setSaveOk(true);
      setForm({ name: '', level: 'intermediate', domain: '', evidence: '', tags: '' });
      await loadSkills();
      setTimeout(() => { setShowAdd(false); setSaveOk(false); }, 1200);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSkill || !form.name.trim()) return;
    setSaving(true);
    setSaveErr(null);
    setSaveOk(false);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { error: err } = await supabase.from('skills').update({
        name: form.name.trim(),
        level: form.level as Level,
        domain: form.domain.trim() || null,
        evidence: form.evidence.trim() || null,
        tags: tags.length ? tags : null,
      }).eq('id', editingSkill.id).eq('user_id', user!.id);
      if (err) throw err;
      setSaveOk(true);
      await loadSkills();
      setTimeout(() => { setEditingSkill(null); setSaveOk(false); }, 900);
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSkill(id: string) {
    await supabase.from('skills').delete().eq('id', id).eq('user_id', user!.id);
    setSkills(prev => prev.filter(s => s.id !== id));
  }

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  if (!user) return null;

  return (
    <>
      <AppShell
        trail={[{ label: 'Dashboard', href: '/' }, { label: 'Skills Portfolio' }]}
        onSignOut={handleSignOut}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white">Skills Portfolio</h1>
              <p className="text-sm text-slate-400 mt-1">
                {skills.length} skill{skills.length !== 1 ? 's' : ''} documented
              </p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold hover:bg-emerald-500/30 transition-colors"
              aria-label="Add a new skill"
            >
              <Plus className="w-4 h-4" /> Add skill
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && skills.length === 0 && (
            <div className="text-center py-20">
              <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 font-semibold mb-1">No skills yet</h3>
              <p className="text-slate-500 text-sm mb-5">Add your first skill to start building your portfolio.</p>
              <button
                onClick={() => setShowAdd(true)}
                className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold hover:bg-emerald-500/30 transition-colors"
              >
                Add your first skill
              </button>
            </div>
          )}

          {/* Skill cards */}
          {!loading && skills.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {skills.map(skill => (
                <div
                  key={skill.id}
                  className="group relative p-4 bg-slate-800/40 border border-slate-700/40 rounded-2xl hover:border-slate-600/60 transition-colors"
                >
                  {/* Card top row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm truncate">{skill.name}</span>
                        <span className={'text-xs px-2 py-0.5 rounded-full border ' + LEVEL_STYLES[skill.level]}>
                          {skill.level}
                        </span>
                      </div>
                      {skill.domain && (
                        <p className="text-xs text-slate-500 mt-0.5">{skill.domain}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* RCT Ontology Graph icon - opens AI-powered modal */}
                      <button
                        onClick={() => setGraphSkill({ name: skill.name, level: skill.level })}
                        title={'Open RCT ontology graph for ' + skill.name}
                        aria-label={'Open RCT ontology graph for ' + skill.name}
                        className="p-1.5 rounded-lg text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors opacity-60 hover:opacity-100"
                      >
                        <Brain className="w-4 h-4" />
                      </button>

                      {/* Deep-link to Learn node */}
                      <Link
                        to={'/learn?node=' + encodeURIComponent(skill.name)}
                        title={'Open ' + skill.name + ' in RCT learning graph'}
                        aria-label={'Open ' + skill.name + ' in RCT learning graph'}
                        className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors opacity-60 hover:opacity-100"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setEditingSkill(skill);
                          setForm({
                            name: skill.name,
                            level: skill.level,
                            domain: skill.domain || '',
                            evidence: skill.evidence || '',
                            tags: (skill.tags || []).join(', '),
                          });
                        }}
                        title={'Edit ' + skill.name}
                        aria-label={'Edit ' + skill.name}
                        className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        title={'Remove ' + skill.name}
                        aria-label={'Remove ' + skill.name}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Evidence */}
                  {skill.evidence && (
                    <div className="flex gap-1.5 mt-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-400 line-clamp-2">{skill.evidence}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {skill.tags && skill.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Tag className="w-3 h-3 text-slate-600" />
                      {skill.tags.map(tag => (
                        <span key={tag}
                          className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      
      {/* Edit Skill Modal */}
      {editingSkill && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-white">Edit Skill</h2>
              <button
                type="button"
                onClick={() => setEditingSkill(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleEditSkill} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Skill name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. React"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Level</label>
                <select
                  value={form.level}
                  onChange={e => setForm(f => ({ ...f, level: e.target.value as Level }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Domain (optional)</label>
                <input
                  value={form.domain}
                  onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Frontend"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Evidence (optional)</label>
                <textarea
                  value={form.evidence}
                  onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Describe how you used this skill..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma-separated, optional)</label>
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. frontend, react, hooks"
                />
              </div>
              {saveErr && <p className="text-xs text-red-400">{saveErr}</p>}
              {saveOk && <p className="text-xs text-emerald-400">Saved!</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingSkill(null)}
                  className="flex-1 px-4 py-2 text-sm text-slate-400 border border-slate-700/50 rounded-xl hover:bg-slate-700/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
</AppShell>

      {/* Add skill modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Add new skill"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h2 className="font-semibold text-white text-sm">Add New Skill</h2>
              <button onClick={() => setShowAdd(false)} aria-label="Close" className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSkill} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Skill name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. TypeScript"
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                  aria-required="true"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Level</label>
                <div className="relative">
                  <select
                    value={form.level}
                    onChange={e => setForm(f => ({ ...f, level: e.target.value as Level }))}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/60 rounded-xl text-sm text-white appearance-none focus:outline-none focus:border-emerald-500/60"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Domain (optional)</label>
                <input
                  value={form.domain}
                  onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                  placeholder="e.g. Backend, Frontend, DevOps"
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Evidence (optional)</label>
                <textarea
                  value={form.evidence}
                  onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
                  placeholder="Describe how you've demonstrated this skill"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. frontend, react, hooks"
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {saveErr && (
                <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveErr}
                </div>
              )}
              {saveOk && (
                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2" role="status">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />Skill saved!
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2 text-sm text-slate-400 border border-slate-700/50 rounded-xl hover:bg-slate-700/30 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-emerald-500/30 border border-emerald-500/50 rounded-xl hover:bg-emerald-500/40 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RCT Ontology Graph Modal */}
      {graphSkill && (
        <OntologyGraphModal
          skillName={graphSkill.name}
          skillLevel={graphSkill.level}
          onClose={() => setGraphSkill(null)}
        />
      )}
    </>
  );
}
