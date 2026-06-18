import { useSearchParams } from 'react-router-dom';
import { BookOpen, ExternalLink, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import AppShell from '../components/ui/AppShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabase';

/**
 * Reader page — embeds regimeReader (white light surface) inside the
 * dark WitnessSkills shell.
 *
 * PackSpec integration:
 *   - Listens for postMessage events from the regimeReader iframe
 *   - On each graded session event (verdict), POSTs to /.hnetlify/functions/packspec
 *   - Displays live PackSpec convergence state (H_total, status, admitted moves)
 *
 * URL params:
 *   ?skill=frame|breadth|depth|channel|implicature
 *   ?skill_id=<uuid>   (Supabase skill row ID for PackSpec persistence)
 */

const READER_ORIGIN = 'https://frabjous-fenglisu-1199db.netlify.app';
const PACKSPEC_FN   = '/.netlify/functions/packspec';

const SKILL_TO_LOCATION: Record<string, string> = {
      depth: 'depth', breadth: 'breadth', channel: 'channel',
      frame: 'frame', implicature: 'implicature',
};

const LOCATION_META: Record<string, { label: string; move: string; description: string; color: string }> = {
      depth:      { label: 'Depth',      move: 'Dig',     description: "What's the rule beneath this symptom?",          color: 'emerald' },
      breadth:    { label: 'Breadth',    move: 'Compare', description: 'What better option was never put beside it?',     color: 'blue'    },
      channel:    { label: 'Channel',    move: 'Separate',description: 'Are these sources independent, or one echo?',     color: 'purple'  },
      frame:      { label: 'Frame',      move: 'Frame',   description: 'Under what unstated coordinates is this true?',   color: 'amber'   },
      implicature:{ label: 'Implicature',move: 'Parse',   description: 'What does it suggest beyond what it asserts?',   color: 'rose'    },
};

interface PackSpecState {
      iteration: number;
      H_total: number;
      L_t_min: number;
      status: 'converging' | 'certified' | 'decaying';
      admitted: string[];
}

export default function Reader() {
      useDocumentTitle('Regime Reader');
      const [searchParams] = useSearchParams();
      const { user } = useAuth();
      const skillParam   = searchParams.get('skill')?.toLowerCase() ?? '';
      const skillId      = searchParams.get('skill_id') ?? '';
      const location     = SKILL_TO_LOCATION[skillParam] ?? '';
      const iframeSrc    = location ? `${READER_ORIGIN}/?location=${location}` : READER_ORIGIN;
      const meta         = location ? LOCATION_META[location] : null;

  const [packSpec, setPackSpec] = useState<PackSpecState | null>(null);
      const [lastEvent, setLastEvent] = useState<string | null>(null);
      const tokenRef = useRef<string | null>(null);

  // Fetch auth token once
  useEffect(() => {
          supabase.auth.getSession().then(({ data }) => {
                    tokenRef.current = data.session?.access_token ?? null;
          });
  }, []);

  // Load existing PackSpec on mount (if skill_id present)
  useEffect(() => {
          if (!skillId || !user) return;
          supabase.auth.getSession().then(async ({ data }) => {
                    const token = data.session?.access_token;
                    if (!token) return;
                    tokenRef.current = token;
                    try {
                                const res = await fetch(`${PACKSPEC_FN}?skill_id=${skillId}`, {
                                              headers: { Authorization: `Bearer ${token}` },
                                });
                                if (res.ok) {
                                              const { packspec } = await res.json() as { packspec: {
                                                              iteration: number; H_total: number; L_t_min: number;
                                                              status: string; pack: { witnesses?: Array<{ location: string; admitted: boolean }> }
                                              } | null };
                                              if (packspec) {
                                                              const admitted = (packspec.pack?.witnesses ?? [])
                                                                .filter(w => w.admitted).map(w => w.location);
                                                              setPackSpec({
                                                                                iteration: packspec.iteration,
                                                                                H_total: packspec.H_total,
                                                                                L_t_min: packspec.L_t_min,
                                                                                status: packspec.status as PackSpecState['status'],
                                                                                admitted,
                                                              });
                                              }
                                }
                    } catch { /* silent — packspec is optional */ }
          });
  }, [skillId, user]);

  // postMessage listener: receives graded events from regimeReader iframe
  const handleMessage = useCallback(async (evt: MessageEvent) => {
          if (evt.origin !== READER_ORIGIN) return;
          const data = evt.data as { type?: string; location?: string; verdict?: string; regime_depth?: number; doc_name?: string };
          if (data?.type !== 'rct:witness_event') return;
          if (!skillId || !tokenRef.current) return;

                                        setLastEvent(`${data.location}: ${data.verdict}`);
          try {
                    const res = await fetch(PACKSPEC_FN, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
                                body: JSON.stringify({
                                              skill_id: skillId,
                                              event: { location: data.location, verdict: data.verdict, regime_depth: data.regime_depth, doc_name: data.doc_name },
                                }),
                    });
                    if (res.ok) {
                                const result = await res.json() as {
                                              iteration: number; H_total: number; L_t_min: number; status: string;
                                              witness_admitted: boolean;
                                };
                                setPackSpec(prev => {
                                              const prevAdmitted = prev?.admitted ?? [];
                                              const newAdmitted = result.witness_admitted && data.location
                                                ? [...new Set([...prevAdmitted, data.location])]
                                                              : prevAdmitted;
                                              return { iteration: result.iteration, H_total: result.H_total, L_t_min: result.L_t_min,
                                                                  status: result.status as PackSpecState['status'], admitted: newAdmitted };
                                });
                    }
          } catch { /* silent */ }
  }, [skillId]);

  useEffect(() => {
          window.addEventListener('message', handleMessage);
          return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const colorMap: Record<string, string> = {
          emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          blue:    'bg-blue-50 border-blue-200 text-blue-700',
          purple:  'bg-purple-50 border-purple-200 text-purple-700',
          amber:   'bg-amber-50 border-amber-200 text-amber-700',
          rose:    'bg-rose-50 border-rose-200 text-rose-700',
  };

  const statusColor = packSpec?.status === 'certified'  ? 'text-emerald-600'
                          : packSpec?.status === 'decaying'   ? 'text-red-500'
                          : 'text-blue-500';

  const statusIcon  = packSpec?.status === 'certified'  ? <CheckCircle2 className="w-3 h-3" />
                          : packSpec?.status === 'decaying'   ? <AlertTriangle className="w-3 h-3" />
                          : <Activity className="w-3 h-3" />;

  return (
          <AppShell trail={[{ label: 'Reader' }]}>
                    <div className="light-surface -mx-4 -mt-6 min-h-[calc(100vh-3.5rem)]"
                                   style={{ background: 'var(--bg-base, #f8fafc)' }}>

                        {/* ── Context banner ─────────────────────────────────────────── */}
                        {meta && (
                                                 <div className={`mx-4 mt-4 px-4 py-3 rounded-xl border text-sm flex items-start gap-3 ${colorMap[meta.color]}`}>
                                                                 <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                                                 <div>
                                                                               <span className="font-semibold">{meta.move} · {meta.label}</span>
                                                                               <span className="ml-2 opacity-80">{meta.description}</span>
                                                                               <span className="ml-2 opacity-60 text-xs">Practice this location in the reader below.</span>
                                                                 </div>
                                                 </div>
                            )}
                    
                        {/* ── PackSpec convergence HUD ─────────────────────────────── */}
                        {skillId && (
                                                 <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-white border border-slate-200 flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                                                             <span className="font-medium text-slate-700">PackSpec</span>
                                                     {packSpec ? (
                                                                   <>
                                                                                   <span className={`flex items-center gap-1 font-medium ${statusColor}`}>
                                                                                       {statusIcon}
                                                                                       {packSpec.status}
                                                                                       </span>
                                                                                   <span>iter <strong>{packSpec.iteration}</strong></span>
                                                                                   <span>H_total <strong>{packSpec.H_total.toFixed(1)}</strong> bits</span>
                                                                                   <span>L_t <strong>{packSpec.L_t_min.toFixed(2)}</strong></span>
                                                                       {packSpec.admitted.length > 0 && (
                                                                                         <span className="text-emerald-600">✓ {packSpec.admitted.join(', ')}</span>
                                                                                   )}
                                                                       {lastEvent && (
                                                                                         <span className="text-slate-400 italic">last: {lastEvent}</span>
                                                                                   )}
                                                                   </>
                                                                 ) : (
                                                                   <span className="text-slate-400 italic">
                                                                       {skillId ? 'Loading…' : 'Open from a skill card to track convergence'}
                                                                   </span>
                                                             )}
                                                 </div>
                            )}
                    
                        {/* ── Open-in-new-tab escape hatch ─────────────────────────── */}
                            <div className="mx-4 mt-3 mb-2 flex items-center justify-between">
                                      <p className="text-xs text-slate-400">Regime Reader — progressive document understanding</p>
                                      <a href={iframeSrc} target="_blank" rel="noopener noreferrer"
                                                       className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 transition-colors">
                                                  Open full screen <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                      </a>
                            </div>
                    
                        {/* ── regimeReader iframe ───────────────────────────────────── */}
                            <iframe
                                          src={iframeSrc}
                                          title="Regime Reader"
                                          className="w-full rounded-xl border border-slate-200 shadow-sm"
                                          style={{ height: 'calc(100vh - 14rem)', minHeight: '520px' }}
                                          allow="clipboard-read; clipboard-write"
                                        />
                    </div>
          </AppShell>
        );
}
