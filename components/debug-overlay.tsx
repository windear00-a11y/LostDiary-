"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Terminal, Copy, X, Minimize2, Maximize2, Search, Filter, Sparkles, Loader2, Check, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

type LogType = "INFO" | "ERROR" | "WARN" | "API";
type ErrorCategory = "NETWORK" | "AUTH" | "CODE" | "UNKNOWN";

interface LogEntry {
  type: LogType;
  category?: ErrorCategory;
  message: string;
  meta?: any;
  time: string;
  actions?: string[];
}

export default function DebugOverlay() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<LogType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [fixCopied, setFixCopied] = useState(false);
  const actionsRef = useRef<string[]>([]);

  const addLog = useCallback((entry: Omit<LogEntry, "time" | "actions">) => {
    const newEntry: LogEntry = {
      ...entry,
      time: new Date().toISOString(),
      actions: [...actionsRef.current],
    };

    setLogs((prev) => [...prev, newEntry].slice(-100)); // Keep last 100 logs

    // Backend Sync
    if (typeof window !== "undefined") {
      fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      }).catch(() => {});
    }
  }, []);

  const categorizeError = (msg: string, meta?: any): ErrorCategory => {
    const message = msg.toLowerCase();
    if (message.includes("fetch") || message.includes("network") || meta?.status === 0) return "NETWORK";
    if (message.includes("401") || message.includes("403") || meta?.status === 401 || meta?.status === 403) return "AUTH";
    if (message.includes("undefined") || message.includes("null") || message.includes("is not a function")) return "CODE";
    return "UNKNOWN";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Session Tracking: Track last 10 user actions
    const trackAction = (e: MouseEvent | KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const className = typeof target.className === 'string' ? target.className : '';
      const action = `${e.type} on ${target.tagName}${target.id ? `#${target.id}` : ""}${className ? `.${className.split(" ")[0]}` : ""}`;
      actionsRef.current = [action, ...actionsRef.current].slice(0, 10);
    };

    window.addEventListener("click", trackAction);
    window.addEventListener("keydown", trackAction);

    // Global Error Handler
    const handleError = (event: ErrorEvent) => {
      addLog({
        type: "ERROR",
        category: categorizeError(event.message),
        message: event.message,
        meta: { filename: event.filename, lineno: event.lineno, colno: event.colno },
      });
    };

    window.addEventListener("error", handleError);

    // API Tracking: Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method || "GET").toUpperCase();

      // Skip logging for debug-related endpoints to avoid noise/loops
      if (url.includes("/api/log") || url.includes("/api/ai-debug")) {
        return originalFetch(...args);
      }

      try {
        const response = await originalFetch(...args);
        const logType: LogType = response.ok ? "API" : "ERROR";
        const category = response.ok ? undefined : categorizeError(`API ${response.status}`, { status: response.status });

        addLog({
          type: logType,
          category,
          message: `${method} ${url} - ${response.status}`,
          meta: { status: response.status, ok: response.ok },
        });

        return response;
      } catch (error: any) {
        addLog({
          type: "ERROR",
          category: "NETWORK",
          message: `Fetch failed: ${method} ${url}`,
          meta: { error: error.message },
        });
        throw error;
      }
    };

    // Structured Logging: Wrap console
    const oldLog = console.log;
    const oldError = console.error;
    const oldWarn = console.warn;

    console.log = (...args) => {
      addLog({ type: "INFO", message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ") });
      oldLog.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ");
      addLog({ type: "ERROR", category: categorizeError(message), message });
      oldError.apply(console, args);
    };

    console.warn = (...args) => {
      addLog({ type: "WARN", message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ") });
      oldWarn.apply(console, args);
    };

    return () => {
      window.removeEventListener("click", trackAction);
      window.removeEventListener("keydown", trackAction);
      window.removeEventListener("error", handleError);
      window.fetch = originalFetch;
      console.log = oldLog;
      console.error = oldError;
      console.warn = oldWarn;
    };
  }, [addLog]);

  const copyLogs = () => {
    const text = logs.map(l => `[${l.time}] [${l.type}]${l.category ? ` [${l.category}]` : ""} ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fixWithAI = async () => {
    if (logs.length === 0) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    setIsAnalysisExpanded(true);
    try {
      const res = await fetch("/api/ai-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: logs.slice(-20) }),
      });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setAnalysis("Failed to analyze logs with AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyFix = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis);
    setFixCopied(true);
    setTimeout(() => setFixCopied(false), 2000);
  };

  const filteredLogs = logs.filter(l => {
    const matchesFilter = filter === "ALL" || l.type === filter;
    const matchesSearch = l.message.toLowerCase().includes(search.toLowerCase()) || 
                         (l.category?.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-indigo-600 text-white rounded-full shadow-lg z-[9999] hover:bg-indigo-700 transition-all active:scale-95"
      >
        <Terminal className="w-6 h-6" />
        {logs.some(l => l.type === "ERROR") && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto w-auto sm:w-[450px] max-h-[80vh] bg-[#0F0F0F] text-gray-300 rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900/50 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-100">Debug System v2.0</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={copyLogs} 
            title="Copy Logs" 
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-gray-800 text-gray-400'}`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Copied!</span>
              </>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400"><Minimize2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-3 border-b border-gray-800 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-gray-800/50 border border-gray-700 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">ALL</option>
            <option value="INFO">INFO</option>
            <option value="ERROR">ERROR</option>
            <option value="API">API</option>
            <option value="WARN">WARN</option>
          </select>
        </div>
        <button 
          onClick={fixWithAI}
          disabled={isAnalyzing}
          className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
        >
          {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isAnalyzing ? "Analyzing..." : "Fix with AI"}
        </button>
      </div>

      {/* Analysis Section */}
      {analysis && (
        <div className="m-3 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl relative overflow-hidden group transition-all duration-300">
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <button 
              onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
              title={isAnalysisExpanded ? "Collapse" : "Expand"}
            >
              {isAnalysisExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={copyFix} 
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 ${fixCopied ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-gray-400'}`}
              title="Copy Fix"
            >
              {fixCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            <button onClick={() => setAnalysis(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-3 h-3" /></button>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">AI Debug Analysis</span>
            {!isAnalysisExpanded && <span className="text-[9px] text-indigo-400/60 italic ml-2">(Collapsed)</span>}
          </div>

          {isAnalysisExpanded && (
            <>
              <div className="text-[11px] text-gray-300 max-h-60 overflow-auto custom-scrollbar leading-relaxed prose prose-invert prose-xs max-w-none animate-in fade-in slide-in-from-top-2 duration-300">
                <ReactMarkdown
                  components={{
                    h3: ({ children }) => <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mt-4 mb-2 first:mt-0">{children}</h3>,
                    code: ({ children }) => <code className="bg-black/40 px-1 py-0.5 rounded text-indigo-300 font-mono">{children}</code>,
                    pre: ({ children }) => <pre className="bg-black/60 p-3 rounded-lg my-2 overflow-x-auto border border-white/5 font-mono text-[10px]">{children}</pre>,
                    ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                    li: ({ children }) => <li className="text-gray-400">{children}</li>,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>
                  }}
                >
                  {analysis}
                </ReactMarkdown>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between animate-in fade-in duration-500">
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-300/60 font-medium italic">
                  <ExternalLink className="w-3 h-3" />
                  Follow the &quot;Next Steps&quot; to resolve the issue.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Logs List */}
      <div className="flex-1 overflow-auto p-3 font-mono text-[10px] space-y-2 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-600">
            <Terminal className="w-8 h-8 mb-2 opacity-20" />
            <p>No logs found</p>
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className="group border-b border-gray-800/50 pb-2 last:border-0">
              <div className="flex items-center gap-2 mb-1 opacity-80">
                <span className="text-gray-600 shrink-0">[{new Date(log.time).toLocaleTimeString()}]</span>
                <span className={`font-bold shrink-0 ${
                  log.type === "ERROR" ? "text-red-400" : 
                  log.type === "WARN" ? "text-orange-400" : 
                  log.type === "API" ? "text-blue-400" : "text-lime-400"
                }`}>
                  [{log.type}]
                </span>
                {log.category && (
                  <span className="bg-gray-800 px-1 rounded text-[9px] font-bold text-gray-400 shrink-0">
                    {log.category}
                  </span>
                )}
              </div>
              <div className={`break-all leading-relaxed ${
                log.type === "ERROR" ? "text-red-400" : 
                log.type === "WARN" ? "text-orange-400" : 
                log.type === "API" ? "text-blue-400" : "text-lime-400"
              }`}>
                {log.message}
              </div>
              {log.meta && Object.keys(log.meta).length > 0 && (
                <div className="mt-1 text-gray-500 italic truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                  meta: {JSON.stringify(log.meta)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
