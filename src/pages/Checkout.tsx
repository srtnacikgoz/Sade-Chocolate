import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductContext';
import { Footer } from '../components/Footer';
import { ChevronRight, ShieldCheck, CheckCircle2, MapPin, CreditCard, Plus, Edit2, X, FileText, Building2, User, AlertTriangle, Thermometer, Calendar, Landmark, Copy, Check, Clock, Percent } from 'lucide-react';
import { isBlackoutDay, getNextShippingDate, formatDateTR } from '../utils/shippingUtils';
import { checkWeatherForShipping, TEMPERATURE_THRESHOLDS } from '../services/weatherService';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CompanyInfo } from '../types';
import { sendOrderConfirmationEmail } from '../services/emailService';

export const Checkout: React.FC = () => {
  const { items, cartTotal, isGift, setIsGift, giftMessage, setGiftMessage, clearCart } = useCart();
  const { isLoggedIn, loading, user, addOrder } = useUser();
const addresses = user?.addresses || []; // Veriyi doğrudan kullanıcı profilinden alıyoruz
  const { settings } = useProducts(); // Admin panelinden gelen kargo limiti
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Guest mode state
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestData, setGuestData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCountry: '+90', // Varsayılan Türkiye
    city: '',
    district: '',
    address: ''
  });

  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // 1: Teslimat, 2: Ödeme
