import React, { useState } from 'react';
import { ScrapeTargetType } from '../types/scraper';
import { ScriptGeneratorModal } from './ScriptGeneratorModal';
import {
  Globe,
  Code2,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  FileText,
  Sliders,
  Wand2,
} from 'lucide-react';

interface ScraperStudioViewProps {
  onRunScrape: (params: {
    url?: string;
    rawHtml?: string;
    targetType: ScrapeTargetType;
    maxPages: number;
    pageParam: string;
    itemSelector?: string;
    useGemini: boolean;
  }) => Promise<void>;
  isLoading: boolean;
  crawlLogs: string[];
  extractedRawItems: any[];
  onProceedToCleaning: () => void;
}

export const ScraperStudioView: React.FC<ScraperStudioViewProps> = ({
  onRunScrape,
  isLoading,
  crawlLogs,
  extractedRawItems,
  onProceedToCleaning,
}) => {
  const [sourceMode, setSourceMode] = useState<'url' | 'html'>('url');
  const [targetType, setTargetType] = useState<ScrapeTargetType>('products');
  const [targetUrl, setTargetUrl] = useState('http://books.toscrape.com/catalogue/page-1.html');
  const [itemSelector, setItemSelector] = useState('');
  const [rawHtmlInput, setRawHtmlInput] = useState('');
  const [maxPages, setMaxPages] = useState(2);
  const [pageParam, setPageParam] = useState('page');
  const [useGemini, setUseGemini] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);

  // Quick Presets
  const handleLoadPreset = (preset: 'books' | 'jobs' | 'messyHtml') => {
    if (preset === 'books') {
      setSourceMode('url');
      setTargetType('products');
      setTargetUrl('http://books.toscrape.com/catalogue/page-1.html');
      setItemSelector('.product_pod');
      setMaxPages(2);
    } else if (preset === 'jobs') {
      setSourceMode('url');
      setTargetType('jobs');
      setTargetUrl('https://remoteok.com/api/jobs');
      setItemSelector('.job');
      setMaxPages(1);
    } else {
      setSourceMode('html');
      setTargetType('products');
      setItemSelector('article.product-card');
      setRawHtmlInput(`
<div class="search-results-grid">
  <!-- Messy raw e-commerce HTML with broken entities and nested spans -->
  <article class="product-card" data-asin="B09V3HN4K3">
    <div class="img-wrap"><img src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300" alt="Watch" /></div>
    <div class="content">
      <h3 class="product-title"><a href="/dp/B09V3HN4K3">Apple Watch Ultra 2 &amp; GPS + Cellular (Titanium Case)</a></h3>
      <div class="price-box">
        <span class="price">USD $ 779.00 <del class="old-price">$799.00</del></span>
        <span class="sr-only">Save 2.5% today!</span>
      </div>
      <div class="stock-status in-stock">In Stock (Only 4 left in stock - order soon).</div>
      <div class="rating star-rating-4.9">Rated 4.9 out of 5 stars (1,240 reviews)</div>
    </div>
  </article>

  <article class="product-card" data-asin="B08N5WRWNW">
    <div class="img-wrap"><img src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300" alt="Sunglasses" /></div>
    <div class="content">
      <h3 class="product-title"><a href="/dp/B08N5WRWNW">Ray-Ban Aviator Classic Polarized Sunglasses &lt;Gunmetal&gt;</a></h3>
      <div class="price-box">
        <span class="price">£ 163.50</span>
      </div>
      <div class="stock-status instock">In stock.</div>
      <div class="rating star-rating-4.6">4.6 out of 5 stars</div>
    </div>
  </article>

  <article class="product-card" data-asin="B09V3HN4K3">
    <!-- Duplicate row to test deduplication -->
    <div class="content">
      <h3 class="product-title"><a href="/dp/B09V3HN4K3">Apple Watch Ultra 2 &amp; GPS + Cellular (Titanium Case)</a></h3>
      <div class="price-box"><span class="price">$779.00</span></div>
      <div class="stock-status">In Stock</div>
    </div>
  </article>
</div>
      `.trim());
    }
  };

  const handleExecute = () => {
    onRunScrape({
      url: sourceMode === 'url' ? targetUrl : undefined,
      rawHtml: sourceMode === 'html' ? rawHtmlInput : undefined,
      targetType,
      maxPages,
      pageParam,
      itemSelector: itemSelector.trim() || undefined,
      useGemini,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Intelligent Web Scraper Studio
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Extract structured datasets from multi-page websites or raw unstructured HTML snippets.
        </p>
      </div>

      {/* Preset Pills & AI Generator Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Test Targets:</span>
          <button
            onClick={() => handleLoadPreset('books')}
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-white transition-colors"
          >
            Books To Scrape (Live Multi-Page)
          </button>
          <button
            onClick={() => handleLoadPreset('jobs')}
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-white transition-colors"
          >
            Tech Job Listings
          </button>
          <button
            onClick={() => handleLoadPreset('messyHtml')}
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-white transition-colors"
          >
            Messy E-Commerce HTML Snippet
          </button>
        </div>

        {/* AI-Powered Scraper Script Generator Trigger */}
        <button
          onClick={() => setIsScriptModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/40 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:border-cyan-400 hover:text-white transition-all shadow-sm shrink-0"
        >
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Generate Scraper Script (Gemini AI)</span>
        </button>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Input Parameters (2 cols) */}
        <div className="lg:col-span-2 space-y-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          {/* Source Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <button
              onClick={() => setSourceMode('url')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                sourceMode === 'url'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>Live Website URL Crawl</span>
            </button>
            <button
              onClick={() => setSourceMode('html')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                sourceMode === 'html'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="h-4 w-4" />
              <span>Paste Messy HTML Payload</span>
            </button>
          </div>

          {/* Mode 1: URL */}
          {sourceMode === 'url' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Target URL (Supports HTTP/HTTPS)
                  </label>
                  <button
                    onClick={() => setIsScriptModalOpen(true)}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>AI-Inspect Selectors for URL</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://example.com/products"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Item Card Container Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Custom Repeating Item Container Selector (Optional)
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    e.g. .product_pod, article.item, .s-result-item
                  </span>
                </div>
                <input
                  type="text"
                  value={itemSelector}
                  onChange={(e) => setItemSelector(e.target.value)}
                  placeholder="Auto-detected if left empty, or apply from AI Generator"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              {/* Multi-page controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Max Pages to Crawl (Multi-Page Crawling)
                  </label>
                  <select
                    value={maxPages}
                    onChange={(e) => setMaxPages(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={1}>1 Page (Single-page scrape)</option>
                    <option value={2}>2 Pages (Pagination follow)</option>
                    <option value={3}>3 Pages (Multi-page batch)</option>
                    <option value={5}>5 Pages (Deep catalog crawl)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Pagination Query Parameter
                  </label>
                  <input
                    type="text"
                    value={pageParam}
                    onChange={(e) => setPageParam(e.target.value)}
                    placeholder="page"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Raw Messy HTML */}
          {sourceMode === 'html' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Raw Unstructured HTML (Copy & paste from DevTools / Page Source)
                </label>
                <button
                  onClick={() => handleLoadPreset('messyHtml')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Insert Sample Markup
                </button>
              </div>
              <textarea
                rows={9}
                value={rawHtmlInput}
                onChange={(e) => setRawHtmlInput(e.target.value)}
                placeholder="Paste HTML divs, articles, tables with noisy text, broken entities, etc..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          )}

          {/* Target Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Domain Extraction Schema
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'products', label: 'E-Commerce Products', desc: 'Price, Stock, Rating' },
                { id: 'jobs', label: 'Job Listings', desc: 'Company, Salary, Remote' },
                { id: 'news', label: 'News / Articles', desc: 'Author, Date, Summary' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTargetType(t.id as ScrapeTargetType)}
                  className={`p-3 text-left rounded-lg border transition-all ${
                    targetType === t.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{t.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Intelligent AI Selector Assist */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <div>
                <div className="text-xs font-medium text-white">
                  Intelligent Selector Fallback (Gemini 3.8 Flash)
                </div>
                <div className="text-[11px] text-slate-400">
                  Automatically infers CSS selectors and regex patterns for obfuscated HTML classes.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useGemini}
                onChange={(e) => setUseGemini(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Action Button */}
          <button
            onClick={handleExecute}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Crawling & Parsing Target DOM...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-slate-950" />
                <span>Execute Web Scraping Engine</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Crawl Logs & Diagnostics (1 col) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                <span>Live Scraping Logs</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {extractedRawItems.length} items extracted
              </span>
            </div>

            {/* Terminal View */}
            <div className="mt-4 h-64 overflow-y-auto rounded-lg border border-slate-800/80 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 space-y-1.5">
              {crawlLogs.length === 0 ? (
                <div className="text-slate-600">
                  Ready. Configure target above and click 'Execute Web Scraping Engine'.
                </div>
              ) : (
                crawlLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span className="text-slate-300">{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Next Step Banner if items extracted */}
          {extractedRawItems.length > 0 && (
            <div className="mt-4 p-4 rounded-lg border border-cyan-500/30 bg-cyan-950/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
                <CheckCircle className="h-4 w-4 text-cyan-400" />
                <span>Extracted {extractedRawItems.length} raw records!</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Data currently contains messy formats, possible duplicates, and unparsed currency symbols.
              </p>
              <button
                onClick={onProceedToCleaning}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
              >
                <span>Proceed to Cleaning Pipeline (Pandas & Regex)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Raw Preview Table */}
      {extractedRawItems.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                Raw Extracted Data (Pre-Cleaning)
              </h3>
              <p className="text-xs text-slate-400">
                Notice unstructured strings, currency characters, and raw text extracted directly from HTML.
              </p>
            </div>
            <button
              onClick={onProceedToCleaning}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-cyan-400 hover:bg-slate-700 transition-colors"
            >
              <span>Clean with Pandas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">raw_title</th>
                  <th className="px-4 py-2.5">raw_price</th>
                  <th className="px-4 py-2.5">raw_stock</th>
                  <th className="px-4 py-2.5">raw_rating</th>
                  <th className="px-4 py-2.5">raw_url</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {extractedRawItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30">
                    <td className="px-4 py-2.5 text-slate-200 truncate max-w-xs">
                      {item.raw_title || item.title}
                    </td>
                    <td className="px-4 py-2.5 text-amber-400">
                      {item.raw_price || item.raw_salary || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {item.raw_stock || item.raw_type || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {item.raw_rating || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 truncate max-w-[200px]">
                      {item.raw_url || item.url || '#'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI-Powered Scraper Script Generator Modal */}
      <ScriptGeneratorModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        targetUrl={targetUrl}
        targetType={targetType}
        onApplySelector={(containerSelector) => {
          setItemSelector(containerSelector);
          if (sourceMode !== 'url') setSourceMode('url');
        }}
      />
    </div>
  );
};
