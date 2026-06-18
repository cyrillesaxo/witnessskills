import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Brain, Loader2, AlertCircle, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

// ─── WBC Compression (adapted from cyrillesaxo/wbc-codec) ──────────────────
// Elides stopwords and compresses repetitive tokens before sending to LLM
// to reduce token count ~30-50% per C-EAT algorithm
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','through','during','is','are','was','were',
  'be','been','being','have','has','had','do','does','did','will','would',
  'could','should','may','might','shall','this','that','these','those','it',
  'its','we','our','you','your','i','me','my','they','them','their','which',
  'who','what','how','when','where','as','if','so','than','then','there',
]);

function wbcCompress(text: string): string {
  // 1. Tokenise on whitespace
  const tokens = text.trim().split(/\s+/);
  // 2. Elide stopwords (replace with empty string, collapse later)
  const elided = tokens.map(t => {
    const w = t.toLowerCase().replace(/[^a-z]/g, '');
    return STOPWORDS.has(w) ? '' : t;
  }).filter(Boolean);
  // 3. Deduplicate consecutive identical tokens
  const deduped: string[] = [];
  for (let i = 0; i < elided.length; i++) {
    if (elided[i] !== elided[i - 1]) deduped.push(elided[i]);
  }
  // 4. Truncate to 120 tokens max (LLM prompt budget)
  return deduped.slice(0, 120).join(' ');
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface GraphNode {
  id: string;
  label: string;
  gist?: string;
  col: number;
  row?: number;
  tier?: string;
  requires?: string[];
}

interface GraphEdge { from: string; to: string; }

interface OntologyGraphModalProps {
  skillName: string;
  skillLevel?: string;
  onClose: () => void;
}

// ─── SVG Graph renderer ─────────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  Junior: '#10b981',
  Mid: '#f59e0b',
  Senior: '#ef4444',
};
const COL_X = (col: number, w: number) => 40 + col * (w / 6);
const ROW_Y = (row: number) => 60 + row * 90;

function OntologyGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const W = 700, H = 480;

  // Build position map
  const rowCounts: Record<number, number> = {};
  const pos: Record<string, { x: number; y: number }> = {};
  nodes.forEach(n => {
    const col = Math.min(n.col ?? 0, 5);
    const row = rowCounts[col] ?? 0;
    rowCounts[col] = row + 1;
    pos[n.id] = { x: COL_X(col, W), y: ROW_Y(row) };
  });

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/80">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
          className="p-1 rounded bg-slate-700/80 hover:bg-slate-600 text-slate-300"
          aria-label="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))}
          className="p-1 rounded bg-slate-700/80 hover:bg-slate-600 text-slate-300"
          aria-label="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setZoom(1)}
          className="p-1 rounded bg-slate-700/80 hover:bg-slate-600 text-slate-300"
          aria-label="Reset zoom">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={'0 0 ' + W + ' ' + H}
        className="w-full"
        style={{ height: 480, transform: 'scale(' + zoom + ')', transformOrigin: 'top left', transition: 'transform 0.2s' }}
        aria-label="RCT Ontology Graph"
        role="img"
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#475569" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const s = pos[e.from], t = pos[e.to];
          if (!s || !t) return null;
          return (
            <line key={'e' + i}
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke="#334155" strokeWidth={1.5}
              markerEnd="url(#arrow)"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const p = pos[n.id];
          if (!p) return null;
          const color = TIER_COLORS[n.tier ?? 'Junior'] ?? '#10b981';
          const isHov = hovered === n.id;
          return (
            <g key={n.id} transform={'translate(' + p.x + ',' + p.y + ')'}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              <circle r={isHov ? 22 : 18}
                fill={isHov ? color : color + '33'}
                stroke={color}
                strokeWidth={isHov ? 2.5 : 1.5}
                style={{ transition: 'all 0.15s' }}
              />
              <text textAnchor="middle" dominantBaseline="middle"
                fontSize={isHov ? 8 : 7}
                fill={isHov ? '#fff' : '#94a3b8'}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {(n.label || n.id).slice(0, 12)}
              </text>
              {isHov && n.gist && (
                <foreignObject x={24} y={-28} width={160} height={60}
                  style={{ pointerEvents: 'none' }}>
                  <div className="bg-slate-800 border border-slate-600 rounded p-1.5 text-xs text-slate-200 shadow-lg"
                    style={{ fontSize: 9 }}>
                    <strong>{n.label}</strong>
                    <br />{n.gist?.slice(0, 80)}
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-3 px-3 pb-2 text-xs text-slate-500">
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <span key={tier} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            {tier}
          </span>
        ))}
        <span className="ml-auto">{nodes.length} nodes</span>
      </div>
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────
export default function OntologyGraphModal({ skillName, skillLevel, onClose }: OntologyGraphModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [domainName, setDomainName] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keyboard trap
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Focus modal on open
  useEffect(() => { dialogRef.current?.focus(); }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // WBC-compress the prompt before sending (reduces tokens ~30-50%)
      const raw = skillName + (skillLevel ? ' ' + skillLevel + ' level practitioner' : '');
      const compressed = wbcCompress(
        'Build RCT ontology skill domain: ' + raw +
        ' Include anchors witnesses anti-witnesses convergence traps Junior Mid Senior tiers'
      );

      const res = await fetch('/.netlify/functions/rct-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: skillName, context: compressed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'HTTP ' + res.status);
      }

      const data = await res.json();
      const raw_nodes: GraphNode[] = (data.nodes ?? []).map((n: GraphNode, i: number) => ({
        ...n,
        id: n.id ?? 'node-' + i,
        label: n.label ?? n.id ?? 'Node ' + i,
        col: Math.min(n.col ?? i % 6, 5),
      }));

      // Build edges from requires[] fields
      const edgeSet: GraphEdge[] = [];
      raw_nodes.forEach(n => {
        (n.requires ?? []).forEach(req => {
          if (raw_nodes.find(r => r.id === req)) {
            edgeSet.push({ from: req, to: n.id });
          }
        });
      });

      setNodes(raw_nodes);
      setEdges(edgeSet);
      setDomainName(data.name ?? skillName);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [skillName, skillLevel]);

  useEffect(() => { generate(); }, [generate]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={'RCT Ontology Graph: ' + skillName}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden outline-none"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/50 bg-slate-800/60">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                RCT Ontology Graph
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {domainName || skillName}
                {skillLevel && <span className="ml-1 text-slate-500">· {skillLevel}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-lg hover:bg-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Regenerate ontology graph"
            >
              <RefreshCw className={'w-3 h-3' + (loading ? ' animate-spin' : '')} />
              Regenerate
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              aria-label="Close ontology graph modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4" role="status" aria-live="polite">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-sm text-slate-400">
                Generating RCT ontology for <strong className="text-slate-200">{skillName}</strong>…
              </p>
              <p className="text-xs text-slate-600">WBC-compressed prompt · Anthropic claude-3-haiku</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-4 py-12" role="alert">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-red-300 mb-1">Generation failed</p>
                <p className="text-xs text-slate-500 max-w-sm">{error}</p>
                {error.includes('not configured') && (
                  <p className="text-xs text-amber-400 mt-2">
                    Add ANTHROPIC_API_KEY to Netlify environment variables to enable AI generation.
                  </p>
                )}
              </div>
              <button
                onClick={generate}
                className="px-4 py-2 text-sm font-medium text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-lg hover:bg-violet-500/20 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && nodes.length > 0 && (
            <>
              <OntologyGraph nodes={nodes} edges={edges} />
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {nodes.slice(0, 12).map(n => (
                  <div key={n.id}
                    className="px-2.5 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-xs">
                    <div className="font-medium text-slate-200 truncate">{n.label}</div>
                    {n.gist && <div className="text-slate-500 mt-0.5 line-clamp-2">{n.gist}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && nodes.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Brain className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No ontology nodes returned. Try regenerating.</p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-4 text-xs text-slate-600 flex items-center justify-between">
          <span>Click a node to see its gist · Hover to explore</span>
          <span className="text-slate-700">Press Esc to close</span>
        </div>
      </div>
    </div>
  );
}
