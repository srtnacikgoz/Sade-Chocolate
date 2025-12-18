import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Checkout: React.FC = () => {
  const { items, cartTotal, isGift, giftNote, clearCart } = useCart();
  const { isLoggedIn, addresses, addOrder } = useUser();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'eft'>('card');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId] = useState(() => Math.floor(Math.random() * 900000) + 100000);

  // Kart Girişleri ve Hatalar
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      const defAddr = addresses.find(a => a.isDefault) || addresses[0];
      if (defAddr) setSelectedAddressId(defAddr.id);
    }
  }, [isLoggedIn, addresses]);

  // Kredi Kartı Maskeleme (4-4-4-4)
  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.substring(0, 16);
    const maskedVal = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardData({ ...cardData, number: maskedVal });
    if (errors.cardNum) setErrors(prev => ({ ...prev, cardNum: '' }));
  };

  // Son Kullanma Tarihi Maskeleme (MM/YY)
  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.substring(0, 4);
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardData({ ...cardData, expiry: val });
    if (errors.cardExp) setErrors(prev => ({ ...prev, cardExp: '' }));
  };

  const handleCVV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCardData({ ...cardData, cvv: val });
    if (errors.cardCvv) setErrors(prev => ({ ...prev, cardCvv: '' }));
  };

  const handleCompleteOrder = () => {
    const newErrors: Record<string, string> = {};
    
    // Adres Kontrolü
    if (!selectedAddressId) {
      newErrors.address = t('fill_delivery_info');
    }

    // Sözleşme Kontrolü
    if (!agreedToTerms) {
      newErrors.terms = language === 'tr' ? "Lütfen satış sözleşmesini onaylayın." : "Please agree to the terms.";
    }
    
    // Kart Kontrolleri
    if (paymentMethod === 'card') {
      const cleanNum = cardData.number.replace(/\s/g, '');
      if (cleanNum.length < 16) {
        newErrors.cardNum = language === 'tr' ? "Geçersiz kart numarası." : "Invalid card number.";
      }
      if (cardData.expiry.length < 5) {
        newErrors.cardExp = language === 'tr' ? "Geçersiz tarih." : "Invalid expiry.";
      }
      if (cardData.cvv.length < 3) {
        newErrors.cardCvv = language === 'tr' ? "Geçersiz CVV." : "Invalid CVV.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    
    // Siparişi Dinamik Olarak Kaydetme Simülasyonu
    setTimeout(() => {
        addOrder({
          id: `SADE-${orderId}`,
          date: new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
          status: paymentMethod === 'eft' ? 'Ödeme Bekleniyor' : 'Hazırlanıyor',
          total: cartTotal,
          items: [...items]
        });

        setIsSuccess(true);
        setIsSubmitting(false);
        clearCart();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500);
  };

  if (items.length === 0 && !isSuccess) { 
    navigate('/catalog'); 
    return null; 
  }

  if (isSuccess) {
    return (
      <main className="pt-24 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen px-5 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <span className="material-icons-outlined text-4xl">check_circle</span>
        </div>
        <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('order_success')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {t('order_success_msg')} <strong className="text-brown-900 dark:text-gold">#SADE-{orderId}</strong>
        </p>
        <Button onClick={() => navigate('/account')} size="lg" className="w-full max-w-xs shadow-xl">
            {language === 'tr' ? 'SİPARİŞLERİME GİT' : 'MY ORDERS'}
        </Button>
      </main>
    );
  }

  return (
    <main className="pt-24 max-w-md mx-auto pb-32 bg-white dark:bg-dark-900 min-h-screen px-5 animate-fade-in">
      <h1 className="font-display text-3xl font-bold dark:text-white mb-8 uppercase tracking-tighter">{t('checkout_title')}</h1>

      <div className="space-y-8">
        {/* Teslimat Adresi */}
        <section>
          <h2 className="font-display text-xl font-bold dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-brown-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
            {t('delivery_address')}
          </h2>
          <div className="space-y-3">
            {addresses.map(addr => (
                <div 
                  key={addr.id} 
                  onClick={() => {
                      setSelectedAddressId(addr.id);
                      if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                  }} 
                  className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 ${selectedAddressId === addr.id ? 'border-brown-900 bg-brown-50 dark:bg-brown-900/20 dark:border-gold' : 'border-gray-100 dark:border-gray-800'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm dark:text-white">{addr.title}</span>
                    {selectedAddressId === addr.id && <span className="material-icons-outlined text-brown-900 dark:text-gold text-lg">check_circle</span>}
                  </div>
                  <p className="text-xs text-gray-400">{addr.address}</p>
                </div>
            ))}
          </div>
          {errors.address && <p className="text-[10px] text-red-500 mt-2 font-bold animate-pulse">{errors.address}</p>}
        </section>

        {/* Ödeme Yöntemi */}
        <section>
          <h2 className="font-display text-xl font-bold dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-brown-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
            {t('payment_method')}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => setPaymentMethod('card')} className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-brown-900 bg-brown-50 dark:bg-brown-900/20 dark:border-gold' : 'border-gray-100 dark:border-gray-800 opacity-60'}`}>
              <span className="material-icons-outlined">credit_card</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('credit_card')}</span>
            </button>
            <button onClick={() => setPaymentMethod('eft')} className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'eft' ? 'border-brown-900 bg-brown-50 dark:bg-brown-900/20 dark:border-gold' : 'border-gray-100 dark:border-gray-800 opacity-60'}`}>
              <span className="material-icons-outlined">account_balance</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('bank_transfer')}</span>
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-4 p-5 bg-gray-50 dark:bg-dark-800 rounded-3xl animate-fade-in border border-gray-100 dark:border-gray-700">
              <Input label="KART NUMARASI" value={cardData.number} onChange={handleCardNumber} placeholder="0000 0000 0000 0000" icon="credit_card" error={errors.cardNum} inputMode="numeric" />
              <div className="flex gap-4">
                <Input label="AA/YY" value={cardData.expiry} onChange={handleExpiry} placeholder="01/28" error={errors.cardExp} inputMode="numeric" />
                <Input label="CVV" value={cardData.cvv} onChange={handleCVV} placeholder="000" error={errors.cardCvv} inputMode="numeric" />
              </div>
            </div>
          )}
        </section>

        {/* Özet ve Onay */}
        <section className="bg-gray-50 dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold uppercase text-gray-500">{t('subtotal')}</span>
            <span className="font-display text-3xl font-bold text-brown-900 dark:text-white">₺{cartTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex items-start gap-3 cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
            <div className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold' : 'border-gray-300'}`}>
              {agreedToTerms && <span className="material-icons-outlined text-white text-[14px] font-bold">check</span>}
            </div>
            <p className={`text-[10px] leading-relaxed ${errors.terms ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
              {t('i_agree_to')} <Link to="/legal/distance-sales" className="underline font-bold text-brown-900 dark:text-gold">{t('terms_link')}</Link>.
            </p>
          </div>
        </section>

        <Button onClick={handleCompleteOrder} loading={isSubmitting} size="lg" className="w-full h-16 shadow-2xl">
          {t('complete_order')}
        </Button>
      </div>
    </main>
  );
};