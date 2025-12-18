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
      <main className="pt-24 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen px-5 flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-8 shadow-luxurious border-4 border-white dark:border-dark-900 animate-bounce">
          <span className="material-icons-outlined text-5xl">check_circle</span>
        </div>
        <h2 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-2 italic">Afiyet Olsun!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
            {t('order_success_msg')} <strong className="text-brown-900 dark:text-gold block mt-2 text-xl font-display tracking-tight">#SADE-{orderId}</strong>
        </p>
        <Button onClick={() => navigate('/account')} size="lg" className="w-full h-14 shadow-xl">
            {language === 'tr' ? 'SİPARİŞLERİME GİT' : 'MY ORDERS'}
        </Button>
      </main>
    );
  }

  return (
    <main className="pt-24 max-w-md mx-auto pb-32 bg-white dark:bg-dark-900 min-h-screen px-5 animate-fade-in">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl font-bold dark:text-white uppercase tracking-tighter leading-none">{t('checkout_title')}</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Sade Artisan Experience</p>
        </div>
        <div className="w-12 h-12 bg-brown-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-lg">
          <span className="material-icons-outlined">lock</span>
        </div>
      </div>

      <div className="space-y-10">
        {/* Teslimat Adresi */}
        <section className="animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 bg-brown-900 dark:bg-gold text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">1</span>
            <h2 className="font-display text-2xl font-bold dark:text-white leading-none">{t('delivery_address')}</h2>
          </div>
          
          <div className="space-y-3">
            {addresses.map(addr => (
                <div 
                  key={addr.id} 
                  onClick={() => {
                      setSelectedAddressId(addr.id);
                      if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                  }} 
                  className={`group p-5 border rounded-3xl cursor-pointer transition-all duration-500 relative overflow-hidden ${selectedAddressId === addr.id ? 'border-brown-900 bg-brown-50/50 dark:bg-brown-900/10 dark:border-gold shadow-md' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-dark-800'}`}
                >
                  <div className="flex justify-between items-center mb-1 relative z-10">
                    <span className={`font-bold text-sm transition-colors ${selectedAddressId === addr.id ? 'text-brown-900 dark:text-gold' : 'dark:text-white'}`}>{addr.title}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedAddressId === addr.id ? 'bg-brown-900 dark:bg-gold border-transparent' : 'border-gray-200'}`}>
                      {selectedAddressId === addr.id && <span className="material-icons-outlined text-white text-[12px] font-bold">check</span>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 relative z-10">{addr.address}</p>
                  {selectedAddressId === addr.id && <div className="absolute top-0 right-0 w-24 h-24 bg-brown-900/5 rounded-full blur-2xl -mr-12 -mt-12"></div>}
                </div>
            ))}
          </div>
          {errors.address && <p className="text-[10px] text-red-500 mt-3 font-bold uppercase tracking-wider ml-2 animate-pulse">{errors.address}</p>}
        </section>

        {/* Ödeme Yöntemi */}
        <section className="animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 bg-brown-900 dark:bg-gold text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">2</span>
            <h2 className="font-display text-2xl font-bold dark:text-white leading-none">{t('payment_method')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={() => setPaymentMethod('card')} className={`group p-5 border rounded-3xl flex flex-col items-center gap-3 transition-all duration-500 relative overflow-hidden ${paymentMethod === 'card' ? 'border-brown-900 bg-brown-50/50 dark:bg-brown-900/10 dark:border-gold shadow-md' : 'border-gray-100 dark:border-gray-800 opacity-60 bg-white dark:bg-dark-800'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'card' ? 'bg-brown-900 dark:bg-gold text-white shadow-lg' : 'bg-gray-100 dark:bg-dark-900 text-gray-400'}`}>
                <span className="material-icons-outlined">credit_card</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${paymentMethod === 'card' ? 'text-brown-900 dark:text-gold' : 'text-gray-400'}`}>{t('credit_card')}</span>
            </button>
            
            <button onClick={() => setPaymentMethod('eft')} className={`group p-5 border rounded-3xl flex flex-col items-center gap-3 transition-all duration-500 relative overflow-hidden ${paymentMethod === 'eft' ? 'border-brown-900 bg-brown-50/50 dark:bg-brown-900/10 dark:border-gold shadow-md' : 'border-gray-100 dark:border-gray-800 opacity-60 bg-white dark:bg-dark-800'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'eft' ? 'bg-brown-900 dark:bg-gold text-white shadow-lg' : 'bg-gray-100 dark:bg-dark-900 text-gray-400'}`}>
                <span className="material-icons-outlined">account_balance</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${paymentMethod === 'eft' ? 'text-brown-900 dark:text-gold' : 'text-gray-400'}`}>{t('bank_transfer')}</span>
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-4 p-6 bg-gray-50/50 dark:bg-dark-800/50 rounded-3xl animate-fade-in border border-gray-100 dark:border-gray-700 shadow-inner">
              <Input label="KART NUMARASI" value={cardData.number} onChange={handleCardNumber} placeholder="0000 0000 0000 0000" icon="credit_card" error={errors.cardNum} inputMode="numeric" />
              <div className="flex gap-4">
                <Input label="AA/YY" value={cardData.expiry} onChange={handleExpiry} placeholder="01/28" error={errors.cardExp} inputMode="numeric" />
                <Input label="CVV" value={cardData.cvv} onChange={handleCVV} placeholder="000" error={errors.cardCvv} inputMode="numeric" />
              </div>
            </div>
          )}
        </section>

        {/* Özet ve Onay */}
        <section className="bg-gray-50 dark:bg-dark-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-luxurious animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t('subtotal')}</span>
              <span className="text-xs text-gray-500 mt-1 italic">{items.length} {language === 'tr' ? 'Eşsiz Lezzet' : 'Unique Flavors'}</span>
            </div>
            <span className="font-display text-4xl font-bold text-brown-900 dark:text-white leading-none">₺{cartTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex items-start gap-4 cursor-pointer group" onClick={() => setAgreedToTerms(!agreedToTerms)}>
            <div className={`w-6 h-6 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold shadow-md' : 'border-gray-300 dark:border-gray-600'}`}>
              {agreedToTerms && <span className="material-icons-outlined text-white text-[16px] font-bold">check</span>}
            </div>
            <p className={`text-[11px] leading-relaxed transition-colors ${errors.terms ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`}>
              {t('i_agree_to')} <Link to="/legal/distance-sales" className="underline font-bold text-brown-900 dark:text-gold decoration-gold/30 hover:decoration-gold">{t('terms_link')}</Link>.
            </p>
          </div>
        </section>

        <Button onClick={handleCompleteOrder} loading={isSubmitting} size="lg" className="w-full h-16 shadow-2xl rounded-full text-base tracking-[0.2em]">
          {t('complete_order')}
        </Button>
      </div>
    </main>
  );
};