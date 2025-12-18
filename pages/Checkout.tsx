import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Checkout: React.FC = () => {
  const { items, cartTotal, isGift, giftMessage, clearCart } = useCart();
  const { isLoggedIn, addresses, addOrder } = useUser();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'eft'>('card');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId] = useState(() => Math.floor(Math.random() * 900000) + 100000);

  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      const defAddr = addresses.find(a => a.isDefault) || addresses[0];
      if (defAddr) setSelectedAddressId(defAddr.id);
    }
  }, [isLoggedIn, addresses]);

  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.substring(0, 16);
    const maskedVal = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardData({ ...cardData, number: maskedVal });
    if (errors.cardNum) setErrors(prev => ({ ...prev, cardNum: '' }));
  };

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
    if (!selectedAddressId) newErrors.address = t('fill_delivery_info');
    if (!agreedToTerms) newErrors.terms = language === 'tr' ? "Lütfen satış sözleşmesini onaylayın." : "Please agree to the terms.";
    
    if (paymentMethod === 'card') {
      const cleanNum = cardData.number.replace(/\s/g, '');
      if (cleanNum.length < 16) newErrors.cardNum = language === 'tr' ? "Geçersiz kart numarası." : "Invalid card number.";
      if (cardData.expiry.length < 5) newErrors.cardExp = language === 'tr' ? "Geçersiz tarih." : "Invalid expiry.";
      if (cardData.cvv.length < 3) newErrors.cardCvv = language === 'tr' ? "Geçersiz CVV." : "Invalid CVV.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
        addOrder({
          id: `SADE-${orderId}`,
          date: new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
          status: paymentMethod === 'eft' ? 'Ödeme Bekleniyor' : 'Hazırlanıyor',
          total: cartTotal,
          items: [...items],
          // Add gift info if needed for backend
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
      <main className="w-full max-w-screen-xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-8 shadow-luxurious border-4 border-white dark:border-dark-900 animate-bounce">
          <span className="material-icons-outlined text-5xl">check_circle</span>
        </div>
        <h2 className="font-display text-5xl font-bold text-gray-900 dark:text-white mb-4 italic">Siparişiniz Tamamlandı!</h2>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-10 max-w-sm mx-auto leading-relaxed">
            {t('order_success_msg')} <strong className="text-brown-900 dark:text-gold block mt-2 text-3xl font-display tracking-tight">#SADE-{orderId}</strong>
        </p>
        <Button onClick={() => navigate('/account')} size="lg" className="px-16 h-16 rounded-full shadow-2xl">
            {language === 'tr' ? 'SİPARİŞLERİME GİT' : 'MY ORDERS'}
        </Button>
      </main>
    );
  }

  return (
    <main className="w-full max-w-screen-xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen animate-fade-in">
      <div className="flex flex-col lg:flex-row items-center justify-between mb-16 gap-6">
        <div className="text-center lg:text-left">
          <h1 className="font-display text-4xl lg:text-5xl font-bold dark:text-white uppercase tracking-tighter italic">{t('checkout_title')}</h1>
          <p className="text-xs text-gray-400 uppercase tracking-[0.4em] mt-2">Sade Artisan Experience</p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 dark:bg-dark-800 px-6 py-3 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
          <span className="material-icons-outlined text-green-500">lock</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">256-bit SSL Güvenli Ödeme</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12 lg:gap-20">
        
        {/* Forms Side */}
        <div className="lg:col-span-2 space-y-16">
          
          {/* Teslimat Adresi */}
          <section className="animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 bg-brown-900 dark:bg-gold text-white dark:text-black rounded-full flex items-center justify-center text-sm font-bold shadow-lg">1</span>
              <h2 className="font-display text-3xl font-bold dark:text-white leading-none italic">{t('delivery_address')}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                  <div 
                    key={addr.id} 
                    onClick={() => {
                        setSelectedAddressId(addr.id);
                        if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                    }} 
                    className={`group p-6 border rounded-[30px] cursor-pointer transition-all duration-500 relative overflow-hidden ${selectedAddressId === addr.id ? 'border-brown-900 bg-brown-50/50 dark:bg-brown-900/10 dark:border-gold shadow-md scale-[1.02]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-dark-800'}`}
                  >
                    <div className="flex justify-between items-center mb-2 relative z-10">
                      <span className={`font-bold text-sm tracking-wide transition-colors ${selectedAddressId === addr.id ? 'text-brown-900 dark:text-gold' : 'dark:text-white'}`}>{addr.title}</span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedAddressId === addr.id ? 'bg-brown-900 dark:bg-gold border-transparent' : 'border-gray-200'}`}>
                        {selectedAddressId === addr.id && <span className="material-icons-outlined text-white text-[14px] font-bold">check</span>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed relative z-10">{addr.address}</p>
                    <p className="text-[10px] font-bold text-gray-300 mt-2 relative z-10 uppercase tracking-widest">{addr.city}</p>
                    {selectedAddressId === addr.id && <div className="absolute top-0 right-0 w-32 h-32 bg-brown-900/5 dark:bg-gold/5 rounded-full blur-2xl -mr-16 -mt-16"></div>}
                  </div>
              ))}
              <Link to="/account" className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[30px] text-gray-400 hover:border-gold hover:text-gold transition-all group">
                <span className="material-icons-outlined text-2xl mb-2 group-hover:scale-110 transition-transform">add_location_alt</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Yeni Adres Ekle</span>
              </Link>
            </div>
            {errors.address && <p className="text-[10px] text-red-500 mt-4 font-bold uppercase tracking-[0.2em] ml-2 animate-pulse">{errors.address}</p>}
          </section>

          {/* Ödeme Yöntemi */}
          <section className="animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 bg-brown-900 dark:bg-gold text-white dark:text-black rounded-full flex items-center justify-center text-sm font-bold shadow-lg">2</span>
              <h2 className="font-display text-3xl font-bold dark:text-white leading-none italic">{t('payment_method')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button onClick={() => setPaymentMethod('card')} className={`group p-8 border rounded-[40px] flex flex-col items-center gap-4 transition-all duration-500 relative overflow-hidden ${paymentMethod === 'card' ? 'border-brown-900 bg-brown-50/50 dark:bg-brown-900/10 dark:border-gold shadow-luxurious scale-[1.02]' : 'border-gray-100 dark:border-gray-800 opacity-60 bg-white dark:bg-dark-800 hover:opacity-100'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'card' ? 'bg-brown-900 dark:bg-gold text-white shadow-2xl' : 'bg-gray-100 dark:bg-dark-900 text-gray-400'}`}>
                  <span className="material-icons-outlined text-2xl">credit_card</span>
                </div>
                <div className="text-center">
                  <span className={`block text-[11px] font-bold uppercase tracking-[0.3em] ${paymentMethod === 'card' ? 'text-brown-900 dark:text-gold' : 'text-gray-400'}`}>{t('credit_card')}</span>
                  <p className="text-[9px] text-gray-400 mt-1">Hızlı ve Güvenli Ödeme</p>
                </div>
              </button>
              
              <button onClick={() => setPaymentMethod('eft')} className={`group p-8 border rounded-[40px] flex flex-col items-center gap-4 transition-all duration-500 relative overflow-hidden ${paymentMethod === 'eft' ? 'border-brown-900 bg-brown-50/50 dark:bg-brown-900/10 dark:border-gold shadow-luxurious scale-[1.02]' : 'border-gray-100 dark:border-gray-800 opacity-60 bg-white dark:bg-dark-800 hover:opacity-100'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'eft' ? 'bg-brown-900 dark:bg-gold text-white shadow-2xl' : 'bg-gray-100 dark:bg-dark-900 text-gray-400'}`}>
                  <span className="material-icons-outlined text-2xl">account_balance</span>
                </div>
                <div className="text-center">
                  <span className={`block text-[11px] font-bold uppercase tracking-[0.3em] ${paymentMethod === 'eft' ? 'text-brown-900 dark:text-gold' : 'text-gray-400'}`}>{t('bank_transfer')}</span>
                  <p className="text-[9px] text-gray-400 mt-1">Havale veya EFT Seçeneği</p>
                </div>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-6 p-10 bg-gray-50/50 dark:bg-dark-800/50 rounded-[40px] animate-fade-in border border-gray-100 dark:border-gray-700 shadow-inner">
                <Input label="KART NUMARASI" value={cardData.number} onChange={handleCardNumber} placeholder="0000 0000 0000 0000" icon="credit_card" error={errors.cardNum} inputMode="numeric" />
                <div className="grid grid-cols-2 gap-6">
                  <Input label="SON KULLANMA (AA/YY)" value={cardData.expiry} onChange={handleExpiry} placeholder="01/28" error={errors.cardExp} inputMode="numeric" />
                  <Input label="GÜVENLİK KODU (CVV)" value={cardData.cvv} onChange={handleCVV} placeholder="000" error={errors.cardCvv} inputMode="numeric" />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Summary Side - Sticky */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 space-y-8 animate-slide-up" style={{animationDelay: '0.3s'}}>
            
            <section className="bg-white dark:bg-dark-800 p-10 rounded-[50px] border border-gray-100 dark:border-gray-700 shadow-luxurious">
              <h2 className="font-display text-2xl font-bold dark:text-white mb-8 italic">{t('order_summary')}</h2>
              
              <div className="space-y-6 mb-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-dark-900 rounded-2xl overflow-hidden shrink-0">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold dark:text-white truncate uppercase tracking-wide">{item.title}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{item.quantity} Adet • ₺{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gift Display in Summary */}
              {isGift && (
                <div className="mb-8 p-4 bg-gold/5 rounded-2xl border border-gold/10">
                    <div className="flex items-center gap-2 mb-2 text-brown-900 dark:text-gold">
                        <span className="material-icons-outlined text-sm">card_giftcard</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Hediye Paketi</span>
                    </div>
                    {giftMessage && (
                        <p className="text-xs italic text-gray-600 dark:text-gray-400 border-l-2 border-gold/30 pl-3 py-1">
                            "{giftMessage}"
                        </p>
                    )}
                </div>
              )}

              <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-8 mb-10">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span className="uppercase tracking-widest">{t('subtotal')}</span>
                  <span className="font-bold">₺{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-green-500">
                  <span className="uppercase tracking-widest">Kargo</span>
                  <span className="font-bold uppercase">Ücretsiz</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                  <span className="font-display text-lg font-bold dark:text-white">Toplam</span>
                  <span className="font-display text-3xl font-bold text-brown-900 dark:text-gold italic">₺{cartTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-4 cursor-pointer group mb-8" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                <div className={`w-6 h-6 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold shadow-md' : 'border-gray-300 dark:border-gray-600'}`}>
                  {agreedToTerms && <span className="material-icons-outlined text-white text-[16px] font-bold">check</span>}
                </div>
                <p className={`text-[10px] leading-relaxed transition-colors ${errors.terms ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700'}`}>
                  {t('i_agree_to')} <Link to="/legal/distance-sales" className="underline font-bold text-brown-900 dark:text-gold">{t('terms_link')}</Link>.
                </p>
              </div>

              <Button onClick={handleCompleteOrder} loading={isSubmitting} size="lg" className="w-full h-16 shadow-2xl rounded-full text-[11px] font-bold uppercase tracking-[0.3em]">
                {t('complete_order')}
              </Button>
            </section>

            <div className="bg-gray-50 dark:bg-dark-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 text-center">
              <span className="material-icons-outlined text-gold mb-4 text-3xl">verified</span>
              <h4 className="text-xs font-bold dark:text-white uppercase tracking-widest mb-2">Sade Garantisi</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed italic">"Her bir çikolata, Belçika kalitesi ve Türk ustalığıyla size özel taze üretilir."</p>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
};