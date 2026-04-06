'use client';

import { useEffect } from 'react';
import { debuggerInstance } from '@/lib/debugger';

export function DebuggerInitializer() {
  useEffect(() => {
    // Initialize the global debugger on the client side
    debuggerInstance.init();
  }, []);

  return null; // This component doesn't render anything
}
