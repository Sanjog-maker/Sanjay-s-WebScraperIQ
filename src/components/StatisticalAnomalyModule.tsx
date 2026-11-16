import React, { useMemo, useState } from 'react';
import { ProductItem, AlertRule } from '../types/scraper';
import {
  AlertTriangle,
  Zap,
  TrendingDown,
  TrendingUp,
  PackageX,
  BellPlus,
  CheckCircle2,
  HelpCircle,
  Activity,
  ArrowRight,
  Sparkles,
  Sliders,
} from 'lucide-react';

export type AnomalyType =
  | 'statistical_price_drop'
  | 'statistical_price_spike'
  | 'high_volatility'
  | 'abnormal_stock_depletion'
  | 'zscore_outlier';

export interface ProductAnomaly {
  id: string;
  product: ProductItem;
  type: AnomalyType;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  zScore?: number;
  categoryMean?: number;
  categoryStdDev?: number;
  suggestedAlert: {
    name: string;
    type: 'price_drop' | 'stock_available';
    field: string;
    operator: 'less_than' | 'equals';
    value: string;
  };
}

interface StatisticalAnomalyModuleProps {
  products: ProductItem[];
  existingAlerts: AlertRule[];
  onSelectProduct?: (productId: string) => void;
  onCreateAlert?: (rule: Partial<AlertRule>) => Promise<void>;
}

