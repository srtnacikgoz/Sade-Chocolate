import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { SplashScreen } from './pages/SplashScreen';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { About } from './pages/About';
import { Favorites } from './pages/Favorites';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Legal } from './pages/Legal';
import { Checkout } from './pages/Checkout';
import { ProductDetail } from './pages/ProductDetail';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Menu } from './components/Menu';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { CartDrawer } from './components/CartDrawer';
import { GiftAssistant } from './components/GiftAssistant';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { Toaster } from 'sonner';
import { TopBar } from './components/TopBar';
import { Cart } from './pages/Cart'; // Birazdan oluşturacağız
import { LoginGateway } from './pages/LoginGateway'; // Birazdan oluşturacağız
import { Register } from './pages/Register';
import { SearchDrawer } from './components/SearchDrawer';
import { NewsletterPopup } from './components/NewsletterPopup';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isSplash = location.pathname === '/';
  const isAdmin = location.pathname === '/admin';
  const isCheckout = location.pathname === '/checkout';
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-dark-900 transition-colors duration-300">
      <Toaster position="top-right" richColors closeButton expand={false} />
      
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      {!isSplash && (
        <div className="relative">
          <TopBar />
          {/* transform: translateY kullanımı, içindeki Header 'fixed' olsa bile onu aşağı iter */}
          <div 
            className="fixed left-0 right-0 z-[120] transition-all duration-500" 
            style={{ 
              transform: 'translateY(var(--top-bar-height, 0px))',
              pointerEvents: 'auto'
            }}
          >
            <Header onMenuClick={() => setIsMenuOpen(true)} onSearchClick={() => setIsSearchOpen(true)} />
          </div>
        </div>
      )}
      
      <div className="flex flex-col">
        {children}
      </div>

      {!isSplash && !isAdmin && !isCheckout && <BottomNav />}
      
      {/* 🪄 Global Hediye Asistanı Butonu - Sağ Alt Köşe */}
      {!isSplash && (
        <>
          <button 
            onClick={() => setIsAssistantOpen(true)}
            className="fixed bottom-24 right-8 lg:right-12 z-[80] bg-brown-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all border-2 border-gold/20 group"
            aria-label="Gift Assistant"
          >
            <span className="material-icons-outlined text-2xl group-hover:rotate-12 transition-transform text-gold">auto_awesome</span>
            
            {/* Tooltip - Sadece Desktop tarafında görünür */}
            <span className="absolute right-full mr-4 bg-white dark:bg-dark-800 text-brown-900 dark:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity shadow-xl pointer-events-none border border-gray-100 dark:border-gray-700 whitespace-nowrap">
              {t('gift_assistant')}
            </span>
          </button>

          <GiftAssistant 
            isOpen={isAssistantOpen} 
            onClose={() => setIsAssistantOpen(false)} 
          />
        </>
      )}

      <CartDrawer />
      <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Newsletter Popup - Don't show on splash, admin, or checkout */}
      {!isSplash && !isAdmin && !isCheckout && <NewsletterPopup />}
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Tema Başlatma
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <LanguageProvider>
      <UserProvider>
        <ProductProvider>
          <CartProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<SplashScreen />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/legal/:type" element={<Legal />} />
                  <Route path="/cart" element={<Cart />} />
<Route path="/login-gateway" element={<LoginGateway />} />
<Route path="/register" element={<Register />} />
                  <Route path="/checkout" element={<Checkout />} />
                </Routes>
              </Layout>
            </Router>
          </CartProvider>
        </ProductProvider>
      </UserProvider>
    </LanguageProvider>
  );
};

export default App;