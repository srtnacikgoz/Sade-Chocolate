import React, { useState } from 'react';
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

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isSplash = location.pathname === '/';
  const isCatalog = location.pathname === '/catalog';
  const isAdmin = location.pathname === '/admin';
  const isCheckout = location.pathname === '/checkout';
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 transition-colors duration-300">
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      {!isSplash && <Header onMenuClick={() => setIsMenuOpen(true)} />}
      
      <div className="flex flex-col">
        {children}
      </div>

      {!isSplash && !isAdmin && !isCheckout && <BottomNav />}
      
      {/* FAB for Gift Assistant - Only on Catalog & Desktop side support */}
      {isCatalog && (
        <button 
            onClick={() => setIsAssistantOpen(true)}
            className="fixed bottom-20 left-5 lg:left-10 z-40 bg-brown-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
            aria-label="Gift Assistant"
        >
            <span className="material-icons-outlined text-2xl group-hover:rotate-12 transition-transform">auto_awesome</span>
            <span className="absolute left-full ml-3 bg-white dark:bg-dark-800 text-brown-900 dark:text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-sm pointer-events-none border border-gray-100 dark:border-gray-700">
                Hediye Asistanı
            </span>
        </button>
      )}

      <CartDrawer />
      <GiftAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
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