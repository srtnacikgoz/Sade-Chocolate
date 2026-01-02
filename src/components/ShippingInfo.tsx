import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const ShippingInfo: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center shrink-0">
          <span className="material-icons-outlined">ac_unit</span>
        </div>
        <div>
          <h4 className="text-sm font-bold dark:text-white mb-1">Isı Yalıtımlı Ambalaj</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Antalya'daki atölyemizden çıkan çikolatalarınız, sıcak havalarda zarar görmemesi için özel termal folyolar ve buz aküleri ile paketlenir.</p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-full flex items-center justify-center shrink-0">
          <span className="material-icons-outlined">local_shipping</span>
        </div>
        <div>
          <h4 className="text-sm font-bold dark:text-white mb-1">Güvenli Gönderim</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">MNG Kargo ile Türkiye'nin her yerine 1-3 iş günü içinde teslimat sağlıyoruz. Hafta sonu teslimatı kargo yoğunluğuna göre değişebilir.</p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center shrink-0">
          <span className="material-icons-outlined">verified</span>
        </div>
        <div>
          <h4 className="text-sm font-bold dark:text-white mb-1">Hasar Garantisi</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Ürününüzün kargoda hasar görmesi durumunda, paketi açmadan fotoğrafını çekip bizimle iletişime geçin. %100 memnuniyet garantisi sunuyoruz.</p>
        </div>
      </div>
    </div>
  );
};