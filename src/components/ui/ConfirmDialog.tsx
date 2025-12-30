import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'warning'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: {
      icon: <AlertTriangle size={24} className="text-red-600" />,
      iconBg: 'bg-red-50 dark:bg-red-900/20',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      border: 'border-red-200 dark:border-red-800'
    },
    warning: {
      icon: <AlertTriangle size={24} className="text-brand-orange" />,
      iconBg: 'bg-brand-orange/10',
      button: 'bg-brand-orange hover:bg-brand-mustard text-white',
      border: 'border-brand-orange/30'
    },
    info: {
      icon: <Info size={24} className="text-brand-blue" />,
      iconBg: 'bg-brand-blue/10',
      button: 'bg-brand-blue hover:bg-blue-500 text-white',
      border: 'border-brand-blue/30'
    },
    success: {
      icon: <CheckCircle2 size={24} className="text-brand-green" />,
      iconBg: 'bg-brand-green/10',
      button: 'bg-brand-green hover:bg-green-500 text-white',
      border: 'border-brand-green/30'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Dialog */}
      <div className="relative bg-white dark:bg-dark-800 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-slide-up">
        {/* Header with Icon */}
        <div className={`p-6 border-b border-gray-100 dark:border-gray-700 ${styles.border}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-display text-brown-900 dark:text-white italic mb-1">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 dark:bg-dark-900 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-3 rounded-2xl text-sm font-medium transition-colors shadow-lg ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
