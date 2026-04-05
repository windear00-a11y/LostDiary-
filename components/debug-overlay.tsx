"use client";

import { useEffect, useState } from "react";

export default function DebugOverlay() {
  const [logs, setLogs] = useState<{ msg: string; type: "log" | "error" | "warn" }[]>([]);

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

    // Cleanup
    return () => {
      console.log = oldLog;
      console.error = oldError;
      console.warn = oldWarn;
    };
  }, []);

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      width: "100%",
      maxHeight: "40%",
      overflow: "auto",
      background: "black",
      color: "lime",
      fontSize: "12px",
      zIndex: 9999,
      padding: "5px"
    }}>
      {logs.map((log, i) => (
        <div key={i} style={{ color: log.type === "error" ? "red" : log.type === "warn" ? "orange" : "lime" }}>
          [{log.type}] {log.msg}
        </div>
      ))}
    </div>
  );
}
