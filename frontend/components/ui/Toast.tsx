'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Info, XCircle, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

let addToastFn: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function toast(message: string, type: Toast['type'] = 'info', duration = 4000) {
  if (addToastFn) addToastFn({ message, type, duration });
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, t.duration ?? 4000);
    };

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      addToastFn?.(detail);
    };

    window.addEventListener('rf:toast', handler);
    return () => {
      window.removeEventListener('rf:toast', handler);
      addToastFn = null;
    };
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 animate-slide-in"
        >
          {t.type === 'success' && <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />}
          {t.type === 'error' && <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />}
          {t.type === 'info' && <Info size={18} className="text-[#F97316] mt-0.5 shrink-0" />}
          <p className="text-sm text-gray-800 flex-1">{t.message}</p>
          <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
