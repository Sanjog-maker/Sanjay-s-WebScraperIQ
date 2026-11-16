import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
  RefreshCw,
  X,
  FileText,
  Sliders,
  Table,
  Check,
} from 'lucide-react';

export interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

// Target Products Schema Fields
const TARGET_SCHEMA_FIELDS: {
  key: string;
  label: string;
  type: string;
  required: boolean;
  description: string;
  defaultVal: any;
}[] = [
  { key: 'title', label: 'Product Title', type: 'string', required: true, description: 'Product title / headline', defaultVal: 'Imported Product' },
  { key: 'price', label: 'Current Price', type: 'number', required: true, description: 'Selling price ($)', defaultVal: 0 },
  { key: 'category', label: 'Category', type: 'string', required: false, description: 'Department or category', defaultVal: 'Imported' },
  { key: 'originalPrice', label: 'Original / MSRP Price', type: 'number', required: false, description: 'Struck or retail price', defaultVal: null },
  { key: 'inStock', label: 'Availability / In Stock', type: 'boolean', required: false, description: 'Stock availability (true/false/1/0)', defaultVal: true },
  { key: 'rating', label: 'Review Rating', type: 'number', required: false, description: 'Score out of 5.0', defaultVal: 4.5 },
  { key: 'reviewsCount', label: 'Review Count', type: 'number', required: false, description: 'Number of ratings', defaultVal: 0 },
  { key: 'brand', label: 'Brand / Manufacturer', type: 'string', required: false, description: 'Brand name', defaultVal: '' },
  { key: 'sku', label: 'SKU / Identifier', type: 'string', required: false, description: 'Unique inventory code', defaultVal: '' },
  { key: 'url', label: 'Product URL', type: 'string', required: false, description: 'Hyperlink to page', defaultVal: 'https://external-import.dataset/' },
  { key: 'imageUrl', label: 'Product Image URL', type: 'string', required: false, description: 'Thumbnail URL', defaultVal: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&q=80' },
  { key: 'currency', label: 'Currency', type: 'string', required: false, description: 'ISO Currency code', defaultVal: 'USD' },
];

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [fileName, setFileName] = useState('');
  const [rawCsvText, setRawCsvText] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Column Mappings: schemaField -> csvHeaderName (or '__none__')
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // RFC-4180 robust CSV parser handling quoted strings and inner commas
  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);
    return { headers, rows };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawCsvText(text);

      const { headers, rows } = parseCsv(text);
      if (headers.length === 0) {
        setError('CSV file is empty or does not have a valid header row.');
        return;
      }

      setCsvHeaders(headers);
      setParsedRows(rows);

      // Automated auto-mapping heuristic based on header names
      const initialMap: Record<string, string> = {};
      for (const field of TARGET_SCHEMA_FIELDS) {
        const match = headers.find((h) => {
          const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanF = field.key.toLowerCase();
          const cleanL = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          return (
            cleanH === cleanF ||
            cleanH === cleanL ||
            cleanH.includes(cleanF) ||
            cleanF.includes(cleanH)
          );
        });
        initialMap[field.key] = match || '__none__';
      }

      setMappings(initialMap);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  // Sample CSV generator for quick testing
  const handleLoadSampleCsv = () => {
    const sample = `Product_Name,Selling_Price,Original_MSRP,Dept_Category,In_Stock,Customer_Rating,Review_Total,Vendor_Brand
"Bose QuietComfort 45 Bluetooth Headphones",279.00,329.00,"Electronics",TRUE,4.7,1850,"Bose"
"Samsung 34-Inch Odyssey OLED G8 Curved Gaming Monitor",899.99,1199.99,"Monitors",TRUE,4.8,320,"Samsung"
"Logitech MX Keys Advanced Wireless Illuminated Keyboard",119.99,129.99,"Accessories",TRUE,4.8,2410,"Logitech"
"Anker 737 Power Bank (PowerCore 24K)",109.99,149.99,"Accessories",FALSE,4.6,980,"Anker"
"LG C3 Series 42-Inch OLED 4K Smart TV",996.99,1199.00,"Electronics",TRUE,4.9,760,"LG"`;

    setFileName('sample_ecommerce_inventory.csv');
    setRawCsvText(sample);

    const { headers, rows } = parseCsv(sample);
    setCsvHeaders(headers);
    setParsedRows(rows);

    const initialMap: Record<string, string> = {
      title: 'Product_Name',
      price: 'Selling_Price',
      originalPrice: 'Original_MSRP',
      category: 'Dept_Category',
      inStock: 'In_Stock',
      rating: 'Customer_Rating',
      reviewsCount: 'Review_Total',
      brand: 'Vendor_Brand',
      sku: '__none__',
      url: '__none__',
      imageUrl: '__none__',
      currency: '__none__',
    };
    setMappings(initialMap);
    setStep('mapping');
  };

  // Transformed data records based on user's column mapping
  const mappedRecords = useMemo(() => {
    if (parsedRows.length === 0) return [];

    return parsedRows.map((row, rowIdx) => {
      const record: Record<string, any> = {
        id: `imported-${Date.now()}-${rowIdx + 1}`,
      };

      for (const field of TARGET_SCHEMA_FIELDS) {
        const mappedCol = mappings[field.key];
        const colIndex = csvHeaders.indexOf(mappedCol);

        if (mappedCol && mappedCol !== '__none__' && colIndex >= 0) {
          const val = row[colIndex];
          if (field.type === 'number') {
            const cleanNum = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
            record[field.key] = isNaN(cleanNum) ? field.defaultVal : cleanNum;
          } else if (field.type === 'boolean') {
            const s = String(val).toLowerCase().trim();
            record[field.key] = s === 'true' || s === '1' || s === 'yes' || s.includes('in stock') || s.includes('instock');
          } else {
            record[field.key] = val !== undefined && val !== null ? String(val).trim() : field.defaultVal;
          }
        } else {
          record[field.key] = field.defaultVal;
        }
      }

      return record;
    });
  }, [parsedRows, mappings, csvHeaders]);

  const handleExecuteImport = async () => {
    if (mappedRecords.length === 0) {
      setError('No mapped records available to import.');
      return;
    }

    if (!mappings.title || mappings.title === '__none__') {
      setError('Please map the required "Product Title" column before importing.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/db/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: mappedRecords,
          replaceExisting,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import dataset');
      }

      setSuccessCount(data.importedCount);
      onImportComplete();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving records into SQLite/MySQL database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep('upload');
    setFileName('');
    setRawCsvText('');
    setCsvHeaders([]);
    setParsedRows([]);
    setMappings({});
    setError(null);
    setSuccessCount(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Import External CSV Dataset</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900 text-slate-300">
                  SQLite / MySQL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload external product feeds, map custom CSV columns to the database schema, and supplement your crawl dataset.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stepper Wizard Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-2 py-3 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                step === 'upload' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              1
            </span>
            <span className={step === 'upload' ? 'text-white font-semibold' : 'text-slate-400'}>
              Upload File
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
          <div className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                step === 'mapping' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              2
            </span>
            <span className={step === 'mapping' ? 'text-white font-semibold' : 'text-slate-400'}>
              Column Schema Mapping
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
          <div className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                step === 'preview' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </span>
            <span className={step === 'preview' ? 'text-white font-semibold' : 'text-slate-400'}>
              Preview & Import
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-xs text-rose-300 font-mono flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Import Successful!</h4>
                <p className="text-xs text-slate-300">
                  Successfully stored <span className="font-bold text-cyan-400">{successCount}</span> external records into the products table.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  onClick={resetAll}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  Import Another File
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  View Database
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: Upload File */}
              {step === 'upload' && (
                <div className="space-y-6">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-10 text-center cursor-pointer transition-colors bg-slate-900/30 hover:bg-slate-900/50"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto group-hover:scale-105 transition-transform border border-cyan-500/20">
                      <FileSpreadsheet className="h-7 w-7" />
                    </div>
                    <h4 className="mt-4 text-sm font-semibold text-white">
                      Click to upload CSV spreadsheet
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports comma-separated (.csv) files up to 25MB with standard header rows.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-white">Need sample test data?</div>
                        <div className="text-[11px] text-slate-400">
                          Load a pre-configured multi-category e-commerce inventory with pricing & stock columns.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadSampleCsv}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 transition-colors shrink-0"
                    >
                      Load Sample CSV
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Column Schema Mapping */}
              {step === 'mapping' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 text-xs">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                      <span className="font-semibold text-white truncate max-w-xs">{fileName}</span>
                      <span className="text-slate-500 font-mono">
                        ({parsedRows.length} rows, {csvHeaders.length} columns)
                      </span>
                    </div>
                    <button
                      onClick={resetAll}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Choose Different File
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="text-xs font-bold text-white">Map CSV Columns to Products Database Schema</h4>
                        <p className="text-[11px] text-slate-400">
                          Match your CSV header labels with target database columns. Auto-matches were inferred below.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                      {TARGET_SCHEMA_FIELDS.map((field) => {
                        const currentMapped = mappings[field.key] || '__none__';
                        return (
                          <div
                            key={field.key}
                            className="rounded-lg border border-slate-800/80 bg-slate-950 p-3 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                <span>{field.label}</span>
                                {field.required && (
                                  <span className="text-rose-400 text-[10px]">*Required</span>
                                )}
                              </label>
                              <span className="text-[10px] font-mono text-slate-500">
                                {field.type}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {field.description}
                            </p>

                            <select
                              value={currentMapped}
                              onChange={(e) =>
                                setMappings((prev) => ({
                                  ...prev,
                                  [field.key]: e.target.value,
                                }))
                              }
                              className={`w-full rounded-md border px-2.5 py-1.5 text-xs font-mono focus:outline-none ${
                                currentMapped !== '__none__'
                                  ? 'border-cyan-500/50 bg-slate-900 text-cyan-300'
                                  : 'border-slate-800 bg-slate-900 text-slate-400'
                              }`}
                            >
                              <option value="__none__">-- Do Not Import / Use Default --</option>
                              {csvHeaders.map((header) => (
                                <option key={header} value={header}>
                                  CSV: {header}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Preview & Import */}
              {step === 'preview' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div>
                      <h4 className="text-xs font-bold text-white">Preview Normalized Records</h4>
                      <p className="text-[11px] text-slate-400">
                        Inspecting first 5 rows converted to the products database schema ({mappedRecords.length} total records to insert).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={replaceExisting}
                          onChange={(e) => setReplaceExisting(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                        />
                        <span>Replace existing products</span>
                      </label>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 max-h-72">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                        <tr>
                          <th className="px-3.5 py-2">Title</th>
                          <th className="px-3.5 py-2">Price</th>
                          <th className="px-3.5 py-2">Category</th>
                          <th className="px-3.5 py-2">Stock</th>
                          <th className="px-3.5 py-2">Rating</th>
                          <th className="px-3.5 py-2">Brand</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {mappedRecords.slice(0, 5).map((rec, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/30">
                            <td className="px-3.5 py-2 font-medium text-slate-200 truncate max-w-xs">
                              {rec.title}
                            </td>
                            <td className="px-3.5 py-2 font-bold text-white">
                              ${Number(rec.price).toFixed(2)}
                            </td>
                            <td className="px-3.5 py-2 text-cyan-400">{rec.category}</td>
                            <td className="px-3.5 py-2">
                              {rec.inStock ? (
                                <span className="text-emerald-400">In Stock</span>
                              ) : (
                                <span className="text-rose-400">Out of Stock</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2 text-amber-400">★ {rec.rating}</td>
                            <td className="px-3.5 py-2 text-slate-400">{rec.brand || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        {successCount === null && (
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0">
            <div>
              {step !== 'upload' && (
                <button
                  type="button"
                  onClick={() => setStep(step === 'preview' ? 'mapping' : 'upload')}
                  className="rounded-lg border border-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              {step === 'mapping' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!mappings.title || mappings.title === '__none__') {
                      setError('Please map the Product Title column before continuing.');
                      return;
                    }
                    setError(null);
                    setStep('preview');
                  }}
                  className="rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  Review Preview
                </button>
              )}

              {step === 'preview' && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleExecuteImport}
                  className="flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Importing into SQLite...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-3.5 w-3.5" />
                      <span>Commit {mappedRecords.length} Records to DB</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
