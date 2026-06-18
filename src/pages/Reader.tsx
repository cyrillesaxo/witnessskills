import { useSearchParams } from 'react-router-dom';
import { BookOpen, ExternalLink } from 'lucide-react';
import AppShell from '../components/ui/AppShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Reader page — embeds regimeReader (white light surface) inside the
 * dark WitnessSkills shell. The content area forces light-mode tokens
 * so the reading environment stays bright regardless of the global theme.
 *
 * URL params:
 *   ?skill=frame|breadth|depth|channel|implicature
 *     → forwarded to the reader so it can pre-focus the matching defeater location.
 */

const READER_ORIGIN = 'https://frabjous-fenglisu-1199db.netlify.app';

/** Maps witnessskills skill/location slugs → regimeReader URL params */
const SKILL_TO_LOCATION: Record<string, string> = {
    depth:       'depth',
    breadth:     'breadth',
    channel:     'channel',
    frame:       'frame',
    implicature: 'implicature',
  };

/** Human-readable labels + descriptions for the five defeater locations */
const LOCATION_META: Record<string, { label: string; move: string; description: string; color: string }> = {
    depth: {
          label: 'Depth',
          move: 'Dig',
          description: "What's the rule beneath this symptom?",
          color: 'emerald',
        },
    breadth: {
          label: 'Breadth',
          move: 'Compare',
          description: 'What better option was never put beside it?',
          color: 'blue',
        },
    channel: {
          label: 'Channel',
          move: 'Separate',
          description: 'Are these sources independent, or one echo?',
          color: 'purple',
        },
    frame: {
          label: 'Frame',
          move: 'Frame',
          description: 'Under what unstated coordinates is this true?',
          color: 'amber',
        },
    implicature: {
          label: 'Implicature',
          move: 'Parse',
          description: 'What does it suggest beyond what it asserts?',
          color: 'rose',
        },
  };

export default function Reader() {
    useDocumentTitle('Regime Reader');
    const [searchParams] = useSearchParams();
    const skillParam = searchParams.get('skill')?.toLowerCase() ?? '';
    const location = SKILL_TO_LOCATION[skillParam] ?? '';

    // Build iframe src — forward skill/location param if present
    const iframeSrc = location
      ? `${READER_ORIGIN}/?location=${location}`
      : READER_ORIGIN;

    const meta = location ? LOCATION_META[location] : null;

    const colorMap: Record<string, string> = {
          emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          blue:    'bg-blue-50 border-blue-200 text-blue-700',
          purple:  'bg-purple-50 border-purple-200 text-purple-700',
          amber:   'bg-amber-50 border-amber-200 text-amber-700',
          rose:    'bg-rose-50 border-rose-200 text-rose-700',
        };

    return (
          <AppShell trail={[{ label: 'Reader' }]}>
            {/* ── Light surface wrapper ─────────────────────────────────────── */}
            {/* Removes dark-mode class influence so all children render in    */}
            {/* light tokens, matching regimeReader's white design language.   */}
      <div className="light-surface -mx-4 -mt-6 min-h-[calc(100vh-3.5rem)]"
           style={{ background: 'var(--bg-base, #f8fafc)' }}>

                                             {/* ── Context banner (shown when arriving from a skill link) ── */}
                                             {meta && (
                                                         <div className={`mx-4 mt-4 px-4 py-3 rounded-xl border text-sm flex items-start gap-3 ${colorMap[meta.color]}`}>
                                                           <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                                           <div>
                                                             <span className="font-semibold">{meta.move} · {meta.label}</span>
                                                             <span className="ml-2 opacity-80">{meta.description}</span>
                                                             <span className="ml-2 opacity-60 text-xs">
                                                               Practice this location in the reader below.
                                                             </span>
                                                           </div>
                                                         </div>
                                                       )}

                                             {/* ── Open-in-new-tab escape hatch ─────────────────────────── */}
                                             <div className="mx-4 mt-3 mb-2 flex items-center justify-between">
                                               <p className="text-xs text-slate-400">
                                                 Regime Reader — progressive document understanding
                                               </p>
                                               <a
                                                 href={iframeSrc}
                                                 target="_blank"
                                                 rel="noopener noreferrer"
                                                 className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 transition-colors"
                                               >
                                                 Open full screen
                                                 <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                               </a>
                                             </div>

                                             {/* ── regimeReader iframe ───────────────────────────────────── */}
                                             <div className="mx-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                                                  style={{ height: 'calc(100vh - 10rem)' }}>
                                               <iframe
                                                 src={iframeSrc}
                                                 title="Regime Reader"
                                                 className="w-full h-full border-0"
                                                 allow="clipboard-read; clipboard-write"
                                               />
                                             </div>

                                           </div>
                                         </AppShell>
                                       );
             }
