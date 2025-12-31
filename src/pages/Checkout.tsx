import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductContext';
import { Footer } from '../components/Footer';
import { ChevronRight, ShieldCheck, CheckCircle2, MapPin, CreditCard, Plus, Edit2, X, FileText, Building2, User, AlertTriangle, Thermometer, Calendar } from 'lucide-react';
import { isBlackoutDay, getNextShippingDate, formatDateTR } from '../utils/shippingUtils';
import { checkWeatherForShipping, TEMPERATURE_THRESHOLDS } from '../services/weatherService';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Checkout: React.FC = () => {
  const { items, cartTotal, isGift, setIsGift, giftMessage, setGiftMessage, clearCart } = useCart();
  const { isLoggedIn, loading, user, addOrder } = useUser();
const addresses = user?.addresses || []; // Veriyi doğrudan kullanıcı profilinden alıyoruz
  const { settings } = useProducts(); // Admin panelinden gelen kargo limiti
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // 1: Teslimat, 2: Ödeme
const [paymentMethod, setPaymentMethod] = useState<'card' | 'eft'>('card');
const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
const [editingAddress, setEditingAddress] = useState<any>(null);
const [invoiceType, setInvoiceType] = useState<'individual' | 'corporate'>('individual');
const [isSameAsDelivery, setIsSameAsDelivery] = useState(true);

// Kargo Hesaplama Mantığı
const freeShippingLimit = settings?.freeShippingLimit || 1500;
const shippingCost = cartTotal >= freeShippingLimit ? 0 : 95; 
const grandTotal = cartTotal + shippingCost;
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId] = useState(() => Math.floor(Math.random() * 900000) + 100000);

  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shipping alerts state
  const [shippingAlerts, setShippingAlerts] = useState<{
    isBlackoutDay: boolean;
    nextShipDate: string;
    isHeatHold: boolean;
    temperature: number;
    heatHoldMessage: string;
  }>({
    isBlackoutDay: false,
    nextShipDate: '',
    isHeatHold: false,
    temperature: 0,
    heatHoldMessage: ''
  });

  useEffect(() => {
    if (isLoggedIn) {
      const defAddr = addresses.find(a => a.isDefault) || addresses[0];
      if (defAddr) setSelectedAddressId(defAddr.id);
    }
  }, [isLoggedIn, addresses]);

  // Shipping alerts kontrolü
  useEffect(() => {
    const checkShippingAlerts = async () => {
      // Blackout kontrolü
      const today = new Date();
      const isBlackout = isBlackoutDay(today);
      const nextShipDate = isBlackout ? formatDateTR(getNextShippingDate(today)) : '';

      // Heat Hold kontrolü - seçili adresin şehrine göre
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      let isHeatHold = false;
      let temperature = 0;
      let heatHoldMessage = '';

      if (selectedAddress?.city) {
        try {
          const weatherCheck = await checkWeatherForShipping(selectedAddress.city);
          isHeatHold = weatherCheck.requiresHeatHold;
          temperature = weatherCheck.weather.temperature;
          if (isHeatHold) {
            heatHoldMessage = selectedAddress.city + ' için hava sıcaklığı ' + temperature + '°C';
          }
        } catch (error) {
          console.log('Weather check failed, using defaults');
        }
      }

      setShippingAlerts({
        isBlackoutDay: isBlackout,
        nextShipDate,
        isHeatHold,
        temperature,
        heatHoldMessage
      });
    };

    if (selectedAddressId) {
      checkShippingAlerts();
    }
  }, [selectedAddressId, addresses]);

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
    if (!selectedAddressId) {
      newErrors.address = t('fill_delivery_info');
      setCurrentStep(1);
    }
    if (!agreedToTerms) newErrors.terms = language === 'tr' ? "Lütfen satış sözleşmesini onaylayın." : "Please agree to the terms.";
    
    if (currentStep === 2 && paymentMethod === 'card') {
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

// ✅ TEK VE STABİL MUHAFIZ: Oturum doğrulanırken sabırla bekle
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gold animate-pulse">Güvenli Ödeme Hattı Doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  // Oturum kontrolü bitti (loading=false) ve hala giriş yoksa kapıya yönlendir
  if (!isLoggedIn) {
    navigate('/login-gateway');
    return null;
  }


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
        <Button onClick={() => navigate('/account')} size="lg" className="px-16 h-16 rounded-xl shadow-2xl">
            {language === 'tr' ? 'SİPARİŞLERİME GİT' : 'MY ORDERS'}
        </Button>
      </main>
    );
  }

  return (
    <main className="w-full max-w-full pt-20 pb-24 px-4 sm:px-6 lg:px-16 bg-cream-100 dark:bg-dark-900 min-h-screen animate-fade-in">
      {/* Üst Navigasyon - Läderach & Marcolini Stili */}
<nav className="flex items-center justify-center gap-8 mb-16 text-[9px] font-black uppercase tracking-[0.4em]">
  <span className="text-gray-400 cursor-pointer hover:text-gold transition-all" onClick={() => navigate('/cart')}>01 SEPET</span>
  <div className="w-8 h-px bg-gray-100"></div>
  <span className={currentStep >= 1 ? "text-brown-900 dark:text-white" : "text-gray-300"}>02 TESLİMAT</span>
  <div className="w-8 h-px bg-gray-100"></div>
  <span className={currentStep === 2 ? "text-brown-900 dark:text-white" : "text-gray-300"}>03 ÖDEME</span>
</nav>
      <div className="mb-16 text-center lg:text-left border-b border-gray-50 dark:border-gray-800 pb-12">
  <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em] mb-4 block">Güvenli Ödeme Hattı</span>
  <h1 className="font-display text-5xl lg:text-7xl font-light dark:text-white italic tracking-tighter">
    {t('checkout_title')}
  </h1>
