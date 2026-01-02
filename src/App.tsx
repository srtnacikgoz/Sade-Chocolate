import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
// SplashScreen kaldirildi
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { About } from './pages/About';
import { Favorites } from './pages/Favorites';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Legal } from './pages/Legal';
import { Checkout } from './pages/Checkout';
import { ProductDetail } from './pages/ProductDetail';
import { SeedData } from './pages/SeedData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Menu } from './components/Menu';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { CartDrawer } from './components/CartDrawer';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { Toaster } from 'sonner';
import { TopBar } from './components/TopBar';
import { Cart } from './pages/Cart'; // Birazdan oluşturacağız
import { LoginGateway } from './pages/LoginGateway'; // Birazdan oluşturacağız
import { Register } from './pages/Register';
import { TastingQuiz } from './pages/TastingQuiz';
import { SearchDrawer } from './components/SearchDrawer';
import { NewsletterPopup } from './components/NewsletterPopup';
import { AIAssistant } from './components/AIAssistant';
import { useLoyaltyStore } from './stores/loyaltyStore';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Splash sayfası kaldırıldı - isSplash artık kullanılmıyor
  const isAdmin = location.pathname === '/admin' || location.pathname === '/seed-data';
  const isCheckout = location.pathname === '/checkout';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true); // Varsayılan aktif
  const { t } = useLanguage();

  // Firestore'dan AI Sommelier enabled durumunu dinle (canlı)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'ai'),
      (docSnap) => {
        if (docSnap.exists()) {
          const config = docSnap.data();
          setIsAiEnabled(config.enabled !== false); // Varsayılan true
        }
      },
      (error) => {
        console.error('AI config dinlenemedi:', error);
        // Hata durumunda varsayılan true bırak
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-dark-900 transition-colors duration-300">
      <Toaster position="top-right" richColors closeButton expand={false} />

      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {!isAdmin && (
        <div className="relative">
          <TopBar />
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

      {!isAdmin && !isCheckout && <BottomNav />}

      {/* AI Asistan - Tüm sitede erişilebilir (enabled ise) */}
      {!isAdmin && !isCheckout && isAiEnabled && <AIAssistant />}

      <CartDrawer />
      <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Newsletter Popup - Don't show on admin or checkout */}
      {!isAdmin && !isCheckout && <NewsletterPopup />}
    </div>
  );
};

const App: React.FC = () => {
  const initializeLoyalty = useLoyaltyStore((state) => state.initialize);

  useEffect(() => {
    // Tema Başlatma
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Loyalty Sistemi Başlatma
    initializeLoyalty().catch((err) => {
      console.error('Loyalty system initialization failed:', err);
    });
  }, [initializeLoyalty]);

  return (
    <LanguageProvider>
      <UserProvider>
        <ProductProvider>
          <CartProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/seed-data" element={<SeedData />} />
                  <Route path="/legal/:type" element={<Legal />} />
                  <Route path="/cart" element={<Cart />} />
<Route path="/login-gateway" element={<LoginGateway />} />
<Route path="/register" element={<Register />} />
                  <Route path="/tasting-quiz" element={<TastingQuiz />} />
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