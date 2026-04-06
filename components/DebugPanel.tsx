'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, X, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

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

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Sync logs from window.__logs__
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.__logs__) {
        // Only update if length changed to avoid unnecessary re-renders
        if (window.__logs__.length !== logs.length) {
          setLogs([...window.__logs__].reverse());
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [logs.length]);

  const clearLogs = () => {
    if (typeof window !== 'undefined' && window.__logs__) {
      window.__logs__ = [];
      setLogs([]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current) {
      setIsDragging(true);
      const rect = dragRef.current.getBoundingClientRect();
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      // Calculate position from bottom-right
      const x = window.innerWidth - e.clientX - (dragRef.current?.offsetWidth || 0) + offsetRef.current.x;
      const y = window.innerHeight - e.clientY - (dragRef.current?.offsetHeight || 0) + offsetRef.current.y;
      
      setPosition({
        x: Math.max(0, x),
        y: Math.max(0, y)
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] p-3 bg-gray-900 text-white rounded-full shadow-xl border border-gray-700 hover:scale-110 transition-transform active:scale-95"
        style={{ transform: `translate(-${position.x}px, -${position.y}px)` }}
      >
        <Terminal size={20} />
        {logs.some(l => l.type === 'ERROR') && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" />
        )}
      </button>
    );
  }

  return (
    <div
      ref={dragRef}
      className={`fixed z-[9999] bg-gray-900 text-gray-300 rounded-xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden transition-all duration-200 ${
        isMinimized ? 'h-12 w-64' : 'h-[400px] w-[350px] sm:w-[450px]'
      }`}
      style={{ 
        bottom: '1rem', 
        right: '1rem',
        transform: `translate(-${position.x}px, -${position.y}px)`,
        userSelect: isDragging ? 'none' : 'auto'
      }}
    >
      {/* Header / Drag Handle */}
      <div 
        className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-gray-500" />
          <Terminal size={14} className="text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Debug Console</span>
          <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">
            {logs.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button 
            onClick={clearLogs}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-500 hover:text-red-400"
            title="Clear Logs"
          >
            <Trash2 size={14} />
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-500 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto p-2 font-mono text-[10px] space-y-1.5 custom-scrollbar bg-black/20">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 italic">
              No logs captured yet
            </div>
          ) : (
            logs.map((log, i) => (
              <div 
                key={`${log.timestamp}-${i}`} 
                className={`p-1.5 rounded border-l-2 ${
                  log.type === 'ERROR' ? 'bg-red-500/10 border-red-500 text-red-200' :
                  log.type === 'API' ? 'bg-blue-500/10 border-blue-500 text-blue-200' :
                  log.type === 'WARN' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-200' :
                  'bg-gray-800/50 border-gray-600 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5 opacity-60">
                  <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="font-bold">{log.type}</span>
                </div>
                <div className="break-all whitespace-pre-wrap">{log.message}</div>
                {log.metadata && (
                  <div className="mt-1 text-[9px] opacity-50 overflow-hidden text-ellipsis">
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
                {log.stack && (
                  <details className="mt-1">
                    <summary className="cursor-pointer hover:underline opacity-50">Stack Trace</summary>
                    <pre className="mt-1 p-1 bg-black/40 rounded overflow-x-auto text-[8px] leading-tight">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
