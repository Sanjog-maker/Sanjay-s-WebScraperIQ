import React, { useState } from 'react';
import { AuthUser } from '../types/scraper';
import { User, Shield, KeyRound, LogOut, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onLogin: (email: string, role?: string) => Promise<void>;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Lead Analyst' | 'Scraper Operator'>(currentUser.role);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onLogin(email, role);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSwitch = async (targetEmail: string, targetRole: 'Admin' | 'Lead Analyst' | 'Scraper Operator') => {
    setEmail(targetEmail);
    setRole(targetRole);
    setIsSubmitting(true);
    try {
      await onLogin(targetEmail, targetRole);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">User Authentication & Roles</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>

        {/* Current Active User Profile */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Authenticated Session</span>
            <span className="text-[11px] font-mono text-emerald-400 font-medium">Session Active</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="h-10 w-10 rounded-full bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{currentUser.name}</div>
              <div className="text-xs text-slate-400 font-mono">{currentUser.email}</div>
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
            <span>Role: <strong className="text-cyan-300">{currentUser.role}</strong></span>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-xs text-rose-400 hover:underline flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Quick Profile Switcher:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickSwitch('admin@example.test', 'Admin')}
              className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/80 text-left hover:border-cyan-500/50 transition-colors"
            >
              <div className="text-xs font-semibold text-white">Sanjay (Admin)</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">sanjayparvathynathan...</div>
            </button>
            <button
              onClick={() => handleQuickSwitch('analyst@example.test', 'Lead Analyst')}
              className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/80 text-left hover:border-cyan-500/50 transition-colors"
            >
              <div className="text-xs font-semibold text-white">Lead Analyst</div>
              <div className="text-[10px] text-slate-500 font-mono">analyst@example.test</div>
            </button>
          </div>
        </div>

        {/* Custom Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              User Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Role Permission
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Admin">Admin (Full Scraper, DB & Alert Access)</option>
              <option value="Lead Analyst">Lead Analyst (Read & SQL Query)</option>
              <option value="Scraper Operator">Scraper Operator (Crawl Executions)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-cyan-500 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In / Switch Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
