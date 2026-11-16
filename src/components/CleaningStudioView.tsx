import React, { useState } from 'react';
import { CleaningRuleConfig, DataCleaningReport } from '../types/scraper';
import {
  Sparkles,
  Filter,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface CleaningStudioViewProps {
  rawItems: any[];
  cleanedItems: any[];
  cleaningReport: DataCleaningReport | null;
  onExecuteCleaning: (rules: CleaningRuleConfig) => Promise<void>;
  onSaveToDatabase: () => void;
  isLoading: boolean;
}

export const CleaningStudioView: React.FC<CleaningStudioViewProps> = ({
  rawItems,
  cleanedItems,
  cleaningReport,
  onExecuteCleaning,
  onSaveToDatabase,
  isLoading,
}) => {
  const [rules, setRules] = useState<CleaningRuleConfig>({
    dropDuplicates: true,
    dedupeKey: 'url',
    handleMissing: 'impute_median',
    defaultStockStatus: true,
    stripHtmlTags: true,
    normalizeCurrency: true,
    normalizeDates: true,
    minPriceThreshold: 1,
    maxPriceThreshold: 10000,
  });

  const handleRunPipeline = () => {
    onExecuteCleaning(rules);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Data Cleaning & Normalization Pipeline
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Pandas-style deduplication, missing value imputation, regex currency parsing, and data standardization.
        </p>
      </div>

      {/* Rules Config Panel & Audit Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Transformation Rules Config (2 cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-cyan-400" />
              <span>Pandas & Regex Transformation Rules</span>
            </h2>
            <span className="text-xs text-slate-400">
              {rawItems.length} raw records queued
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Rule 1: Deduplication */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Deduplicate Records
                </label>
                <input
                  type="checkbox"
                  checked={rules.dropDuplicates}
                  onChange={(e) => setRules({ ...rules, dropDuplicates: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Drop repeated scrapes with identical primary keys using Pandas <code className="font-mono text-cyan-400">drop_duplicates()</code>.
              </p>
              <div className="pt-1">
                <select
                  value={rules.dedupeKey}
                  onChange={(e) => setRules({ ...rules, dedupeKey: e.target.value as any })}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                >
                  <option value="url">Subset: URL (Exact URL matching)</option>
                  <option value="title">Subset: Title (Exact Title matching)</option>
                  <option value="composite">Composite: Title + Price</option>
                </select>
              </div>
            </div>

            {/* Rule 2: Missing Values */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Missing Value Strategy
                </label>
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                How to handle missing fields like price or stock in unstandardized HTML cards.
              </p>
              <div className="pt-1">
                <select
                  value={rules.handleMissing}
                  onChange={(e) => setRules({ ...rules, handleMissing: e.target.value as any })}
                  className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                >
                  <option value="impute_median">Impute Median Price (Robust to outliers)</option>
                  <option value="impute_mean">Impute Mean Price (Dataset average)</option>
                  <option value="impute_default">Impute Default Values ($49.99 / In-Stock)</option>
                  <option value="drop">Drop Rows with Missing Essentials (dropna)</option>
                </select>
              </div>
            </div>

            {/* Rule 3: Regex Currency Extraction */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Regex Price Extraction
                </label>
                <input
                  type="checkbox"
                  checked={rules.normalizeCurrency}
                  onChange={(e) => setRules({ ...rules, normalizeCurrency: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Parses messy currencies like <span className="font-mono text-amber-400">"£ 129.99 (tax inc)"</span> or <span className="font-mono text-amber-400">"USD $ 79.00"</span> into clean float decimals.
              </p>
            </div>

            {/* Rule 4: Strip HTML Noise & Entities */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Strip Tags & Unescape Entities
                </label>
                <input
                  type="checkbox"
                  checked={rules.stripHtmlTags}
                  onChange={(e) => setRules({ ...rules, stripHtmlTags: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Removes residual <code className="font-mono">&lt;span&gt;</code> tags and converts <code className="font-mono">&amp;amp;</code> to <code className="font-mono">&amp;</code>.
              </p>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleRunPipeline}
            disabled={isLoading || rawItems.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Executing Cleaning & Normalization Pipeline...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 fill-slate-950" />
                <span>Run Pandas & Regex Cleaning Pipeline</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Data Quality Audit Report (1 col) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Data Quality Audit Report</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {cleaningReport ? `${cleaningReport.executionTimeMs}ms` : 'Awaiting Run'}
              </span>
            </div>

            {cleaningReport ? (
              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400">Raw Input Rows:</span>
                  <span className="font-bold text-white tabular-nums">{cleaningReport.rawCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400">Clean Normalized Output:</span>
                  <span className="font-bold text-emerald-400 tabular-nums">{cleaningReport.cleanCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400">Duplicates Removed:</span>
                  <span className="font-bold text-amber-400 tabular-nums">{cleaningReport.duplicatesRemoved}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400">Missing Prices Imputed:</span>
                  <span className="font-bold text-cyan-400 tabular-nums">{cleaningReport.missingValuesFilled.price || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400">Currencies Normalized:</span>
                  <span className="font-bold text-indigo-400 tabular-nums">{cleaningReport.normalizedCurrencies}</span>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center text-xs text-slate-500 py-6">
                Click 'Run Pandas & Regex Cleaning Pipeline' to generate a full transformation audit report.
              </div>
            )}
          </div>

          {cleanedItems.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Database className="h-4 w-4" />
                <span>{cleanedItems.length} Clean Records Ready for Storage</span>
              </div>
              <button
                onClick={onSaveToDatabase}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                <span>Commit to MySQL & SQLite Tables</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cleaned Dataset Preview */}
      {cleanedItems.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                Cleaned & Normalized Output
              </h3>
              <p className="text-xs text-slate-400">
                All values cast to native numeric floats, clean booleans, and stripped strings.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              {cleanedItems.length} Records Verified
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 font-medium">
                <tr>
                  <th className="px-4 py-3">Clean Title</th>
                  <th className="px-4 py-3 text-right">Price (Float)</th>
                  <th className="px-4 py-3 text-center">In Stock</th>
                  <th className="px-4 py-3 text-center">Rating</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Source URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {cleanedItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200 max-w-sm truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                      ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      {item.inStock ? (
                        <span className="text-emerald-400">True (1)</span>
                      ) : (
                        <span className="text-rose-400">False (0)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-amber-400 tabular-nums">
                      {item.rating ? item.rating.toFixed(1) : '4.5'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {item.currency || 'USD'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono truncate max-w-xs">
                      {item.url}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
