// @ts-nocheck
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
      <div className="toast-container">
        {toasts.map((toast) => {
          const duration = toast.type === 'success' ? 3000 : 5000;
          return (
            <div key={toast.id} className="toast-item">
              <button 
                className="toast-close" 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              >
                <AlertCircle size={14} style={{ opacity: 0 }} /> {/* Placeholder, use actual X icon if imported, else just HTML entity */}
                <span style={{ position: 'absolute' }}>×</span>
              </button>
              <div className="toast-content">
                <div className={`toast-icon ${toast.type}`}>
                  {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="toast-message">
                  {toast.text}
                </div>
              </div>
              <div 
                className={`toast-progress ${toast.type}`} 
                style={{ animationDuration: `${duration}ms` }}
              ></div>
            </div>
          );
        })}
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
