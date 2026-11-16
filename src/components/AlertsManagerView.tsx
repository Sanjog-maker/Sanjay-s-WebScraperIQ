import React, { useState } from 'react';
import { AlertRule, AlertTriggerEvent } from '../types/scraper';
import {
  Bell,
  Plus,
  Mail,
  TrendingDown,
  CheckCircle2,
  Trash2,
  Send,
  Eye,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface AlertsManagerViewProps {
  alerts: AlertRule[];
  events: AlertTriggerEvent[];
  onCreateAlert: (rule: Partial<AlertRule>) => Promise<void>;
  onDeleteAlert: (id: string) => Promise<void>;
  onTriggerTestAlert: (alertId?: string, recipientEmail?: string) => Promise<{
    delivered: boolean;
    recipient: string;
    subject: string;
    emailHtml: string;
  }>;
  recipientEmail: string;
}

export const AlertsManagerView: React.FC<AlertsManagerViewProps> = ({
  alerts,
  events,
  onCreateAlert,
  onDeleteAlert,
  onTriggerTestAlert,
  recipientEmail,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<'price_drop' | 'stock_available'>('price_drop');
  const [newRuleValue, setNewRuleValue] = useState('300.00');
  const [newRuleEmail, setNewRuleEmail] = useState(recipientEmail);
  const [newPercentageDrop, setNewPercentageDrop] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email preview state
  const [emailPreview, setEmailPreview] = useState<{
    subject: string;
    html: string;
    recipient: string;
  } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateAlert({
        name: newRuleName,
        type: newRuleType,
        targetType: 'products',
        field: newRuleType === 'price_drop' ? 'price' : 'in_stock',
        operator: newRuleType === 'price_drop' ? 'less_than' : 'equals',
        value: newRuleType === 'price_drop' ? newRuleValue : '1',
        percentageDrop: newPercentageDrop,
        recipientEmail: newRuleEmail,
      });
      setShowCreateModal(false);
      setNewRuleName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestSend = async (alertId?: string) => {
    try {
      const res = await onTriggerTestAlert(alertId, recipientEmail);
      setEmailPreview({
        subject: res.subject,
        html: res.emailHtml,
        recipient: res.recipient,
      });
    } catch (err: any) {
      alert(`Error triggering test email: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Automated Alerts & Price Drop Tracking
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time triggers that dispatch automated email notifications when prices fall or items restock.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTestSend()}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Test Email Dispatcher</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Alert Rule</span>
          </button>
        </div>
      </div>

      {/* Email Preview Drawer if test triggered */}
      {emailPreview && (
        <div className="rounded-xl border border-cyan-500/40 bg-slate-900/90 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <Mail className="h-4 w-4" />
              <span>Automated Email Dispatched to: {emailPreview.recipient}</span>
            </div>
            <button
              onClick={() => setEmailPreview(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss Preview ✕
            </button>
          </div>
          <div className="text-xs font-semibold text-white">
            Subject: {emailPreview.subject}
          </div>
          <div
            className="rounded-lg bg-white text-slate-900 p-4 max-w-2xl mx-auto shadow-md"
            dangerouslySetInnerHTML={{ __html: emailPreview.html }}
          />
        </div>
      )}

      {/* Configured Rules Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">Active Alert Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                    {a.type === 'price_drop' ? (
                      <TrendingDown className="h-4 w-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                    <span>{a.type === 'price_drop' ? 'Price Drop Monitor' : 'Stock Availability Monitor'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">Active</span>
                </div>

                <h3 className="mt-2.5 text-sm font-semibold text-white">
                  {a.name}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Condition: {a.field || a.condition?.field} {(a.operator || a.condition?.operator || '').replace('_', ' ')} <span className="font-mono text-cyan-300">${a.value || a.condition?.value}</span>
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{a.recipientEmail}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <span className="text-[11px] font-mono text-slate-500">
                  Triggered: {a.triggerCount} times
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestSend(a.id)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Send Test
                  </button>
                  <button
                    onClick={() => onDeleteAlert(a.id)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                    title="Delete Alert"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dispatched Alert Delivery Log */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">
              Automated Alert Dispatch History
            </h3>
            <p className="text-xs text-slate-400">
              Complete audit log of triggered alerts and delivery status.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {events.length} logs recorded
          </span>
        </div>

        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No alerts logged yet. Run a scrape or click "Test Email Dispatcher" above!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Alert Rule</th>
                  <th className="px-4 py-2.5">Matched Product</th>
                  <th className="px-4 py-2.5 text-right">Old Price</th>
                  <th className="px-4 py-2.5 text-right">New Price</th>
                  <th className="px-4 py-2.5">Recipient</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-900/30">
                    <td className="px-4 py-2.5 text-cyan-300 font-medium">
                      {evt.alertName}
                    </td>
                    <td className="px-4 py-2.5 text-slate-200 truncate max-w-xs font-sans">
                      {evt.itemTitle}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">
                      ${evt.oldPrice ? evt.oldPrice.toFixed(2) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-400 font-bold tabular-nums">
                      ${evt.newPrice ? evt.newPrice.toFixed(2) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 truncate max-w-[150px]">
                      {evt.emailSentTo}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-center text-emerald-400">
                      Delivered ✓
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Create New Alert Rule</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Alert Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Sony XM5 Price Drop Alert"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Trigger Event Type
                </label>
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="price_drop">Price Drops Below Threshold</option>
                  <option value="stock_available">Item Returns to In-Stock</option>
                </select>
              </div>

              {newRuleType === 'price_drop' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Price Threshold ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient Notification Email
                </label>
                <input
                  type="email"
                  required
                  value={newRuleEmail}
                  onChange={(e) => setNewRuleEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Create & Activate Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
