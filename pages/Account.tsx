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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, pass);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (regData.pass !== regData.confirmPass) {
        setError(language === 'tr' ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.');
        return;
    }

    const { pass: _, confirmPass: __, ...profile } = regData;
    register(profile, regData.pass);
  };

  if (!isLoggedIn) {
    return (
      <main className="pt-24 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen px-6 flex flex-col justify-center animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl text-brown-900 dark:text-white mb-2 italic">Sade</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Patisserie & Artisan</p>
        </div>

        {!isRegistering ? (
          <div className="animate-fade-in">
            <h2 className="text-xl font-display font-bold text-center mb-6 dark:text-white">{t('login')}</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} required icon="email" />
              <Input type="password" placeholder={t('password')} value={pass} onChange={e => setPass(e.target.value)} required icon="lock" />
              <Button type="submit" className="w-full" size="lg">{t('login_button')}</Button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 mb-2">{t('dont_have_account')}</p>
              <button 
                onClick={() => setIsRegistering(true)}
                className="text-xs font-bold text-brown-900 dark:text-gold uppercase tracking-widest border-b border-brown-900 dark:border-gold pb-0.5"
              >
                {t('register_button')}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h2 className="text-xl font-display font-bold text-center mb-6 dark:text-white">{t('register')}</h2>
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={t('first_name')} value={regData.firstName} onChange={e => setRegData({...regData, firstName: e.target.value})} required />
                <Input placeholder={t('last_name')} value={regData.lastName} onChange={e => setRegData({...regData, lastName: e.target.value})} required />
              </div>
              <Input type="email" placeholder={t('email')} value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} required icon="email" />
              <Input type="tel" placeholder={t('phone')} value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} required icon="phone" />
              <Input type="password" placeholder={t('password')} value={regData.pass} onChange={e => setRegData({...regData, pass: e.target.value})} required icon="lock" />
              <Input type="password" placeholder={t('confirm_password')} value={regData.confirmPass} onChange={e => setRegData({...regData, confirmPass: e.target.value})} required icon="lock" />
              
              {error && <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-tighter">{error}</p>}
              
              <Button type="submit" className="w-full mt-2" size="lg">{t('register_button')}</Button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 mb-2">{t('already_have_account')}</p>
              <button 
                onClick={() => setIsRegistering(false)}
                className="text-xs font-bold text-brown-900 dark:text-gold uppercase tracking-widest border-b border-brown-900 dark:border-gold pb-0.5"
              >
                {t('login_button')}
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  const renderHeader = (title: string) => (
    <div className="flex items-center mb-8">
      <button onClick={() => setCurrentView('main')} className="mr-4 p-2 bg-gray-50 dark:bg-dark-800 rounded-full text-gray-900 dark:text-white hover:bg-gray-100 transition-colors">
        <span className="material-icons-outlined block">arrow_back</span>
      </button>
      <h2 className="font-display text-2xl font-bold dark:text-white">{title}</h2>
    </div>
  );

  return (
    <main className="pt-24 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen px-5">
      {currentView === 'main' ? (
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-brown-400 to-brown-900 rounded-full flex items-center justify-center text-white font-display text-2xl font-bold shadow-xl">
              {user?.firstName?.[0]}
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold dark:text-white">{t('welcome')}</h2>
              <p className="text-xs text-gray-400 font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-10">
            <MenuButton icon="shopping_bag" color="text-blue-500" label={t('my_orders')} count={orders.length} onClick={() => setCurrentView('orders')} />
            <MenuButton icon="location_on" color="text-orange-500" label={t('my_addresses')} onClick={() => setCurrentView('addresses')} />
            <MenuButton icon="receipt" color="text-brown-900 dark:text-gold" label={t('invoice_info')} onClick={() => setCurrentView('invoice')} />
            <MenuButton icon="settings" color="text-purple-500" label={t('settings')} onClick={() => setCurrentView('settings')} />
            <MenuButton icon="help_outline" color="text-teal-500" label={t('help_support')} onClick={() => setCurrentView('help')} />
          </div>

          <Button variant="outline" className="w-full text-red-500 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10" onClick={logout}>
            {t('logout')}
          </Button>
        </div>
      ) : (
        <>
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
              <div className="space-y-4 bg-gray-50 dark:bg-dark-800 p-6 rounded-2xl animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold dark:text-white">Dil / Language</span>
                  <div className="flex gap-2">
                    {['tr', 'en', 'ru'].map(lang => (
                      <button key={lang} onClick={() => setLanguage(lang as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${language === lang ? 'bg-brown-900 text-white shadow-md' : 'bg-white dark:bg-dark-900 text-gray-400 border border-gray-100 dark:border-gray-700'}`}>
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
              <div className="p-8 bg-gray-50 dark:bg-dark-800 rounded-3xl text-sm text-gray-500 italic text-center animate-fade-in">
                <span className="material-icons-outlined text-4xl mb-4 block text-teal-500">support_agent</span>
                Destek ekibimize hafta içi 09:00 - 18:00 arası <br/> <strong className="text-brown-900 dark:text-white">0552 896 30 26</strong> numaralı hattan ulaşabilirsiniz.
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
};