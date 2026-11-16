import React, { useState } from 'react';
import {
  Sparkles,
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  ChevronDown,
  Layers,
  Wand2,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { ScrapeTargetType } from '../types/scraper';

interface GeneratedScriptResult {
  code: string;
  itemContainerSelector?: string;
  selectors?: { field: string; selector: string; description: string }[];
  architecture?: string;
  tips?: string[];
  url: string;
  library: string;
  targetType: string;
}

interface ScriptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  targetType: ScrapeTargetType;
  onApplySelector?: (containerSelector: string) => void;
}

export const ScriptGeneratorModal: React.FC<ScriptGeneratorModalProps> = ({
  isOpen,
  onClose,
  targetUrl,
  targetType,
  onApplySelector,
}) => {
  const [urlInput, setUrlInput] = useState(targetUrl || 'http://books.toscrape.com/catalogue/page-1.html');
  const [selectedLibrary, setSelectedLibrary] = useState<'beautifulsoup' | 'selenium' | 'playwright'>('beautifulsoup');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedScriptResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'selectors' | 'architecture'>('code');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!urlInput.trim()) {
      setError('Please provide a website URL to generate custom Python selectors.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/scrape/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput.trim(),
          targetType,
          library: selectedLibrary,
          customRequirements: customPrompt.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate script');
      }

      setResult(data);
      setActiveTab('code');
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini code generator');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!result?.code) return;
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result?.code) return;
    const blob = new Blob([result.code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom_scraper_${selectedLibrary}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI-Powered Scraper Script Generator</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-semibold">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyzes live target web page structure and writes bespoke Python extraction code with custom DOM selectors.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Input Controls */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Target URL */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Website URL
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/shop"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              {/* Framework Choice */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Python Framework
                </label>
                <select
                  value={selectedLibrary}
                  onChange={(e) => setSelectedLibrary(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                >
                  <option value="beautifulsoup">Requests + BeautifulSoup4</option>
                  <option value="selenium">Selenium WebDriver (Dynamic JS)</option>
                  <option value="playwright">Playwright Python (Async Headless)</option>
                </select>
              </div>
            </div>

            {/* Custom Notes / Extra instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <span>Optional Instructions or Specific Fields to Target</span>
                <span className="text-[11px] text-slate-500 font-mono">(e.g. "include discount percentage", "handle infinite scroll")</span>
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus on product card titles, original struck prices, and stock indicators..."
                className="w-full rounded-lg border border-slate-800/80 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>Target Schema:</span>
                <span className="text-cyan-300 font-semibold uppercase">{targetType}</span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/10 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Analyzing DOM & Synthesizing Selectors...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Generate Custom Python Scraper</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-xs text-rose-300 font-mono flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Output Area */}
          {result && (
            <div className="space-y-4">
              {/* Output Tabs & Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                      activeTab === 'code'
                        ? 'bg-slate-800 text-white font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Python Code</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('selectors')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                      activeTab === 'selectors'
                        ? 'bg-slate-800 text-white font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="h-3.5 w-3.5 text-amber-400" />
                    <span>DOM Selectors ({result.selectors?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('architecture')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                      activeTab === 'architecture'
                        ? 'bg-slate-800 text-white font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Strategy & Tips</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {onApplySelector && result.itemContainerSelector && (
                    <button
                      onClick={() => {
                        onApplySelector(result.itemContainerSelector!);
                        onClose();
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 font-medium transition-colors"
                    >
                      Apply Container to Studio
                    </button>
                  )}
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .py</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Python Script Canvas */}
              {activeTab === 'code' && (
                <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[380px]">
                  <pre className="whitespace-pre">
                    <code>{result.code}</code>
                  </pre>
                </div>
              )}

              {/* Tab 2: Discovered Selectors Breakdown */}
              {activeTab === 'selectors' && (
                <div className="space-y-3">
                  {result.itemContainerSelector && (
                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-cyan-300">
                          Main Card Container Selector
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Repeats for every extracted item card on the page
                        </div>
                      </div>
                      <code className="text-xs font-mono px-3 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                        {result.itemContainerSelector}
                      </code>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                        <tr>
                          <th className="px-4 py-2.5">Field</th>
                          <th className="px-4 py-2.5">CSS / XPath Selector</th>
                          <th className="px-4 py-2.5">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {result.selectors?.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-white capitalize">
                              {s.field}
                            </td>
                            <td className="px-4 py-2.5 text-cyan-400 font-semibold">
                              <code>{s.selector}</code>
                            </td>
                            <td className="px-4 py-2.5 text-slate-400 text-[11px]">
                              {s.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Architecture & Reliable Scraping Tips */}
              {activeTab === 'architecture' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-emerald-400" />
                      <span>Architecture Strategy</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {result.architecture}
                    </p>
                  </div>

                  {result.tips && result.tips.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                      <h4 className="text-xs font-semibold text-white">
                        Production Scraping Best Practices
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {result.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-cyan-400 select-none">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Powered by Gemini 3.8 Flash SDK · Automated Selector Inference
          </span>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
