import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { Footer } from '../components/Footer';
import { OrdersView } from '../components/account/OrdersView';
import { AddressesView } from '../components/account/AddressesView';
import { InvoiceInfoView } from '../components/account/InvoiceInfoView';
import { LoyaltyPanel } from '../components/account/LoyaltyPanel';
import { SettingsView } from '../components/account/SettingsView';
import { HelpView } from '../components/account/HelpView';
import { AccountSidebar, type AccountView } from '../components/account/AccountSidebar';
import { AccountMobileNav } from '../components/account/AccountMobileNav';
import { AccountOverview } from '../components/account/AccountOverview';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Check, ArrowRight } from 'lucide-react';

export const Account: React.FC = () => {
  const { isLoggedIn, user, login, loginWithGoogle, resetPassword, logout, orders, loading } = useUser();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const viewParam = searchParams.get('view') || searchParams.get('tab'); // tab parametresi de destekleniyor
  const trackOrderId = searchParams.get('track'); // Kargo takip için sipariş ID

  // URL'deki view parametresine göre başlangıç view'ını belirle
  const getInitialView = (): AccountView => {
    // track parametresi varsa otomatik olarak orders görünümüne git
    if (trackOrderId) {
      return 'orders';
    }
    if (viewParam && ['overview', 'orders', 'addresses', 'invoice', 'settings', 'help', 'loyalty'].includes(viewParam)) {
      return viewParam as AccountView;
    }
    return 'overview';
  };

  const [currentView, setCurrentView] = useState<AccountView>(getInitialView);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Kullanıcı giriş yaptıysa ve redirect parametresi varsa yönlendir
  useEffect(() => {
    if (!loading && isLoggedIn && redirectTo) {
      navigate(`/${redirectTo}`, { replace: true });
    }
  }, [loading, isLoggedIn, redirectTo, navigate]);

  // URL'de view/tab parametresi veya track parametresi varsa ilgili görünüme git
  useEffect(() => {
    if (isLoggedIn) {
      // track parametresi varsa otomatik olarak orders görünümüne git
      if (trackOrderId) {
        setCurrentView('orders');
      } else if (viewParam && ['overview', 'orders', 'addresses', 'invoice', 'settings', 'help', 'loyalty'].includes(viewParam)) {
        setCurrentView(viewParam as AccountView);
      }
    }
  }, [isLoggedIn, viewParam, trackOrderId]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const isDarkInitial = storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkInitial);
    document.documentElement.classList.toggle('dark', isDarkInitial);
    window.scrollTo(0, 0);
  }, [isLoggedIn, user]);

  // View değiştiğinde URL'i güncelle
  const handleViewChange = (view: AccountView) => {
    setCurrentView(view);
    // URL'i güncelle (overview için parametreyi kaldır)
    if (view === 'overview') {
      searchParams.delete('view');
    } else {
      searchParams.set('view', view);
    }
    setSearchParams(searchParams, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      if (redirectTo) {
        navigate(`/${redirectTo}`);
      }
    } catch (err: any) {
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
      if (redirectTo) {
        navigate(`/${redirectTo}`);
      }
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-gold">
            <span className="font-santana font-bold">Sade</span> <span className="font-santana font-normal">Chocolate</span>
          </p>
        </div>
      </div>
    );
  }

  // Giriş yapmamış kullanıcılar için login formu
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-cream-100 dark:bg-dark-900 px-6 py-12">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm p-10 space-y-8">
            <div className="text-center space-y-3">
              <h1 className="font-display text-4xl font-bold italic text-brown-900 dark:text-white">Hoş Geldiniz</h1>
              <p className="text-sm text-gray-400">Gerçek çikolata deneyimine adım atın.</p>
            </div>

            {showForgotPassword ? (
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
            ) : (
              <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                <div className="space-y-4">
                  <Input label={t('email')} type="email" placeholder="isim@örnek.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  <div className="space-y-2">
                    <Input label={t('password')} type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required />
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
                    <span className="bg-white dark:bg-dark-800 px-4 text-gray-400 font-bold">veya</span>
                  </div>
                </div>

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

                {(redirectTo === 'checkout' || !redirectTo) && (
                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => navigate('/checkout?guest=true')}
                      className="w-full flex items-center justify-center gap-3 py-4 text-gray-500 hover:text-brown-900 dark:hover:text-gold transition-colors group"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest">Misafir Olarak Devam Et</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[9px] text-gray-400 text-center mt-1">Kayıt olmadan sipariş verebilirsiniz</p>
                  </div>
                )}

                <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Henüz hesabınız yok mu?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="text-brown-900 dark:text-gold underline decoration-gold/50 hover:decoration-gold transition-all underline-offset-4 font-black ml-1"
                    >
                      KAYIT OLUN
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Giriş yapmış kullanıcılar için hesap paneli
  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
      <div className="flex pt-28 lg:pt-32">
        {/* Desktop Sidebar */}
        <AccountSidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          user={user}
          ordersCount={orders.length}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onLogout={logout}
        />

        {/* Ana İçerik Alanı */}
        <main className="flex-1 min-h-[calc(100vh-128px)] pb-24 lg:pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'overview' && (
              <AccountOverview
                user={user}
                orders={orders}
                onNavigate={handleViewChange}
              />
            )}
            {currentView === 'orders' && <OrdersView orders={orders} trackOrderId={trackOrderId} />}
            {currentView === 'addresses' && <AddressesView />}
            {currentView === 'invoice' && <InvoiceInfoView />}
            {currentView === 'loyalty' && <LoyaltyPanel />}
            {currentView === 'settings' && <SettingsView />}
            {currentView === 'help' && <HelpView />}
          </div>

          {/* Footer - sadece desktop */}
          <div className="hidden lg:block">
            <Footer />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <AccountMobileNav
        currentView={currentView}
        onViewChange={handleViewChange}
        ordersCount={orders.length}
      />
    </div>
  );
};
