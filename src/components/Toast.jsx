import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Toast = () => {
  const { toasts, removeToast } = useShop();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-item">
          {toast.type === 'success' && <CheckCircle2 size={18} color="#D4AC68" />}
          {toast.type === 'error' && <AlertCircle size={18} color="#C98278" />}
          {toast.type === 'info' && <Info size={18} color="#EADAB5" />}

          <span style={{ flexGrow: 1, lineHeight: 1.4 }}>{toast.message}</span>

          <button
            onClick={() => removeToast(toast.id)}
            style={{ color: 'rgba(250, 246, 238, 0.7)', padding: '0.2rem' }}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
