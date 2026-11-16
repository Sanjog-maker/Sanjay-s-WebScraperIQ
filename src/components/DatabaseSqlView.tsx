import React, { useState } from 'react';
import {
  Database,
  Play,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  FileCode,
  Table,
  Layers,
  Eye,
  SlidersHorizontal,
  UploadCloud,
} from 'lucide-react';
import { ExportPreviewModal, ExportFormat } from './ExportPreviewModal';
import { CsvImportModal } from './CsvImportModal';

interface DatabaseSqlViewProps {
  onRunQuery: (sql: string) => Promise<{
    rows: any[];
    columns: string[];
    rowCount: number;
    executionTimeMs: number;
  }>;
  onExportData: (
    format: 'csv' | 'excel' | 'json' | 'sql',
    selectedColumns?: string[],
    rowLimit?: number,
    customDataset?: any[]
  ) => void;
  products: any[];
  onImportSuccess?: () => void;
}

export const DatabaseSqlView: React.FC<DatabaseSqlViewProps> = ({
  onRunQuery,
  onExportData,
  products,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'tables' | 'export'>('console');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [queryInput, setQueryInput] = useState(
    'SELECT title, category, price, discount_percent, in_stock FROM products ORDER BY price ASC LIMIT 10;'
  );
  const [queryResults, setQueryResults] = useState<{
    rows: any[];
    columns: string[];
    rowCount: number;
    executionTimeMs: number;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Pre-export preview modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModalFormat, setExportModalFormat] = useState<ExportFormat>('csv');
  const [exportModalData, setExportModalData] = useState<any[]>(products);
  const [exportModalDatasetName, setExportModalDatasetName] = useState('Products Inventory');

  const openExportPreview = (format: ExportFormat, dataToExport?: any[], name?: string) => {
    setExportModalFormat(format);
    setExportModalData(dataToExport && dataToExport.length > 0 ? dataToExport : products);
    setExportModalDatasetName(name || (dataToExport ? 'SQL Query Result' : 'Products Inventory'));
    setIsExportModalOpen(true);
  };

  const handleConfirmExport = (
    format: ExportFormat,
    selectedColumns: string[],
    rowLimit?: number
  ) => {
    onExportData(format, selectedColumns, rowLimit, exportModalData);
  };

  const sampleQueries = [
    {
      label: 'Products Under $100',
      sql: 'SELECT title, price, category FROM products WHERE price < 100 ORDER BY price ASC;',
    },
    {
      label: 'Average Price by Category',
      sql: 'SELECT category, COUNT(*) as count, ROUND(AVG(price), 2) as avg_price FROM products GROUP BY category;',
    },
    {
      label: 'Out of Stock Items',
      sql: 'SELECT title, price, category, sku FROM products WHERE in_stock = 0;',
    },
    {
      label: 'Top Discounts & Deals',
      sql: 'SELECT title, price, original_price, discount_percent FROM products WHERE discount_percent > 10 ORDER BY discount_percent DESC;',
    },
    {
      label: 'Job Listings Summary',
      sql: 'SELECT company, title, location, salary_min, salary_max FROM jobs ORDER BY salary_min DESC;',
    },
  ];

  const handleExecute = async (sqlToRun?: string) => {
    const targetSql = sqlToRun || queryInput;
    setIsExecuting(true);
    setQueryError(null);
    try {
      const res = await onRunQuery(targetSql);
      setQueryResults(res);
    } catch (err: any) {
      setQueryError(err.message || 'SQL execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(queryInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Relational SQL Console & Database Explorer
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Native SQLite engine with full MySQL schema compatibility, query runner, and multi-format exports.
          </p>
        </div>

        {/* Tab switch and Import Button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-all shadow-sm"
          >
            <UploadCloud className="h-3.5 w-3.5 text-cyan-400" />
            <span>Import External Data (CSV)</span>
          </button>

          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'console'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SQL Editor
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'tables'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Schema Tables
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'export'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Export Hub
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: SQL Console */}
      {activeTab === 'console' && (
        <div className="space-y-6">
          {/* Query Snippets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Quick SQL Snippets:</span>
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQueryInput(q.sql);
                  handleExecute(q.sql);
                }}
                className="rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-white transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* SQL Editor Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white">Interactive SQL Runner</span>
                <span className="text-[11px] font-mono text-slate-500">webscrapeiq.db (SQLite / MySQL)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-xs text-cyan-200 font-mono focus:border-cyan-500 focus:outline-none"
              placeholder="SELECT * FROM products WHERE ..."
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Tables: <code className="text-slate-400">products</code>, <code className="text-slate-400">price_history</code>, <code className="text-slate-400">jobs</code>, <code className="text-slate-400">alerts</code>
              </span>
              <button
                onClick={() => handleExecute()}
                disabled={isExecuting}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-slate-950" />
                <span>{isExecuting ? 'Executing Query...' : 'Run SQL Query'}</span>
              </button>
            </div>
          </div>

          {/* Query Error */}
          {queryError && (
            <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-4 text-xs text-rose-300 font-mono">
              Error executing query: {queryError}
            </div>
          )}

          {/* Query Results Data Grid */}
          {queryResults && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-white">Query Results</span>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {queryResults.rowCount} rows returned
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    ({queryResults.executionTimeMs}ms)
                  </span>
                </div>

                {queryResults.rows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openExportPreview('csv', queryResults.rows, 'SQL Query Custom Output')}
                      className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Preview & Export Results</span>
                    </button>
                  </div>
                )}
              </div>

              {queryResults.rows.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No records returned for this query filter.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-800/80">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                      <tr>
                        {queryResults.columns.map((col) => (
                          <th key={col} className="px-4 py-2.5">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                      {queryResults.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                          {queryResults.columns.map((col) => {
                            const val = row[col];
                            return (
                              <td key={col} className="px-4 py-2.5 text-slate-200 truncate max-w-xs tabular-nums">
                                {typeof val === 'number'
                                  ? val % 1 !== 0
                                    ? val.toFixed(2)
                                    : val
                                  : String(val ?? 'NULL')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Schema Explorer */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Table: products */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-xs font-bold text-cyan-400">TABLE products</span>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
              >
                <UploadCloud className="h-3 w-3" />
                <span>+ Import CSV into products</span>
              </button>
            </div>
            <div className="space-y-1 font-mono text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-white font-semibold">id</span>
                <span className="text-slate-500">VARCHAR(64) PRIMARY KEY</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>title</span>
                <span className="text-slate-500">VARCHAR(255) NOT NULL</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>price</span>
                <span className="text-slate-500">DECIMAL(10,2) NOT NULL</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>original_price</span>
                <span className="text-slate-500">DECIMAL(10,2)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>discount_percent</span>
                <span className="text-slate-500">DECIMAL(5,2)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>in_stock</span>
                <span className="text-slate-500">TINYINT(1) DEFAULT 1</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>rating</span>
                <span className="text-slate-500">DECIMAL(2,1)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>category</span>
                <span className="text-slate-500">VARCHAR(100)</span>
              </div>
            </div>
          </div>

          {/* Table: price_history */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-xs font-bold text-cyan-400">TABLE price_history</span>
              <span className="text-[11px] text-slate-500 font-mono">4 Columns</span>
            </div>
            <div className="space-y-1 font-mono text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-white font-semibold">id</span>
                <span className="text-slate-500">INT AUTO_INCREMENT PK</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>product_id</span>
                <span className="text-slate-500">VARCHAR(64) FK</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>price</span>
                <span className="text-slate-500">DECIMAL(10,2) NOT NULL</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>recorded_at</span>
                <span className="text-slate-500">DATE NOT NULL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Export Hub */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Pre-Export Data Inspection & Column Filtering</h3>
                <p className="text-[11px] text-slate-400">
                  Click <span className="text-cyan-300">"Preview & Select Columns"</span> on any format below to preview real sample rows, toggle columns, or configure custom row counts.
                </p>
              </div>
            </div>
            <button
              onClick={() => openExportPreview('csv', products, 'Current Products Inventory')}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 px-3.5 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/25 transition-colors shrink-0"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Open Global Preview</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CSV Export */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">CSV Export</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Standard RFC-4180 CSV file with header rows, clean numbers, and unescaped commas.
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => openExportPreview('csv', products, 'Product Catalog (CSV)')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview & Select Columns</span>
                </button>
                <button
                  onClick={() => openExportPreview('csv', products, 'Product Catalog (CSV)')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .csv</span>
                </button>
              </div>
            </div>

            {/* Excel Export */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="h-9 w-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Table className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">Excel Spreadsheet</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Tab-separated values (.tsv / Excel compliant) formatted for spreadsheet tools.
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => openExportPreview('excel', products, 'Product Catalog (Excel/TSV)')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview & Select Columns</span>
                </button>
                <button
                  onClick={() => openExportPreview('excel', products, 'Product Catalog (Excel/TSV)')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Excel/TSV</span>
                </button>
              </div>
            </div>

            {/* JSON Export */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <FileCode className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">JSON Records</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Structured array of JSON objects with nested fields and schema metadata.
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => openExportPreview('json', products, 'Product Catalog (JSON)')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview & Select Columns</span>
                </button>
                <button
                  onClick={() => openExportPreview('json', products, 'Product Catalog (JSON)')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>

            {/* SQL Dump Export */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">MySQL / SQLite Dump</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Ready-to-import SQL script containing CREATE TABLE and INSERT INTO statements.
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => openExportPreview('sql', products, 'Product Catalog (SQL Dump)')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview & Select Columns</span>
                </button>
                <button
                  onClick={() => openExportPreview('sql', products, 'Product Catalog (SQL Dump)')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .sql</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Export Preview Modal */}
      <ExportPreviewModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        format={exportModalFormat}
        data={exportModalData}
        datasetName={exportModalDatasetName}
        onConfirmExport={handleConfirmExport}
      />

      {/* CSV Dataset Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          setIsImportModalOpen(false);
          if (onImportSuccess) {
            onImportSuccess();
          }
          // Refresh default query
          handleExecute('SELECT title, category, price, discount_percent, in_stock FROM products ORDER BY id DESC LIMIT 15;');
        }}
      />
    </div>
  );
};
