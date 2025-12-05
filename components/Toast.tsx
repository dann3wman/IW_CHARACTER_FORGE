import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, JSX.Element> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden />,
  error: <AlertTriangle className="w-4 h-4 text-red-400" aria-hidden />,
  info: <Info className="w-4 h-4 text-mythic-300" aria-hidden />,
};

const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => onDismiss(toast.id), 4500)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-xs" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl px-3 py-2 flex items-start gap-2 text-sm"
          role="status"
        >
          <span className="mt-0.5">{ICONS[toast.type]}</span>
          <p className="text-gray-100 flex-1">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-gray-500 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
