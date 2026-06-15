import type { OntologyNode, NodeState } from '../../lib/rct/types';
import { TIER_COLOR } from '../../lib/rct/types';

interface GraphProps {
  nodes: OntologyNode[];
  view: Record<string, NodeState>;
  active: string | null;
  compressed: boolean;
  regions: { ids: string[]; meanCret: number }[];
  onOpen: (id: string) => void;
  fullySat: (id: string) => boolean;
  onDecompress: (id: string) => void;
  onRecompress: (id: string) => void;
  dueQueue: { id: string }[];
}

const CW = 178, CH = 118, padX = 92, padY = 56;

export default function Graph({ nodes, view, active, compressed, regions, onOpen, fullySat, onDecompress, onRecompress, dueQueue }: GraphProps) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const maxCol = Math.max(0, ...nodes.map(n => n.col));
  const maxRow = Math.max(0, ...nodes.map(n => n.row));
  const W = padX * 2 + (maxCol + 1) * CW;
  const H = padY * 2 + (maxRow + 1) * CH;
  const dueSet = new Set(dueQueue.map(d => d.id));
  const pos = (id: string) => { const n = byId[id]; return { x: padX + n.col * CW, y: padY + n.row * CH }; };

  const compressedSets = compressed ? regions.filter(r => r.ids.length > 1 && r.meanCret >= 0.6) : [];
  const hidden = new Set<string>();
  const reps: { rep: string; members: string[]; meanCret: number }[] = [];
  compressedSets.forEach(r => {
    r.ids.forEach(id => hidden.add(id));
    reps.push({ rep: [...r.ids].sort((a, b) => byId[a].col - byId[b].col)[0], members: r.ids, meanCret: r.meanCret });
  });

  const edges: [string, string][] = [];
  nodes.forEach(n => n.requires.forEach(r => edges.push([r, n.id])));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Skill ontology graph">
      <defs>
        <marker id="ar" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#3a4358" />
        </marker>
      </defs>
      {edges.map(([a, b], i) => {
        if (hidden.has(a) && hidden.has(b)) return null;
        const pa = pos(a), pb = pos(b);
        const sat = fullySat(a) && fullySat(b);
        return (
          <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
            stroke={sat ? '#2f6f63' : '#2a3142'} strokeWidth={sat ? 2 : 1.3}
            markerEnd="url(#ar)" opacity={hidden.has(a) || hidden.has(b) ? 0.25 : 1} />
        );
      })}
      {reps.map(({ rep, members, meanCret }, i) => {
        const p = pos(rep);
        return (
          <g key={`c${i}`}>
            <rect x={p.x - 82} y={p.y - 30} width={164} height={60} rx={30} fill="#0e2b2f" stroke="#39c2d6" strokeWidth={1.4} />
            <text x={p.x} y={p.y - 5} textAnchor="middle" className="fill-cyan-200 text-xs font-bold">◆ cached regime</text>
            <text x={p.x} y={p.y + 13} textAnchor="middle" className="fill-cyan-500 text-[9.5px] font-mono">{members.length} atoms · C_ret {meanCret.toFixed(2)}</text>
          </g>
        );
      })}
      {nodes.map(n => {
        if (hidden.has(n.id)) return null;
        const p = pos(n.id), st = view[n.id];
        const lvl = Math.min(st.depth, n.levels.length - 1);
        const tier = n.levels[lvl].tier;
        const tc = TIER_COLOR[tier];
        const locked = !st.unlocked;
        const isActive = active === n.id;
        const sat = fullySat(n.id);

        return (
          <g key={n.id} className="cursor-pointer" onClick={() => onOpen(n.id)}>
            {dueSet.has(n.id) && (
              <rect x={p.x - 86} y={p.y - 40} width={172} height={80} rx={14} fill="none" stroke="#f2a43c" strokeWidth={1.6} className="animate-pulse" />
            )}
            <rect x={p.x - 82} y={p.y - 36} width={164} height={72} rx={11}
              fill={locked ? '#11141d' : '#141925'} stroke={sat ? '#39c2d6' : tc}
              strokeWidth={isActive ? 2.4 : 1.4} opacity={locked ? 0.5 : 1} />
            <text x={p.x - 72} y={p.y - 18} className="text-[9.5px] font-mono">
              <tspan fill={tc}>{n.eat.entity}</tspan>
              <tspan fill="#566179"> · </tspan>
              <tspan fill="#7d8aa3">{n.eat.action}</tspan>
              <tspan fill="#4a5468"> → </tspan>
              <tspan fill="#7d8aa3">{n.eat.target}</tspan>
            </text>
            <text x={p.x - 72} y={p.y + 1} className="fill-slate-100 text-[13px] font-semibold">{n.label}</text>
            {n.levels.map((L, i) => {
              const reached = i <= st.depth;
              const clr = i <= st.cleared;
              return (
                <circle key={i} cx={p.x - 64 + i * 13} cy={p.y + 17} r={4}
                  fill={clr ? TIER_COLOR[L.tier] : reached ? '#2a3344' : '#191e2b'}
                  stroke={reached ? '#445072' : 'none'} strokeWidth={1} />
              );
            })}
            <text x={p.x - 64 + n.levels.length * 13 + 6} y={p.y + 20} className="text-[10px] font-mono font-bold" fill={tc}>
              {locked ? '🔒' : sat ? `✓ ${tier}` : tier}
            </text>
            {!locked && (
              <>
                <g onClick={e => { e.stopPropagation(); onDecompress(n.id); }} className={st.depth < n.levels.length - 1 ? 'cursor-pointer' : 'cursor-not-allowed'}>
                  <rect x={p.x + 50} y={p.y - 32} width={24} height={20} rx={5} fill="#16233d" stroke="#3a5288" opacity={st.depth < n.levels.length - 1 ? 1 : 0.35} />
                  <text x={p.x + 62} y={p.y - 18} textAnchor="middle" className="fill-slate-200 text-sm font-mono font-bold">+</text>
                </g>
                <g onClick={e => { e.stopPropagation(); onRecompress(n.id); }} className={st.depth > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}>
                  <rect x={p.x + 50} y={p.y - 8} width={24} height={20} rx={5} fill="#16233d" stroke="#3a5288" opacity={st.depth > 0 ? 1 : 0.35} />
                  <text x={p.x + 62} y={p.y + 6} textAnchor="middle" className="fill-slate-200 text-sm font-mono font-bold">−</text>
                </g>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
