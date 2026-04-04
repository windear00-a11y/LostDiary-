'use client';

import { useEffect } from 'react';

export function ErrorLogger() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // API Logging & UI Error Display
      window.onerror = (message, url, line, column, error) => {
        fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            url,
            line,
            column,
            stack: error instanceof Error ? error.stack : undefined,
          }),
        });

        const log = document.createElement("p");
        log.style.color = "red";
        log.innerText = `ERROR: ${message}`;
        document.body.appendChild(log);
      };

      // UI Console Logging
      const oldLog = console.log;
      console.log = function (...args) {
        const log = document.createElement("p");
        log.style.color = "green";
        log.innerText = args.join(" ");
        document.body.appendChild(log);

        oldLog.apply(console, args);
      };
    }
  }, []);

  return null;
}
