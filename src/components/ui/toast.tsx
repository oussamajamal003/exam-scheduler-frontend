import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconClass = "size-5";

  switch (type) {
    case 'success':
      return <CheckCircle className={cn(iconClass, "text-green-600")} />;
    case 'error':
      return <AlertCircle className={cn(iconClass, "text-red-600")} />;
    case 'warning':
      return <AlertTriangle className={cn(iconClass, "text-yellow-600")} />;
    case 'info':
      return <Info className={cn(iconClass, "text-blue-600")} />;
    default:
      return null;
  }
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300); // Allow time for exit animation
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-none border p-4 pr-8 shadow-lg transition-all duration-300",
        "bg-white border-zinc-200",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        toast.type === 'success' && "border-green-200 bg-green-50",
        toast.type === 'error' && "border-red-200 bg-red-50",
        toast.type === 'warning' && "border-yellow-200 bg-yellow-50",
        toast.type === 'info' && "border-blue-200 bg-blue-50"
      )}
    >
      <div className="flex items-start space-x-3">
        <ToastIcon type={toast.type} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-950">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm text-zinc-600">{toast.description}</p>
          )}
        </div>
      </div>
      <button
        onClick={handleClose}
        className="absolute right-2 top-2 rounded-none p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col space-y-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};