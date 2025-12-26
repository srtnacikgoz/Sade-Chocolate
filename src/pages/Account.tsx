import React, { useState, useEffect } from 'react';
import { useUser, UserProfile } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { Footer } from '../components/Footer';
import { OrdersView } from '../components/account/OrdersView';
import { AddressesView } from '../components/account/AddressesView';
import { InvoiceInfoView } from '../components/account/InvoiceInfoView';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { 
  ShoppingBag, MapPin, Receipt, Settings, HelpCircle, 
  LogOut, Moon, Sun, Sparkles, ArrowLeft, User as UserIcon, ShieldCheck, CreditCard, Check
} from 'lucide-react';

type AccountView = 'main' | 'orders' | 'addresses' | 'invoice' | 'settings' | 'help';



export const Account: React.FC = () => {
  const { isLoggedIn, user, login, register, logout, orders, loading } = useUser();
  const { t, language, setLanguage } = useLanguage();
  
  const [currentView, setCurrentView] = useState<AccountView>('main');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  
  const [regData, setRegData] = useState<UserProfile & { pass: string, confirmPass: string }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    pass: '',
    confirmPass: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
    setIsLoading(true);
    setTimeout(() => {
      login(email, pass, rememberMe);
      setIsLoading(false);
    }, 800);
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
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Sade Chocolate</p>
        </div>
      </div>
    );
  }
 if (!isLoggedIn) {
    return (
      <main className="min-h-screen w-full flex flex-col lg:flex-row bg-cream-100 dark:bg-dark-900 animate-fade-in overflow-hidden">
        
        {/* SOL TARAF: Sanatsal Karşılama (Register ile birebir aynı lüks doku) */}
        <section className="relative w-full lg:w-1/2 min-h-[40vh] lg:min-h-screen flex flex-col justify-between p-8 lg:p-16 overflow-hidden bg-slate-50/50">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=2000&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-[0.07] grayscale scale-110 animate-pulse-slow" 
              alt="Sade Experience" 
            />
            <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-br from-white via-transparent to-slate-100/50"></div>
          </div>

          <div className="relative z-10">
             </div>

          <div className="relative z-10 space-y-8 lg:space-y-12">
            <div className="space-y-4">
              <h2 className="font-display text-4xl lg:text-7xl text-brown-900 italic leading-tight">Sade <br /> <span className="text-gold">Artisan</span> Kulübü</h2>
            </div>

            <div className="grid gap-6 lg:gap-8">
              {[
                { icon: <ShieldCheck size={26} />, title: "Güvenli Erişim", desc: "Kişisel verileriniz ve hesabınız global güvenlik standartlarıyla korunur." },
                { icon: <CreditCard size={26} />, title: "Hızlı Ödeme", desc: "Adres ve kart bilgilerinizi kaydederek saniyeler içinde sipariş verin." },
                { icon: <ShieldCheck size={26} />, title: "Güvenli Deneyim", desc: "Isı yalıtımlı ambalaj ve %100 erime koruması ile güvenli teslimat." },
                { icon: <Sparkles size={26} />, title: "Öncelikli Erişim", desc: "Yeni koleksiyonlara ve sınırlı üretimlere herkesten önce siz ulaşın." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-center group cursor-default">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-white transition-all duration-500 group-hover:rotate-6 text-gold">
                    {item.icon}
                  </div>
                  <div className="group-hover:translate-x-2 transition-transform duration-500">
                    <h4 className="text-brown-900 font-bold text-sm lg:text-base mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-[11px] lg:text-xs leading-relaxed max-w-[240px]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10">
            <p className="text-gray-300 text-[9px] font-black uppercase tracking-[0.5em]">Premium Standards • 2025</p>
          </div>
        </section>

        {/* SAĞ TARAF: Giriş/Kayıt Formu (Geniş, Ferah ve Profesyonel) */}
        <section className="flex-1 flex flex-col justify-center items-center p-8 lg:p-24 bg-cream-100 dark:bg-dark-900">
          <div className="w-full max-w-md space-y-12">
            
            {/* Login / Register Switch (Segmented Control) */}
            <div className="bg-gray-50 dark:bg-dark-800 p-1.5 rounded-3xl flex border border-gray-100 dark:border-gray-700 shadow-inner">
                <button 
                  onClick={() => { setIsRegistering(false); setError(''); }}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all duration-500 ${!isRegistering ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-xl' : 'text-gray-400'}`}
                >
                  {t('login')}
                </button>
                <button 
                  onClick={() => { setIsRegistering(true); setError(''); }}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all duration-500 ${isRegistering ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-xl' : 'text-gray-400'}`}
                >
                  {t('register')}
                </button>
            </div>

            {!isRegistering ? (
              /* GİRİŞ FORMU */
              <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                <div className="space-y-4">
                  <Input label={t('email')} type="email" placeholder="isim@örnek.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-16 rounded-2xl" />
                  <div className="space-y-2">
                    <Input label={t('password')} type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required className="h-16 rounded-2xl" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                        <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold' : 'border-gray-200 dark:border-gray-600'}`}>
                          {rememberMe && <Check size={12} className="text-white dark:text-black" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-brown-900 dark:group-hover:text-gold transition-colors">Beni Hatırla</span>
                      </div>
                      <button type="button" className="text-[9px] font-black text-gray-400 hover:text-gold transition-colors uppercase tracking-[0.2em]">
                        {language === 'tr' ? 'Şifremi Unuttum' : 'Forgot Password?'}
                      </button>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full h-20 rounded-[30px] shadow-2xl tracking-[0.4em] text-[11px] bg-brown-900 text-white dark:bg-gold dark:text-black" loading={isLoading}>{t('login_button')}</Button>
              </form>
            ) : (
              /* KAYIT FORMU (Hızlı Kayıt) */
              <form onSubmit={handleRegister} className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <Input label={t('first_name')} placeholder="Can" value={regData.firstName} onChange={e => setRegData({...regData, firstName: e.target.value})} required className="h-16 rounded-2xl" />
                  <Input label={t('last_name')} placeholder="Yılmaz" value={regData.lastName} onChange={e => setRegData({...regData, lastName: e.target.value})} required className="h-16 rounded-2xl" />
                </div>
                <Input label={t('email')} type="email" placeholder="isim@örnek.com" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} required className="h-16 rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t('birth_date')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        <select 
                          className="h-16 rounded-2xl bg-gray-50 dark:bg-dark-800 border-none px-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer dark:text-white"
                          value={regData.birthDate.split('-')[2] || ''}
                          onChange={(e) => {
                            const parts = regData.birthDate.split('-');
                            const newDate = `${parts[0] || '1990'}-${parts[1] || '01'}-${e.target.value.padStart(2, '0')}`;
                            setRegData({...regData, birthDate: newDate});
                          }}
                          required
                        >
                          <option value="">GÜN</option>
                          {[...Array(31)].map((_, i) => <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{i+1}</option>)}
                        </select>
                        <select 
                          className="h-16 rounded-2xl bg-gray-50 dark:bg-dark-800 border-none px-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer dark:text-white"
                          value={regData.birthDate.split('-')[1] || ''}
                          onChange={(e) => {
                            const parts = regData.birthDate.split('-');
                            const newDate = `${parts[0] || '1990'}-${e.target.value.padStart(2, '0')}-${parts[2] || '01'}`;
                            setRegData({...regData, birthDate: newDate});
                          }}
                          required
                        >
                          <option value="">AY</option>
                          {['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'].map((m, i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{m}</option>)}
                        </select>
                        <select 
                          className="h-16 rounded-2xl bg-gray-50 dark:bg-dark-800 border-none px-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer dark:text-white"
                          value={regData.birthDate.split('-')[0] || ''}
                          onChange={(e) => {
                            const parts = regData.birthDate.split('-');
                            const newDate = `${e.target.value}-${parts[1] || '01'}-${parts[2] || '01'}`;
                            setRegData({...regData, birthDate: newDate});
                          }}
                          required
                        >
                          <option value="">YIL</option>
                          {[...Array(100)].map((_, i) => <option key={i} value={2010-i}>{2010-i}</option>)}
                        </select>
                      </div>
                    </div>
                    <Input label={t('phone')} type="tel" placeholder="05xx" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} required className="h-16 rounded-2xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label={t('password')} type="password" placeholder="••••" value={regData.pass} onChange={e => setRegData({...regData, pass: e.target.value})} required className="h-16 rounded-2xl" />
                  <Input label={t('confirm_password')} type="password" placeholder="••••" value={regData.confirmPass} onChange={e => setRegData({...regData, confirmPass: e.target.value})} required className="h-16 rounded-2xl" />
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
  disabled={isLoading || !agreedToTerms}
  className={`w-full h-20 rounded-[30px] shadow-2xl mt-4 tracking-[0.4em] text-[11px] transition-all ${!agreedToTerms ? 'opacity-50 grayscale cursor-not-allowed' : 'bg-brown-900 text-white dark:bg-gold dark:text-black hover:scale-[1.02] active:scale-95'}`} 
  loading={isLoading}
>
  {t('register_button')}
</Button>
              </form>
            )}
          </div>
          
        </section>
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
            
            {/* Dekoratif Boş Kart */}
            <div className="hidden lg:flex border border-dashed border-gray-200 dark:border-gray-800 items-center justify-center p-12 rounded-none opacity-20">
               <p className="text-[10px] font-black uppercase tracking-[1em] rotate-90">SADE ARTISAN</p>
            </div>
          </div>
        </div>
      ) : (
        /* ALT GÖRÜNÜMLER (Orders, Addresses vb.) - Katalog İçi Sayfa Yapısı */
        <div className="animate-fade-in-up">
          <div className="mb-12">
             {renderHeader(currentView === 'orders' ? t('my_orders') : currentView === 'addresses' ? t('my_addresses') : t('invoice_info'))}
          </div>
          <div className="bg-white dark:bg-dark-900 rounded-none">
            {currentView === 'orders' && <OrdersView orders={orders} />}
            {currentView === 'addresses' && <AddressesView />}
            {currentView === 'invoice' && <InvoiceInfoView />}
          </div>
        </div>
      )}

      <Footer />
    </main>
);

};