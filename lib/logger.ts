// lib/logger.ts
import { serializeError } from './serializeError';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    const serializedArgs = args.map(arg => {
      if (arg instanceof Error || (typeof arg === 'object' && arg !== null && 'message' in arg)) {
        return serializeError(arg);
      }
      return arg;
    });
    console.error(...serializedArgs);
  },
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
};
