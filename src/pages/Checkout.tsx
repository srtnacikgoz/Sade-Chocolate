import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductContext';
import { Footer } from '../components/Footer';
import { ChevronRight, ChevronDown, ShieldCheck, CheckCircle2, MapPin, CreditCard, Plus, FileText, Building2, User, AlertTriangle, Thermometer, Calendar, Landmark, Copy, Check, Clock, Percent, RotateCcw } from 'lucide-react';
import { isBlackoutDay, getNextShippingDate, formatDateTR } from '../utils/shippingUtils';
import { checkWeatherForShipping, TEMPERATURE_THRESHOLDS } from '../services/weatherService';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { doc, getDoc, setDoc, arrayUnion, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CompanyInfo } from '../types';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { calculateShipping, findMNGDistrictCode } from '../services/shippingService';
import { TURKEY_CITIES, ALL_TURKEY_CITIES } from '../data/turkeyLocations';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export const Checkout: React.FC = () => {
  const { items, cartTotal, isGift, setIsGift, giftMessage, setGiftMessage, clearCart, hasGiftBag } = useCart();
  const { isLoggedIn, loading, user, addOrder } = useUser();
const addresses = user?.addresses || []; // Veriyi doğrudan kullanıcı profilinden alıyoruz
  const { settings } = useProducts(); // Admin panelinden gelen kargo limiti
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Guest mode state - URL'den ?guest=true ile gelindiyse direkt aktif
  const [isGuestMode, setIsGuestMode] = useState(() => searchParams.get('guest') === 'true');
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
const [invoiceType, setInvoiceType] = useState<'individual' | 'corporate'>('individual');
const [isSameAsDelivery, setIsSameAsDelivery] = useState(true);
const [vergiNo, setVergiNo] = useState(''); // Vergi no state (max 10 hane)
const [selectedInvoiceProfileId, setSelectedInvoiceProfileId] = useState<string | null>(null);
const [tcKimlikNo, setTcKimlikNo] = useState(''); // TC Kimlik No state (max 11 hane)
const [firmaUnvani, setFirmaUnvani] = useState('');
const [vergiDairesi, setVergiDairesi] = useState('');
const [faturaAdresi, setFaturaAdresi] = useState('');
const [faturaTitle, setFaturaTitle] = useState(''); // Fatura başlığı (Ev, İş, vb.)
const [faturaFirstName, setFaturaFirstName] = useState(''); // Bireysel fatura için ad
const [faturaLastName, setFaturaLastName] = useState(''); // Bireysel fatura için soyad
const [faturaCity, setFaturaCity] = useState(''); // Fatura şehir
const [faturaDistrict, setFaturaDistrict] = useState(''); // Fatura ilçe

  // LocalStorage keys
  const DRAFT_KEY = 'sade_checkout_draft';
  const DRAFT_TIMESTAMP_KEY = 'sade_checkout_draft_timestamp';
  const DRAFT_EXPIRY_HOURS = 24; // 24 saat sonra draft'ı sil

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

  // Phone formatter helper - 0 ile başlamamalı, 533 342 04 93 formatında
  const formatPhone = (value: string, countryCode: string): string => {
    const digits = value.replace(/\D/g, '');

    if (countryCode === '+90') {
      const cleaned = digits.startsWith('0') ? digits.slice(1) : digits;
      const limited = cleaned.slice(0, 10);
      if (limited.length <= 3) return limited;
      if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`;
      if (limited.length <= 8) return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
      return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 8)} ${limited.slice(8)}`;
    }

    return digits.substring(0, 15);
  };

  // LocalStorage helpers
  const saveDraftToLocalStorage = useCallback(() => {
    try {
      const draft = {
        isGuestMode,
        guestData,
        invoiceType,
        isSameAsDelivery,
        tcKimlikNo,
        vergiNo,
        firmaUnvani,
        vergiDairesi,
        faturaAdresi,
        faturaFirstName,
        faturaLastName,
        faturaCity,
        faturaDistrict,
        faturaTitle,
        currentStep
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      localStorage.setItem(DRAFT_TIMESTAMP_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Draft kaydetme hatası:', error);
    }
  }, [
    isGuestMode, guestData, invoiceType, isSameAsDelivery,
    tcKimlikNo, vergiNo, firmaUnvani, vergiDairesi, faturaAdresi,
    faturaFirstName, faturaLastName, faturaCity, faturaDistrict, faturaTitle, currentStep
  ]);

  const loadDraftFromLocalStorage = useCallback(() => {
    try {
      const draftStr = localStorage.getItem(DRAFT_KEY);
      const timestampStr = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

      if (!draftStr || !timestampStr) return null;

      // Expiry kontrolü
      const timestamp = new Date(timestampStr);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > DRAFT_EXPIRY_HOURS) {
        // Draft çok eski, sil
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
        return null;
      }

      return JSON.parse(draftStr);
    } catch (error) {
      console.error('Draft yükleme hatası:', error);
      return null;
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
    setHasDraft(false);
    setShowDraftRecovery(false);
  }, []);

  const restoreDraft = useCallback(() => {
    const draft = loadDraftFromLocalStorage();
    if (draft) {
      if (draft.isGuestMode) setIsGuestMode(draft.isGuestMode);
      if (draft.guestData) setGuestData(draft.guestData);
      if (draft.invoiceType) setInvoiceType(draft.invoiceType);
      if (draft.isSameAsDelivery !== undefined) setIsSameAsDelivery(draft.isSameAsDelivery);
      if (draft.tcKimlikNo) setTcKimlikNo(draft.tcKimlikNo);
      if (draft.vergiNo) setVergiNo(draft.vergiNo);
      if (draft.firmaUnvani) setFirmaUnvani(draft.firmaUnvani);
      if (draft.vergiDairesi) setVergiDairesi(draft.vergiDairesi);
      if (draft.faturaAdresi) setFaturaAdresi(draft.faturaAdresi);
      if (draft.faturaFirstName) setFaturaFirstName(draft.faturaFirstName);
      if (draft.faturaLastName) setFaturaLastName(draft.faturaLastName);
      if (draft.faturaCity) setFaturaCity(draft.faturaCity);
      if (draft.faturaDistrict) setFaturaDistrict(draft.faturaDistrict);
      if (draft.faturaTitle) setFaturaTitle(draft.faturaTitle);
      if (draft.currentStep) setCurrentStep(draft.currentStep);

      setShowDraftRecovery(false);
      setHasDraft(false);
    }
  }, [loadDraftFromLocalStorage]);

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

  // İlçeleri şehre göre filtrele (Misafir modu için)
  const availableGuestDistricts = useMemo(() => {
    const selectedCity = TURKEY_CITIES.find(c => c.name === guestData.city);
    return selectedCity?.districts || [];
  }, [guestData.city]);

  // İlçeleri şehre göre filtrele (Fatura adresi için)
  const availableInvoiceDistricts = useMemo(() => {
    const selectedCity = TURKEY_CITIES.find(c => c.name === faturaCity);
    return selectedCity?.districts || [];
  }, [faturaCity]);

// Kargo Hesaplama Mantığı (Admin panelden ayarlanabilir)
const freeShippingLimit = settings?.freeShippingLimit || 1500;
const defaultShippingCost = settings?.defaultShippingCost || 95;
const shippingCost = cartTotal >= freeShippingLimit ? 0 : defaultShippingCost;
const giftBagPrice = hasGiftBag && settings?.giftBag?.enabled ? (settings.giftBag.price || 0) : 0;
const grandTotal = cartTotal + shippingCost + giftBagPrice;
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [legalContent, setLegalContent] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState<{ total: number; subtotal: number; shipping: number; giftBag: number } | null>(null);
  const [orderId] = useState(() => Math.floor(Math.random() * 900000) + 100000);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [paymentCountdown, setPaymentCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  // Accordion states
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(true);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isNewAddressFormOpen, setIsNewAddressFormOpen] = useState(false);
  const [saveNewAddressToAccount, setSaveNewAddressToAccount] = useState(false);
  const [newTempAddress, setNewTempAddress] = useState({
    title: '',
    firstName: '',
    lastName: '',
    street: '',
    postCode: '',
    city: '',
    district: '',
    phone: '',
    phoneCountry: '+90'
  });

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

  // Sayfa yüklendiğinde draft kontrolü (sadece ilk yükleme)
  // ?guest=true ile geldiğinde eski draft'ı temizle - yeni misafir oturumu
  useEffect(() => {
    const isGuestFromUrl = searchParams.get('guest') === 'true';

    if (isGuestFromUrl) {
      // Misafir modu URL'den tetiklendi - temiz başla
      clearDraft();
      setShowDraftRecovery(false);
      setHasDraft(false);
      return;
    }

    const draft = loadDraftFromLocalStorage();
    if (draft) {
      setHasDraft(true);
      setShowDraftRecovery(true);
    }
  }, [loadDraftFromLocalStorage, searchParams, clearDraft]);

  // Kullanıcı form'a dokunduğunda draft uyarısını gizle
  useEffect(() => {
    if (showDraftRecovery && (
      guestData.firstName || guestData.lastName || guestData.email ||
      guestData.phone || guestData.city || guestData.district || guestData.address ||
      tcKimlikNo || vergiNo || firmaUnvani || faturaAdresi
    )) {
      setShowDraftRecovery(false);
    }
  }, [guestData, tcKimlikNo, vergiNo, firmaUnvani, faturaAdresi, showDraftRecovery]);

  // Debounced auto-save (2 saniye sonra kaydet)
  useEffect(() => {
    if (!isSuccess && (isGuestMode || currentStep === 1)) {
      const timeoutId = setTimeout(() => {
        saveDraftToLocalStorage();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    isGuestMode, guestData, invoiceType, isSameAsDelivery,
    tcKimlikNo, vergiNo, firmaUnvani, vergiDairesi, faturaAdresi,
    faturaFirstName, faturaLastName, faturaCity, faturaDistrict, faturaTitle,
    currentStep, isSuccess, saveDraftToLocalStorage
  ]);

  // Sipariş başarılı olduğunda draft'ı temizle
  useEffect(() => {
    if (isSuccess) {
      clearDraft();
    }
  }, [isSuccess, clearDraft]);

  // EFT siparişleri için geri sayım
  useEffect(() => {
    if (!isSuccess || paymentMethod !== 'eft') return;

    const deadlineHours = bankTransferSettings?.paymentDeadlineHours || 12;
    const deadline = Date.now() + deadlineHours * 60 * 60 * 1000;

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = deadline - now;

      if (remaining <= 0) {
        setPaymentCountdown({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setPaymentCountdown({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isSuccess, paymentMethod, bankTransferSettings?.paymentDeadlineHours]);

  useEffect(() => {
    if (isLoggedIn) {
      const defAddr = addresses.find(a => a.isDefault) || addresses[0];
      if (defAddr) setSelectedAddressId(defAddr.id);

      // Kayıtlı fatura profili varsa otomatik seç
      const invoiceProfiles = user?.invoiceProfiles || [];
      if (invoiceProfiles.length > 0) {
        const defaultProfile = invoiceProfiles[0];
        setSelectedInvoiceProfileId(defaultProfile.id);
        // Profil bilgilerini form alanlarına doldur
        setInvoiceType(defaultProfile.type || 'individual');
        setFaturaTitle(defaultProfile.title || '');
        setFaturaCity(defaultProfile.city || '');
        setFaturaDistrict(defaultProfile.district || '');
        setFaturaAdresi(defaultProfile.address || '');

        if (defaultProfile.type === 'corporate') {
          setFirmaUnvani(defaultProfile.companyName || '');
          setVergiDairesi(defaultProfile.taxOffice || '');
          setVergiNo(defaultProfile.taxNo || '');
        } else {
          setFaturaFirstName(defaultProfile.firstName || '');
          setFaturaLastName(defaultProfile.lastName || '');
          setTcKimlikNo(defaultProfile.tckn || '');
        }
      }
    }
  }, [isLoggedIn, addresses, user?.invoiceProfiles]);

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

  // Load legal content from CMS
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'legal'), (doc) => {
      if (doc.exists()) setLegalContent(doc.data());
    });
    return () => unsub();
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

  // Telefon numarası formatla - 0 ile başlamamalı
  const formatPhoneNumber = (value: string, countryCode: string) => {
    const digits = value.replace(/\D/g, '');

    if (countryCode === '+90') {
      // 0 ile başlıyorsa kaldır
      const cleaned = digits.startsWith('0') ? digits.slice(1) : digits;
      // TR format: 533 342 04 93 (10 digit)
      const limited = cleaned.substring(0, 10);
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
      // Şehir kodunu bul (plaka kodu)
      const shippingCity = isGuestMode ? guestData.city : addresses.find(a => a.id === selectedAddressId)?.city || '';
      const shippingDistrict = isGuestMode ? guestData.district : addresses.find(a => a.id === selectedAddressId)?.district || '';
      const cityData = TURKEY_CITIES.find(c => c.name === shippingCity);
      const cityCode = cityData?.id?.toString() || '34'; // Default: İstanbul

      // Toplam ağırlık ve desi hesapla
      // Ürün verisi varsa kullan, yoksa varsayılan değerler (200g, 1 desi)
      const totalWeightGram = items.reduce((sum, item) => {
        const itemWeight = (item as any).weight || 200; // gram, varsayılan 200g
        return sum + (item.quantity * itemWeight);
      }, 0);
      const totalWeight = totalWeightGram / 1000; // kg'a çevir

      // Desi hesapla: (U × G × Y) / 3000 - her ürün için
      const totalDesiFromDimensions = items.reduce((sum, item) => {
        const dims = (item as any).dimensions;
        if (dims?.length && dims?.width && dims?.height) {
          const itemDesi = (dims.length * dims.width * dims.height) / 3000;
          return sum + (item.quantity * itemDesi);
        }
        return sum + (item.quantity * 1); // Varsayılan 1 desi
      }, 0);

      // Kargo firması hangisi büyükse onu kullanır
      const totalDesi = Math.max(1, Math.ceil(Math.max(totalWeight, totalDesiFromDimensions)));

      if (isGuestMode) {
        // Guest sipariş oluştur - Admin panelinin beklediği formatta
        const { addDoc, collection } = await import('firebase/firestore');
        const docRef = await addDoc(collection(db, 'orders'), {
          id: `SADE-${orderId}`,
          // Müşteri bilgileri (nested object - admin panel bu formatı bekliyor)
          customer: {
            name: `${guestData.firstName} ${guestData.lastName}`,
            email: guestData.email,
            phone: guestData.phone
          },
          // Kargo/Teslimat bilgileri
          shipping: {
            address: guestData.address,
            city: guestData.city,
            district: guestData.district,
            method: 'standard'
          },
          // Ürünler
          items: items.map(item => ({
            productId: item.id,
            name: item.title,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          // Ödeme bilgileri
          payment: {
            method: paymentMethod,
            subtotal: cartTotal,
            shipping: shippingCost,
            ...(giftBagPrice > 0 && { giftBag: giftBagPrice }),
            ...(bankTransferDiscount > 0 && { discount: bankTransferDiscount }),
            total: finalTotal,
            status: paymentMethod === 'eft' ? 'pending' : 'paid'
          },
          // Hediye çantası seçimi
          hasGiftBag: hasGiftBag && settings?.giftBag?.enabled,
          // Hediye siparişi bilgileri
          isGift: isGift,
          ...(isGift && giftMessage && { giftMessage }),
          // Maliyet Analizi (Admin için - müşteri görmez)
          costAnalysis: {
            customerPaid: shippingCost,
            mngEstimate: null, // API'den sonra güncellenecek
            calculatedAt: null,
            profit: null
          },
          // Durum
          status: paymentMethod === 'eft' ? 'pending' : 'processing',
          ...(paymentMethod === 'eft' && { paymentDeadline: new Date(Date.now() + (bankTransferSettings?.paymentDeadlineHours || 12) * 60 * 60 * 1000).toISOString() }),
          isGuest: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Timeline
          timeline: [{
            status: paymentMethod === 'eft' ? 'pending' : 'processing',
            time: new Date().toLocaleString('tr-TR'),
            note: paymentMethod === 'eft' ? 'Ödeme bekleniyor' : 'Sipariş alındı'
          }]
        });

        // Arka planda MNG API'den gerçek kargo maliyetini hesapla (müşteriyi bekletmez)
        (async () => {
          try {
            // Önce ilçe kodunu bul
            const districtCode = await findMNGDistrictCode(cityCode, shippingDistrict);

            // Kargo maliyetini hesapla
            const mngCost = await calculateShipping({
              cityCode,
              districtCode: districtCode || '0',
              address: guestData.address,
              weight: totalWeight,
              desi: totalDesi
            });

            if (mngCost) {
              await updateDoc(doc(db, 'orders', docRef.id), {
                'costAnalysis.mngEstimate': mngCost.total,
                'costAnalysis.mngDistrictCode': districtCode,
                'costAnalysis.calculatedAt': new Date().toISOString(),
                'costAnalysis.profit': shippingCost - mngCost.total
              });
            }
          } catch (err) {
            console.log('MNG maliyet hesaplama hatası (önemli değil):', err);
          }
        })();
      } else {
        // Kayıtlı kullanıcı siparişi
        addOrder({
          id: `SADE-${orderId}`,
          date: new Date().toISOString(),
          status: paymentMethod === 'eft' ? 'Ödeme Bekleniyor' : 'Hazırlanıyor',
          total: finalTotal,
          subtotal: cartTotal,
          shippingCost,
          ...(giftBagPrice > 0 && { giftBagPrice }),
          ...(bankTransferDiscount > 0 && { bankTransferDiscount }),
          paymentMethod: paymentMethod,
          ...(paymentMethod === 'eft' && { paymentDeadline: new Date(Date.now() + (bankTransferSettings?.paymentDeadlineHours || 12) * 60 * 60 * 1000).toISOString() }),
          items: [...items],
          // Hediye bilgileri
          hasGiftBag: hasGiftBag && settings?.giftBag?.enabled,
          isGift: isGift,
          ...(isGift && giftMessage && { giftMessage }),
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

      // Sipariş verilerini kaydet (clearCart'tan önce!)
      setSuccessOrderData({
        total: finalTotal,
        subtotal: cartTotal,
        shipping: shippingCost,
        giftBag: giftBagPrice
      });
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

  // Kullanıcı giriş yapmamışsa ve guest mode seçmemişse, Account sayfasına yönlendir
  if (!isLoggedIn && !isGuestMode) {
    navigate('/account?redirect=checkout', { replace: true });
    return null;
  }


  if (items.length === 0 && !isSuccess) { 
    navigate('/catalog'); 
    return null; 
  }

  if (isSuccess) {
    return (
      <main className="w-full max-w-screen-xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen flex flex-col items-center justify-center text-center animate-fade-in">
        <div className={`w-24 h-24 ${paymentMethod === 'eft' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'} rounded-full flex items-center justify-center mb-8 shadow-luxurious border-4 border-white dark:border-dark-900 animate-bounce`}>
          <span className="material-icons-outlined text-5xl">{paymentMethod === 'eft' ? 'schedule' : 'check_circle'}</span>
        </div>

        <h2 className="font-display text-5xl font-bold text-gray-900 dark:text-white mb-4 italic">
          {paymentMethod === 'eft' ? 'Siparişiniz Alındı!' : 'Siparişiniz Tamamlandı!'}
        </h2>

        <p className="text-base text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
          {paymentMethod === 'eft'
            ? 'Ödemenizi tamamladığınızda siparişiniz hazırlanmaya başlayacaktır.'
            : t('order_success_msg')}
          <strong className="text-brown-900 dark:text-gold block mt-2 text-3xl font-display tracking-tight">#SADE-{orderId}</strong>
        </p>

        {/* EFT Geri Sayım ve Banka Bilgileri */}
        {paymentMethod === 'eft' && paymentCountdown && (
          <div className="w-full max-w-lg mb-8 space-y-6">
            {/* Geri Sayım */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-3xl border border-amber-200/50 dark:border-amber-700/50">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="text-amber-600 dark:text-amber-400" size={20} />
                <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                  Ödeme Süresi
                </span>
              </div>
              <div className="flex justify-center gap-4">
                <div className="bg-white dark:bg-dark-800 px-5 py-3 rounded-xl shadow-sm">
                  <span className="text-3xl font-bold text-brown-900 dark:text-gold font-mono">
                    {String(paymentCountdown.hours).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-gray-400 block">saat</span>
                </div>
                <div className="bg-white dark:bg-dark-800 px-5 py-3 rounded-xl shadow-sm">
                  <span className="text-3xl font-bold text-brown-900 dark:text-gold font-mono">
                    {String(paymentCountdown.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-gray-400 block">dk</span>
                </div>
                <div className="bg-white dark:bg-dark-800 px-5 py-3 rounded-xl shadow-sm">
                  <span className="text-3xl font-bold text-brown-900 dark:text-gold font-mono">
                    {String(paymentCountdown.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-gray-400 block">sn</span>
                </div>
              </div>
            </div>

            {/* Banka Bilgileri */}
            {companyInfo?.bankAccounts && companyInfo.bankAccounts.length > 0 && (
              <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <Landmark className="text-gold" size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Banka Hesabı</span>
                </div>
                {companyInfo.bankAccounts.slice(0, 1).map((account: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <p className="font-medium text-brown-900 dark:text-white">{account.bankName}</p>
                    <div className="bg-white dark:bg-dark-700 p-4 rounded-xl space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">IBAN</span>
                        <span className="font-mono font-medium text-brown-900 dark:text-white">{account.iban}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hesap Sahibi</span>
                        <span className="font-medium text-brown-900 dark:text-white">{account.accountHolder}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Açıklama: <strong className="text-brown-900 dark:text-gold">SADE-{orderId}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Tutar */}
            <div className="bg-brown-900 dark:bg-dark-800 text-white p-4 rounded-2xl flex justify-between items-center">
              <span className="text-sm font-medium">Ödenecek Tutar</span>
              <span className="text-2xl font-bold font-display">₺{(successOrderData?.total || finalTotal).toLocaleString('tr-TR')}</span>
            </div>

            {/* Sipariş Özeti */}
            {successOrderData && (
              <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-2xl space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Ara Toplam</span>
                  <span>₺{successOrderData.subtotal.toLocaleString('tr-TR')}</span>
                </div>
                {successOrderData.giftBag > 0 && (
                  <div className="flex justify-between text-pink-600">
                    <span>Hediye Çantası</span>
                    <span>+₺{successOrderData.giftBag.toLocaleString('tr-TR')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Kargo</span>
                  <span>{successOrderData.shipping === 0 ? 'Ücretsiz' : `₺${successOrderData.shipping}`}</span>
                </div>
                <div className="flex justify-between font-bold text-brown-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Toplam</span>
                  <span>₺{successOrderData.total.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            )}
          </div>
        )}

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
<div className="relative mb-16">
  <nav className="flex items-center justify-center gap-8 text-[9px] font-black uppercase tracking-[0.4em]">
    <span className="text-gray-400 cursor-pointer hover:text-gold transition-all" onClick={() => navigate('/cart')}>01 SEPET</span>
    <div className="w-8 h-px bg-gray-100"></div>
    <span className={currentStep >= 1 ? "text-brown-900 dark:text-white" : "text-gray-300"}>02 TESLİMAT</span>
    <div className="w-8 h-px bg-gray-100"></div>
    <span className={currentStep === 2 ? "text-brown-900 dark:text-white" : "text-gray-300"}>03 ÖDEME</span>
  </nav>
  {/* Geri Dön Butonu - Sadece ödeme adımında */}
  {currentStep === 2 && (
    <button
      onClick={() => setCurrentStep(1)}
      className="absolute left-0 top-0 flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors group"
    >
      <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={14} />
      Geri Dön
    </button>
  )}
</div>

      {/* Draft Recovery - Removed: Showing this in checkout is redundant */}
      <div className="mb-12 text-center border-b border-gray-50 dark:border-gray-800 pb-8">
  <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em] mb-4 block">Güvenli Ödeme Hattı</span>
  <h1 className="font-display text-5xl lg:text-6xl font-light dark:text-white italic tracking-tighter">
    {t('checkout_title')}
  </h1>
</div>

      <div className="max-w-4xl mx-auto space-y-8">

        {currentStep === 1 ? (
          <>
            {/* SİPARİŞ ÖZETİ - En Üstte */}
            <section className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                <ShieldCheck className="text-gold" size={28} />
                <h2 className="font-display text-3xl font-bold italic dark:text-white">Sipariş Özeti</h2>
              </div>

              {/* Shipping Alert Banners */}
              {(shippingAlerts.isBlackoutDay || shippingAlerts.isHeatHold) && (
                <div className="space-y-3 mb-8">
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

              {/* Ürünler Listesi */}
              <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 items-center p-4 bg-gray-50 dark:bg-dark-900 rounded-2xl">
                    <div className="w-16 h-16 bg-white dark:bg-dark-800 rounded-xl overflow-hidden shrink-0">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold dark:text-white truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{item.quantity} Adet • ₺{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hediye Paketi */}
              {isGift && (
                <div className="mb-6 p-4 bg-gold/5 rounded-2xl border border-gold/10">
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

              {/* Fiyat Özeti */}
              <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="uppercase tracking-wider font-medium">Ara Toplam</span>
                  <span className="font-bold">₺{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="uppercase tracking-wider font-medium text-gray-600 dark:text-gray-400">Kargo</span>
                  <span className={`font-bold ${shippingCost === 0 ? 'text-emerald-600' : 'dark:text-white'}`}>
                    {shippingCost === 0 ? 'Ücretsiz' : `₺${shippingCost}`}
                  </span>
                </div>

                {giftBagPrice > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="uppercase tracking-wider font-medium text-pink-500">Hediye Çantası</span>
                    <span className="font-bold text-pink-500">+₺{giftBagPrice.toFixed(2)}</span>
                  </div>
                )}

                {bankTransferDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="uppercase tracking-wider font-bold text-emerald-600 flex items-center gap-1">
                      <Percent size={14} /> Havale İndirimi
                    </span>
                    <span className="font-bold text-emerald-600">-₺{bankTransferDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                  <span className="font-display text-xl font-bold dark:text-white">Toplam</span>
                  <div className="text-right">
                    {bankTransferDiscount > 0 && (
                      <span className="text-sm text-gray-400 line-through mr-2">₺{grandTotal.toFixed(2)}</span>
                    )}
                    <span className="font-display text-4xl font-bold text-brown-900 dark:text-gold italic">₺{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* TESLİMAT BİLGİLERİ ACCORDION */}
            <section className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden">
              <button
                onClick={() => setIsDeliveryOpen(!isDeliveryOpen)}
                className="w-full p-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <MapPin className="text-gold" size={28} />
                  <h2 className="font-display text-3xl font-bold italic dark:text-white">Teslimat Bilgileri</h2>
                </div>
                <ChevronDown className={`text-gray-400 transition-transform duration-300 ${isDeliveryOpen ? 'rotate-180' : ''}`} size={24} />
              </button>

              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isDeliveryOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 pb-8">

{/* Guest Mode Form */}
{isGuestMode ? (
  <div className="space-y-6">
    <div className="flex items-center gap-3 p-4 bg-gold/5 rounded-2xl border border-gold/20">
      <ShieldCheck className="text-gold" size={20} />
      <p className="text-xs text-gray-600 dark:text-gray-300">Misafir olarak devam ediyorsunuz. Sipariş bilgileriniz e-posta adresinize gönderilecektir.</p>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <Input
        label="ADINIZ"
        placeholder="Can"
        className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
        required
        value={guestData.firstName}
        onChange={(e) => setGuestData({...guestData, firstName: e.target.value})}
      />
      <Input
        label="SOYADINIZ"
        placeholder="Yılmaz"
        className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
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
        className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
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
          className="h-16 px-4 rounded-md border border-gray-400 dark:border-gray-500 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all appearance-none cursor-pointer
          bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3c%2Fsvg%3E')]
          bg-[length:14px_14px] bg-[right_0.5rem_center] bg-no-repeat pr-8"
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
          className="flex-1 h-16 px-6 rounded-md border border-gray-400 dark:border-gray-500 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 font-medium focus:outline-none focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
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
      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ŞEHİR</label>
        <select
          value={guestData.city}
          onChange={(e) => setGuestData({...guestData, city: e.target.value, district: ''})}
          className="w-full h-16 px-4 rounded-md border border-gray-400 dark:border-gray-500 bg-white dark:bg-dark-800 text-gray-900 dark:text-white transition-all focus:outline-none appearance-none cursor-pointer focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30
          bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3c%2Fsvg%3E')]
          bg-[length:16px_16px] bg-[right_1rem_center] bg-no-repeat"
          required
        >
          <option value="" className="text-gray-500">Şehir seçin...</option>
          {ALL_TURKEY_CITIES.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">İLÇE</label>
        <select
          value={guestData.district}
          onChange={(e) => setGuestData({...guestData, district: e.target.value})}
          disabled={!guestData.city || availableGuestDistricts.length === 0}
          className="w-full h-16 px-4 rounded-md border border-gray-400 dark:border-gray-500 bg-white dark:bg-dark-800 text-gray-900 dark:text-white transition-all focus:outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30
          bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3c%2Fsvg%3E')]
          bg-[length:16px_16px] bg-[right_1rem_center] bg-no-repeat"
          required
        >
          <option value="" className="text-gray-500">{!guestData.city ? 'Önce şehir seçin' : 'İlçe seçin...'}</option>
          {availableGuestDistricts.map(district => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AÇIK ADRES</label>
      <textarea
        className="w-full p-5 bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 rounded-md text-sm placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 outline-none transition-all min-h-[120px] dark:text-white"
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
) : (
  <div className="grid md:grid-cols-2 gap-4 items-start">
    {/* Mevcut Adresler */}
    {addresses.map(addr => (
      <div
        key={addr.id}
        onClick={() => setSelectedAddressId(addr.id)}
        className={`p-8 border-2 rounded-2xl cursor-pointer transition-all duration-500 group relative ${selectedAddressId === addr.id ? 'border-brown-900 bg-white dark:bg-dark-800 shadow-xl scale-[1.01]' : 'border-gray-50 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
      >
        {selectedAddressId === addr.id && (
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-brown-900 text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
             <CheckCircle2 size={16} />
          </div>
        )}
        <div className="flex justify-between items-center mb-2">
          <p className="font-bold text-xs uppercase tracking-widest dark:text-white">{addr.title}</p>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{addr.address}</p>
        <p className="text-[10px] text-gray-400 mt-2">{addr.city} / {addr.district}</p>
      </div>
    ))}

    {/* Yeni Adres Kullan - Accordion */}
    <div className="border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsNewAddressFormOpen(!isNewAddressFormOpen)}
        className="w-full p-6 flex items-center justify-between text-gray-400 hover:border-gold hover:text-gold transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-dark-900 flex items-center justify-center group-hover:bg-gold/10">
            <Plus size={20} />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-widest block">Yeni Adres Kullan</span>
            <p className="text-[9px] text-gray-400">Geçici veya kalıcı adres ekleyin</p>
          </div>
        </div>
        <ChevronDown className={`transition-transform duration-300 ${isNewAddressFormOpen ? 'rotate-180' : ''}`} size={20} />
      </button>

      {/* Inline Adres Formu */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isNewAddressFormOpen ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-6 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-800">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="ADRES BAŞLIĞI"
              placeholder="Örn: Hediye Adresi"
              value={newTempAddress.title}
              onChange={e => setNewTempAddress({...newTempAddress, title: e.target.value})}
              className="h-14 rounded-md"
            />
            <Input
              label="AD"
              placeholder="Can"
              value={newTempAddress.firstName}
              onChange={e => setNewTempAddress({...newTempAddress, firstName: e.target.value})}
              className="h-14 rounded-md"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="SOYAD"
              placeholder="Yılmaz"
              value={newTempAddress.lastName}
              onChange={e => setNewTempAddress({...newTempAddress, lastName: e.target.value})}
              className="h-14 rounded-md"
            />
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TELEFON</label>
              <div className="flex gap-2">
                <select
                  value={newTempAddress.phoneCountry}
                  onChange={e => setNewTempAddress({...newTempAddress, phoneCountry: e.target.value})}
                  className="h-14 px-3 rounded-md border border-gray-400 dark:border-gray-500 bg-white dark:bg-dark-800 text-sm"
                  style={{ width: '110px' }}
                >
                  <option value="+90">🇹🇷 +90</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                </select>
                <Input
                  placeholder="533 342 04 93"
                  value={newTempAddress.phone}
                  onChange={e => setNewTempAddress({...newTempAddress, phone: formatPhone(e.target.value, newTempAddress.phoneCountry)})}
                  className="flex-1 h-14 rounded-md"
                />
              </div>
            </div>
          </div>

          <Input
            label="AÇIK ADRES"
            placeholder="Cadde, sokak, bina no, daire..."
            value={newTempAddress.street}
            onChange={e => setNewTempAddress({...newTempAddress, street: e.target.value})}
            className="h-14 rounded-md"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ŞEHİR</label>
              <select
                value={newTempAddress.city}
                onChange={e => {
                  setNewTempAddress({...newTempAddress, city: e.target.value, district: ''});
                }}
                className="w-full h-14 px-4 rounded-md border border-gray-400 dark:border-gray-500 bg-white dark:bg-dark-800"
              >
                <option value="">Şehir Seçin</option>
                {TURKEY_CITIES.map(city => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">İLÇE</label>
              <select
                value={newTempAddress.district}
                onChange={e => setNewTempAddress({...newTempAddress, district: e.target.value})}
                disabled={!newTempAddress.city}
                className="w-full h-14 px-4 rounded-md border border-gray-400 dark:border-gray-500 bg-white dark:bg-dark-800 disabled:opacity-50"
              >
                <option value="">İlçe Seçin</option>
                {TURKEY_CITIES.find(c => c.name === newTempAddress.city)?.districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kaydet Checkbox */}
          {isLoggedIn && (
            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-900 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-800 transition-all">
              <input
                type="checkbox"
                checked={saveNewAddressToAccount}
                onChange={e => setSaveNewAddressToAccount(e.target.checked)}
                className="w-5 h-5 text-brown-900 dark:text-gold rounded border-gray-300 dark:border-gray-600"
              />
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Bu adresi hesabıma kaydet</p>
                <p className="text-xs text-gray-500">Gelecekteki siparişlerde kullanabilirsiniz</p>
              </div>
            </label>
          )}

          <Button
            onClick={async () => {
              // Validate and use this address
              if (newTempAddress.title && newTempAddress.firstName && newTempAddress.lastName &&
                  newTempAddress.street && newTempAddress.city && newTempAddress.district && newTempAddress.phone) {

                // Eğer kaydetme checkbox'u işaretliyse ve kullanıcı giriş yapmışsa
                if (saveNewAddressToAccount && isLoggedIn && user?.uid) {
                  try {
                    const addressId = `addr-${Date.now()}`;
                    const addressToSave = { ...newTempAddress, id: addressId };
                    const userRef = doc(db, 'users', user.uid);

                    await setDoc(userRef, {
                      addresses: arrayUnion(addressToSave)
                    }, { merge: true });

                    // Kaydedilen adresi seç
                    setSelectedAddressId(addressId);
                    toast.success('Adres hesabınıza kaydedildi ve seçildi ✨');
                  } catch (error) {
                    console.error('Adres kaydetme hatası:', error);
                    toast.error('Adres kaydedilemedi, ancak geçici olarak kullanabilirsiniz');
                    setSelectedAddressId(-1); // Geçici ID
                  }
                } else {
                  // Sadece geçici olarak kullan
                  setSelectedAddressId(-1); // Special ID for temp address
                  toast.success('Adres seçildi (geçici)');
                }

                setIsNewAddressFormOpen(false);
                // Formu temizle
                setNewTempAddress({
                  title: '', firstName: '', lastName: '', street: '',
                  postCode: '', city: '', district: '', phone: '', phoneCountry: '+90'
                });
                setSaveNewAddressToAccount(false);
              } else {
                toast.error('Lütfen tüm alanları doldurun');
              }
            }}
            className="w-full h-14 rounded-xl"
          >
            {saveNewAddressToAccount ? 'Kaydet ve Kullan' : 'Bu Adresi Kullan'}
          </Button>
        </div>
      </div>
    </div>
  </div>
)}
                </div>
              </div>
            </section>

{/* FATURA BİLGİLERİ ACCORDION */}
            <section className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden">
              <button
                onClick={() => setIsInvoiceOpen(!isInvoiceOpen)}
                className="w-full p-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FileText className="text-gold" size={28} />
                  <h2 className="font-display text-3xl font-bold italic dark:text-white">Fatura Bilgileri</h2>
                </div>
                <ChevronDown className={`text-gray-400 transition-transform duration-300 ${isInvoiceOpen ? 'rotate-180' : ''}`} size={24} />
              </button>

              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isInvoiceOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 pb-8">

      <div className="space-y-6">
        {/* Kayıtlı Fatura Profilleri - Sadece giriş yapmış kullanıcılar için */}
        {isLoggedIn && user?.invoiceProfiles && user.invoiceProfiles.length > 0 && (
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kayıtlı Fatura Profili</label>
            <div className="grid md:grid-cols-2 gap-3">
              {user.invoiceProfiles.map((profile: any) => (
                <div
                  key={profile.id}
                  onClick={() => {
                    setSelectedInvoiceProfileId(profile.id);
                    setInvoiceType(profile.type || 'individual');
                    setFaturaTitle(profile.title || '');
                    setFaturaCity(profile.city || '');
                    setFaturaDistrict(profile.district || '');
                    setFaturaAdresi(profile.address || '');

                    if (profile.type === 'corporate') {
                      setFirmaUnvani(profile.companyName || '');
                      setVergiDairesi(profile.taxOffice || '');
                      setVergiNo(profile.taxNo || '');
                    } else {
                      setFaturaFirstName(profile.firstName || '');
                      setFaturaLastName(profile.lastName || '');
                      setTcKimlikNo(profile.tckn || '');
                    }
                    setIsSameAsDelivery(false);
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedInvoiceProfileId === profile.id ? 'border-brown-900 dark:border-gold bg-brown-900/5 dark:bg-gold/5' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedInvoiceProfileId === profile.id ? 'bg-brown-900 dark:bg-gold text-white dark:text-black' : 'bg-gray-100 dark:bg-dark-900 text-gray-500'}`}>
                      {profile.type === 'corporate' ? <Building2 size={14} /> : <User size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold dark:text-white truncate">{profile.title}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {profile.type === 'corporate' ? profile.companyName : `${profile.firstName} ${profile.lastName}`}
                      </p>
                    </div>
                    {selectedInvoiceProfileId === profile.id && (
                      <CheckCircle2 size={16} className="text-brown-900 dark:text-gold shrink-0" />
                    )}
                  </div>
                </div>
              ))}
              {/* Yeni Profil Ekle */}
              <div
                onClick={() => {
                  setSelectedInvoiceProfileId(null);
                  setTcKimlikNo('');
                  setVergiNo('');
                  setFirmaUnvani('');
                  setVergiDairesi('');
                  setFaturaAdresi('');
                }}
                className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center gap-2 ${!selectedInvoiceProfileId ? 'border-gold bg-gold/5 text-gold' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gold hover:text-gold'}`}
              >
                <Plus size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Farklı Bilgi Gir</span>
              </div>
            </div>
          </div>
        )}

        {/* Fatura Tipi Seçici - Yeni bilgi giriliyorsa veya guest mode */}
        {(!isLoggedIn || !selectedInvoiceProfileId) && (
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
        )}

        {/* Fatura Adresi Teslimatla Aynı mı? */}
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setIsSameAsDelivery(!isSameAsDelivery)}>
          <div className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${isSameAsDelivery ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold shadow-md' : 'border-gray-300 dark:border-gray-600'}`}>
            {isSameAsDelivery && <CheckCircle2 size={14} className="text-white" />}
          </div>
          <div className="flex-1 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-700 transition-colors">Fatura adresim teslimat adresiyle aynı olsun</p>
            {!isSameAsDelivery && (
              <ChevronRight className="text-gray-400 rotate-90 transition-transform" size={16} />
            )}
          </div>
        </div>

        {/* Dinamik Fatura Formu - Accordion ile */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            (!selectedInvoiceProfileId || !isSameAsDelivery || invoiceType === 'corporate') && !selectedInvoiceProfileId
              ? 'max-h-[2000px] opacity-100'
              : 'max-h-0 opacity-0'
          }`}
        >
          {(!selectedInvoiceProfileId || !isSameAsDelivery || invoiceType === 'corporate') && !selectedInvoiceProfileId && (
          <div className="bg-gray-50 dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 grid md:grid-cols-2 gap-6 mt-4">
            {invoiceType === 'corporate' ? (
              <>
                <Input
                  label="FİRMA UNVANI"
                  placeholder="LTD. ŞTİ."
                  className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
                  value={firmaUnvani}
                  onChange={(e) => setFirmaUnvani(e.target.value)}
                  autoComplete="off"
                  name="invoice_company"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="VERGİ DAİRESİ"
                    className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
                    value={vergiDairesi}
                    onChange={(e) => setVergiDairesi(e.target.value)}
                    autoComplete="off"
                    name="invoice_taxoffice"
                  />
                  <Input
                    label="VERGİ NO"
                    placeholder="0000000000"
                    className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={vergiNo}
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(/\D/g, '');
                      setVergiNo(onlyNumbers.substring(0, 10));
                    }}
                    autoComplete="off"
                    name="invoice_taxno"
                  />
                </div>
              </>
            ) : (
              <>
                <Input
                  label="AD"
                  placeholder="Adınız"
                  className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
                  value={faturaFirstName}
                  onChange={(e) => setFaturaFirstName(e.target.value)}
                  autoComplete="off"
                  name="invoice_firstname"
                />
                <Input
                  label="SOYAD"
                  placeholder="Soyadınız"
                  className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
                  value={faturaLastName}
                  onChange={(e) => setFaturaLastName(e.target.value)}
                  autoComplete="off"
                  name="invoice_lastname"
                />
                <Input
                  label="TC KİMLİK NO"
                  placeholder="11111111111"
                  className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={tcKimlikNo}
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/\D/g, '');
                    setTcKimlikNo(onlyNumbers.substring(0, 11));
                  }}
                  autoComplete="off"
                  name="invoice_tckn"
                />
              </>
            )}
            {!isSameAsDelivery && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ŞEHİR</label>
                  <select
                    value={faturaCity}
                    onChange={(e) => {
                      setFaturaCity(e.target.value);
                      setFaturaDistrict('');
                    }}
                    className="w-full h-16 px-4 rounded-md border border-gray-400 dark:border-gray-500 bg-white dark:bg-dark-800 text-gray-900 dark:text-white transition-all focus:outline-none appearance-none cursor-pointer focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30
                    bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3c%2Fsvg%3E')]
                    bg-[length:16px_16px] bg-[right_1rem_center] bg-no-repeat"
                  >
                    <option value="" className="text-gray-500">Şehir seçin...</option>
                    {ALL_TURKEY_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">İLÇE</label>
                  <select
                    value={faturaDistrict}
                    onChange={(e) => setFaturaDistrict(e.target.value)}
                    disabled={!faturaCity || availableInvoiceDistricts.length === 0}
                    className="w-full h-16 px-4 rounded-md border border-gray-400 dark:border-gray-500 bg-white dark:bg-dark-800 text-gray-900 dark:text-white transition-all focus:outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30
                    bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3c%2Fsvg%3E')]
                    bg-[length:16px_16px] bg-[right_1rem_center] bg-no-repeat"
                  >
                    <option value="" className="text-gray-500">{!faturaCity ? 'Önce şehir seçin' : 'İlçe seçin...'}</option>
                    {availableInvoiceDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">FATURA ADRESİ</label>
                  <textarea
                    className="w-full p-5 bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 rounded-md text-sm placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 outline-none transition-all min-h-[100px] dark:text-white"
                    placeholder="Faturanın kesileceği açık adres..."
                    value={faturaAdresi}
                    onChange={(e) => setFaturaAdresi(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          )}
        </div>

        {selectedInvoiceProfileId && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Kayıtlı fatura profiliniz kullanılacak
            </p>
          </div>
        )}
      </div>
                </div>
              </div>
            </section>

            {/* TERMS & CTA BUTTON */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 cursor-pointer group bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                <div className={`w-6 h-6 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold shadow-md' : 'border-gray-300 dark:border-gray-600'}`}>
                  {agreedToTerms && <span className="material-icons-outlined text-white text-[16px] font-bold">check</span>}
                </div>
                <p className={`text-sm leading-relaxed transition-colors ${errors.terms ? 'text-red-500 font-bold' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300'}`}>
                  {t('i_agree_to')}{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAgreementModal(true);
                    }}
                    className="underline font-bold text-brown-900 dark:text-gold hover:text-gold dark:hover:text-brown-300 transition-colors"
                  >
                    {t('terms_link')}
                  </button>.
                </p>
              </div>

              <Button
                onClick={() => {
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
                }}
                loading={isSubmitting}
                disabled={(isGuestMode ? !isGuestFormValid : !selectedAddressId) || !agreedToTerms}
                size="lg"
                className={`w-full h-16 shadow-2xl rounded-xl text-sm font-bold uppercase tracking-wider ${!agreedToTerms ? 'opacity-50' : ''}`}
              >
                ÖDEMEYE DEVAM ET <ChevronRight className="ml-2 inline-block" size={18} />
              </Button>
            </div>
          </>
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
          <Input label="KART ÜZERİNDEKİ İSİM" placeholder="CAN YILMAZ" className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all" />
          <Input label="KART NUMARASI" placeholder="0000 0000 0000 0000" value={cardData.number} onChange={handleCardNumber} className={`h-16 rounded-md bg-white dark:bg-dark-800 border placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all ${errors.cardNum ? 'border-red-600 border-2 bg-red-50/5' : 'border-gray-400 dark:border-gray-500'}`} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="S.K. TARİHİ" placeholder="AA/YY" value={cardData.expiry} onChange={handleExpiry} className={`h-16 rounded-md bg-white dark:bg-dark-800 border placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all ${errors.cardExp ? 'border-red-600 border-2' : 'border-gray-400 dark:border-gray-500'}`} />
            <Input label="CVV" placeholder="***" type="password" value={cardData.cvv} onChange={handleCVV} className={`h-16 rounded-md bg-white dark:bg-dark-800 border placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all ${errors.cardCvv ? 'border-red-600 border-2' : 'border-gray-400 dark:border-gray-500'}`} />
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

          {/* Ödeme Butonu */}
          <Button
            onClick={handleCompleteOrder}
            loading={isSubmitting}
            disabled={isSubmitting}
            size="lg"
            className="w-full h-20 shadow-2xl rounded-[30px] text-sm font-black uppercase tracking-[0.3em] bg-brown-900 dark:bg-gold text-white dark:text-black hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isSubmitting ? 'İŞLEM YAPILIYOR...' : 'ÖDEMEYE DEVAM ET'}
          </Button>
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

          {/* Deadline Warning - Prominent */}
          <div className="p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-amber-900/20 rounded-2xl border-2 border-amber-300 dark:border-amber-700 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl flex items-center justify-center shadow-md">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                  Ödeme Süresi
                </p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 font-mono">
                  {bankTransferSettings?.paymentDeadlineHours || 12} Saat
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>
                  Siparişiniz oluşturulduktan sonra <strong>{bankTransferSettings?.paymentDeadlineHours || 12} saat</strong> içinde ödemenizi tamamlamanız gerekmektedir.
                  Süre sonunda ödeme yapılmadığı takdirde siparişiniz otomatik olarak iptal edilecektir.
                </span>
              </p>
            </div>
          </div>

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

          {/* Sipariş Tamamla Butonu - EFT */}
          <Button
            onClick={handleCompleteOrder}
            loading={isSubmitting}
            disabled={isSubmitting}
            size="lg"
            className="w-full h-20 shadow-2xl rounded-[30px] text-sm font-black uppercase tracking-[0.3em] bg-brown-900 dark:bg-gold text-white dark:text-black hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isSubmitting ? 'SİPARİŞ OLUŞTURULUYOR...' : 'SİPARİŞİ TAMAMLA'}
          </Button>
        </div>
      )}
    </div>
  </section>
)}

      </div>

      {/* Mesafeli Satış Sözleşmesi Modal - CMS + Dinamik Bilgiler */}
      {showAgreementModal && (() => {
        // Dinamik bilgileri hesapla
        const selectedAddress = addresses.find(a => a.id === selectedAddressId);
        const buyerName = isGuestMode
          ? `${guestData.firstName} ${guestData.lastName}`
          : selectedAddress
            ? `${selectedAddress.firstName} ${selectedAddress.lastName}`
            : user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : '';
        const buyerAddress = isGuestMode
          ? `${guestData.address}, ${guestData.district}/${guestData.city}`
          : selectedAddress
            ? `${selectedAddress.street}, ${selectedAddress.district}/${selectedAddress.city}`
            : '';
        const buyerPhone = isGuestMode
          ? `${guestData.phoneCountry} ${guestData.phone}`
          : selectedAddress?.phone || user?.phone || '';
        const buyerEmail = isGuestMode ? guestData.email : user?.email || '';
        const currentDate = new Date().toLocaleDateString('tr-TR');

        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAgreementModal(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-dark-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-800 bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center gap-4">
                <span className="text-2xl">📋</span>
                <h2 className="text-lg font-bold text-purple-700 dark:text-purple-400">
                  Mesafeli Satış Sözleşmesi
                </h2>
              </div>
              <button
                onClick={() => setShowAgreementModal(false)}
                className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* TARAFLAR */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  TARAFLAR
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SATICI */}
                  <div className="bg-cream-50 dark:bg-dark-800 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">SATICI</h4>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Ünvan:</span> {companyInfo?.companyName || 'Sade Patisserie'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Adres:</span> {companyInfo?.branches?.[0]?.address ? `${companyInfo.branches[0].address}, ${companyInfo.branches[0].city}` : 'Antalya'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Telefon:</span> {companyInfo?.generalPhone || ''}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">E-posta:</span> {companyInfo?.generalEmail || ''}</p>
                      {companyInfo?.taxOffice && companyInfo?.taxNumber && (
                        <p><span className="font-medium text-gray-700 dark:text-gray-300">Vergi:</span> {companyInfo.taxOffice} / {companyInfo.taxNumber}</p>
                      )}
                    </div>
                  </div>
                  {/* ALICI */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">ALICI</h4>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Ad Soyad:</span> {buyerName || '-'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Adres:</span> {buyerAddress || '-'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Telefon:</span> {buyerPhone || '-'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">E-posta:</span> {buyerEmail || '-'}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SİPARİŞ BİLGİLERİ */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  SİPARİŞ BİLGİLERİ
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-dark-800">
                        <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300 rounded-tl-xl">Ürün</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Adet</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Birim Fiyat</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-700 dark:text-gray-300 rounded-tr-xl">Toplam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{item.name}</td>
                          <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">₺{item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">₺{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 dark:bg-dark-800">
                        <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Kargo:</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{shippingCost === 0 ? 'Ücretsiz' : `₺${shippingCost.toFixed(2)}`}</td>
                      </tr>
                      <tr className="bg-purple-100 dark:bg-purple-900/30">
                        <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white rounded-bl-xl">TOPLAM:</td>
                        <td className="px-4 py-3 text-right font-bold text-purple-700 dark:text-purple-400 rounded-br-xl">₺{finalTotal.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              {/* SÖZLEŞME METNİ (CMS'den) */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  SÖZLEŞME ŞARTLARI
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {legalContent?.[language]?.distance_sales_content || legalContent?.tr?.distance_sales_content || 'İçerik yükleniyor...'}
                </div>
              </section>

              {/* TARİH VE İMZA */}
              <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-end text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">SATICI</p>
                    <p className="text-gray-600 dark:text-gray-400">{companyInfo?.companyName || 'Sade Patisserie'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">{currentDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">ALICI</p>
                    <p className="text-gray-600 dark:text-gray-400">{buyerName || '-'}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-8 py-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dark-800">
              <button
                onClick={() => setShowAgreementModal(false)}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors"
              >
                Okudum, Anladım
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      <Footer />
    </main>
  );
};