import React, { useState, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Play,
  Terminal,
  FileCode,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface PythonSandboxViewProps {
  onRunPythonSandbox: (scriptType: 'sqlite' | 'regex') => Promise<{
    stdout: string;
    stderr: string;
    success: boolean;
  }>;
}

export const PythonSandboxView: React.FC<PythonSandboxViewProps> = ({
  onRunPythonSandbox,
}) => {
  const [activeScriptTab, setActiveScriptTab] = useState<'scraper' | 'cleaner' | 'database' | 'streamlit' | 'requirements'>('scraper');
  const [scripts, setScripts] = useState<Record<string, string>>({
    scraper: '# Loading scraper.py...',
    cleaner: '# Loading cleaner.py...',
    database: '# Loading database.py...',
    streamlit: '# Loading app.py...',
    requirements: '# Loading requirements.txt...',
  });
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');

  useEffect(() => {
    fetch('/api/python/scripts')
      .then((res) => res.json())
      .then((data) => {
        setScripts(data);
      })
      .catch((err) => console.error('Failed to load python scripts:', err));
  }, []);

  const handleCopy = () => {
    const content = scripts[activeScriptTab] || '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filenameMap: Record<string, string> = {
      scraper: 'scraper.py',
      cleaner: 'cleaner.py',
      database: 'database.py',
      streamlit: 'app.py',
      requirements: 'requirements.txt',
    };
    const content = scripts[activeScriptTab] || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filenameMap[activeScriptTab];
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteSandbox = async (type: 'sqlite' | 'regex') => {
    setIsRunning(true);
    setTerminalOutput(`[WebScrapeIQ] Executing Python 3 script (${type})...\n`);
    try {
      const res = await onRunPythonSandbox(type);
      setTerminalOutput(res.stdout || res.stderr || 'Python script executed with no output.');
    } catch (err: any) {
      setTerminalOutput(`Error executing sandbox: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const tabs = [
    { id: 'scraper', label: 'scraper.py (Requests + BS4 + Selenium)', file: 'scraper.py' },
    { id: 'cleaner', label: 'cleaner.py (Pandas + Regex)', file: 'cleaner.py' },
    { id: 'database', label: 'database.py (SQLite & MySQL)', file: 'database.py' },
    { id: 'streamlit', label: 'app.py (Streamlit Dashboard)', file: 'app.py' },
    { id: 'requirements', label: 'requirements.txt', file: 'requirements.txt' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Python Web Scraping & Streamlit Architecture
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Export ready-to-run Python pipelines using Requests, BeautifulSoup, Selenium, Pandas, MySQL, and Streamlit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExecuteSandbox('sqlite')}
            disabled={isRunning}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50 transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-cyan-400" />
            <span>Test Run in Python Sandbox</span>
          </button>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        {/* Subtabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveScriptTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                  activeScriptTab === tab.id
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.file}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code Content Box */}
        <div className="relative">
          <pre className="h-[420px] overflow-auto rounded-lg border border-slate-800/80 bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed">
            <code>{scripts[activeScriptTab]}</code>
          </pre>
        </div>
      </div>

      {/* Python Sandbox Runner & Output Terminal */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Live Python 3 Execution Terminal (Sandbox)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExecuteSandbox('sqlite')}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white"
            >
              Run SQLite Verifier
            </button>
            <button
              onClick={() => handleExecuteSandbox('regex')}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white"
            >
              Run Regex Cleaner Demo
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-950 p-4 font-mono text-xs text-emerald-400 min-h-[140px] whitespace-pre-wrap">
          {terminalOutput || (
            <span className="text-slate-600">
              Click 'Run SQLite Verifier' or 'Run Regex Cleaner Demo' to test Python 3 script execution directly inside the server sandbox!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
