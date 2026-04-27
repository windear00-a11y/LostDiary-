'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/lib/store/use-ui-store';

export const KeyboardDetection = () => {
  const { setInputFocused } = useUIStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleFocusChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const activeEl = document.activeElement as HTMLElement;
        const isInput = activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          activeEl.isContentEditable
        );

        const isToolbar = activeEl && activeEl.closest('.formatting-toolbar');

        if (isInput || isToolbar) {
          setInputFocused(true);
        } else {
          const viewport = window.visualViewport;
          const MIN_KEYBOARD_HEIGHT = 150;
          const isKeyboardOpen = viewport ? (window.innerHeight - viewport.height > MIN_KEYBOARD_HEIGHT) : false;
          
          if (!isKeyboardOpen) {
            setInputFocused(false);
          }
        }
      }, 50);
    };

    const viewport = window.visualViewport;
    const handleResize = () => {
      if (!viewport) return;
      const MIN_KEYBOARD_HEIGHT = 150;
      const isKeyboardOpen = (window.innerHeight - viewport.height) > MIN_KEYBOARD_HEIGHT;
      
      if (isKeyboardOpen) {
        setInputFocused(true);
      } else {
        handleFocusChange();
      }
    };

    document.addEventListener('focusin', handleFocusChange);
    document.addEventListener('focusout', handleFocusChange);
    
    if (viewport) {
      viewport.addEventListener('resize', handleResize);
    }

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('focusin', handleFocusChange);
      document.removeEventListener('focusout', handleFocusChange);
      if (viewport) {
        viewport.removeEventListener('resize', handleResize);
      }
    };
  }, [setInputFocused]);

  return null;
};
