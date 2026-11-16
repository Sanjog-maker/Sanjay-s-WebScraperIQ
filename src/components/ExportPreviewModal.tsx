import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileCode,
  Table,
  Database,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';

export type ExportFormat = 'csv' | 'excel' | 'json' | 'sql';

export interface ColumnDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
}

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  format: ExportFormat;
  data: any[];
  datasetName?: string;
  onConfirmExport: (format: ExportFormat, selectedColumns: string[], rowLimit?: number) => void;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  format,
  data,
  datasetName = 'Products Dataset',
  onConfirmExport,
}) => {
  if (!isOpen) return null;

  // Determine all available keys from data
  const availableColumns = useMemo<ColumnDefinition[]>(() => {
    if (!data || data.length === 0) return [];
    
    // Scan up to first 20 records to find all keys
    const keysMap = new Map<string, 'string' | 'number' | 'boolean'>();
    const sampleSize = Math.min(data.length, 20);
    
    for (let i = 0; i < sampleSize; i++) {
      const row = data[i];
      if (!row || typeof row !== 'object') continue;
      for (const [key, val] of Object.entries(row)) {
        if (key === 'priceHistory' || key === 'history') continue; // Skip complex nested arrays for tabular exports
        if (!keysMap.has(key)) {
          let type: 'string' | 'number' | 'boolean' = 'string';
          if (typeof val === 'number') type = 'number';
          else if (typeof val === 'boolean') type = 'boolean';
          keysMap.set(key, type);
        }
      }
    }

    // Default preferred ordering if matching product columns
    const preferredOrder = [
      'id',
      'title',
      'price',
      'originalPrice',
      'currency',
      'discountPercent',
      'inStock',
      'rating',
      'reviewsCount',
      'category',
      'brand',
      'sku',
      'url',
      'scrapedAt',
    ];

    const sortedKeys = Array.from(keysMap.keys()).sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => ({
      key,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      type: keysMap.get(key) || 'string',
    }));
  }, [data]);

  // Selected columns state (defaults to all columns selected)
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<Set<string>>(() => {
    return new Set(availableColumns.map((col) => col.key));
  });

  const [rowLimit, setRowLimit] = useState<number>(data.length);
  const [activePreviewTab, setActivePreviewTab] = useState<'table' | 'raw'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Column toggle helpers
  const toggleColumn = (key: string) => {
    setSelectedColumnKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev; // Keep at least one column
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllColumns = () => {
    setSelectedColumnKeys(new Set(availableColumns.map((col) => col.key)));
  };

  const selectEssentialColumns = () => {
    const essentials = ['title', 'price', 'originalPrice', 'currency', 'inStock', 'category', 'url'];
    const validEssentials = availableColumns
      .map((c) => c.key)
      .filter((k) => essentials.includes(k) || essentials.includes(k.toLowerCase()));
    setSelectedColumnKeys(new Set(validEssentials.length > 0 ? validEssentials : availableColumns.slice(0, 5).map(c => c.key)));
  };

  // Filter columns list by search
  const filteredColumns = availableColumns.filter(
    (col) =>
      col.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Active columns in order
  const activeColumns = availableColumns.filter((col) => selectedColumnKeys.has(col.key));

  // Preview rows (sample first 5 rows)
  const previewRows = useMemo(() => {
    return data.slice(0, 5);
  }, [data]);

  // Formatter for raw sample text
  const rawPreviewSnippet = useMemo(() => {
    const sample = data.slice(0, 3).map((item) => {
      const obj: Record<string, any> = {};
      activeColumns.forEach((col) => {
        obj[col.key] = item[col.key];
      });
      return obj;
    });

    if (format === 'json') {
      return JSON.stringify(sample, null, 2);
    } else if (format === 'csv') {
      const headers = activeColumns.map((c) => `"${c.key}"`).join(',');
      const rows = sample.map((row) =>
        activeColumns.map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
      );
      return [headers, ...rows].join('\n');
    } else if (format === 'excel') {
      const headers = activeColumns.map((c) => c.key).join('\t');
      const rows = sample.map((row) =>
        activeColumns.map((c) => String(row[c.key] ?? '')).join('\t')
      );
      return [headers, ...rows].join('\n');
    } else if (format === 'sql') {
      const colNames = activeColumns.map((c) => c.key).join(', ');
      return sample
        .map(
          (row) =>
            `INSERT INTO export_data (${colNames}) VALUES (${activeColumns
              .map((c) => {
                const val = row[c.key];
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'number') return val;
                if (typeof val === 'boolean') return val ? 1 : 0;
                return `'${String(val).replace(/'/g, "''")}'`;
              })
              .join(', ')});`
        )
        .join('\n');
    }
    return '';
  }, [data, activeColumns, format]);

  const formatConfig: Record<
    ExportFormat,
    { title: string; badge: string; icon: React.ReactNode; color: string; ext: string }
  > = {
    csv: {
      title: 'Comma-Separated Values',
      badge: 'CSV (RFC-4180)',
      icon: <FileSpreadsheet className="h-5 w-5 text-emerald-400" />,
      color: 'text-emerald-400',
      ext: '.csv',
    },
    excel: {
      title: 'Excel Tab-Separated Spreadsheet',
      badge: 'Excel / TSV',
      icon: <Table className="h-5 w-5 text-cyan-400" />,
      color: 'text-cyan-400',
      ext: '.tsv',
    },
    json: {
      title: 'Structured JSON Records',
      badge: 'JSON (UTF-8)',
      icon: <FileCode className="h-5 w-5 text-amber-400" />,
      color: 'text-amber-400',
      ext: '.json',
    },
    sql: {
      title: 'MySQL / SQLite Relational Dump',
      badge: 'SQL Dump',
      icon: <Database className="h-5 w-5 text-indigo-400" />,
      color: 'text-indigo-400',
      ext: '.sql',
    },
  };

  const currentCfg = formatConfig[format];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
              {currentCfg.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Pre-Export Data Preview</h3>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900 ${currentCfg.color}`}>
                  {currentCfg.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize column schema and preview live rows before compiling the <span className="font-mono text-slate-300">{currentCfg.ext}</span> export.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Top Control Bar: Quick Summary & Column Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-400">
                Source: <strong className="text-slate-200">{datasetName}</strong>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                Total Rows: <strong className="text-cyan-400 font-mono">{data.length}</strong>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                Selected Columns:{' '}
                <strong className="text-emerald-400 font-mono">
                  {selectedColumnKeys.size} of {availableColumns.length}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllColumns}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={selectEssentialColumns}
                className="text-xs text-slate-300 hover:text-white font-medium px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                Essentials Only
              </button>
            </div>
          </div>

          {/* Column Picker Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                <span>Select Columns to Include in File</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Click column chips to toggle inclusion
              </span>
            </div>

            {/* Column Selector Badges */}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-800/80 bg-slate-950/70">
              {availableColumns.map((col) => {
                const isSelected = selectedColumnKeys.has(col.key);
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleColumn(col.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      isSelected
                        ? 'border border-cyan-500/50 bg-cyan-500/15 text-cyan-300 font-semibold shadow-sm'
                        : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    )}
                    <span>{col.key}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{col.type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Sample Preview Panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-semibold text-slate-200">
                  Sample Data Preview (First 5 Rows)
                </h4>
              </div>

              {/* View switch: Formatted Table vs Raw Output */}
              <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('table')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activePreviewTab === 'table'
                      ? 'bg-slate-800 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Table Grid
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('raw')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activePreviewTab === 'raw'
                      ? 'bg-slate-800 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw {format.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Tab 1: Formatted Table Grid */}
            {activePreviewTab === 'table' && (
              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950">
                {activeColumns.length === 0 ? (
                  <div className="py-12 text-center text-xs text-rose-400 font-mono">
                    Please select at least 1 column to include in the export.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-300">
                      <tr>
                        <th className="px-3.5 py-2.5 w-12 text-slate-500 text-center">#</th>
                        {activeColumns.map((col) => (
                          <th key={col.key} className="px-3.5 py-2.5 whitespace-nowrap text-cyan-400">
                            {col.key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                          <td className="px-3.5 py-2.5 text-slate-600 text-center">{idx + 1}</td>
                          {activeColumns.map((col) => {
                            const val = row[col.key];
                            return (
                              <td
                                key={col.key}
                                className="px-3.5 py-2.5 text-slate-200 truncate max-w-xs tabular-nums"
                              >
                                {val === null || val === undefined
                                  ? '—'
                                  : typeof val === 'boolean'
                                  ? val
                                    ? 'true'
                                    : 'false'
                                  : typeof val === 'number'
                                  ? col.key.toLowerCase().includes('price')
                                    ? `$${val.toFixed(2)}`
                                    : val
                                  : String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tab 2: Raw Format Snippet */}
            {activePreviewTab === 'raw' && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-56">
                <pre className="whitespace-pre">
                  <code>{rawPreviewSnippet}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Export Scope & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Row Export Scope</label>
              <select
                value={rowLimit}
                onChange={(e) => setRowLimit(Number(e.target.value))}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              >
                <option value={data.length}>All Collected Records ({data.length} rows)</option>
                <option value={Math.min(data.length, 50)}>Top 50 Records</option>
                <option value={Math.min(data.length, 100)}>Top 100 Records</option>
                <option value={Math.min(data.length, 25)}>Top 25 Records (Quick sample)</option>
              </select>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5 space-y-1">
              <span className="text-xs font-semibold text-slate-300">Format Details</span>
              <p className="text-[11px] text-slate-400">
                Target: <code className="font-mono text-cyan-400">{currentCfg.ext}</code> · Encoding: UTF-8 with automatic header row mapping.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              Exporting <strong className="text-white font-mono">{Math.min(rowLimit, data.length)}</strong> rows with <strong className="text-white font-mono">{selectedColumnKeys.size}</strong> selected columns.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedColumnKeys.size === 0}
              onClick={() => {
                onConfirmExport(format, Array.from(selectedColumnKeys), rowLimit);
                onClose();
              }}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/10"
            >
              <Download className="h-4 w-4" />
              <span>Generate & Download {currentCfg.ext.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
