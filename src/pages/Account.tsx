import React, { useState, useEffect } from 'react';
import { useUser, UserProfile } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { Footer } from '../components/Footer';
import { OrdersView } from '../components/account/OrdersView';
import { AddressesView } from '../components/account/AddressesView';
import { InvoiceInfoView } from '../components/account/InvoiceInfoView';
import { LoyaltyPanel } from '../components/account/LoyaltyPanel';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  ShoppingBag, MapPin, Receipt, Settings, HelpCircle,
  LogOut, Moon, Sun, Sparkles, ArrowLeft, User as UserIcon, ShieldCheck, CreditCard, Check, Award
} from 'lucide-react';

type AccountView = 'main' | 'orders' | 'addresses' | 'invoice' | 'settings' | 'help' | 'loyalty';



export const Account: React.FC = () => {
  const { isLoggedIn, user, login, loginWithGoogle, resetPassword, register, logout, orders, loading } = useUser();
  const { t, language, setLanguage } = useLanguage();

  const [currentView, setCurrentView] = useState<AccountView>('main');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const [regData, setRegData] = useState<UserProfile & { pass: string, confirmPass: string, referralCode: string }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    pass: '',
    confirmPass: '',
    referralCode: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validasyon fonksiyonları
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    // Türkiye için 10 hane gerekli (5xx veya 05xx kabul)
    if (digits.length === 10) return digits.startsWith('5');
    if (digits.length === 11) return digits.startsWith('05');
    return false;
  };

  const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const isValidBirthDate = (date: string): boolean => {
    if (!date) return false;
    const parts = date.split('-');
    // YYYY-MM-DD formatında olmalı ve tüm parçalar dolu olmalı
    return parts.length === 3 &&
           parts[0] !== '' && parts[0].length === 4 &&
           parts[1] !== '' && parts[1].length === 2 &&
           parts[2] !== '' && parts[2].length === 2;
  };

  // Alan bazlı hata mesajları
  const fieldErrors = {
    firstName: touched.firstName && !regData.firstName.trim() ? 'Ad gerekli' : '',
    lastName: touched.lastName && !regData.lastName.trim() ? 'Soyad gerekli' : '',
    email: touched.email && regData.email && !isValidEmail(regData.email) ? 'Geçersiz email' : '',
    phone: touched.phone && regData.phone && !isValidPhone(regData.phone) ? '10 haneli telefon gerekli' : '',
    birthDate: touched.birthDate && !isValidBirthDate(regData.birthDate) ? 'Doğum tarihi seçin' : '',
    pass: touched.pass && regData.pass && !isValidPassword(regData.pass) ? 'Min. 6 karakter' : '',
    confirmPass: regData.confirmPass && regData.pass !== regData.confirmPass ? 'Şifreler eşleşmiyor' : ''
  };

  // Kayıt formu validasyonu
  const isRegisterFormValid =
    regData.firstName.trim() !== '' &&
    regData.lastName.trim() !== '' &&
    isValidEmail(regData.email) &&
    isValidPhone(regData.phone) &&
    isValidBirthDate(regData.birthDate) &&
    isValidPassword(regData.pass) &&
    regData.pass === regData.confirmPass &&
    agreedToTerms;

  useEffect(() => {
    // Tema Başlatma: LocalStorage'dan oku, yoksa sistem tercihine bak
    const storedTheme = localStorage.getItem('theme');
    const isDarkInitial = storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkInitial);
    document.documentElement.classList.toggle('dark', isDarkInitial);
    
    window.scrollTo(0, 0);
  }, [isLoggedIn, user]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, pass, rememberMe);
    } catch (err: any) {
      // Firebase auth hata kodlarını Türkçe mesajlara çevir
      const errorCode = err?.code || '';
      let errorMessage = language === 'tr' ? 'Giriş yapılırken bir hata oluştu.' : 'An error occurred during login.';

      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        errorMessage = language === 'tr' ? 'E-posta veya şifre hatalı.' : 'Invalid email or password.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = language === 'tr' ? 'Geçersiz e-posta adresi.' : 'Invalid email address.';
      } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = language === 'tr' ? 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.' : 'Too many failed attempts. Please try again later.';
      } else if (errorCode === 'auth/user-disabled') {
        errorMessage = language === 'tr' ? 'Bu hesap devre dışı bırakılmış.' : 'This account has been disabled.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await loginWithGoogle();
      toast.success('Google ile giriş başarılı!');
    } catch (err: any) {
      const errorCode = err?.code || '';
      let errorMessage = language === 'tr' ? 'Google ile giriş yapılırken bir hata oluştu.' : 'An error occurred during Google sign-in.';

      if (errorCode === 'auth/popup-closed-by-user') {
        errorMessage = language === 'tr' ? 'Giriş işlemi iptal edildi.' : 'Sign-in cancelled.';
      } else if (errorCode === 'auth/popup-blocked') {
        errorMessage = language === 'tr' ? 'Pop-up engellendi. Lütfen tarayıcı ayarlarınızı kontrol edin.' : 'Pop-up blocked. Please check your browser settings.';
      }

      console.error('Google login hatası:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resetPassword(forgotEmail);
      setForgotEmailSent(true);
      toast.success('Şifre sıfırlama bağlantısı gönderildi!');
    } catch (err: any) {
      const errorCode = err?.code || '';
      let errorMessage = 'Bir hata oluştu.';

      if (errorCode === 'auth/user-not-found') {
        errorMessage = 'Bu e-posta adresiyle kayıtlı hesap bulunamadı.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi.';
      } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
        toast.error("Lütfen KVKK metnini onaylayın.");
        return;
    }
    setError('');
    setIsLoading(true);

    if (regData.pass !== regData.confirmPass) {
        setError(language === 'tr' ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.');
        setIsLoading(false);
        return;
    }

    if (!regData.birthDate) {
        setError(language === 'tr' ? 'Doğum tarihi gerekli.' : 'Birth date is required.');
        setIsLoading(false);
        return;
    }

    setTimeout(() => {
      const { pass: _, confirmPass: __, ...profile } = regData;
      register(profile, regData.pass);
      setIsLoading(false);
    }, 1000);
  };
// ✅ Oturum doğrulanırken şık bir bekleme ekranı göster
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-none animate-spin"></div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-gold">
            <span className="font-santana font-bold">Sade</span> <span className="font-santana font-normal">Chocolate</span>
          </p>
        </div>
      </div>
    );
  }
 if (!isLoggedIn) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-cream-100 dark:bg-dark-900 px-6 py-12">
        <div className="w-full max-w-[420px] animate-fade-in">

          {/* Logo */}
          <div className="text-center mb-12">
            <h1 className="font-santana text-5xl text-brown-900 dark:text-white font-bold tracking-tight mb-1">Sade</h1>
            <p className="font-santana text-xl text-brown-900 dark:text-white font-normal tracking-wide">Chocolate</p>
          </div>

          {/* Ana Kart */}
          <div className="bg-white dark:bg-dark-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm p-10 space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-bold dark:text-white tracking-tight">{isRegistering ? 'Hesap Oluştur' : 'Hoş Geldiniz'}</h2>
              <p className="text-xs text-gray-400 tracking-wide">{isRegistering ? 'Yeni bir hesap oluşturun.' : 'Gerçek çikolata deneyimine adım atın.'}</p>
            </div>

            {/* Login / Register Switch */}
            <div className="bg-gray-50 dark:bg-dark-900 p-1.5 rounded-2xl flex border border-gray-100 dark:border-gray-700">
              <button
                onClick={() => { setIsRegistering(false); setError(''); }}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-300 ${!isRegistering ? 'bg-white dark:bg-dark-800 text-brown-900 dark:text-gold shadow-md' : 'text-gray-400'}`}
              >
                Giriş Yap
              </button>
              <button
                onClick={() => { setIsRegistering(true); setError(''); }}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-300 ${isRegistering ? 'bg-white dark:bg-dark-800 text-brown-900 dark:text-gold shadow-md' : 'text-gray-400'}`}
              >
                Kayıt Ol
              </button>
            </div>

            {showForgotPassword ? (
              /* ŞİFREMİ UNUTTUM */
              <div className="space-y-6 animate-fade-in">
                {!forgotEmailSent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold dark:text-white">Şifreni mi unuttun?</h3>
                      <p className="text-xs text-gray-400">E-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim.</p>
                    </div>
                    <Input
                      label="E-posta"
                      type="email"
                      placeholder="isim@örnek.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="h-14 rounded-2xl"
                    />
                    {error && <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-wide">{error}</p>}
                    <Button
                      type="submit"
                      disabled={isLoading || !forgotEmail}
                      className="w-full h-16 rounded-full bg-brown-900 dark:bg-gold dark:text-black text-white font-bold text-[11px] uppercase tracking-[0.4em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                      loading={isLoading}
                    >
                      Bağlantı Gönder
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(false); setError(''); }}
                      className="w-full text-[10px] font-bold text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors uppercase tracking-wide"
                    >
                      Giriş'e Dön
                    </button>
                  </form>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                      <Check size={40} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold dark:text-white">Email Gönderildi!</h3>
                      <p className="text-xs text-gray-400">
                        <span className="font-bold text-brown-900 dark:text-gold">{forgotEmail}</span> adresine şifre sıfırlama bağlantısı gönderdik.
                      </p>
                      <p className="text-[10px] text-gray-400 mt-4">Spam klasörünü kontrol etmeyi unutmayın.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(false); setForgotEmailSent(false); setForgotEmail(''); setError(''); }}
                      className="w-full h-16 rounded-full bg-brown-900 dark:bg-gold dark:text-black text-white font-bold text-[11px] uppercase tracking-[0.4em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Giriş'e Dön
                    </button>
                  </div>
                )}
              </div>
            ) : !isRegistering ? (
              /* GİRİŞ FORMU */
              <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                <div className="space-y-4">
                  <Input label={t('email')} type="email" placeholder="isim@örnek.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-14 rounded-2xl" />
                  <div className="space-y-2">
                    <Input label={t('password')} type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required className="h-14 rounded-2xl" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${rememberMe ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold' : 'border-gray-200 dark:border-gray-600'}`}>
                          {rememberMe && <Check size={12} className="text-white dark:text-black" />}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 group-hover:text-brown-900 dark:group-hover:text-gold transition-colors">Beni Hatırla</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(true); setForgotEmail(email); setError(''); }}
                        className="text-[10px] font-bold text-gray-400 hover:text-gold transition-colors uppercase tracking-wide"
                      >
                        Şifremi Unuttum
                      </button>
                    </div>
                  </div>
                </div>
                {error && <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-wide">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-16 rounded-full bg-brown-900 dark:bg-gold dark:text-black text-white font-bold text-[11px] uppercase tracking-[0.4em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  loading={isLoading}
                >
                  {t('login_button')}
                </Button>

                {/* Ayraç */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
                    <span className="bg-white dark:bg-dark-800 px-4 text-gray-400 font-bold">veya</span>
                  </div>
                </div>

                {/* Google Giriş */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-16 rounded-full bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-gray-700 text-brown-900 dark:text-white font-bold text-[11px] uppercase tracking-[0.3em] shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google ile Giriş
                </button>
              </form>
            ) : (
              /* KAYIT FORMU */
              <form onSubmit={handleRegister} className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('first_name')}
                    placeholder="Can"
                    value={regData.firstName}
                    onChange={e => setRegData({...regData, firstName: e.target.value})}
                    onBlur={() => setTouched({...touched, firstName: true})}
                    error={fieldErrors.firstName}
                    autoComplete="given-name"
                    required
                    className={`h-14 rounded-2xl ${fieldErrors.firstName ? 'border-2 border-red-400' : ''}`}
                  />
                  <Input
                    label={t('last_name')}
                    placeholder="Yılmaz"
                    value={regData.lastName}
                    onChange={e => setRegData({...regData, lastName: e.target.value})}
                    onBlur={() => setTouched({...touched, lastName: true})}
                    error={fieldErrors.lastName}
                    autoComplete="family-name"
                    required
                    className={`h-14 rounded-2xl ${fieldErrors.lastName ? 'border-2 border-red-400' : ''}`}
                  />
                </div>
                <Input
                  label={t('email')}
                  type="email"
                  placeholder="isim@örnek.com"
                  value={regData.email}
                  onChange={e => setRegData({...regData, email: e.target.value})}
                  onBlur={() => setTouched({...touched, email: true})}
                  error={fieldErrors.email}
                  autoComplete="email"
                  required
                  className={`h-14 rounded-2xl ${fieldErrors.email ? 'border-2 border-red-400' : ''}`}
                />
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${fieldErrors.birthDate ? 'text-red-400' : 'text-gray-400'}`}>{t('birth_date')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          className={`h-16 rounded-2xl bg-gray-50 dark:bg-dark-800 px-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer dark:text-white ${!regData.birthDate.split('-')[2] && touched.birthDate ? 'border-2 border-red-400' : 'border-none'}`}
                          value={regData.birthDate.split('-')[2] || ''}
                          onChange={(e) => {
                            const parts = regData.birthDate.split('-');
                            const newDate = `${parts[0] || ''}-${parts[1] || ''}-${e.target.value}`;
                            setRegData({...regData, birthDate: newDate});
                            setTouched({...touched, birthDate: true});
                          }}
                          required
                        >
                          <option value="">GÜN</option>
                          {[...Array(31)].map((_, i) => <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{i+1}</option>)}
                        </select>
                        <select
                          className={`h-16 rounded-2xl bg-gray-50 dark:bg-dark-800 px-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer dark:text-white ${!regData.birthDate.split('-')[1] && touched.birthDate ? 'border-2 border-red-400' : 'border-none'}`}
                          value={regData.birthDate.split('-')[1] || ''}
                          onChange={(e) => {
                            const parts = regData.birthDate.split('-');
                            const newDate = `${parts[0] || ''}-${e.target.value}-${parts[2] || ''}`;
                            setRegData({...regData, birthDate: newDate});
                            setTouched({...touched, birthDate: true});
                          }}
                          required
                        >
                          <option value="">AY</option>
                          {['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'].map((m, i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{m}</option>)}
                        </select>
                        <select
                          className={`h-16 rounded-2xl bg-gray-50 dark:bg-dark-800 px-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer dark:text-white ${!regData.birthDate.split('-')[0] && touched.birthDate ? 'border-2 border-red-400' : 'border-none'}`}
                          value={regData.birthDate.split('-')[0] || ''}
                          onChange={(e) => {
                            const parts = regData.birthDate.split('-');
                            const newDate = `${e.target.value}-${parts[1] || ''}-${parts[2] || ''}`;
                            setRegData({...regData, birthDate: newDate});
                            setTouched({...touched, birthDate: true});
                          }}
                          required
                        >
                          <option value="">YIL</option>
                          {[...Array(100)].map((_, i) => <option key={i} value={2010-i}>{2010-i}</option>)}
                        </select>
                      </div>
                      {fieldErrors.birthDate && <p className="text-[9px] text-red-400 ml-2">{fieldErrors.birthDate}</p>}
                    </div>
                    <Input
                      label={t('phone')}
                      type="tel"
                      placeholder="5xx xxx xx xx"
                      value={regData.phone}
                      onChange={e => {
                        const value = e.target.value.replace(/\D/g, '');
                        setRegData({...regData, phone: value});
                      }}
                      onBlur={() => setTouched({...touched, phone: true})}
                      error={fieldErrors.phone}
                      autoComplete="tel"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={11}
                      required
                      className={`h-16 rounded-2xl ${fieldErrors.phone ? 'border-2 border-red-400' : ''}`}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('password')}
                    type="password"
                    placeholder="Min. 6 karakter"
                    value={regData.pass}
                    onChange={e => setRegData({...regData, pass: e.target.value})}
                    onBlur={() => setTouched({...touched, pass: true})}
                    error={fieldErrors.pass}
                    autoComplete="new-password"
                    required
                    className={`h-16 rounded-2xl ${fieldErrors.pass ? 'border-2 border-red-400' : ''}`}
                  />
                  <Input
                    label={t('confirm_password')}
                    type="password"
                    placeholder="Tekrar girin"
                    value={regData.confirmPass}
                    onChange={e => setRegData({...regData, confirmPass: e.target.value})}
                    onBlur={() => setTouched({...touched, confirmPass: true})}
                    error={fieldErrors.confirmPass}
                    autoComplete="new-password"
                    required
                    className={`h-16 rounded-2xl ${fieldErrors.confirmPass ? 'border-2 border-red-400' : ''}`}
                  />
                </div>
                {/* Referans Kodu (Opsiyonel) */}
                <div className="relative">
                  <Input
                    label="Referans Kodu (Opsiyonel)"
                    placeholder="SADE-XXXX"
                    value={regData.referralCode}
                    onChange={e => setRegData({...regData, referralCode: e.target.value.toUpperCase()})}
                    className="h-16 rounded-2xl font-mono tracking-widest"
                  />
                  <p className="text-[9px] text-gray-400 mt-1 ml-2">Arkadaşınızdan aldığınız kodu girin, ikiniz de puan kazanın!</p>
                </div>
                {/* ✅ KVKK Onay Modülü (Register.tsx ile Eşitlendi) */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-gray-700 group cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                    <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${agreedToTerms ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold' : 'border-gray-200 dark:border-gray-600'}`}>
                        {agreedToTerms && <Check size={14} className="text-white dark:text-black" />}
                    </div>
                    <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
                        <Link to="/legal/kvkk" className="text-brown-900 dark:text-white font-bold hover:text-gold transition-colors underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
                            {t('legal_kvkk')}
                        </Link>
                        {' '} metnini okudum, kişisel verilerimin işlenmesine ve tarafıma ticari ileti gönderilmesine onay veriyorum.
                    </p>
                </div>
                {error && <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-widest animate-shake">{error}</p>}
                <Button
  type="submit"
  disabled={isLoading || !isRegisterFormValid}
  className={`w-full h-20 rounded-[30px] shadow-2xl mt-4 tracking-[0.4em] text-[11px] transition-all ${!isRegisterFormValid ? 'opacity-50 grayscale cursor-not-allowed' : 'bg-brown-900 text-white dark:bg-gold dark:text-black hover:scale-[1.02] active:scale-95'}`}
  loading={isLoading}
>
  {t('register_button')}
</Button>

                {/* Ayraç */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
                    <span className="bg-white dark:bg-dark-800 px-4 text-gray-400 font-bold">veya</span>
                  </div>
                </div>

                {/* Google Giriş */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-16 rounded-full bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-gray-700 text-brown-900 dark:text-white font-bold text-[11px] uppercase tracking-[0.3em] shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google ile Devam Et
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    );
  }

  const renderHeader = (title: string) => (
    <div className="flex items-center gap-6 mb-12 animate-fade-in">
      <button 
        onClick={() => setCurrentView('main')} 
        className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-dark-800 rounded-2xl hover:bg-gold hover:text-white transition-all shadow-sm"
      >
        <ArrowLeft size={20} />
      </button>
      <h2 className="font-display text-4xl lg:text-5xl font-bold dark:text-white italic tracking-tight">{title}</h2>
    </div>
  );
return (
    <main className="w-full max-w-screen-xl mx-auto pt-32 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen animate-fade-in">
      
      {currentView === 'main' ? (
        <div className="space-y-16">
          {/* Katalog Stili Header */}
          <div className="animate-fade-in">
            <span className="font-sans text-[10px] lg:text-xs font-bold tracking-[0.4em] text-gold uppercase mb-3 block">
              {t('account') || 'KİŞİSEL PANEL'}
            </span>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="font-display text-5xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 italic tracking-tighter">
   Hoş Geldin, <span className="text-gold">{user?.displayName?.split(' ')[0] || user?.firstName || user?.email?.split('@')[0] || 'Artisan'}</span>
</h2>
                <p className="text-gray-400 font-medium text-xs mt-4 uppercase tracking-widest">{user?.email}</p>
              </div>
              
              {/* Tema & Çıkış - Katalog Buton Stili */}
              <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="h-14 px-6 border border-gray-100 dark:border-gray-800 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-800 transition-all rounded-2xl">
                  {isDark ? <Sun size={18} className="text-gold" /> : <Moon size={18} className="text-brown-900" />}
                  <span className="text-[10px] font-black uppercase tracking-widest dark:text-white">{isDark ? 'AYDINLIK' : 'KARANLIK'}</span>
                </button>
                <button onClick={logout} className="h-14 px-6 bg-red-50 text-red-500 border border-red-100 flex items-center gap-3 hover:bg-red-500 hover:text-white transition-all rounded-2xl font-black text-[10px] uppercase tracking-widest">
                  <LogOut size={18} /> ÇIKIŞ
                </button>
              </div>
            </div>
          </div>

          {/* Menü Kartları - Katalog Ürün Kartı Düzeni */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sadakat Kartı - Öne Çıkarılmış */}
            <button
              onClick={() => setCurrentView('loyalty')}
              className="group relative bg-gradient-to-br from-gold/10 to-amber-50 dark:from-gold/20 dark:to-dark-800 border-2 border-gold/30 p-8 text-left transition-all hover:border-gold hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] rounded-[32px] min-h-[220px] flex flex-col justify-between overflow-hidden md:col-span-2 lg:col-span-1"
            >
              <div className="w-12 h-12 bg-gold/20 border border-gold/30 flex items-center justify-center text-gold transition-all duration-500 group-hover:bg-gold group-hover:text-black rounded-2xl">
                <Award size={20} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold dark:text-white italic tracking-tight uppercase group-hover:text-gold transition-colors">Sadakat</h3>
                  <span className="bg-gold text-black text-[10px] px-3 py-1 font-black rounded-full animate-pulse">PUAN</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  Puanlarınız, seviyeniz ve avantajlar.
                </p>
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] bg-gold transition-all duration-700 w-0 group-hover:w-full"></div>
            </button>

            {[
              { id: 'orders', icon: <ShoppingBag size={20} />, label: t('my_orders'), count: orders.length, desc: 'Sipariş geçmişi ve anlık takip.' },
              { id: 'addresses', icon: <MapPin size={20} />, label: t('my_addresses'), desc: 'Teslimat adreslerinizi yönetin.' },
              { id: 'invoice', icon: <Receipt size={20} />, label: t('invoice_info'), desc: 'Fatura ve vergi detayları.' },
              { id: 'settings', icon: <Settings size={20} />, label: t('settings'), desc: 'Profil ve dil tercihleri.' },
              { id: 'help', icon: <HelpCircle size={20} />, label: t('help_support'), desc: 'Destek ekibimize ulaşın.' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setCurrentView(item.id as AccountView)}
                className="group relative bg-white dark:bg-dark-900 border border-gray-100 dark:border-gray-800 p-8 text-left transition-all hover:border-gold/50 hover:shadow-[0_0_40px_rgba(0,0,0,0.03)] rounded-[32px] min-h-[220px] flex flex-col justify-between overflow-hidden"
              >
                <div className="w-12 h-12 bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-brown-900 dark:text-gold transition-all duration-500 group-hover:bg-brown-900 dark:group-hover:bg-gold group-hover:text-white dark:group-hover:text-black rounded-2xl">
                  {item.icon}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold dark:text-white italic tracking-tight uppercase group-hover:text-gold transition-colors">{item.label}</h3>
                    {item.count !== undefined && <span className="bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 text-[10px] px-3 py-1 font-black rounded-none group-hover:bg-gold group-hover:text-black transition-all">{item.count}</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                    {item.desc}
                  </p>
                </div>
                {/* Alt Dekoratif Çizgi - Subtle Border Effect */}
                <div className="absolute bottom-0 left-0 h-[2px] bg-gold transition-all duration-700 w-0 group-hover:w-full"></div>
              </button>
            ))}
            
            {/* Damak Tadı Quiz Kartı */}
            <Link
              to="/tasting-quiz"
              className="group relative bg-gradient-to-br from-gold/5 to-amber-50 dark:from-gold/10 dark:to-dark-800 border border-gold/20 p-8 text-left transition-all hover:border-gold/50 hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] rounded-[32px] min-h-[220px] flex flex-col justify-between overflow-hidden"
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center text-gold transition-all duration-500 group-hover:bg-gold group-hover:text-black rounded-2xl">
                <Sparkles size={20} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold dark:text-white italic tracking-tight uppercase group-hover:text-gold transition-colors">Damak Tadı</h3>
                  <span className="bg-gold text-black text-[10px] px-3 py-1 font-black rounded-full animate-pulse">YENİ</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  Çikolata tercihlerinizi keşfedin.
                </p>
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] bg-gold transition-all duration-700 w-0 group-hover:w-full"></div>
            </Link>
          </div>
        </div>
      ) : (
        /* ALT GÖRÜNÜMLER (Orders, Addresses vb.) - Katalog İçi Sayfa Yapısı */
        <div className="animate-fade-in-up">
          <div className="mb-12">
             {renderHeader(
               currentView === 'orders' ? t('my_orders') :
               currentView === 'addresses' ? t('my_addresses') :
               currentView === 'loyalty' ? 'Sadakat Programı' :
               t('invoice_info')
             )}
          </div>
          <div className="bg-white dark:bg-dark-900 rounded-none">
            {currentView === 'orders' && <OrdersView orders={orders} />}
            {currentView === 'addresses' && <AddressesView />}
            {currentView === 'invoice' && <InvoiceInfoView />}
            {currentView === 'loyalty' && <LoyaltyPanel />}
          </div>
        </div>
      )}

      <Footer />
    </main>
);

};