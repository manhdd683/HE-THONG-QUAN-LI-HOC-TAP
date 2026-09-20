import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastContextType {
  showSuccess: (text: string) => void;
  showError: (text: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    
    // Auto remove after 3s for success, 5s for error
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, type === 'success' ? 3000 : 5000);
  }, []);

  const showSuccess = useCallback((text: string) => showToast(text, 'success'), [showToast]);
  const showError = useCallback((text: string) => showToast(text, 'error'), [showToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      
      {/* GLOBAL TOAST RENDERER */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999
      }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{
            backgroundColor: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