</div>

      <div className="grid lg:grid-cols-3 gap-12 lg:gap-20">
        
        {/* Forms Side */}
        {currentStep === 1 ? (
  /* ADIM 1: TESLİMAT ADRESİ */
  <section className="animate-in slide-in-from-left-4 duration-500">
    <div className="flex items-center gap-4 mb-10">
      <MapPin className="text-gold" size={28} />
      <h2 className="font-display text-4xl font-bold italic dark:text-white">Teslimat Adresi</h2>
    </div>
{!isAddressFormOpen ? (
  <div className="grid md:grid-cols-2 gap-4">
    {/* Mevcut Adresler */}
    {addresses.map(addr => (
      <div 
        key={addr.id}
        onClick={() => setSelectedAddressId(addr.id)}
        className={`p-8 border-2 rounded-2xl cursor-pointer transition-all duration-500 group relative ${selectedAddressId === addr.id ? 'border-brown-900 bg-white dark:bg-dark-800 shadow-xl scale-[1.01]' : 'border-gray-50 dark:border-gray-800 hover:border-gray-200'}`}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setEditingAddress(addr); setIsAddressFormOpen(true); }}
          className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gold transition-colors opacity-0 group-hover:opacity-100"
        >
          <Edit2 size={14} />
        </button>
        {selectedAddressId === addr.id && (
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-brown-900 text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
             <CheckCircle2 size={16} />
          </div>
        )}
        <div className="flex justify-between items-center mb-2">
          <p className="font-bold text-xs uppercase tracking-widest dark:text-white">{addr.title}</p>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{addr.address}</p>
      </div>
    ))}

    {/* Yeni Adres Ekle Kartı */}
    <div 
      onClick={() => { setEditingAddress(null); setIsAddressFormOpen(true); }}
      className="p-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-gold hover:text-gold transition-all group cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-dark-900 flex items-center justify-center group-hover:bg-gold/10">
        <Plus size={20} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">Yeni Adres Ekle</span>
    </div>
  </div>
) : (
  /* İNLINE ADRES FORMU */
  <div className="bg-gray-50 dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-4 duration-500">
    <div className="flex justify-between items-center mb-8">
      <h3 className="font-display text-xl font-bold italic dark:text-white">
        {editingAddress ? 'Adresi Düzenle' : 'Yeni Teslimat Adresi'}
      </h3>
      <button onClick={() => setIsAddressFormOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
    </div>
    <div className="space-y-4">
      <Input label="ADRES BAŞLIĞI" placeholder="Örn: Evim, İş Yerim" defaultValue={editingAddress?.title} className="h-16 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="ŞEHİR" defaultValue={editingAddress?.city || 'Antalya'} className="h-16 rounded-2xl" />
        <Input label="İLÇE" defaultValue={editingAddress?.district} className="h-16 rounded-2xl" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AÇIK ADRES</label>
        <textarea 
          className="w-full p-5 bg-white dark:bg-dark-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:ring-2 focus:ring-brown-900/10 outline-none transition-all min-h-[120px]"
          defaultValue={editingAddress?.address}
        />
      </div>
      <div className="flex gap-4 pt-4">
        <Button onClick={() => setIsAddressFormOpen(false)} className="flex-1 h-16 rounded-xl">ADRESİ KAYDET</Button>
        <button onClick={() => setIsAddressFormOpen(false)} className="px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">İPTAL</button>
      </div>
    </div>
  </div>
)}
{/* FATURA TERCİHİ BÖLÜMÜ */}
    <div className="mt-16 pt-12 border-t border-gray-50 dark:border-gray-800 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-8">
        <FileText className="text-gold" size={28} />
        <h2 className="font-display text-4xl font-bold italic dark:text-white">Fatura Bilgileri</h2>
      </div>

      <div className="space-y-8">
        {/* Fatura Tipi Seçici */}
        <div className="bg-gray-50 dark:bg-dark-800 p-2 rounded-xl flex border border-gray-100 dark:border-gray-700 shadow-inner max-w-sm">
          <button 
            type="button" 
            onClick={() => setInvoiceType('individual')} 
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${invoiceType === 'individual' ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-lg' : 'text-gray-400'}`}
          >
            <User size={14} /> Bireysel
          </button>
          <button 
            type="button" 
            onClick={() => setInvoiceType('corporate')} 
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${invoiceType === 'corporate' ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-lg' : 'text-gray-400'}`}
          >
            <Building2 size={14} /> Kurumsal
          </button>
        </div>

        {/* Fatura Adresi Teslimatla Aynı mı? */}
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setIsSameAsDelivery(!isSameAsDelivery)}>
          <div className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${isSameAsDelivery ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold shadow-md' : 'border-gray-300 dark:border-gray-600'}`}>
            {isSameAsDelivery && <CheckCircle2 size={14} className="text-white" />}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-700 transition-colors">Fatura adresim teslimat adresiyle aynı olsun</p>
        </div>

        {/* Dinamik Fatura Formu */}
        {!isSameAsDelivery || invoiceType === 'corporate' ? (
          <div className="bg-gray-50 dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 grid md:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
            {invoiceType === 'corporate' ? (
              <>
                <Input label="FİRMA UNVANI" placeholder="LTD. ŞTİ." className="h-16 rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="VERGİ DAİRESİ" className="h-16 rounded-2xl" />
                  <Input label="VERGİ NO" className="h-16 rounded-2xl" />
                </div>
              </>
            ) : (
              <Input label="TC KİMLİK NO" placeholder="11111111111" className="h-16 rounded-2xl" />
            )}
            {!isSameAsDelivery && (
               <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">FATURA ADRESİ</label>
                  <textarea className="w-full p-5 bg-white dark:bg-dark-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:ring-2 focus:ring-brown-900/10 outline-none transition-all min-h-[100px]" placeholder="Faturanın kesileceği açık adres..." />
               </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
    <div className="mt-12">
      <Button 
        onClick={() => setCurrentStep(2)} 
        disabled={!selectedAddressId}
        className="w-full md:w-auto px-16 h-18 rounded-full shadow-xl"
      >
        ÖDEMEYE DEVAM ET <ChevronRight className="ml-2" size={16} />
      </Button>
    </div>
  </section>
) : (
  /* ADIM 2: ÖDEME YÖNTEMİ */
  <section className="animate-in slide-in-from-right-4 duration-500">
    <div className="flex items-center gap-4 mb-10">
      <CreditCard className="text-gold" size={28} />
      <h2 className="font-display text-4xl font-bold italic dark:text-white">Ödeme Bilgileri</h2>
    </div>
<div className="space-y-8">

<div className="bg-gray-50 dark:bg-dark-800 p-2 rounded-xl flex border border-gray-100 dark:border-gray-700 shadow-inner max-w-sm mb-10">
    <button type="button" onClick={() => setPaymentMethod('card')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${paymentMethod === 'card' ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-lg' : 'text-gray-400'}`}>Kredi Kartı</button>
    <button type="button" onClick={() => setPaymentMethod('eft')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${paymentMethod === 'eft' ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-lg' : 'text-gray-400'}`}>Havale / EFT</button>
      </div>

      {paymentMethod === 'card' ? (
        <div className="space-y-4 animate-fade-in">
          <Input label="KART ÜZERİNDEKİ İSİM" placeholder="CAN YILMAZ" className="h-16 rounded-2xl border-2 border-gray-100 dark:border-gray-800" />
          <Input label="KART NUMARASI" placeholder="0000 0000 0000 0000" value={cardData.number} onChange={handleCardNumber} className={`h-16 rounded-2xl border-2 ${errors.cardNum ? 'border-red-600 bg-red-50/5' : 'border-gray-100 dark:border-gray-800'}`} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="S.K. TARİHİ" placeholder="AA/YY" value={cardData.expiry} onChange={handleExpiry} className={`h-16 rounded-2xl border-2 ${errors.cardExp ? 'border-red-600' : 'border-gray-100 dark:border-gray-800'}`} />
            <Input label="CVV" placeholder="***" type="password" value={cardData.cvv} onChange={handleCVV} className={`h-16 rounded-2xl border-2 ${errors.cardCvv ? 'border-red-600' : 'border-gray-100 dark:border-gray-800'}`} />
          </div>
        </div>
      ) : (
        <div className="p-8 bg-gray-50 dark:bg-dark-800 rounded-[30px] border-2 border-dashed border-gray-200 dark:border-gray-700 animate-fade-in">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Sipariş onayından sonra IBAN bilgileri e-posta adresinize iletilecektir. Ödemeniz onaylandığında artisan hazırlık sürecine başlanır.</p>
        </div>
      )}
    </div>    <div className="flex gap-4 mt-12 border-t pt-10">
      <button onClick={() => setCurrentStep(1)} className="px-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brown-900 transition-colors">GERİ DÖN</button>
      <Button onClick={handleCompleteOrder} loading={isSubmitting} className="flex-1 h-18 rounded-full shadow-2xl">
        SİPARİŞİ TAMAMLA
      </Button>
    </div>
  </section>
)}

        {/* Summary Side - Sticky */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 space-y-8 animate-slide-up" style={{animationDelay: '0.3s'}}>
            
            {/* Shipping Alert Banners */}
            {(shippingAlerts.isBlackoutDay || shippingAlerts.isHeatHold) && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                {/* Blackout Days Banner */}
                {shippingAlerts.isBlackoutDay && (
                  <div className="bg-brand-peach/30 border border-brand-peach rounded-2xl p-4 flex items-start gap-3">
                    <Calendar className="text-brand-orange shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-brand-orange mb-1">
                        Gönderim Bilgisi
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Hafta sonu kargolama yapılmamaktadır. Siparişiniz <strong className="text-brand-orange">{shippingAlerts.nextShipDate}</strong> tarihinde kargoya verilecektir.
                      </p>
                    </div>
                  </div>
                )}

                {/* Heat Hold Banner */}
                {shippingAlerts.isHeatHold && (
                  <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-2xl p-4 flex items-start gap-3">
                    <Thermometer className="text-brand-orange shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-brand-orange mb-1">
                        Sıcaklık Uyarısı
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {shippingAlerts.heatHoldMessage}. Çikolatanızın kalitesi için uygun hava koşulları bekleniyor olabilir.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <section className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-luxurious">
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
{/* Invoice Summary */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-gold" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fatura Tipi</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest dark:text-white">
                  {invoiceType === 'corporate' ? 'Kurumsal' : 'Bireysel'}
                </span>
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
                <div className="flex justify-between items-center text-xs">
  <span className="uppercase tracking-widest text-gray-400 font-bold">Kargo</span>
  <span className={`font-bold uppercase ${shippingCost === 0 ? 'text-green-500' : 'dark:text-white'}`}>
    {shippingCost === 0 ? 'Ücretsiz' : `₺${shippingCost}`}
  </span>
</div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                  <span className="font-display text-lg font-bold dark:text-white">Toplam</span>
                  <span className="font-display text-3xl font-bold text-brown-900 dark:text-gold italic">₺{grandTotal.toFixed(2)}</span>
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

              <Button 
  onClick={() => currentStep === 1 ? setCurrentStep(2) : handleCompleteOrder()} 
  loading={isSubmitting} 
  disabled={currentStep === 1 && !selectedAddressId}
  size="lg" 
  className="w-full h-16 shadow-2xl rounded-xl text-[11px] font-bold uppercase tracking-[0.3em]"
>
  {currentStep === 1 ? (language === 'tr' ? 'ÖDEME ADIMINA GEÇ' : 'PROCEED TO PAYMENT') : t('complete_order')}
</Button>
            </section>

            
            <div className="mt-8 flex items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-all">
  <ShieldCheck size={14} className="text-emerald-500" />
  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">256-BIT SSL SECURE PAYMENT NETWORK</span>
</div>

          </div>
        </div>

      </div>

      <Footer />
    </main>
  );
};