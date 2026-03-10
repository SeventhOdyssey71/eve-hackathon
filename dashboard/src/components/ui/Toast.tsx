"use client";

import { createContext, useContext, useCallback, useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  txDigest?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
  txSuccess: (title: string, digest: string) => void;
  txError: (title: string, error: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS: Record<ToastType, string> = {
  success: "border-eve-green/30 bg-eve-green/5",
  error: "border-eve-red/30 bg-eve-red/5",
  warning: "border-eve-yellow/30 bg-eve-yellow/5",
  info: "border-eve-blue/30 bg-eve-blue/5",
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-eve-green",
  error: "text-eve-red",
  warning: "text-eve-yellow",
  info: "text-eve-blue",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  const explorerUrl = toast.txDigest
    ? `https://suiscan.xyz/testnet/tx/${toast.txDigest}`
    : null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg animate-slide-in",
        COLORS[toast.type]
      )}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", ICON_COLORS[toast.type])} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-eve-text">{toast.title}</div>
        {toast.description && (
          <div className="text-xs text-eve-text-dim mt-0.5 truncate">{toast.description}</div>
        )}
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-eve-orange hover:text-eve-orange-light mt-1 transition-colors"
          >
            View on Sui Explorer <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-eve-muted hover:text-eve-text transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-4), { ...t, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const txSuccess = useCallback(
    (title: string, digest: string) => {
      addToast({ type: "success", title, txDigest: digest, duration: 8000 });
    },
    [addToast]
  );

  const txError = useCallback(
    (title: string, error: string) => {
      addToast({ type: "error", title, description: error, duration: 8000 });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, txSuccess, txError }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
