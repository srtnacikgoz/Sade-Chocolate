import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variants = {
    success: {
      icon: <CheckCircle2 size={20} />,
      bg: 'bg-brand-green/90 dark:bg-brand-green/80',
      text: 'text-white',
      iconColor: 'text-white'
    },
    error: {
      icon: <AlertCircle size={20} />,
      bg: 'bg-red-500/90 dark:bg-red-600/80',
      text: 'text-white',
      iconColor: 'text-white'
    },
    info: {
      icon: <Info size={20} />,
      bg: 'bg-brand-blue/90 dark:bg-brand-blue/80',
      text: 'text-white',
      iconColor: 'text-white'
    }
  };

  const variant = variants[type];

  return (
    <div
      className={`${variant.bg} ${variant.text} px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md animate-slide-up backdrop-blur-sm`}
    >
      <div className={variant.iconColor}>
        {variant.icon}
      </div>
      <p className="flex-1 text-sm font-medium leading-relaxed">
        {message}
      </p>
      <button
        onClick={onClose}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};
