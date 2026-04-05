"use client";

import { useEffect, useState } from "react";

export default function DebugOverlay() {
  const [logs, setLogs] = useState<{ msg: string; type: "log" | "error" }[]>([]);

  useEffect(() => {
    const addLog = (msg: string, type: "log" | "error" = "log") => {
      setLogs((prev) => [...prev, { msg, type }]);
    };

    window.onerror = function (msg, url, line, col, error) {
      addLog(`${msg} at ${line}:${col}`, "error");
    };

    const oldLog = console.log;
    console.log = function (...args) {
      addLog(args.join(" "), "log");
      oldLog.apply(console, args);
    };

    // Cleanup to prevent memory leaks or multiple handlers
    return () => {
      console.log = oldLog;
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
        <div key={i} style={{ color: log.type === "error" ? "red" : "lime" }}>
          [{log.type}] {log.msg}
        </div>
      ))}
    </div>
  );
}
