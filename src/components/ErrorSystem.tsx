import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, Clock, WifiOff, CheckCircle2, X } from 'lucide-react';

// --- Types ---

export type ErrorType = '429' | 'CONNECTION_CLOSED' | 'GENERAL' | null;

interface ErrorState {
  type: ErrorType;
  message: string;
  details?: string;
}

// --- Global Error Bus ---
// Simple event emitter for global error handling
type ErrorListener = (error: ErrorState) => void;
const listeners = new Set<ErrorListener>();

// Monkey-patch WebSocket to intercept errors globally
try {
  if (window.WebSocket) {
    const OriginalWebSocket = window.WebSocket;
    
    // Use a proxy to intercept the constructor call
    const WebSocketProxy = new Proxy(OriginalWebSocket, {
      construct(target, args) {
        // @ts-ignore
        const ws = new target(...args);
        
        ws.addEventListener('error', () => {
          globalErrorBus.emit({
            type: 'CONNECTION_CLOSED',
            message: 'WebSocket 连接错误',
            details: 'ERR_CONNECTION_CLOSED'
          });
        });

        ws.addEventListener('close', (event: any) => {
          if (!event.wasClean) {
            globalErrorBus.emit({
              type: 'CONNECTION_CLOSED',
              message: 'WebSocket 连接意外关闭',
              details: `Code: ${event.code}`
            });
          }
        });

        return ws;
      }
    });

    // Try to overwrite the global WebSocket property
    try {
      // @ts-ignore
      window.WebSocket = WebSocketProxy;
    } catch (e) {
      // If direct assignment fails (e.g. read-only getter), try defineProperty
      Object.defineProperty(window, 'WebSocket', {
        value: WebSocketProxy,
        configurable: true,
        writable: true
      });
    }
  }
} catch (e) {
  console.error("Failed to globally intercept WebSocket errors:", e);
}

export const globalErrorBus = {
  emit: (error: ErrorState) => {
    listeners.forEach(l => l(error));
    
    // Logging 429 errors
    if (error.type === '429') {
      const logs = JSON.parse(localStorage.getItem('bagforge_429_logs') || '[]');
      logs.push({
        timestamp: new Date().toISOString(),
        context: window.location.pathname + window.location.hash,
        message: error.message,
        details: error.details
      });
      localStorage.setItem('bagforge_429_logs', JSON.stringify(logs.slice(-50))); // Keep last 50
    }
  },
  subscribe: (listener: ErrorListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

// --- Components ---

/**
 * CountDownTimer for 429 Rate Limit
 */
export const CountDownTimer: React.FC<{ seconds: number }> = ({ seconds }) => {
  if (seconds <= 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-500/20 border border-slate-500/30 rounded-lg text-slate-200 text-xs animate-in fade-in slide-in-from-top-1">
      <Clock size={14} className="animate-pulse" />
      <span>频率过高，请等待 {seconds}s 后重试</span>
    </div>
  );
};

/**
 * ReconnectGuide for Connection Closed
 */
export const ReconnectGuide: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 animate-in zoom-in-95 duration-300">
      <div className="flex items-center gap-2 font-bold">
        <WifiOff size={18} />
        <span>连接已断开 (ERR_CONNECTION_CLOSED)</span>
      </div>
      <p className="text-xs opacity-80">网络连接不稳定或服务器已关闭连接。请检查您的网络设置或刷新页面。</p>
      <button 
        onClick={() => window.location.reload()}
        className="flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-red-500/40 hover:bg-red-500/60 rounded-lg text-sm font-medium transition-colors"
      >
        <RefreshCw size={14} />
        <span>立即刷新</span>
      </button>
    </div>
  );
};

/**
 * StatusBar Component
 */
export const StatusBar: React.FC<{ error?: ErrorState | null, onClear?: () => void }> = ({ error, onClear }) => {
  if (error) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-red-600 border border-red-500 rounded-lg text-white text-xs font-medium shadow-lg animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{error.message} {error.details ? `(${error.details})` : ''}</span>
        </div>
        <button onClick={onClear} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <X size={14} />
        </button>
      </div>
    );
  }

  return null;
};

/**
 * Global Error Interceptor Hook
 */
export const useErrorInterceptor = () => {
  const [error, setError] = useState<ErrorState | null>(null);
  const [busyCountdown, setBusyCountdown] = useState(0);

  useEffect(() => {
    const unsubscribe = globalErrorBus.subscribe((err) => {
      setError(err);
      if (err.type === '429') {
        setBusyCountdown(15);
      }
    });
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    if (busyCountdown > 0) {
      const timer = setTimeout(() => setBusyCountdown(busyCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [busyCountdown]);

  const clearError = useCallback(() => {
    setError(null);
    setBusyCountdown(0);
  }, []);

  return { error, clearError, busyCountdown };
};
