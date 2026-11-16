/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ScraperStudioView } from './components/ScraperStudioView';
import { CleaningStudioView } from './components/CleaningStudioView';
import { DatabaseSqlView } from './components/DatabaseSqlView';
import { AlertsManagerView } from './components/AlertsManagerView';
import { PythonSandboxView } from './components/PythonSandboxView';
import { AuthModal } from './components/AuthModal';
import {
  ProductItem,
  AlertRule,
  AlertTriggerEvent,
  AuthUser,
  CleaningRuleConfig,
  DataCleaningReport,
  ScrapeTargetType,
} from './types/scraper';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<AuthUser>({
    id: 'user-001',
    name: 'Demo Admin',
    email: 'admin@example.test',
    role: 'Admin',
    token: 'demo-session',
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [alertEvents, setAlertEvents] = useState<AlertTriggerEvent[]>([]);
  const [rawItems, setRawItems] = useState<any[]>([]);
  const [cleanedItems, setCleanedItems] = useState<any[]>([]);
  const [cleaningReport, setCleaningReport] = useState<DataCleaningReport | null>(null);
  const [crawlLogs, setCrawlLogs] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Initial data load
  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch products and price history via SQL query
      const pRes = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'SELECT * FROM products ORDER BY price ASC;',
        }),
      });
      const pData = await pRes.json();

      const hRes = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'SELECT product_id, price, recorded_at FROM price_history ORDER BY recorded_at ASC;',
        }),
      });
      const hData = await hRes.json();
      const historyByProduct: Record<string, { date: string; price: number }[]> = {};
      if (hData.success && hData.rows) {
        for (const row of hData.rows) {
          if (!historyByProduct[row.product_id]) {
            historyByProduct[row.product_id] = [];
          }
          historyByProduct[row.product_id].push({
            date: row.recorded_at,
            price: Number(row.price),
          });
        }
      }

      if (pData.success && pData.rows) {
        const mappedProducts = pData.rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          price: Number(r.price),
          originalPrice: r.original_price ? Number(r.original_price) : undefined,
          currency: r.currency || 'USD',
          discountPercent: r.discount_percent ? Number(r.discount_percent) : undefined,
          inStock: Boolean(r.in_stock),
          rating: r.rating ? Number(r.rating) : 4.5,
          reviewsCount: r.reviews_count ? Number(r.reviews_count) : 0,
          category: r.category || 'General',
          brand: r.brand,
          sku: r.sku,
          imageUrl: r.image_url,
          url: r.url,
          scrapedAt: r.scraped_at,
          priceHistory: historyByProduct[r.id] || [],
        }));
        setProducts(mappedProducts);
      }

      // 2. Fetch alerts and trigger events
      const aRes = await fetch('/api/alerts');
      const aData = await aRes.json();
      if (aData.alerts) {
        setAlerts(
          aData.alerts.map((a: any) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            targetType: a.target_type,
            condition: {
              field: a.field,
              operator: a.operator,
              value: a.value,
              percentageDrop: a.percentage_drop,
            },
            recipientEmail: a.recipient_email,
            isEnabled: Boolean(a.is_enabled),
            lastTriggeredAt: a.last_triggered_at,
            triggerCount: Number(a.trigger_count || 0),
            createdAt: a.created_at,
          }))
        );
      }
      if (aData.events) {
        setAlertEvents(
          aData.events.map((e: any) => ({
            id: e.id,
            alertId: e.alert_id,
            alertName: e.alert_name,
            itemTitle: e.item_title,
            itemUrl: e.item_url,
            oldPrice: e.old_price ? Number(e.old_price) : undefined,
            newPrice: e.new_price ? Number(e.new_price) : undefined,
            eventMessage: e.event_message,
            emailSentTo: e.email_sent_to,
            timestamp: e.timestamp,
            status: e.status || 'sent',
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load database data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Handler: Run Scraper
  const handleRunScrape = async (params: {
    url?: string;
    rawHtml?: string;
    targetType: ScrapeTargetType;
    maxPages: number;
    pageParam: string;
    itemSelector?: string;
    useGemini: boolean;
  }) => {
    setIsLoading(true);
    setCrawlLogs(['Initiating scraping engine...']);
    try {
      const res = await fetch('/api/scrape/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scraping request failed');

      setRawItems(data.items || []);
      setCrawlLogs(data.logs || ['Crawl finished.']);
      showToast(`Scraped ${data.count} raw items across ${data.pagesCrawled} pages!`);
    } catch (err: any) {
      showToast(`Scrape failed: ${err.message}`, 'error');
      setCrawlLogs((prev) => [...prev, `[ERROR] ${err.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Run Data Cleaning Pipeline
  const handleExecuteCleaning = async (rules: CleaningRuleConfig) => {
    setIsLoading(true);
    try {
      const itemsToClean = rawItems.length > 0 ? rawItems : products;
      const res = await fetch('/api/scrape/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToClean,
          rules,
          targetType: 'products',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cleaning pipeline failed');

      setCleanedItems(data.items || []);
      setCleaningReport(data.report);
      showToast(`Cleaning completed: ${data.report.cleanCount} clean records normalized!`);
      // Refresh database records
      loadDatabaseData();
    } catch (err: any) {
      showToast(`Cleaning error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Save to database
  const handleSaveToDatabase = () => {
    loadDatabaseData();
    showToast('Cleaned records successfully committed to MySQL & SQLite tables!');
    setActiveTab('database');
  };

  // Handler: Run SQL Query
  const handleRunQuery = async (sql: string) => {
    const res = await fetch('/api/db/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Query failed');
    }
    return data;
  };

  // Handler: Export Hub
  const handleExportData = (
    format: 'csv' | 'excel' | 'json' | 'sql',
    selectedColumns?: string[],
    rowLimit?: number,
    customDataset?: any[]
  ) => {
    let items = customDataset && customDataset.length > 0
      ? customDataset
      : products.length > 0
      ? products
      : cleanedItems;

    if (rowLimit && rowLimit > 0) {
      items = items.slice(0, rowLimit);
    }

    let content = '';
    let filename = `webscrapeiq_export_${Date.now()}`;
    let mimeType = 'text/plain';

    // Helper: Determine keys to export
    const defaultHeaders = ['title', 'price', 'original_price', 'currency', 'in_stock', 'rating', 'category', 'url'];
    const cols = selectedColumns && selectedColumns.length > 0
      ? selectedColumns
      : defaultHeaders;

    if (format === 'csv') {
      const headers = cols.map((c) => `"${c}"`);
      const rows = items.map((i) => {
        return cols
          .map((col) => {
            const val = (i as any)[col];
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',');
      });
      content = [headers.join(','), ...rows].join('\n');
      filename += '.csv';
      mimeType = 'text/csv';
    } else if (format === 'excel') {
      const headers = cols.join('\t');
      const rows = items.map((i) => {
        return cols
          .map((col) => {
            const val = (i as any)[col];
            if (val === null || val === undefined) return '';
            if (typeof val === 'boolean') return val ? 'YES' : 'NO';
            return String(val);
          })
          .join('\t');
      });
      content = [headers, ...rows].join('\n');
      filename += '.tsv';
      mimeType = 'text/tab-separated-values';
    } else if (format === 'json') {
      const filtered = items.map((i) => {
        const obj: Record<string, any> = {};
        cols.forEach((col) => {
          obj[col] = (i as any)[col];
        });
        return obj;
      });
      content = JSON.stringify(filtered, null, 2);
      filename += '.json';
      mimeType = 'application/json';
    } else if (format === 'sql') {
      const colDefs = cols.map((col) => {
        const isNum = items.some((item) => typeof (item as any)[col] === 'number');
        return `  ${col} ${isNum ? 'DECIMAL(10,2)' : 'TEXT'}`;
      });

      const sqlStatements = [
        '-- WebScrapeIQ MySQL / SQLite Data Dump',
        '-- Generated on: ' + new Date().toISOString(),
        '-- Columns: ' + cols.join(', '),
        '',
        'CREATE TABLE IF NOT EXISTS export_dataset (',
        colDefs.join(',\n'),
        ');',
        '',
      ];

      for (const i of items) {
        const values = cols.map((col) => {
          const val = (i as any)[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 1 : 0;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        sqlStatements.push(
          `INSERT INTO export_dataset (${cols.join(', ')}) VALUES (${values.join(', ')});`
        );
      }
      content = sqlStatements.join('\n');
      filename += '.sql';
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${items.length} records (${cols.length} columns) as ${filename}!`);
  };

  // Handler: Create Alert
  const handleCreateAlert = async (rule: Partial<AlertRule>) => {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create alert');
    showToast(`Alert rule '${data.alert.name}' activated!`);
    loadDatabaseData();
  };

  // Handler: Delete Alert
  const handleDeleteAlert = async (id: string) => {
    const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete alert');
    showToast('Alert rule removed.');
    loadDatabaseData();
  };

  // Handler: Test Trigger Email Alert
  const handleTriggerTestAlert = async (alertId?: string, recipient?: string) => {
    const res = await fetch('/api/alerts/test-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId,
        recipientEmail: recipient || currentUser.email,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to trigger alert');
    showToast(`Simulated alert email dispatched to ${data.recipient}!`);
    loadDatabaseData();
    return data;
  };

  // Handler: Run Python sandbox
  const handleRunPythonSandbox = async (scriptType: 'sqlite' | 'regex') => {
    const res = await fetch('/api/python/run-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptType }),
    });
    return await res.json();
  };

  // Handler: Login/Switch account
  const handleLogin = async (email: string, role = 'Admin') => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.user) {
      setCurrentUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: (role as any) || data.user.role,
        token: data.token,
      });
      showToast(`Welcome, ${data.user.name} (${role})`);
    }
  };

  const handleLogout = () => {
    setCurrentUser({
      id: 'guest',
      name: 'Guest Operator',
      email: 'operator@example.test',
      role: 'Scraper Operator',
      token: '',
    });
    showToast('Signed out of session');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-md text-xs">
          {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="h-4 w-4 text-cyan-400 shrink-0" />}
          <span className="text-slate-200">{toast.text}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar Contract (1 row, 3 zones) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        unreadAlertCount={alertEvents.length}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenNewScrape={() => setActiveTab('scraper')}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            alerts={alerts}
            alertEvents={alertEvents}
            onNavigateToScraper={() => setActiveTab('scraper')}
            onNavigateToCleaning={() => setActiveTab('cleaning')}
            onNavigateToSql={() => setActiveTab('database')}
            onTriggerTestAlert={handleTriggerTestAlert}
            onCreateAlert={handleCreateAlert}
            onRefreshData={loadDatabaseData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'scraper' && (
          <ScraperStudioView
            onRunScrape={handleRunScrape}
            isLoading={isLoading}
            crawlLogs={crawlLogs}
            extractedRawItems={rawItems}
            onProceedToCleaning={() => setActiveTab('cleaning')}
          />
        )}

        {activeTab === 'cleaning' && (
          <CleaningStudioView
            rawItems={rawItems}
            cleanedItems={cleanedItems}
            cleaningReport={cleaningReport}
            onExecuteCleaning={handleExecuteCleaning}
            onSaveToDatabase={handleSaveToDatabase}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseSqlView
            onRunQuery={handleRunQuery}
            onExportData={handleExportData}
            products={products}
            onImportSuccess={loadDatabaseData}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsManagerView
            alerts={alerts}
            events={alertEvents}
            onCreateAlert={handleCreateAlert}
            onDeleteAlert={handleDeleteAlert}
            onTriggerTestAlert={handleTriggerTestAlert}
            recipientEmail={currentUser.email}
          />
        )}

        {activeTab === 'python' && (
          <PythonSandboxView
            onRunPythonSandbox={handleRunPythonSandbox}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">WebScrapeIQ</span>
            <span>·</span>
            <span>Intelligent Scraping & Market Analytics</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
            <span>MySQL / SQLite Storage</span>
            <span>·</span>
            <span>Pandas & Regex Cleaning</span>
            <span>·</span>
            <span>Automated Price Alerts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
