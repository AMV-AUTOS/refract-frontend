'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { ToastItem, ToastVariant } from '@/lib/toast/ToastProvider';

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-pm-green/40 bg-pm-panel text-pm-green',
  error: 'border-pm-red/40 bg-pm-panel text-pm-red',
  info: 'border-pm-panel/60 bg-pm-panel text-pm-text',
};

const VARIANT_ICON: Record<ToastVariant, string> = {
  success: '\u2713',
  error: '\u2715',
  info: '\u2139',
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [entered, setEntered] = useState(prefersReducedMotion);
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(toast.duration);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setEntered(true);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (paused || toast.duration <= 0) return;
    startedAtRef.current = Date.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), remainingRef.current);
    return () => {
      window.clearTimeout(timer);
      remainingRef.current -= Date.now() - startedAtRef.current;
      if (remainingRef.current < 0) remainingRef.current = 0;
    };
  }, [paused, toast.id, toast.duration, onDismiss]);

  const isAssertive = toast.variant === 'error';

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={[
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
        'transition duration-200 ease-out',
        VARIANT_STYLES[toast.variant],
        entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      ].join(' ')}
    >
      <span aria-hidden="true" className="mt-0.5 text-sm font-semibold">
        {VARIANT_ICON[toast.variant]}
      </span>
      <div className="flex-1 text-sm">
        {toast.title ? <p className="font-semibold">{toast.title}</p> : null}
        {toast.message ? <p className="text-pm-text/80">{toast.message}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded p-1 text-pm-text/60 transition hover:text-pm-text focus:outline-none focus-visible:ring-2 focus-visible:ring-pm-green"
      >
        <span aria-hidden="true">\u2715</span>
      </button>
    </div>
  );
}

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default Toast;