const [paymentMethod, setPaymentMethod] = useState<'card' | 'eft'>('card');
const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
const [editingAddress, setEditingAddress] = useState<any>(null);
const [invoiceType, setInvoiceType] = useState<'individual' | 'corporate'>('individual');
const [isSameAsDelivery, setIsSameAsDelivery] = useState(true);
const [vergiNo, setVergiNo] = useState(''); // Vergi no state (max 10 hane)

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation helper
  const isValidPhone = (phone: string, countryCode: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    if (countryCode === '+90') {
      // Türkiye: 10 hane gerekli
      return digits.length === 10;
    }
    // Diğer ülkeler için minimum 7 hane
    return digits.length >= 7;
  };

  // Guest form validation
  const isGuestFormValid = useMemo(() => {
    if (!isGuestMode) return true;
    return !!(
      guestData.firstName?.trim() &&
      guestData.lastName?.trim() &&
      guestData.email?.trim() &&
      isValidEmail(guestData.email) &&
      guestData.phone?.trim() &&
      isValidPhone(guestData.phone, guestData.phoneCountry) &&
      guestData.city?.trim() &&
      guestData.district?.trim() &&
      guestData.address?.trim()
    );
  }, [isGuestMode, guestData]);

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
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  // Bank transfer hesaplama
  const bankTransferSettings = companyInfo?.bankTransferSettings;
  const bankTransferDiscount = bankTransferSettings?.isEnabled && paymentMethod === 'eft'
    ? (cartTotal * (bankTransferSettings?.discountPercent || 2) / 100)
    : 0;
  const finalTotal = grandTotal - bankTransferDiscount;

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

  // Load company info for bank accounts
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'company_info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCompanyInfo(docSnap.data() as CompanyInfo);
        }
      } catch (error) {
        console.error('Error loading company info:', error);
      }
    };
    loadCompanyInfo();
  }, []);

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

  // Telefon numarası formatla
  const formatPhoneNumber = (value: string, countryCode: string) => {
    const digits = value.replace(/\D/g, '');

    if (countryCode === '+90') {
      // TR format: 533 342 04 93 (10 digit)
      const limited = digits.substring(0, 10);
      if (limited.length <= 3) return limited;
      if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`;
      if (limited.length <= 8) return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
      return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 8)} ${limited.slice(8)}`;
    }

    // Diğer ülkeler için basit format (max 15 digit)
    return digits.substring(0, 15);
  };

  const handleCompleteOrder = async () => {
    const newErrors: Record<string, string> = {};

    // Guest mode validations
    if (isGuestMode) {
      if (!guestData.firstName || !guestData.lastName) {
        newErrors.address = "Lütfen ad ve soyadınızı girin.";
      }
      if (!guestData.email) {
        newErrors.email = "Lütfen e-posta adresinizi girin.";
      } else if (!isValidEmail(guestData.email)) {
        newErrors.email = "Geçerli bir e-posta adresi girin.";
      }
      if (!guestData.phone) {
        newErrors.phone = "Lütfen telefon numaranızı girin.";
      } else if (!isValidPhone(guestData.phone, guestData.phoneCountry)) {
        const requiredDigits = guestData.phoneCountry === '+90' ? '10' : '7';
        newErrors.phone = `Geçerli bir telefon numarası girin (${requiredDigits} hane gerekli).`;
      }
      if (!guestData.city || !guestData.district || !guestData.address) {
        newErrors.address = "Lütfen teslimat adresinizi eksiksiz girin.";
      }
    } else {
      if (!selectedAddressId) {
        newErrors.address = t('fill_delivery_info');
        setCurrentStep(1);
      }
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

    try {
      if (isGuestMode) {
        // Guest sipariş oluştur
        const { addDoc, collection } = await import('firebase/firestore');
        await addDoc(collection(db, 'orders'), {
          orderId: `SADE-${orderId}`,
          customerEmail: guestData.email,
          customerName: `${guestData.firstName} ${guestData.lastName}`,
          customerPhone: guestData.phone,
          shippingAddress: {
            city: guestData.city,
            district: guestData.district,
            address: guestData.address
          },
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          subtotal: cartTotal,
          shippingCost,
          ...(bankTransferDiscount > 0 && { bankTransferDiscount }),
          total: finalTotal,
          paymentMethod,
          ...(paymentMethod === 'eft' && { paymentDeadline: new Date(Date.now() + (bankTransferSettings?.paymentDeadlineHours || 12) * 60 * 60 * 1000).toISOString() }),
          status: paymentMethod === 'eft' ? 'Ödeme Bekleniyor' : 'Hazırlanıyor',
          isGuest: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Kayıtlı kullanıcı siparişi
        addOrder({
          id: `SADE-${orderId}`,
          date: new Date().toISOString(),
          status: paymentMethod === 'eft' ? 'Ödeme Bekleniyor' : 'Hazırlanıyor',
          total: finalTotal,
          subtotal: cartTotal,
          shippingCost,
          ...(bankTransferDiscount > 0 && { bankTransferDiscount }),
          paymentMethod: paymentMethod,
          ...(paymentMethod === 'eft' && { paymentDeadline: new Date(Date.now() + (bankTransferSettings?.paymentDeadlineHours || 12) * 60 * 60 * 1000).toISOString() }),
          items: [...items],
        });
      }

      // Sipariş Onay Emaili Gönder
      const customerEmail = isGuestMode ? guestData.email : user?.email;
      const customerName = isGuestMode ? `${guestData.firstName} ${guestData.lastName}` : `${user?.firstName} ${user?.lastName}`;
      const selectedAddr = addresses.find(a => a.id === selectedAddressId);
      const customerAddress = isGuestMode
        ? `${guestData.address}, ${guestData.district}, ${guestData.city}`
        : selectedAddr?.address || '';

      if (customerEmail) {
        sendOrderConfirmationEmail(customerEmail, {
          orderId: `SADE-${orderId}`,
          customerName: customerName || 'Değerli Müşterimiz',
          items: items.map(item => ({
            name: item.title,
            quantity: item.quantity,
            price: item.price * item.quantity
          })),
          subtotal: cartTotal,
          shipping: shippingCost,
          total: finalTotal,
          address: customerAddress
        }).catch(err => {
          console.log('Sipariş onay emaili gönderilemedi:', err);
        });
      }

      setIsSuccess(true);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Order creation error:', error);
      setErrors({ general: 'Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setIsSubmitting(false);
    }
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

  // Kullanıcı giriş yapmamışsa ve guest mode seçmemişse, seçim ekranı göster
  if (!isLoggedIn && !isGuestMode) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-cream-100 dark:bg-dark-900 px-4 animate-fade-in">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h2 className="font-display text-5xl font-bold italic dark:text-white">Nasıl Devam Etmek İstersiniz?</h2>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Siparişinizi tamamlamak için bir seçenek belirleyin</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Giriş Yap */}
            <button
              onClick={() => navigate('/login-gateway')}
              className="p-10 bg-white dark:bg-dark-800 rounded-3xl border-2 border-gray-100 dark:border-gray-700 hover:border-brown-900 dark:hover:border-gold transition-all group"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-brown-900 dark:bg-gold rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="text-white dark:text-black" size={32} />
              </div>
              <h3 className="font-display text-2xl font-bold italic mb-3 dark:text-white">Giriş Yap</h3>
              <p className="text-xs text-gray-400 leading-relaxed">Hesabınızla giriş yapın ve kayıtlı adreslerinizi kullanın</p>
            </button>

            {/* Misafir Olarak Devam Et */}
            <button
              onClick={() => setIsGuestMode(true)}
              className="p-10 bg-gradient-to-br from-gold/5 to-brown-900/5 dark:from-gold/10 dark:to-gold/5 rounded-3xl border-2 border-gold/20 hover:border-gold transition-all group"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-gold rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-white" size={32} />
              </div>
              <h3 className="font-display text-2xl font-bold italic mb-3 dark:text-white">Misafir Olarak Devam Et</h3>
              <p className="text-xs text-gray-400 leading-relaxed">Hızlıca sipariş verin, hesap oluşturmaya gerek yok</p>
            </button>
          </div>
        </div>
      </main>
    );
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
        {isGuestMode ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              Sipariş detaylarınız <strong className="text-brown-900 dark:text-gold">{guestData.email}</strong> adresine gönderildi.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => navigate('/catalog')} size="lg" className="px-12 h-16 rounded-xl shadow-2xl">
                ALIŞVERİŞE DEVAM ET
              </Button>
              <Button onClick={() => navigate('/register')} variant="outline" size="lg" className="px-12 h-16 rounded-xl">
                HESAP OLUŞTUR
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => navigate('/account')} size="lg" className="px-16 h-16 rounded-xl shadow-2xl">
              {language === 'tr' ? 'SİPARİŞLERİME GİT' : 'MY ORDERS'}
          </Button>
        )}
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
  <section className="animate-in slide-in-from-left-4 duration-500 lg:col-span-2">
    {/* Başlık modal dışında */}
    <div className="flex items-center gap-4 mb-8">
      <MapPin className="text-gold" size={28} />
      <h2 className="font-display text-4xl font-bold italic dark:text-white">Teslimat Bilgileri</h2>
    </div>

{/* Guest Mode Form */}
{isGuestMode ? (
  <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-6 animate-in fade-in">
    <div className="flex items-center gap-3 p-4 bg-gold/5 rounded-2xl border border-gold/20">
      <ShieldCheck className="text-gold" size={20} />
      <p className="text-xs text-gray-600 dark:text-gray-300">Misafir olarak devam ediyorsunuz. Sipariş bilgileriniz e-posta adresinize gönderilecektir.</p>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <Input
        label="ADINIZ"
        placeholder="Can"
        className="h-16 rounded-2xl"
        required
        value={guestData.firstName}
        onChange={(e) => setGuestData({...guestData, firstName: e.target.value})}
      />
      <Input
        label="SOYADINIZ"
        placeholder="Yılmaz"
        className="h-16 rounded-2xl"
        required
        value={guestData.lastName}
        onChange={(e) => setGuestData({...guestData, lastName: e.target.value})}
      />
    </div>

    <div>
      <Input
        label="E-POSTA ADRESİ"
        type="email"
        placeholder="isim@ornek.com"
        className="h-16 rounded-2xl"
        required
        value={guestData.email}
        onChange={(e) => setGuestData({...guestData, email: e.target.value})}
      />
      {guestData.email && !isValidEmail(guestData.email) && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
          <span className="material-icons-outlined text-sm">error</span>
          Geçerli bir e-posta adresi girin (örn: isim@ornek.com)
        </p>
      )}
    </div>

    {/* Telefon input - ülke kodu dropdown + formatlanmış input */}
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
        TELEFON
      </label>
      <div className="flex gap-2">
        {/* Ülke kodu dropdown */}
        <select
          value={guestData.phoneCountry}
          onChange={(e) => setGuestData({...guestData, phoneCountry: e.target.value, phone: ''})}
          className="h-16 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-brown-500 dark:focus:ring-gold transition-all"
          style={{ width: '110px' }}
        >
          <option value="+90">🇹🇷 +90</option>
          <option value="+1">🇺🇸 +1</option>
          <option value="+44">🇬🇧 +44</option>
          <option value="+49">🇩🇪 +49</option>
          <option value="+33">🇫🇷 +33</option>
          <option value="+39">🇮🇹 +39</option>
          <option value="+34">🇪🇸 +34</option>
          <option value="+31">🇳🇱 +31</option>
          <option value="+32">🇧🇪 +32</option>
          <option value="+41">🇨🇭 +41</option>
          <option value="+43">🇦🇹 +43</option>
          <option value="+61">🇦🇺 +61</option>
          <option value="+81">🇯🇵 +81</option>
          <option value="+86">🇨🇳 +86</option>
          <option value="+971">🇦🇪 +971</option>
        </select>

        {/* Formatlanmış telefon input */}
        <input
          type="tel"
          placeholder={guestData.phoneCountry === '+90' ? '533 342 04 93' : 'Phone number'}
          className="flex-1 h-16 px-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-brown-500 dark:focus:ring-gold transition-all"
          required
          value={guestData.phone}
          onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value, guestData.phoneCountry);
            setGuestData({...guestData, phone: formatted});
          }}
        />
      </div>
      {guestData.phone && !isValidPhone(guestData.phone, guestData.phoneCountry) && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
          <span className="material-icons-outlined text-sm">error</span>
          {guestData.phoneCountry === '+90'
            ? 'Türkiye için 10 haneli telefon numarası girin (örn: 533 342 04 93)'
            : 'En az 7 haneli telefon numarası girin'}
        </p>
      )}
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <Input
        label="ŞEHİR"
        placeholder="Antalya"
        className="h-16 rounded-2xl"
        required
        value={guestData.city}
        onChange={(e) => setGuestData({...guestData, city: e.target.value})}
      />
      <Input
        label="İLÇE"
        placeholder="Muratpaşa"
        className="h-16 rounded-2xl"
        required
        value={guestData.district}
        onChange={(e) => setGuestData({...guestData, district: e.target.value})}
      />
    </div>

    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AÇIK ADRES</label>
      <textarea
        className="w-full p-5 bg-gray-50 dark:bg-dark-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:ring-2 focus:ring-brown-900/10 outline-none transition-all min-h-[120px]"
        placeholder="Mahalle, sokak, bina no, daire no..."
        required
        value={guestData.address}
        onChange={(e) => setGuestData({...guestData, address: e.target.value})}
      />
      {errors.address && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
          <span className="material-icons-outlined text-sm">error</span>
          {errors.address}
        </p>
      )}
    </div>
  </div>
) : !isAddressFormOpen ? (
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

{/* FATURA TERCİHİ BÖLÜMÜ - Teslimat formunun devamı */}
<div className="mt-12 bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-6">
  <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
    <FileText className="text-gold" size={20} />
    <h3 className="text-lg font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Fatura Bilgileri</h3>
  </div>

      <div className="space-y-6">
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
                  <Input
                    label="VERGİ NO"
                    placeholder="0000000000"
                    className="h-16 rounded-2xl"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={vergiNo}
                    onChange={(e) => {
                      // Sadece rakam girişine izin ver, max 10 hane
                      const onlyNumbers = e.target.value.replace(/\D/g, '');
                      setVergiNo(onlyNumbers.substring(0, 10));
                    }}
                  />
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
        onClick={() => {
          // Guest mode için basit validasyon
          if (isGuestMode && !isGuestFormValid) {
            setErrors({ address: 'Lütfen tüm bilgileri eksiksiz doldurun.' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          if (!agreedToTerms) {
            setErrors({ terms: 'Lütfen satış sözleşmesini onaylayın.' });
            return;
          }
          setCurrentStep(2);
        }}
        disabled={(isGuestMode ? !isGuestFormValid : !selectedAddressId) || !agreedToTerms}
        className={`w-full md:w-auto px-16 h-18 rounded-full shadow-xl ${!agreedToTerms ? 'opacity-50' : ''}`}
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

<div className="bg-gray-50 dark:bg-dark-800 p-2 rounded-xl flex border border-gray-100 dark:border-gray-700 shadow-inner max-w-md mb-10">
    <button type="button" onClick={() => setPaymentMethod('card')} className={`flex-1 py-4 px-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex flex-col items-center gap-1 ${paymentMethod === 'card' ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-lg' : 'text-gray-400'}`}>
      <CreditCard size={18} />
      <span>Kredi Kartı</span>
    </button>
    <button type="button" onClick={() => setPaymentMethod('eft')} className={`flex-1 py-4 px-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex flex-col items-center gap-1 ${paymentMethod === 'eft' ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-lg' : 'text-gray-400'}`}>
      <Landmark size={18} />
      <span>Havale / EFT</span>
      {bankTransferSettings?.isEnabled && bankTransferSettings.discountPercent > 0 && (
        <span className={`text-[9px] px-2 py-0.5 rounded-full ${paymentMethod === 'eft' ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-50 text-emerald-500'}`}>
          %{bankTransferSettings.discountPercent} İndirim
        </span>
      )}
    </button>
      </div>

      {paymentMethod === 'card' ? (
        <div className="space-y-4 animate-fade-in">
          <Input label="KART ÜZERİNDEKİ İSİM" placeholder="CAN YILMAZ" className="h-16 rounded-2xl border-2 border-gray-100 dark:border-gray-800" />
          <Input label="KART NUMARASI" placeholder="0000 0000 0000 0000" value={cardData.number} onChange={handleCardNumber} className={`h-16 rounded-2xl border-2 ${errors.cardNum ? 'border-red-600 bg-red-50/5' : 'border-gray-100 dark:border-gray-800'}`} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="S.K. TARİHİ" placeholder="AA/YY" value={cardData.expiry} onChange={handleExpiry} className={`h-16 rounded-2xl border-2 ${errors.cardExp ? 'border-red-600' : 'border-gray-100 dark:border-gray-800'}`} />
            <Input label="CVV" placeholder="***" type="password" value={cardData.cvv} onChange={handleCVV} className={`h-16 rounded-2xl border-2 ${errors.cardCvv ? 'border-red-600' : 'border-gray-100 dark:border-gray-800'}`} />
          </div>

          {/* Güvenli Ödeme - Iyzico */}
          <div className="flex items-center justify-center gap-3 py-4 px-6 bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={20} />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">256-bit SSL ile güvenli ödeme</span>
            <img
              src="/payment/iyzico/iyzico-logo-pack/checkout_iyzico_ile_ode/TR/Tr_Colored/iyzico_ile_ode_colored.svg"
              alt="iyzico ile öde"
              className="h-6 opacity-80"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Discount Banner */}
          {bankTransferSettings?.isEnabled && bankTransferDiscount > 0 && (
            <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                  <Percent size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    %{bankTransferSettings.discountPercent} İndirim Uygulandı!
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-500">
                    ₺{bankTransferDiscount.toFixed(2)} tasarruf ediyorsunuz
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Accounts */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Landmark size={14} /> Banka Hesap Bilgileri
            </p>

            {companyInfo?.bankAccounts?.filter(a => a.isActive).map((account) => (
              <div key={account.id} className="p-5 bg-white dark:bg-dark-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900 dark:text-white">{account.bankName}</span>
                  <span className="text-xs text-gray-400">{account.currency === 'TRY' ? '₺ TL' : account.currency === 'USD' ? '$ USD' : '€ EUR'}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{account.accountHolder}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg text-sm font-mono tracking-wider text-gray-700 dark:text-gray-300">
                    {account.iban}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(account.iban);
                      setCopiedIban(account.id);
                      setTimeout(() => setCopiedIban(null), 2000);
                    }}
                    className={`p-3 rounded-lg transition-all ${copiedIban === account.id ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 dark:bg-dark-800 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {copiedIban === account.id ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            ))}

            {(!companyInfo?.bankAccounts || companyInfo.bankAccounts.filter(a => a.isActive).length === 0) && (
              <div className="p-6 bg-gray-50 dark:bg-dark-800 rounded-2xl text-center">
                <p className="text-sm text-gray-400">Banka hesap bilgileri sipariş onayından sonra e-posta ile gönderilecektir.</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div className="space-y-2">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Önemli Bilgiler:</p>
                <ul className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-disc list-inside">
                  <li>Açıklama kısmına <strong>sipariş numaranızı</strong> yazmayı unutmayın</li>
                  <li>Ödemenizi <strong>{bankTransferSettings?.paymentDeadlineHours || 12} saat</strong> içinde tamamlayın</li>
                  <li>Ödeme onaylandığında siparişiniz hazırlanmaya başlar</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Deadline Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <Clock size={18} className="text-gray-400" />
            <p className="text-xs text-gray-500">
              Ödeme süresi: Sipariş tarihinden itibaren <strong className="text-gray-700 dark:text-gray-300">{bankTransferSettings?.paymentDeadlineHours || 12} saat</strong>
            </p>
          </div>
        </div>
      )}
    </div>    <div className="flex gap-4 mt-12 border-t pt-10">
      <button onClick={() => setCurrentStep(1)} className="px-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brown-900 transition-colors">GERİ DÖN</button>
      <Button onClick={handleCompleteOrder} loading={isSubmitting} disabled={!agreedToTerms} className={`flex-1 h-18 rounded-full shadow-2xl ${!agreedToTerms ? 'opacity-50 cursor-not-allowed' : ''}`}>
        SİPARİŞİ TAMAMLA
      </Button>
    </div>
  </section>
)}

        {/* Summary Side - Sticky */}
        <div className="lg:col-span-1">
          {/* Başlık modal dışında - Sticky */}
          <div className="sticky top-24 z-40 flex items-center gap-4 mb-8 pb-4 bg-cream-100 dark:bg-dark-900 -mx-2 px-2">
            <ShieldCheck className="text-gold" size={28} />
            <h2 className="font-display text-4xl font-bold italic dark:text-white">Sipariş Özeti</h2>
          </div>

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
                        Hafta sonu kargolama yapılmamaktadır (ürün tazeliği ve kalite kontrolü için). Siparişiniz <strong className="text-brand-orange">{shippingAlerts.nextShipDate}</strong> tarihinde kargoya verilecektir.
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
                {/* Bank Transfer Discount */}
                {bankTransferDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs animate-in fade-in">
                    <span className="uppercase tracking-widest text-emerald-600 font-bold flex items-center gap-1">
                      <Percent size={12} /> Havale İndirimi (%{bankTransferSettings?.discountPercent})
                    </span>
                    <span className="font-bold text-emerald-600">-₺{bankTransferDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                  <span className="font-display text-lg font-bold dark:text-white">Toplam</span>
                  <div className="text-right">
                    {bankTransferDiscount > 0 && (
                      <span className="text-sm text-gray-400 line-through mr-2">₺{grandTotal.toFixed(2)}</span>
                    )}
                    <span className="font-display text-3xl font-bold text-brown-900 dark:text-gold italic">₺{finalTotal.toFixed(2)}</span>
                  </div>
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
  onClick={() => {
    if (currentStep === 1) {
      // Guest mode için validasyon
      if (isGuestMode && !isGuestFormValid) {
        setErrors({ address: 'Lütfen tüm bilgileri eksiksiz doldurun.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!agreedToTerms) {
        setErrors({ terms: 'Lütfen satış sözleşmesini onaylayın.' });
        return;
      }
      setCurrentStep(2);
    } else {
      handleCompleteOrder();
    }
  }}
  loading={isSubmitting}
  disabled={(currentStep === 1 && (isGuestMode ? !isGuestFormValid : !selectedAddressId)) || !agreedToTerms}
  size="lg"
  className={`w-full h-16 shadow-2xl rounded-xl text-[11px] font-bold uppercase tracking-[0.3em] ${!agreedToTerms ? 'opacity-50' : ''}`}
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

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-900 border-t-2 border-gray-200 dark:border-gray-800 shadow-2xl animate-slide-up">
        <div className="px-4 py-4 flex items-center justify-between gap-4">
          {/* Total */}
          <div className="flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Toplam Tutar</p>
            <p className="font-display text-2xl font-bold text-brown-900 dark:text-gold italic">
              ₺{finalTotal.toFixed(2)}
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => currentStep === 1 ? setCurrentStep(2) : handleCompleteOrder()}
            loading={isSubmitting}
            disabled={currentStep === 1 ? (isGuestMode ? !isGuestFormValid : !selectedAddressId) : !agreedToTerms}
            className={`px-8 h-14 rounded-full shadow-xl text-xs whitespace-nowrap ${currentStep === 2 && !agreedToTerms ? 'opacity-50' : ''}`}
          >
            {currentStep === 1 ? 'DEVAM ET' : 'SİPARİŞİ TAMAMLA'}
          </Button>
        </div>
      </div>

      <Footer />
    </main>
  );
};