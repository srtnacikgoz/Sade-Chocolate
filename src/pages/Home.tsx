import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { COLLECTIONS } from '../constants';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { QuickViewModal } from '../components/QuickViewModal';
import { CuratedBoxModal } from '../components/CuratedBoxModal';
import { AdminLoginModal } from '../components/AdminLoginModal';
import { Footer } from '../components/Footer';
import { Product, BoxConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package } from 'lucide-react';
import { BrandIcon } from '../components/ui/BrandIcon';
import { SEOHead } from '../components/SEOHead';

export const Home: React.FC = () => {
  const { addToCart } = useCart();
  const { products } = useProducts();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const { t, language } = useLanguage();

  const [liveContent, setLiveContent] = useState<any>(null);
  const [boxConfig, setBoxConfig] = useState<BoxConfig | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const clickCount = useRef(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'home'), (doc) => {
      if (doc.exists()) setLiveContent(doc.data());
    });
    return () => unsub();
  }, []);

  // Firestore'dan box_config yapılandırmasını çek
  useEffect(() => {
    const fetchBoxConfig = async () => {
      try {
        const docRef = doc(db, 'box_config', 'default');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBoxConfig(docSnap.data() as BoxConfig);
        }
      } catch (error) {
        console.error('Box config yüklenemedi:', error);
      }
    };
    fetchBoxConfig();
  }, []);

  const heroTitle = liveContent?.[language]?.hero_title || t('hero_title');
  const heroSubtitle = liveContent?.[language]?.hero_subtitle || t('hero_subtitle');
  const heroImageDesktop = liveContent?.[language]?.hero_image_desktop || liveContent?.[language]?.hero_image;
  const heroImageMobile = liveContent?.[language]?.hero_image_mobile || liveContent?.[language]?.hero_image;
  const heroFocalPointDesktop = liveContent?.[language]?.hero_focal_point_desktop || liveContent?.[language]?.hero_focal_point || { x: 50, y: 50 };
  const heroFocalPointMobile = liveContent?.[language]?.hero_focal_point_mobile || liveContent?.[language]?.hero_focal_point || { x: 50, y: 50 };
  const secretTitle = liveContent?.[language]?.secret_title || t('secret_title');
  const secretQuote = liveContent?.[language]?.secret_quote || t('secret_quote');
  const secretDesc = liveContent?.[language]?.secret_desc || t('secret_desc');
  // Ana sayfa imzası - bağımsız (site_content/home'dan)
  const signature = liveContent?.[language]?.signature || 'Sertan Açıkgöz';
  const signatureFont = liveContent?.[language]?.signature_font || 'handwriting';
  const signatureColor = liveContent?.[language]?.signature_color || 'gold';

  const filterTags = useMemo(() => {
    const allTags = products.flatMap(p => p.tags || []);
    return [...new Set(allTags)];
  }, [products]);

  const premiumCollections = useMemo(() => {
    if (liveContent?.premium_collection_ids?.length > 0) {
      return liveContent.premium_collection_ids
        .map((id: string) => products.find(p => p.id === id))
        .filter(Boolean);
    }
    return COLLECTIONS;
  }, [products, liveContent]);

  const featuredProduct = useMemo(() => {
    if (liveContent?.featured_product_id) {
      return products.find(p => p.id === liveContent.featured_product_id);
    }
    return products.find(p => p.badge === 'New') || products[0];
  }, [products, liveContent]);

  // Admin panel gizli giriş - 3 kez tıklama
  const handleLogoClick = () => {
    clickCount.current += 1;

    // Timer varsa temizle
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }

    // 3 kez tıklandıysa modal aç
    if (clickCount.current === 3) {
      setIsAdminModalOpen(true);
      clickCount.current = 0;
    }

    // 2 saniye içinde 3 tıklama olmazsa sıfırla
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 2000);
  };

  return (
    <>
    <SEOHead path="/" />
    <main
  className="w-full max-w-full pb-24 bg-cream-100 dark:bg-dark-900 min-h-screen"
  /* Padding-top ve header-height arasındaki hesaplama, boşluğu tamamen yok etmek için senkronize edildi */
  style={{ paddingTop: 'calc(var(--top-bar-height, 0px) + var(--header-height, 80px) + -20px)' }}
>
      {/* 🍫 Hero Section - Menüye tam yapışık ve Above the Fold sınırında */}
      {!heroImageDesktop && !heroImageMobile ? (
        /* Skeleton Loader - Firebase verisi gelene kadar */
        <section
          className="relative w-full overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse"
          style={{
            height: 'calc(100vh - var(--top-bar-height, 0px) - var(--header-height, 80px) - 30px)'
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-3xl space-y-6 w-full">
              <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded-2xl w-3/4 mx-auto"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-xl w-1/2 mx-auto"></div>
              <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-xl w-48 mx-auto"></div>
            </div>
          </div>
        </section>
      ) : (
        /* Gerçek Hero Section - Firebase verisi yüklendikten sonra */
        <section
          className="relative w-full overflow-hidden group transition-all duration-500"
          style={{
            height: 'calc(100vh - var(--top-bar-height, 0px) - var(--header-height, 80px) - 30px)'
          }}
        >
          {/* Desktop Hero Image */}
          {heroImageDesktop && (
            <img
              src={heroImageDesktop}
              alt="Artisan chocolate"
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s] hidden md:block"
              style={{ objectPosition: `${heroFocalPointDesktop.x}% ${heroFocalPointDesktop.y}%` }}
            />
          )}
          {/* Mobile Hero Image */}
          {heroImageMobile && (
            <img
              src={heroImageMobile}
              alt="Artisan chocolate"
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s] md:hidden"
              style={{ objectPosition: `${heroFocalPointMobile.x}% ${heroFocalPointMobile.y}%` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-3xl animate-fade-in">
              <h1 className="text-5xl lg:text-8xl text-white mb-6 leading-none tracking-tighter drop-shadow-xl whitespace-pre-line">
                {heroTitle.includes('Sade') && heroTitle.includes('Chocolate') ? (
                  // "Sade Chocolate" içeriyorsa Santana font kullan
                  heroTitle.split('\n').map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line.includes('Sade') && line.includes('Chocolate') ? (
                        <>
                          <span className="font-santana font-bold">Sade</span>{' '}
                          <span className="font-santana font-normal">Chocolate</span>
                        </>
                      ) : (
                        <span className="font-serif font-extralight">{line}</span>
                      )}
                      {idx < heroTitle.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))
                ) : (
                  // Diğer durumlarda normal serif font
                  <span className="font-serif font-extralight">{heroTitle}</span>
                )}
              </h1>
              <p className="font-sans text-white/90 text-sm lg:text-base font-light mb-10 tracking-[0.3em] uppercase">
                {heroSubtitle}
              </p>
              <Link to="/catalog" className="inline-flex items-center gap-4 text-white text-[10px] font-black uppercase tracking-[0.4em] group/btn">
                <span className="relative pb-2 border-b border-gold/50 group-hover:border-gold transition-colors">
                  {t('shop_now')}
                </span>
                <span className="material-icons-outlined text-sm transform group-hover:translate-x-3 transition-transform duration-500">east</span>
              </Link>
            </div>
          </div>
        </section>
      )}

     {/* 🏷️ Bilgi Kuşağı - Infinite Scroll Versiyonu */}
<div className="w-full bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-gray-800 py-5 relative z-10 overflow-hidden">
  <div className="animate-marquee flex gap-10">
    {/* İçeriği 4 kez render ediyoruz ki sonsuz döngü kusursuz olsun */}
    {[1, 2, 3, 4].map((iteration) => (
      <div key={iteration} className="flex gap-10 shrink-0">
        {(liveContent?.[language]?.featured_tags
  ? liveContent[language].featured_tags.split(',').filter((t: string) => t.trim() !== '')
  : ['SINGLE-ORIGIN', 'HANDCRAFTED', 'ETHICALLY SOURCED', 'ARTISAN', 'SMALL BATCH']
).map((text: string, idx: number) => (
          <span
  key={`${iteration}-${idx}`}
  className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 dark:text-gray-500 whitespace-nowrap"
>
            {text.trim()}
          </span>
        ))}
      </div>
    ))}
  </div>
</div>

      {/* 📜 Philosophy Section */}
      <section className="w-full mb-32 py-32 bg-cream-200/40 dark:bg-dark-900/50 border-y border-gold/5 transition-all duration-700">
        <div className="sade-container grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
          <div className="space-y-6">
            <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em] block mb-4">{secretTitle}</span>
            <h2 className="font-serif text-5xl lg:text-7xl text-mocha-900 dark:text-white leading-[1.1] tracking-tighter italic">
              {secretQuote.split(',').map((part, i) => (
                <span key={i} className="block">{part}</span>
              ))}
            </h2>
          </div>
          <div className="relative pl-12 border-l border-gold/30">
            <div className="font-serif text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed italic mb-8 space-y-4 whitespace-pre-line">
              {secretDesc}
            </div>
            <div className="flex items-center gap-6">
              <div className="h-[1px] w-12 bg-gold/50"></div>
              <span className={`text-3xl ${
                signatureFont === 'handwriting'
                  ? 'font-signature'
                  : signatureFont === 'santana'
                    ? 'font-santana'
                    : signatureFont === 'display'
                      ? 'font-display'
                      : 'font-sans'
              } ${
                signatureColor === 'mocha-900'
                  ? 'text-mocha-900 dark:text-cream-50'
                  : signatureColor === 'dark-900'
                    ? 'text-dark-900 dark:text-cream-50'
                    : 'text-gold'
              }`}>{signature}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 📦 ✅ ÇÖZÜM 1: Koleksiyonlar Bölümü - Tüm fonksiyonelliğiyle korunarak geri eklendi */}
      <section className="w-full mb-48">
        <div className="sade-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-gold text-[10px] font-bold uppercase tracking-[0.4em] mb-2 block">Premium Selection</span>
              <h2 className="font-display text-3xl lg:text-5xl text-mocha-900 dark:text-white italic leading-none">{t('collections')}</h2>
            </div>
            <Link to="/catalog" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gold border-b border-transparent hover:border-gold transition-all pb-1">
              {t('view_all')}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Kendi Kutunu Oluştur - Özel Kart */}
            {(boxConfig?.enabled !== false) && (
              <button
                onClick={() => setIsBoxModalOpen(true)}
                className="group cursor-pointer bg-white dark:bg-dark-800 rounded-[40px] overflow-hidden transition-all duration-700 hover:shadow-luxurious border-2 border-gold text-left"
              >
                <div className="relative aspect-square overflow-hidden flex items-center justify-center">
                  {/* Arka plan görseli veya gradient */}
                  {boxConfig?.cardImage ? (
                    <>
                      <img
                        src={boxConfig.cardImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      {/* Kutu boyutları görselin altında */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-bold text-gold uppercase tracking-widest bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
                        {boxConfig?.boxSizes?.filter(s => s.enabled).map((size, idx, arr) => (
                          <React.Fragment key={size.id}>
                            <span>{size.size}'li</span>
                            {idx < arr.length - 1 && <span className="w-1 h-1 rounded-full bg-gold/50" />}
                          </React.Fragment>
                        )) || (
                          <>
                            <span>4'lü</span>
                            <span className="w-1 h-1 rounded-full bg-gold/50" />
                            <span>8'li</span>
                            <span className="w-1 h-1 rounded-full bg-gold/50" />
                            <span>16'lı</span>
                            <span className="w-1 h-1 rounded-full bg-gold/50" />
                            <span>25'li</span>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-brand-mustard/10 dark:from-gold/10 dark:to-brand-mustard/5 flex items-center justify-center">
                      {/* Ana ikon */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-28 h-28 bg-gradient-to-br from-gold to-brand-mustard rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 mb-6">
                          <Package className="text-white" size={56} />
                          <BrandIcon className="absolute -top-2 -right-2 text-white drop-shadow-lg" size={24} />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gold uppercase tracking-widest">
                          {boxConfig?.boxSizes?.filter(s => s.enabled).map((size, idx, arr) => (
                            <React.Fragment key={size.id}>
                              <span>{size.size}'li</span>
                              {idx < arr.length - 1 && <span className="w-1 h-1 rounded-full bg-gold/50" />}
                            </React.Fragment>
                          )) || (
                            <>
                              <span>4'lü</span>
                              <span className="w-1 h-1 rounded-full bg-gold/50" />
                              <span>8'li</span>
                              <span className="w-1 h-1 rounded-full bg-gold/50" />
                              <span>16'lı</span>
                              <span className="w-1 h-1 rounded-full bg-gold/50" />
                              <span>25'li</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-10 text-center">
                  <h3 className="font-display text-2xl mb-2 text-mocha-900 dark:text-white italic">
                    {boxConfig?.cardTitle || 'Kendi Kutunu Oluştur'}
                  </h3>
                  <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
                    {boxConfig?.cardSubtitle || 'Favori bonbonlarını seç'}
                  </p>
                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-xl text-[10px] font-bold uppercase tracking-widest group-hover:bg-brown-900 transition-all">
                    {boxConfig?.ctaText || 'Başla'}
                    <span className="material-icons-outlined text-sm">east</span>
                  </span>
                </div>
              </button>
            )}

            {premiumCollections.filter(c => c?.id).slice(0, 2).map((collection) => (
              <Link
                key={collection.id}
                to={`/product/${collection.id}`}
                className="group cursor-pointer bg-white dark:bg-dark-800 rounded-[40px] overflow-hidden transition-all duration-700 hover:shadow-luxurious border border-gray-100 dark:border-gray-800"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img src={collection.image} alt={collection.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-10 text-center">
                  <h3 className="font-display text-2xl mb-2 text-mocha-900 dark:text-white italic">{collection.title}</h3>
                  <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">{collection.description}</p>
                  <span className="font-display text-xl font-bold text-brown-900 dark:text-gold italic">₺{collection.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 🌟 Featured Product */}
      {featuredProduct && (
        <section className="w-full mb-32 py-32 bg-gray-50/50 dark:bg-dark-800/50 border-y border-gray-100 dark:border-gray-800">
          <div className="sade-container">
            <h2 className="font-display text-3xl lg:text-5xl text-gray-900 dark:text-white mb-16 text-center italic">{t('featured_month')}</h2>
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center bg-white dark:bg-dark-800 rounded-[60px] p-8 lg:p-20 border border-gray-100 dark:border-gray-700 shadow-luxurious">
              <div className="w-full lg:w-1/2 relative aspect-square bg-gray-50 dark:bg-dark-900 rounded-[40px] shadow-inner group overflow-hidden border border-gray-100 dark:border-gray-800">
                  <img
                    src={featuredProduct.image}
                    alt={featuredProduct.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain p-12 transform group-hover:scale-105 transition-transform duration-1000"
                  />
                  <button 
                    onClick={() => setQuickViewProduct(featuredProduct)}
                    className="absolute bottom-8 right-8 w-14 h-14 bg-white dark:bg-black/80 rounded-xl text-gray-500 dark:text-gray-200 hover:text-brown-900 dark:hover:text-gold transition-all shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 z-10"
                  >
                      <span className="material-icons-outlined text-2xl">visibility</span>
                  </button>
              </div>
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                  <span className="text-gold text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block">Artisan Selection</span>
                  <h3 className="font-display text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 italic leading-tight">{featuredProduct.title}</h3>
                  <p className="font-sans text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed italic">
                  "{featuredProduct.description}"
                  </p>
                  <div className="flex items-center justify-center lg:justify-start gap-8">
                    <span className="font-display text-5xl font-bold text-brown-900 dark:text-gold italic">₺{featuredProduct.price.toFixed(2)}</span>
                    <button 
                      onClick={() => addToCart(featuredProduct)}
                      className="bg-brown-900 text-white dark:bg-white dark:text-black px-12 py-5 rounded-xl text-[11px] font-bold uppercase tracking-[0.3em] shadow-2xl hover:bg-gold dark:hover:bg-gold hover:text-white transition-all active:scale-95"
                    >
                        {t('add_to_cart')}
                    </button>
                  </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer onLogoClick={handleLogoClick} />

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* Kendi Kutunu Oluştur Modal */}
      <CuratedBoxModal
        isOpen={isBoxModalOpen}
        onClose={() => setIsBoxModalOpen(false)}
      />

      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </main>
    </>
  );
};