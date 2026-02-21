import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

interface IyzicoCheckoutModalProps {
  isOpen: boolean;
  checkoutFormContent: string;
  token: string;
  orderId: string;
  onClose: () => void;
  onPaymentComplete?: (result: { status: 'success' | 'failed'; orderId: string }) => void; // Artık kullanılmıyor, callback redirect ile yönetiliyor
}

export const IyzicoCheckoutModal: React.FC<IyzicoCheckoutModalProps> = ({
  isOpen,
  checkoutFormContent,
  token,
  orderId,
  onClose,
  onPaymentComplete
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // İyzico form'u inject et ve script'leri çalıştır
  useEffect(() => {
    if (!isOpen || !checkoutFormContent) return;

    setIsLoading(true);

    // Checkout form content'i body'ye inject et (İyzico kendi modal'ını oluşturacak)
    const tempDiv = document.createElement('div');
    tempDiv.id = 'iyzico-checkout-container';
    tempDiv.innerHTML = checkoutFormContent;

    // Script'leri ayır ve sonra ekle (DOM'a eklenince çalışması için)
    const scripts = tempDiv.querySelectorAll('script');
    const scriptContents: string[] = [];

    scripts.forEach(script => {
      if (script.textContent) {
        scriptContents.push(script.textContent);
      }
      script.remove();
    });

    // Container'ı body'ye ekle
    document.body.appendChild(tempDiv);

    // Script'leri çalıştır
    scriptContents.forEach(content => {
      const newScript = document.createElement('script');
      newScript.textContent = content;
      document.body.appendChild(newScript);
    });

    // İyzico form yüklendiğinde loading'i kapat
    const checkIframeLoaded = setInterval(() => {
      const iframe = document.querySelector('#iyzico-checkout-container iframe, #iyzipay-checkout-form iframe');
      if (iframe) {
        setIsLoading(false);
        clearInterval(checkIframeLoaded);
      }
    }, 100);

    // Timeout - 5 saniye sonra loading'i kapat
    const timeout = setTimeout(() => {
      setIsLoading(false);
      clearInterval(checkIframeLoaded);
    }, 5000);

    return () => {
      clearInterval(checkIframeLoaded);
      clearTimeout(timeout);
      // Cleanup - container'ı kaldır
      const container = document.getElementById('iyzico-checkout-container');
      if (container) {
        container.remove();
      }
    };
  }, [isOpen, checkoutFormContent]);

  // postMessage listener - İyzico'dan gelen callback'leri dinle
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // İyzico domain kontrolü
      if (!event.origin.includes('iyzipay.com') && !event.origin.includes('iyzico.com')) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // İyzico payment complete mesajı
        // Sadece visual feedback göster - asıl işlem İyzico callback redirect ile yapılacak
        if (data.status === 'success' || data.status === 'failure') {
          setIsLoading(true); // "İşleniyor..." göster
          // onPaymentComplete çağırma - callback redirect asıl akışı yönetecek
        }
      } catch (e) {
        // JSON parse hatası - ignore
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, orderId, onPaymentComplete]);

  // ESC tuşu ile kapatma
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Sadece loading göster, İyzico kendi modal'ını oluşturacak
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl">
          <Loader className="w-10 h-10 text-gold animate-spin mb-4" />
          <p className="text-brown-900 font-medium">Ödeme formu yükleniyor...</p>
          <p className="text-gray-500 text-sm mt-1">Lütfen bekleyiniz</p>
        </div>
      </div>
    );
  }

  // İyzico kendi modal'ını gösteriyor, biz sadece arka planı karartıyoruz
  return null;
};

export default IyzicoCheckoutModal;
