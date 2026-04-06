/**
 * Utility to serialize Error objects for logging.
 * Error properties like 'message' and 'stack' are non-enumerable,
 * which is why JSON.stringify(new Error()) returns "{}".
 */

// Helper to safely stringify objects with circular references
export function safeStringify(obj: any, indent?: number): string {
  const cache = new Set();
  try {
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) {
            return '[Circular Reference]';
          }
          cache.add(value);
        }
        // Handle BigInt which JSON.stringify cannot serialize natively
        if (typeof value === 'bigint') {
          return value.toString() + 'n';
        }
        return value;
      },
      indent
    );
  } catch (err) {
    return '[Unserializable Object]';
  }
}

export function serializeError(error: unknown) {
  if (error instanceof Error) {
    const customProps: Record<string, any> = {};
    
    // Safely extract custom properties
    try {
      for (const key of Object.keys(error)) {
        if (!['name', 'message', 'stack', 'cause'].includes(key)) {
          customProps[key] = (error as any)[key];
        }
      }
    } catch (e) {
      // Ignore extraction errors
    }

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause ? serializeError(error.cause) : undefined,
      ...customProps,
    };
  }

  if (typeof error === 'string') {
    return { message: error, name: 'StringError' };
  }

  if (typeof error === 'object' && error !== null) {
    try {
      // Handle objects that might not be Error instances but have error-like shapes
      return {
        message: (error as any).message || safeStringify(error),
        name: (error as any).name || 'ObjectError',
        stack: (error as any).stack,
      };
    } catch {
      return { message: '[Unserializable Object]', name: 'UnserializableObject' };
    }
  }

  return { message: String(error), name: 'UnknownError' };
}
