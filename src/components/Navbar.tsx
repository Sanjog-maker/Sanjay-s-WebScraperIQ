import React from 'react';
import { AuthUser } from '../types/scraper';
import { Bell, Database, Terminal, Sparkles, UserCheck, LogOut } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: AuthUser;
  unreadAlertCount: number;
  onOpenAuth: () => void;
  onOpenNewScrape: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  unreadAlertCount,
  onOpenAuth,
  onOpenNewScrape,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'scraper', label: 'Scraper Studio' },
    { id: 'cleaning', label: 'Data Cleaning' },
    { id: 'database', label: 'SQL & Database' },
    { id: 'alerts', label: 'Price Alerts' },
    { id: 'python', label: 'Python Scripts' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Database className="h-4 w-4" />
            </span>
            <span className="text-slate-100">WebScrapeIQ</span>
          </a>
          <span className="hidden lg:inline text-xs text-slate-500 font-mono">v2.4·ETL</span>
        </div>

        {/* Zone 2: 4-6 text navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {item.id === 'alerts' && unreadAlertCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono font-medium text-amber-400 border border-amber-500/30">
                    {unreadAlertCount}
                  </span>
                )}
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-[19px] h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewScrape}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-all hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Scrape Job</span>
          </button>

          {/* User profile dropdown trigger */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            title="Account & Role Settings"
          >
            <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 text-xs font-semibold border border-slate-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden xl:inline max-w-[130px] truncate font-medium">
              {user.name}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-900 px-4 py-2 gap-2 bg-slate-950/60 text-xs scrollbar-none">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1 rounded whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                : 'text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
