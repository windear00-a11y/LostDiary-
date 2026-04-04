'use client';

import { useEffect } from 'react';

export function ErrorLogger() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
      };
    }
  }, []);

  return null;
}
