import React, { useState, useMemo } from 'react';
import { ProductItem, AlertTriggerEvent, AlertRule } from '../types/scraper';
import { ProductPriceHistoryChart } from './ProductPriceHistoryChart';
import { StatisticalAnomalyModule } from './StatisticalAnomalyModule';
import {
  TrendingDown,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  Bell,
  RefreshCw,
  Database,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';

interface DashboardViewProps {
  products: ProductItem[];
  alerts: AlertRule[];
  alertEvents: AlertTriggerEvent[];
  onNavigateToScraper: () => void;
  onNavigateToCleaning: () => void;
  onNavigateToSql: () => void;
  onTriggerTestAlert: (alertId?: string) => void;
  onCreateAlert?: (rule: Partial<AlertRule>) => Promise<void>;
  onRefreshData: () => void;
  isLoading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  alerts,
  alertEvents,
  onNavigateToScraper,
  onNavigateToCleaning,
  onNavigateToSql,
  onTriggerTestAlert,
  onCreateAlert,
  onRefreshData,
  isLoading,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Compute unique categories and item counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of products) {
      const cat = item.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const sortedCats = Object.keys(counts).sort((a, b) => a.localeCompare(b));
    return {
      all: products.length,
      categories: sortedCats.map((cat) => ({
        name: cat,
        count: counts[cat],
      })),
    };
  }, [products]);

  // Filtered products list based on category dropdown selection
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter((p) => (p.category || 'General') === selectedCategory);
  }, [products, selectedCategory]);

  // Compute analytics
  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.inStock).length;
  const inStockPercentage = totalCount > 0 ? Math.round((inStockCount / totalCount) * 100) : 0;
  
  const validPrices = products.map((p) => p.price).filter((p) => p > 0);
  const avgPrice = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : 0;
  
  const priceDrops = products.filter(
    (p) => p.originalPrice && p.originalPrice > p.price
  );

  return (
    <div className="space-y-8">
      {/* Top Banner / Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Data Collection & Market Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time multi-page scraping pipeline, Pandas cleaning metrics, and price drop monitors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Sync</span>
          </button>
          <button
            onClick={onNavigateToScraper}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            <span>Run New Scrape</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Tracked Products</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono tabular-nums">
              {totalCount}
            </span>
            <span className="text-xs text-slate-400">items in database</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across 4 categories · Stored in SQLite & MySQL
          </div>
        </div>

        {/* In-Stock Rate */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Availability Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono tabular-nums">
              {inStockPercentage}%
            </span>
            <span className="text-xs text-emerald-400">in stock</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {inStockCount} available · {totalCount - inStockCount} backordered
          </div>
        </div>

        {/* Average Price */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Average Price</span>
            <span className="text-xs text-slate-500 font-mono">USD</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono tabular-nums">
              ${avgPrice.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Min ${Math.min(...validPrices, 0).toFixed(2)} · Max ${Math.max(...validPrices, 0).toFixed(2)}
          </div>
        </div>

        {/* Active Price Drop Monitors */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Price Drop Alerts</span>
            <TrendingDown className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono tabular-nums">
              {priceDrops.length}
            </span>
            <span className="text-xs text-amber-400">active discounts</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {alertEvents.length} alert notifications dispatched
          </div>
        </div>
      </div>

      {/* Main Content: Recharts Price History Visualization & Alerts Dispatcher */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recharts Price History Visualization (2 cols) */}
        <div className="lg:col-span-2">
          <ProductPriceHistoryChart
            products={products}
            selectedProductId={selectedProductId}
            onSelectProduct={(id) => setSelectedProductId(id)}
            onTriggerAlertForProduct={(id) => onTriggerTestAlert(undefined)}
          />
        </div>

        {/* Live Alerts & Notification Center (1 col) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Email Alert Dispatcher</h2>
            <button
              onClick={() => onTriggerTestAlert()}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Test Trigger
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Automated alerts sent to <span className="text-slate-200 font-mono">admin@example.test</span> on price drops.
          </p>

          <div className="space-y-3">
            {alertEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No alert events triggered yet. Click "Test Trigger" above to test the automated email pipeline!
              </div>
            ) : (
              alertEvents.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <Bell className="h-3 w-3" />
                      <span>{evt.alertName}</span>
                    </span>
                    <span className="text-slate-500 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {evt.eventMessage}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                    <span className="font-mono truncate max-w-[170px]">{evt.emailSentTo}</span>
                    <span className="text-emerald-400 font-mono">Delivered ✓</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Automated Statistical Anomaly & Outlier Detector */}
      <StatisticalAnomalyModule
        products={products}
        existingAlerts={alerts}
        onSelectProduct={(productId) => {
          setSelectedProductId(productId);
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
        onCreateAlert={onCreateAlert}
      />

      {/* Scraped Inventory Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span>Collected Product Dataset (Normalized)</span>
              {selectedCategory !== 'All' && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Category: {selectedCategory} ({filteredProducts.length})
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cleaned with Pandas pipeline & stored in MySQL / SQLite tables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs">
                <Filter className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-transparent pr-6 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="All" className="bg-slate-900 text-white">
                    All Categories ({categoriesWithCounts.all})
                  </option>
                  {categoriesWithCounts.categories.map((c) => (
                    <option key={c.name} value={c.name} className="bg-slate-900 text-white">
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {selectedCategory !== 'All' && (
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Reset Filter ✕
              </button>
            )}

            <button
              onClick={onNavigateToSql}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>Query via SQL Console</span>
            </button>
            <button
              onClick={onNavigateToCleaning}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <span>View Cleaning Audit</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-3">Product Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Original</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500 font-mono">
                    No products found in category "{selectedCategory}".
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className="ml-2 text-cyan-400 hover:underline"
                    >
                      Show all products
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => {
                  const isSelected = item.id === selectedProductId;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedProductId(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/10 border-l-2 border-cyan-400'
                          : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-200 max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          )}
                          <span className={isSelected ? 'text-cyan-300 font-semibold' : ''}>
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white tabular-nums">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500 tabular-nums">
                        {item.originalPrice ? `$${item.originalPrice.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {item.inStock ? (
                          <span className="text-emerald-400">In Stock</span>
                        ) : (
                          <span className="text-rose-400">Out of Stock</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-amber-400 tabular-nums">
                        ★ {item.rating ? item.rating.toFixed(1) : '4.5'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProductId(item.id);
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                            }}
                            className={`text-xs px-2 py-0.5 rounded transition-colors ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                                : 'text-slate-400 hover:text-cyan-400'
                            }`}
                          >
                            {isSelected ? 'Viewing Chart' : 'Plot Chart'}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
