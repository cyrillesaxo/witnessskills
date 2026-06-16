import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Trash2, Plus, BookOpen, Cpu } from 'lucide-react';
import type { Domain } from '../../lib/rct/types';

export interface TrainingRow {
  key: string;
  name: string;
  domain: Domain;
  custom: boolean;
}

interface Props {
  rows: TrainingRow[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onRemove: (key: string) => void;
  onNewTraining: () => void;
}

type SortField = 'name' | 'type' | 'nodes';
type SortDir = 'asc' | 'desc';

const PAGE_SIZES = [5, 10, 25, 50];

function SortIcon({ field, sort, dir }: { field: SortField; sort: SortField; dir: SortDir }) {
  if (sort !== field) return <ChevronsUpDown className="w-3 h-3 text-slate-600" />;
  return dir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-emerald-400" />
    : <ChevronDown className="w-3 h-3 text-emerald-400" />;
}

export default function TrainingTable({ rows, selectedKey, onSelect, onRemove, onNewTraining }: Props) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter(r =>
      !q || r.name.toLowerCase().includes(q) || (r.custom ? 'generated' : 'built-in').includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'type') cmp = (a.custom ? 1 : 0) - (b.custom ? 1 : 0);
      else if (sortField === 'nodes') cmp = a.domain.nodes.length - b.domain.nodes.length;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);
  const totalCount = sorted.length;
  const from = totalCount === 0 ? 0 : start + 1;
  const to = Math.min(start + pageSize, totalCount);

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handlePageSize(v: number) { setPageSize(v); setPage(1); }

  const thClick = 'px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide select-none cursor-pointer hover:text-slate-200 transition-colors';
  const thStatic = 'px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide';

  return (
    <div className="mb-6 rounded-xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-slate-700/60 bg-slate-800/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search trainings..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="text-slate-500 hover:text-slate-300 text-xs shrink-0">
              clear
            </button>
          )}
        </div>
        <button
          onClick={onNewTraining}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/60 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> New training
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/40">
            <tr>
              <th className={thClick} onClick={() => handleSort('name')}>
                <span className="inline-flex items-center gap-1">
                  Name <SortIcon field="name" sort={sortField} dir={sortDir} />
                </span>
              </th>
              <th className={thClick} onClick={() => handleSort('type')}>
                <span className="inline-flex items-center gap-1">
                  Type <SortIcon field="type" sort={sortField} dir={sortDir} />
                </span>
              </th>
              <th className={thClick} onClick={() => handleSort('nodes')}>
                <span className="inline-flex items-center gap-1">
                  Nodes <SortIcon field="nodes" sort={sortField} dir={sortDir} />
                </span>
              </th>
              <th className={thStatic}>Grounded</th>
              <th className={thStatic + ' text-right'}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500 text-xs">
                  {search ? 'No trainings match your search.' : 'No trainings yet.'}
                </td>
              </tr>
            )}
            {pageRows.map(row => {
              const active = row.key === selectedKey;
              return (
                <tr
                  key={row.key}
                  onClick={() => onSelect(row.key)}
                  className={'cursor-pointer transition-colors ' + (active
                    ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                    : 'hover:bg-slate-800/40 border-l-2 border-l-transparent'
                  )}
                >
                  <td className="px-3 py-2.5">
                    <span className={'font-medium ' + (active ? 'text-emerald-300' : 'text-slate-200')}>
                      {row.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ' + (
                      row.custom
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-slate-700/40 border-slate-600/40 text-slate-400'
                    )}>
                      {row.custom ? <Cpu className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                      {row.custom ? 'Generated' : 'Built-in'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 tabular-nums">{row.domain.nodes.length}</td>
                  <td className="px-3 py-2.5">
                    {row.domain.grounded
                      ? <span className="text-xs text-emerald-400">Yes</span>
                      : <span className="text-xs text-slate-600">&mdash;</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                    {row.custom ? (
                      <button onClick={() => onRemove(row.key)} title="Remove"
                        className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : <span className="text-slate-700 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-slate-700/60 bg-slate-800/20">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Rows per page:</span>
          <select value={pageSize} onChange={e => handlePageSize(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700/60 rounded px-1 py-0.5 text-slate-300 text-xs outline-none"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span className="text-xs text-slate-500 tabular-nums">{from}&ndash;{to} of {totalCount}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
            className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:text-slate-700 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5 -rotate-90" />
          </button>
          <span className="text-xs text-slate-500 tabular-nums min-w-[4rem] text-center">
            page {safePage} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
            className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:text-slate-700 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5 rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}
