import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, RotateCcw } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Toast = () => {
  const { toasts, removeToast, isCheckoutOpen } = useShop();

  // Keep UPI QR codes and mobile checkout surfaces unobstructed by non-error popups
  const visibleToasts = isCheckoutOpen ? (toasts || []).filter((t) => t.type === 'error') : (toasts || []);
  if (visibleToasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="toast-item">
          {toast.type === 'success' && <CheckCircle2 size={18} color="#D4AC68" style={{ flexShrink: 0 }} />}
          {toast.type === 'error' && <AlertCircle size={18} color="#C98278" style={{ flexShrink: 0 }} />}
          {toast.type === 'info' && <Info size={18} color="#EADAB5" style={{ flexShrink: 0 }} />}

          <span style={{ flexGrow: 1, lineHeight: 1.4 }}>{toast.message}</span>

          {toast.actionLabel && typeof toast.onAction === 'function' && (
            <button
              onClick={() => {
                removeToast(toast.id);
                toast.onAction();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.28rem 0.65rem',
                backgroundColor: 'rgba(212, 172, 104, 0.2)',
                border: '1px solid #D4AC68',
                color: '#EADAB5',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: '2px',
                cursor: 'pointer',
                flexShrink: 0,
                minHeight: '30px'
              }}
            >
              <RotateCcw size={11} />
              <span>{toast.actionLabel}</span>
            </button>
          )}

          <button
            onClick={() => removeToast(toast.id)}
            style={{ color: 'rgba(250, 246, 238, 0.7)', padding: '0.25rem', flexShrink: 0 }}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