export const StatisticalAnomalyModule: React.FC<StatisticalAnomalyModuleProps> = ({
  products,
  existingAlerts,
  onSelectProduct,
  onCreateAlert,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium'>('all');
  const [addingAlertId, setAddingAlertId] = useState<string | null>(null);
  const [addedAlertIds, setAddedAlertIds] = useState<Set<string>>(new Set());

  // Set of product IDs or names already guarded by user-defined alerts
  const guardedProductIndicators = useMemo(() => {
    const set = new Set<string>();
    for (const a of existingAlerts) {
      if (a.name) set.add(a.name.toLowerCase());
      if (a.field) set.add(a.field.toLowerCase());
      if (a.value) set.add(String(a.value).toLowerCase());
    }
    return set;
  }, [existingAlerts]);

  // Compute Statistical Anomalies (Z-Score across categories, volatility, and unexpected out-of-stock transitions)
  const anomalies = useMemo<ProductAnomaly[]>(() => {
    if (!products || products.length === 0) return [];

    // 1. Group by category to calculate category baseline statistics (Mean & Standard Deviation)
    const categoryStats: Record<
      string,
      {
        count: number;
        mean: number;
        stdDev: number;
        prices: number[];
      }
    > = {};

    for (const p of products) {
      const cat = p.category || 'General';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, mean: 0, stdDev: 0, prices: [] };
      }
      categoryStats[cat].prices.push(p.price);
    }

    for (const cat of Object.keys(categoryStats)) {
      const stat = categoryStats[cat];
      stat.count = stat.prices.length;
      stat.mean = stat.prices.reduce((sum, val) => sum + val, 0) / stat.count;
      const variance =
        stat.prices.reduce((sum, val) => sum + Math.pow(val - stat.mean, 2), 0) /
        (stat.count > 1 ? stat.count - 1 : 1);
      stat.stdDev = Math.sqrt(variance);
    }

    const detected: ProductAnomaly[] = [];

    for (const p of products) {
      const cat = p.category || 'General';
      const stats = categoryStats[cat];

      // Check if product already has an explicit alert rule configured by name or exact value
      const isAlreadyCovered =
        guardedProductIndicators.has(p.id.toLowerCase()) ||
        guardedProductIndicators.has(p.title.toLowerCase()) ||
        Array.from(guardedProductIndicators).some(
          (indicator) =>
            indicator.length > 5 && p.title.toLowerCase().includes(indicator)
        );

      if (isAlreadyCovered) {
        continue;
      }

      // Check A: Historical price fluctuation analysis
      const history = p.priceHistory || [];
      if (history.length >= 2) {
        const prices = history.map((h) => h.price);
        const initial = prices[0];
        const latest = prices[prices.length - 1];
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const relativeDrop = initial > 0 ? (initial - latest) / initial : 0;
        const volatility = minPrice > 0 ? (maxPrice - minPrice) / minPrice : 0;

        // Anomaly: Rapid Price Drop > 15% without alert rule
        if (relativeDrop >= 0.15) {
          detected.push({
            id: `drop-${p.id}`,
            product: p,
            type: 'statistical_price_drop',
            severity: relativeDrop >= 0.25 ? 'high' : 'medium',
            title: `Unusual -${(relativeDrop * 100).toFixed(0)}% Price Drop Detected`,
            description: `Price abruptly declined from $${initial.toFixed(2)} to $${latest.toFixed(2)} across scrape sample intervals.`,
            metricLabel: 'Drop Delta',
            metricValue: `-$${(initial - latest).toFixed(2)}`,
            suggestedAlert: {
              name: `Monitor ${p.title.slice(0, 24)}... (Price Drop)`,
              type: 'price_drop',
              field: 'price',
              operator: 'less_than',
              value: (latest * 0.95).toFixed(2),
            },
          });
          continue;
        }

        // Anomaly: High Volatility (spread > 30% between crawls)
        if (volatility >= 0.3) {
          detected.push({
            id: `vol-${p.id}`,
            product: p,
            type: 'high_volatility',
            severity: 'medium',
            title: `High Price Volatility (${(volatility * 100).toFixed(0)}% swing)`,
            description: `Extreme price oscillation between $${minPrice.toFixed(2)} and $${maxPrice.toFixed(2)} detected in recent snapshots.`,
            metricLabel: 'Volatility Band',
            metricValue: `±$${(maxPrice - minPrice).toFixed(2)}`,
            suggestedAlert: {
              name: `Stabilization alert for ${p.title.slice(0, 22)}...`,
              type: 'price_drop',
              field: 'price',
              operator: 'less_than',
              value: minPrice.toFixed(2),
            },
          });
          continue;
        }
      }

      // Check B: Z-Score Outlier Analysis against category peer group
      if (stats.stdDev > 0) {
        const zScore = (p.price - stats.mean) / stats.stdDev;

        // Abnormally cheap outlier (Z-Score <= -1.15 in category)
        if (zScore <= -1.15) {
          detected.push({
            id: `zlow-${p.id}`,
            product: p,
            type: 'zscore_outlier',
            severity: zScore <= -1.5 ? 'high' : 'medium',
            title: `Statistical Price Outlier (${Math.abs(zScore).toFixed(1)}σ below peer mean)`,
            description: `Priced at $${p.price.toFixed(2)} vs ${cat} category mean of $${stats.mean.toFixed(2)} (Standard Deviation σ=$${stats.stdDev.toFixed(2)}).`,
            metricLabel: 'Z-Score',
            metricValue: `${zScore.toFixed(2)}σ`,
            zScore,
            categoryMean: stats.mean,
            categoryStdDev: stats.stdDev,
            suggestedAlert: {
              name: `Alert if ${p.title.slice(0, 24)} drops below $${p.price.toFixed(2)}`,
              type: 'price_drop',
              field: 'price',
              operator: 'less_than',
              value: (p.price * 0.95).toFixed(2),
            },
          });
          continue;
        }
      }

      // Check C: Sudden Stock Depletion / Out of Stock on high-rated popular product
      if (!p.inStock && (p.rating || 0) >= 4.6 && (p.reviewsCount || 0) >= 200) {
        detected.push({
          id: `stock-${p.id}`,
          product: p,
          type: 'abnormal_stock_depletion',
          severity: 'high',
          title: 'Abnormal Stock Depletion on Top-Rated Item',
          description: `High-demand item (★${p.rating} with ${p.reviewsCount} reviews) transitioned to Out of Stock without an active restock alert.`,
          metricLabel: 'Status',
          metricValue: 'Out of Stock',
          suggestedAlert: {
            name: `Restock Notify: ${p.title.slice(0, 26)}`,
            type: 'stock_available',
            field: 'in_stock',
            operator: 'equals',
            value: '1',
          },
        });
        continue;
      }

      // Check D: Heuristic discount without user alert (originalPrice > price with >= 20% discount)
      if (p.originalPrice && p.originalPrice > p.price) {
        const discountRate = (p.originalPrice - p.price) / p.originalPrice;
        if (discountRate >= 0.2) {
          detected.push({
            id: `deal-${p.id}`,
            product: p,
            type: 'statistical_price_drop',
            severity: discountRate >= 0.3 ? 'high' : 'medium',
            title: `Deep Unmonitored Discount (${(discountRate * 100).toFixed(0)}% Off)`,
            description: `Crawled price $${p.price.toFixed(2)} is substantially lower than MSRP $${p.originalPrice.toFixed(2)}.`,
            metricLabel: 'Discount',
            metricValue: `-${(discountRate * 100).toFixed(0)}%`,
            suggestedAlert: {
              name: `Deal tracker: ${p.title.slice(0, 24)}`,
              type: 'price_drop',
              field: 'price',
              operator: 'less_than',
              value: p.price.toFixed(2),
            },
          });
        }
      }
    }

    return detected;
  }, [products, existingAlerts, guardedProductIndicators]);

  // Handle 1-click converting anomaly into active alert rule
  const handleQuickCreateAlert = async (anomaly: ProductAnomaly) => {
    if (!onCreateAlert) return;
    setAddingAlertId(anomaly.id);
    try {
      await onCreateAlert({
        name: anomaly.suggestedAlert.name,
        type: anomaly.suggestedAlert.type,
        targetType: 'products',
        field: anomaly.suggestedAlert.field,
        operator: anomaly.suggestedAlert.operator,
        value: anomaly.suggestedAlert.value,
        recipientEmail: 'admin@example.test',
      });
      setAddedAlertIds((prev) => new Set(prev).add(anomaly.id));
    } finally {
      setAddingAlertId(null);
    }
  };

  const filteredAnomalies = useMemo(() => {
    if (filterSeverity === 'all') return anomalies;
    return anomalies.filter((a) => a.severity === filterSeverity);
  }, [anomalies, filterSeverity]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-5">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
            </div>
            <h2 className="text-base font-bold text-white">
              Automated Statistical Anomaly & Outlier Detector
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Gaussian Z-Score & Volatility
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Identifies abnormal price deviations, volatility spikes, and sudden stock depletions that aren't yet protected by user-defined alerts.
          </p>
        </div>

        {/* Severity Filter Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSeverity === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Signals ({anomalies.length})
            </button>
            <button
              onClick={() => setFilterSeverity('high')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSeverity === 'high'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              High Severity ({anomalies.filter((a) => a.severity === 'high').length})
            </button>
          </div>
        </div>
      </div>

      {/* Anomalies Card Grid */}
      {filteredAnomalies.length === 0 ? (
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-8 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-semibold text-white">No Unmonitored Anomalies Detected</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All current product pricing bands and stock states conform to baseline category distributions, or are already guarded by active alert rules.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnomalies.map((anomaly) => {
            const isAdded = addedAlertIds.has(anomaly.id);
            const isHigh = anomaly.severity === 'high';

            return (
              <div
                key={anomaly.id}
                className={`rounded-xl border p-4.5 flex flex-col justify-between space-y-4 transition-all ${
                  isHigh
                    ? 'border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Badge: Type & Severity */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        isHigh
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {anomaly.type === 'abnormal_stock_depletion' ? (
                        <PackageX className="h-3 w-3" />
                      ) : anomaly.type === 'statistical_price_drop' ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <Activity className="h-3 w-3" />
                      )}
                      <span>{anomaly.severity} Priority</span>
                    </span>

                    <span className="text-[11px] font-mono text-cyan-400 font-semibold tabular-nums">
                      {anomaly.metricLabel}: {anomaly.metricValue}
                    </span>
                  </div>

                  {/* Anomaly Title & Product Name */}
                  <h4 className="mt-3 text-sm font-bold text-white leading-snug">
                    {anomaly.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="truncate font-medium">{anomaly.product.title}</span>
                  </div>

                  {/* Detailed Description */}
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {anomaly.description}
                  </p>

                  {/* Benchmark Comparison pill */}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-slate-800">
                    <span className="text-slate-400">Current: ${anomaly.product.price.toFixed(2)}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">Category: {anomaly.product.category}</span>
                  </div>
                </div>

                {/* Bottom Actions: View Chart & Convert to Active Alert */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  {onSelectProduct && (
                    <button
                      type="button"
                      onClick={() => onSelectProduct(anomaly.product.id)}
                      className="text-slate-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                    >
                      <span>Analyze Trend</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isAdded || addingAlertId === anomaly.id}
                    onClick={() => handleQuickCreateAlert(anomaly)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      isAdded
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-sm'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Alert Activated</span>
                      </>
                    ) : (
                      <>
                        <BellPlus className="h-3.5 w-3.5" />
                        <span>{addingAlertId === anomaly.id ? 'Creating...' : '+ Create Alert'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
