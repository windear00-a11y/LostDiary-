"use client";

import { useEffect, useState } from "react";
import { Terminal, Copy, X, Minimize2, Maximize2 } from "lucide-react";

export default function DebugOverlay() {
  const [logs, setLogs] = useState<{ msg: string; type: "log" | "error" | "warn" }[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const addLog = (msg: string, type: "log" | "error" | "warn" = "log") => {
      setLogs((prev) => [...prev, { msg, type }]);
    };

    window.onerror = function (msg, url, line, col, error) {
      addLog(`${msg} at ${line}:${col}`, "error");
    };

    const oldLog = console.log;
    const oldError = console.error;
    const oldWarn = console.warn;

    console.log = function (...args) {
      addLog(args.join(" "), "log");
      oldLog.apply(console, args);
    };

    console.error = function (...args) {
      addLog(args.join(" "), "error");
      oldError.apply(console, args);
    };

    console.warn = function (...args) {
      addLog(args.join(" "), "warn");
      oldWarn.apply(console, args);
    };

    return () => {
      console.log = oldLog;
      console.error = oldError;
      console.warn = oldWarn;
    };
  }, []);

  const copyLogs = () => {
    const text = logs.map(l => `[${l.type}] ${l.msg}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-indigo-600 text-white rounded-full shadow-lg z-[9999] hover:bg-indigo-700 transition-colors"
      >
        <Terminal className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[60vh] bg-black text-lime-400 rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden border border-gray-800">
      <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800">
        <span className="text-xs font-bold uppercase tracking-widest">System Logs</span>
        <div className="flex items-center gap-2">
          <button onClick={copyLogs} className="p-1 hover:bg-gray-700 rounded"><Copy className="w-4 h-4" /></button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-700 rounded"><Minimize2 className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 font-mono text-xs space-y-1">
        {logs.map((log, i) => (
          <div key={i} className={log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-orange-400" : "text-lime-400"}>
            [{log.type}] {log.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
