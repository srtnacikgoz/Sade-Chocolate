import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ModalPortal } from '../ui/ModalPortal';
import { DistanceSalesAgreement } from './DistanceSalesAgreement';

interface BuyerInfo {
  fullName: string;
  address: string;
  phone: string;
  email: string;
}

interface SellerInfo {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  taxOffice?: string;
  taxNumber?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceInfo {
  type: 'individual' | 'corporate';
  fullName?: string;
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  tcKimlikNo?: string;
  address: string;
  phone: string;
  email: string;
}

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyer: BuyerInfo;
  seller: SellerInfo;
  items: OrderItem[];
  shippingCost: number;
  totalAmount: number;
  invoice: InvoiceInfo;
}

export const AgreementModal: React.FC<AgreementModalProps> = ({
  isOpen,
  onClose,
  buyer,
  seller,
  items,
  shippingCost,
  totalAmount,
  invoice
}) => {
  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <ModalPortal isOpen={isOpen}>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-modal-title"
        className="fixed inset-4 md:inset-8 lg:inset-12 bg-white dark:bg-dark-900 rounded-2xl shadow-2xl z-[1001] flex flex-col animate-slide-up overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-cream-50 dark:bg-dark-800">
          <h2 id="agreement-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
            Mesafeli Satış Sözleşmesi
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
            aria-label="Kapat"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <DistanceSalesAgreement
            buyer={buyer}
            seller={seller}
            items={items}
            shippingCost={shippingCost}
            totalAmount={totalAmount}
            invoice={invoice}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-cream-50 dark:bg-dark-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-brown-900 dark:bg-gold text-white dark:text-dark-900 rounded-xl font-medium hover:bg-brown-800 dark:hover:bg-gold-400 transition-colors"
          >
            Okudum, Anladım
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default AgreementModal;
