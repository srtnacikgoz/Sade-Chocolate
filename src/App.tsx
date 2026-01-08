import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
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
import { SearchDrawer } from './components/SearchDrawer';
import { NewsletterPopup } from './components/NewsletterPopup';
import { AIAssistant } from './components/AIAssistant';
import { CookieConsent } from './components/CookieConsent';
import { FloatingFeedback } from './components/FloatingFeedback';
import { useLoyaltyStore } from './stores/loyaltyStore';
import { TypographySettings } from './types';

// Lazy load pages - Route bazlı code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Catalog = lazy(() => import('./pages/Catalog').then(m => ({ default: m.Catalog })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Favorites = lazy(() => import('./pages/Favorites').then(m => ({ default: m.Favorites })));
const Account = lazy(() => import('./pages/Account').then(m => ({ default: m.Account })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Legal = lazy(() => import('./pages/Legal').then(m => ({ default: m.Legal })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const SeedData = lazy(() => import('./pages/SeedData').then(m => ({ default: m.SeedData })));
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const LoginGateway = lazy(() => import('./pages/LoginGateway').then(m => ({ default: m.LoginGateway })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const TastingQuiz = lazy(() => import('./pages/TastingQuiz').then(m => ({ default: m.TastingQuiz })));
const Campaigns = lazy(() => import('./pages/Campaigns').then(m => ({ default: m.Campaigns })));
const Maintenance = lazy(() => import('./pages/Maintenance').then(m => ({ default: m.Maintenance })));

// Minimal loading component - no spinner
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white dark:bg-dark-900"></div>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Splash sayfası kaldırıldı - isSplash artık kullanılmıyor
  const isAdmin = location.pathname === '/admin' || location.pathname === '/seed-data';
  const isCheckout = location.pathname === '/checkout';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true); // Varsayılan aktif
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
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

  // Firestore'dan bakım modu durumunu dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'site_settings', 'maintenance'),
      (docSnap) => {
        if (docSnap.exists()) {
          setIsMaintenanceMode(docSnap.data()?.enabled === true);
        }
      },
      (error) => {
        console.error('Maintenance mode dinlenemedi:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Bakım modunda admin hariç tüm sayfalar Maintenance gösterir
  if (isMaintenanceMode && !isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Maintenance />
      </Suspense>
    );
  }

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

      {/* Floating Feedback - Don't show on admin or checkout */}
      {!isAdmin && !isCheckout && <FloatingFeedback />}

      <CartDrawer />
      <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Newsletter Popup - Don't show on admin or checkout */}
      {!isAdmin && !isCheckout && <NewsletterPopup />}

      {/* Cookie Consent - Don't show on admin or checkout */}
      {!isAdmin && !isCheckout && <CookieConsent />}
    </div>
  );
};

// Typography uygulama fonksiyonu
const applyTypography = (settings: TypographySettings) => {
  const root = document.documentElement;

  // Font families - Başlıklar (Her seviye için ayrı)
  if (settings.h1Font) {
    root.style.setProperty('--font-h1', `${settings.h1Font.family}, ${settings.h1Font.fallback}`);
  }
  if (settings.h2Font) {
    root.style.setProperty('--font-h2', `${settings.h2Font.family}, ${settings.h2Font.fallback}`);
  }
  if (settings.h3Font) {
    root.style.setProperty('--font-h3', `${settings.h3Font.family}, ${settings.h3Font.fallback}`);
  }
  if (settings.h4Font) {
    root.style.setProperty('--font-h4', `${settings.h4Font.family}, ${settings.h4Font.fallback}`);
  }
  if (settings.bodyFont) {
    root.style.setProperty('--font-body', `${settings.bodyFont.family}, ${settings.bodyFont.fallback}`);
  }
  if (settings.displayFont) {
    root.style.setProperty('--font-display', `${settings.displayFont.family}, ${settings.displayFont.fallback}`);
  }
  if (settings.logoFont) {
    root.style.setProperty('--font-logo', `${settings.logoFont.family}, ${settings.logoFont.fallback}`);
  }
  if (settings.buttonFont) {
    root.style.setProperty('--font-button', `${settings.buttonFont.family}, ${settings.buttonFont.fallback}`);
  }
  if (settings.navFont) {
    root.style.setProperty('--font-nav', `${settings.navFont.family}, ${settings.navFont.fallback}`);
  }
  if (settings.labelFont) {
    root.style.setProperty('--font-label', `${settings.labelFont.family}, ${settings.labelFont.fallback}`);
  }
  if (settings.captionFont) {
    root.style.setProperty('--font-caption', `${settings.captionFont.family}, ${settings.captionFont.fallback}`);
  }

  // Font sizes (responsive)
  Object.entries(settings.fontSize).forEach(([key, value]) => {
    root.style.setProperty(`--text-${key}-desktop`, value.desktop);
    root.style.setProperty(`--text-${key}-tablet`, value.tablet);
    root.style.setProperty(`--text-${key}-mobile`, value.mobile);
  });

  // Hover colors
  root.style.setProperty('--hover-primary', settings.hoverColors.primary);
  root.style.setProperty('--hover-secondary', settings.hoverColors.secondary);
  root.style.setProperty('--hover-accent', settings.hoverColors.accent);

  // Google Fonts yükle
  loadGoogleFonts(settings);
};

// Google Fonts yükleyici
const loadGoogleFonts = (settings: TypographySettings) => {
  const fonts: Array<{ family: string; weights: number[] }> = [];

  [
    settings.h1Font,
    settings.h2Font,
    settings.h3Font,
    settings.h4Font,
    settings.bodyFont,
    settings.displayFont,
    settings.logoFont,
    settings.buttonFont,
    settings.navFont,
    settings.labelFont,
    settings.captionFont
  ].forEach(font => {
    if (font && font.source === 'google' && !fonts.find(f => f.family === font.family)) {
      fonts.push({ family: font.family, weights: font.weights });
    }
  });

  if (fonts.length > 0) {
    const existingLink = document.querySelector('link[data-typography]');
    if (existingLink) existingLink.remove();

    const link = document.createElement('link');
    link.setAttribute('data-typography', 'true');
    link.rel = 'stylesheet';

    const families = fonts.map(f =>
      `family=${f.family.replace(/ /g, '+')}:wght@${f.weights.join(';')}`
    ).join('&');

    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
  }
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

    // Typography Başlatma
    const loadTypography = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'typography');
        onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as any;

            // Migration: Eski yapıdan yeni yapıya geçiş
            let settings: TypographySettings;
            if (data.headingFont && !data.h1Font) {
              settings = {
                ...data,
                h1Font: data.headingFont,
                h2Font: data.headingFont,
                h3Font: data.headingFont,
                h4Font: data.headingFont
              };
            } else {
              settings = data as TypographySettings;
            }

            applyTypography(settings);
          }
        });
      } catch (error) {
        console.error('Typography loading failed:', error);
      }
    };

    loadTypography();

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
                <Suspense fallback={<PageLoader />}>
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
                    <Route path="/campaigns" element={<Campaigns />} />
                    <Route path="/checkout" element={<Checkout />} />
                  </Routes>
                </Suspense>
              </Layout>
            </Router>
          </CartProvider>
        </ProductProvider>
      </UserProvider>
    </LanguageProvider>
  );
};

export default App;