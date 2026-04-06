/**
 * Global Client-Side Debugger & Logger
 * Optimized for Next.js Production Environments
 */

import { serializeError, safeStringify } from './serializeError';

interface LogEntry {
  type: 'ERROR' | 'API' | 'WARN' | 'INFO';
  message: string;
  timestamp: string;
  url: string;
  stack?: string;
  name?: string;
  line?: number;
  column?: number;
  metadata?: any;
}

declare global {
  interface Window {
    __logs__: LogEntry[];
  }
}

const LOG_ENDPOINT = '/api/log';
const MAX_BUFFER_SIZE = 50;

class Debugger {
  private static instance: Debugger;
  private isInitialized = false;

  private errorCount = 0;
  private lastErrorTime = 0;
  private lastAiTriggerTime = 0;
  private readonly ERROR_THRESHOLD = 3;
  private readonly ERROR_TIME_WINDOW = 10000; // 10 seconds
  private readonly AI_TRIGGER_DEBOUNCE = 60000; // 1 minute

  private constructor() {
    if (typeof window !== 'undefined') {
      window.__logs__ = window.__logs__ || [];
    }
  }

  public static getInstance(): Debugger {
    if (!Debugger.instance) {
      Debugger.instance = new Debugger();
    }
    return Debugger.instance;
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.setupErrorHandlers();
    this.setupFetchOverride();
    this.setupConsoleOverride();
    this.isInitialized = true;
    
    this.log('INFO', 'Debugger initialized');
  }

  private setupConsoleOverride() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      this.log('INFO', args.map(arg => typeof arg === 'object' ? safeStringify(arg) : String(arg)).join(' '));
      originalLog.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      this.log('WARN', args.map(arg => typeof arg === 'object' ? safeStringify(arg) : String(arg)).join(' '));
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      this.log('ERROR', args.map(arg => typeof arg === 'object' ? safeStringify(arg) : String(arg)).join(' '));
      originalError.apply(console, args);
    };
  }

  private setupErrorHandlers() {
    // 1. Capture Runtime Errors
    window.addEventListener('error', (event) => {
      const serialized = serializeError(event.error || event.message);
      this.log('ERROR', String(event.message), {
        ...serialized,
        line: event.lineno,
        column: event.colno,
        url: event.filename
      });
    });

    // 2. Capture Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      const serialized = serializeError(error);
      this.log('ERROR', serialized.message || 'Unhandled Rejection', {
        ...serialized,
        name: serialized.name || 'UnhandledRejection',
      });
    });
  }

  private setupFetchOverride() {
    const originalFetch = window.fetch;
    const SLOW_THRESHOLD = 3000; // 3 seconds
    
    window.fetch = async (...args) => {
      const start = performance.now();
      
      let url = '';
      let method = 'GET';
      
      try {
        const request = args[0];
        if (typeof request === 'string') {
          url = request;
        } else if (request instanceof URL) {
          url = request.href;
        } else if (request instanceof Request) {
          url = request.url;
          method = request.method;
        }
        
        if (args[1] && args[1].method) {
          method = args[1].method;
        }
        method = method.toUpperCase();
      } catch (e) {
        // Fallback if parsing fails
      }

      // Avoid logging our own logging endpoint to prevent infinite loops
      if (url && url.includes(LOG_ENDPOINT)) {
        return originalFetch(...args);
      }

      try {
        const response = await originalFetch(...args);
        const duration = Math.round(performance.now() - start);

        const isSlow = duration > SLOW_THRESHOLD;
        const isError = !response.ok;

        if (isError || isSlow) {
          const reason = isError ? 'Failed API Call' : 'Slow API Call';
          this.log('API', `${reason}: ${method} ${url}`, {
            metadata: {
              status: response.status,
              statusText: response.statusText,
              duration: `${duration}ms`,
              method,
              isSlow,
              isError
            }
          });
        }

        return response;
      } catch (error: any) {
        const duration = Math.round(performance.now() - start);
        this.log('API', `Network Error: ${method} ${url}`, {
          metadata: {
            error: error?.message || String(error),
            duration: `${duration}ms`,
            method
          }
        });
        throw error;
      }
    };
  }

  private log(type: LogEntry['type'], message: string, details: Partial<LogEntry> = {}) {
    const entry: LogEntry = {
      type,
      message,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      ...details
    };

    // Store in global buffer
    if (typeof window !== 'undefined') {
      window.__logs__.push(entry);
      if (window.__logs__.length > MAX_BUFFER_SIZE) {
        window.__logs__ = window.__logs__.slice(-MAX_BUFFER_SIZE);
      }
    }

    // Console output in dev
    if (process.env.NODE_ENV === 'development') {
      const color = type === 'ERROR' ? 'red' : type === 'API' ? 'orange' : 'blue';
      console.log(`%c[${type}] %c${message}`, `color: ${color}; font-weight: bold;`, 'color: inherit;', details);
    }

    // Send to server (non-blocking)
    if (type === 'ERROR' || type === 'API') {
      this.sendToServer(entry);
      
      if (type === 'ERROR' || (entry.metadata?.isError)) {
        this.checkAndTriggerAiDebug();
      }
    }
  }

  private async checkAndTriggerAiDebug() {
    const now = Date.now();

    // Reset error count if outside time window
    if (now - this.lastErrorTime > this.ERROR_TIME_WINDOW) {
      this.errorCount = 0;
    }

    this.errorCount++;
    this.lastErrorTime = now;

    // Check if we hit the threshold and if enough time has passed since last trigger
    if (this.errorCount >= this.ERROR_THRESHOLD && (now - this.lastAiTriggerTime > this.AI_TRIGGER_DEBOUNCE)) {
      this.lastAiTriggerTime = now;
      this.errorCount = 0; // Reset count after triggering

      try {
        this.log('INFO', 'Triggering automatic AI debug analysis due to multiple errors...');
        
        const rawFetch = Function('return fetch')(); // Bypass our override
        const response = await rawFetch('/api/ai-debug', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: window.__logs__.slice(-20) })
        });

        if (response.ok) {
          const data = await response.json();
          this.log('INFO', 'AI Debug Analysis Complete', {
            metadata: { analysis: data.analysis }
          });
        }
      } catch (e) {
        // Fail silently
      }
    }
  }

  private async sendToServer(entry: LogEntry) {
    try {
      const payload = safeStringify(entry);
      // Use navigator.sendBeacon if available for non-blocking "fire and forget"
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(LOG_ENDPOINT, blob);
      } else {
        // Fallback to fetch (using original to avoid recursion)
        const rawFetch = Function('return fetch')(); // Bypass our override
        rawFetch(LOG_ENDPOINT, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true // Ensure request completes even if page closes
        }).catch(() => {}); // Silently fail to avoid infinite loops
      }
    } catch (e) {
      // Fail silently
    }
  }
}

export const debuggerInstance = Debugger.getInstance();
