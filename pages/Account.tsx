import React, { useState } from 'react';
import { useUser, UserProfile } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { OrdersView } from '../components/account/OrdersView';
import { AddressesView } from '../components/account/AddressesView';
import { InvoiceInfoView } from '../components/account/InvoiceInfoView';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

type AccountView = 'main' | 'orders' | 'addresses' | 'invoice' | 'settings' | 'help';

const MenuButton: React.FC<{ icon: string, label: string, color: string, onClick: () => void, count?: number }> = ({ icon, label, color, onClick, count }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-dark-800 rounded-2xl hover:bg-white dark:hover:bg-dark-700 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm group">
    <div className="flex items-center gap-4">
      <span className={`material-icons-outlined ${color} transition-transform group-hover:scale-110`}>{icon}</span>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {count !== undefined && <span className="text-[10px] font-bold px-2 py-0.5 bg-white dark:bg-dark-900 rounded-full text-gray-400 group-hover:text-brown-900 dark:group-hover:text-gold">{count}</span>}
      <span className="material-icons-outlined text-gray-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
    </div>
  </button>
);

export const Account: React.FC = () => {
  const { isLoggedIn, user, login, register, logout, orders } = useUser();
  const { t, language, setLanguage } = useLanguage();
  
  const [currentView, setCurrentView] = useState<AccountView>('main');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  
  // Register Form States
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network delay for premium feel
    setTimeout(() => {
      login(email, pass);
      setIsLoading(false);
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (regData.pass !== regData.confirmPass) {
        setError(language === 'tr' ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.');
        setIsLoading(false);
        return;
    }

    // Simple validation for birthdate
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

  if (!isLoggedIn) {
    return (
      <main className="pt-24 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen px-6 flex flex-col justify-center animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl text-brown-900 dark:text-white mb-2 italic tracking-tighter">Sade</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-light ml-1">Patisserie & Artisan</p>
        </div>

        <div className="bg-gray-50/50 dark:bg-dark-800/50 p-1 rounded-2xl mb-8 flex border border-gray-100 dark:border-gray-700 shadow-inner">
          <button 
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${!isRegistering ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-md' : 'text-gray-400'}`}
          >
            {t('login')}
          </button>
          <button 
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${isRegistering ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-md' : 'text-gray-400'}`}
          >
            {t('register')}
          </button>
        </div>

        {!isRegistering ? (
          <div className="animate-fade-in space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} required icon="email" />
              <div className="space-y-1">
                <Input type="password" placeholder={t('password')} value={pass} onChange={e => setPass(e.target.value)} required icon="lock" />
                <div className="flex justify-end">
                  <button type="button" className="text-[10px] font-bold text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors uppercase tracking-wider">
                    {language === 'tr' ? 'Şifremi Unuttum' : 'Forgot Password?'}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-14" size="lg" loading={isLoading}>{t('login_button')}</Button>
            </form>
          </div>
        ) : (
          <div className="animate-fade-in">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={t('first_name')} value={regData.firstName} onChange={e => setRegData({...regData, firstName: e.target.value})} required />
                <Input placeholder={t('last_name')} value={regData.lastName} onChange={e => setRegData({...regData, lastName: e.target.value})} required />
              </div>
              <Input type="email" placeholder={t('email')} value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} required icon="email" />
              <Input type="tel" placeholder={t('phone')} value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} required icon="phone" />
              <Input type="date" label={t('birth_date')} value={regData.birthDate} onChange={e => setRegData({...regData, birthDate: e.target.value})} required icon="cake" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="password" placeholder={t('password')} value={regData.pass} onChange={e => setRegData({...regData, pass: e.target.value})} required icon="lock" />
                <Input type="password" placeholder={t('confirm_password')} value={regData.confirmPass} onChange={e => setRegData({...regData, confirmPass: e.target.value})} required icon="lock" />
              </div>
              
              {error && <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-tighter animate-pulse">{error}</p>}
              
              <Button type="submit" className="w-full h-14" size="lg" loading={isLoading}>{t('register_button')}</Button>
            </form>
          </div>
        )}
      </main>
    );
  }

  const renderHeader = (title: string) => (
    <div className="flex items-center mb-8">
      <button onClick={() => setCurrentView('main')} className="mr-4 p-2 bg-gray-50 dark:bg-dark-800 rounded-full text-gray-900 dark:text-white hover:bg-gray-100 transition-colors shadow-sm">
        <span className="material-icons-outlined block">arrow_back</span>
      </button>
      <h2 className="font-display text-2xl font-bold dark:text-white">{title}</h2>
    </div>
  );

  return (
    <main className="pt-24 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen px-5">
      {currentView === 'main' ? (
        <div className="animate-fade-in">
          <div className="flex items-center gap-5 mb-10 p-4 bg-gray-50/50 dark:bg-dark-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-brown-400 to-brown-900 rounded-full flex items-center justify-center text-white font-display text-3xl font-bold shadow-xl border-4 border-white dark:border-dark-900">
              {user?.firstName?.[0]}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold dark:text-white leading-tight">{t('welcome')}, {user?.firstName}</h2>
              <p className="text-xs text-gray-400 font-medium">{user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-gold/10 text-gold rounded-full">
                <span className="material-icons-outlined text-[10px]">stars</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Premium Member</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-10">
            <MenuButton icon="shopping_bag" color="text-blue-500" label={t('my_orders')} count={orders.length} onClick={() => setCurrentView('orders')} />
            <MenuButton icon="location_on" color="text-orange-500" label={t('my_addresses')} onClick={() => setCurrentView('addresses')} />
            <MenuButton icon="receipt" color="text-brown-900 dark:text-gold" label={t('invoice_info')} onClick={() => setCurrentView('invoice')} />
            <MenuButton icon="settings" color="text-purple-500" label={t('settings')} onClick={() => setCurrentView('settings')} />
            <MenuButton icon="help_outline" color="text-teal-500" label={t('help_support')} onClick={() => setCurrentView('help')} />
          </div>

          <Button variant="outline" className="w-full text-red-500 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 h-14" onClick={logout}>
            {t('logout')}
          </Button>
        </div>
      ) : (
        <div className="animate-fade-in">
          {currentView === 'orders' && (
            <>
              {renderHeader(t('my_orders'))}
              <OrdersView orders={orders} />
            </>
          )}
          {currentView === 'addresses' && (
            <>
              {renderHeader(t('my_addresses'))}
              <AddressesView />
            </>
          )}
          {currentView === 'invoice' && (
            <>
              {renderHeader(t('invoice_info'))}
              <InvoiceInfoView />
            </>
          )}
          {currentView === 'settings' && (
            <>
              {renderHeader(t('settings'))}
              <div className="space-y-4 bg-gray-50 dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 animate-fade-in shadow-sm">
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Tercih Edilen Dil</span>
                  <div className="flex gap-2">
                    {['tr', 'en', 'ru'].map(lang => (
                      <button 
                        key={lang} 
                        onClick={() => setLanguage(lang as any)} 
                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all border ${language === lang ? 'bg-brown-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-105' : 'bg-white dark:bg-dark-900 text-gray-400 border-gray-100 dark:border-gray-700'}`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          {currentView === 'help' && (
            <>
              {renderHeader(t('help_support'))}
              <div className="p-10 bg-gray-50 dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-sm text-gray-500 italic text-center animate-fade-in shadow-sm">
                <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <span className="material-icons-outlined text-3xl">support_agent</span>
                </div>
                <p className="mb-2 leading-relaxed">Destek ekibimize hafta içi 09:00 - 18:00 arası</p>
                <a href="tel:05528963026" className="text-xl font-display font-bold text-brown-900 dark:text-white block hover:text-gold transition-colors">0552 896 30 26</a>
                <p className="mt-4 text-[10px] uppercase tracking-widest font-bold">numaralı hattan ulaşabilirsiniz.</p>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
};