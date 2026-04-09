import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { ShippingInfo } from '../components/ShippingInfo';
import { NutritionalInfo } from '../components/NutritionalInfo';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { ViewMode } from '../types';
import { trackProductView } from '../services/visitorTrackingService';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer
} from 'recharts';
import { ChevronLeft, ChevronRight, Milk, Bean, Square, Nut, Cherry, Coffee, Cookie, Flame, IceCream } from 'lucide-react';
import { BrandIcon } from '../components/ui/BrandIcon';
import { SEOHead } from '../components/SEOHead';
import { ProductReviews } from '../components/ProductReviews';
import { trackViewItem } from '../services/analyticsService';
import { trackPixelViewContent } from '../services/metaPixelService';

// İkon Eşleştirme Yardımcısı
const AttributeIcon = ({ iconId }: { iconId: string }) => {
  const icons: any = {
    milk: <Milk size={16} />,
    dark: <Bean size={16} />,
    white: <Square size={16} />,
    nut: <Nut size={16} />,
    fruit: <Cherry size={16} />,
    coffee: <Coffee size={16} />,
    cookie: <Cookie size={16} />,
    flame: <Flame size={16} />,
    icecream: <IceCream size={16} />,
    special: <BrandIcon size={16} />
  };
  return icons[iconId] || <BrandIcon size={16} />;
};
const Accordion: React.FC<{ title: string; content?: string; defaultOpen?: boolean }> = ({ title, content, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!content || content.trim() === "" || content.includes("undefined")) return null;

  return (
    <div className="border-b border-gray-100 dark:border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-7 flex items-center justify-between text-left group transition-all"
      >
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 group-hover:text-brown-900 dark:group-hover:text-gold transition-colors">{title}</span>
        <div className={`p-2 rounded-full transition-all duration-500 ${isOpen ? 'bg-gold/10 rotate-90' : 'group-hover:bg-gray-50'}`}>
          <ChevronRight className={`transition-colors duration-500 ${isOpen ? 'text-gold' : 'text-gray-300'}`} size={16} />
        </div>
      </button>

      {/* 🪄 SMOOTH GRID ANIMATION: İçerik ne kadar uzun olursa olsun akışkan açılır */}
      <div className={`grid transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100 mb-8' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="text-sm leading-[2] text-gray-600 dark:text-gray-400 font-sans whitespace-pre-line pr-12">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};

// 🎁 Kutu İçeriği Accordion - Bonbon kartları ile
const BoxContentAccordion: React.FC<{
  bonbons: any[];
  boxSize?: number;
  boxProduct?: { id: string; title: string };
  defaultOpen?: boolean
}> = ({ bonbons, boxSize, boxProduct, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!bonbons || bonbons.length === 0) return null;

  const title = `Kutu İçeriği (${boxSize || bonbons.length} Bonbon)`;

  return (
    <div className="border-b border-gray-100 dark:border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-7 flex items-center justify-between text-left group transition-all"
      >
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 group-hover:text-brown-900 dark:group-hover:text-gold transition-colors">{title}</span>
        <div className={`p-2 rounded-full transition-all duration-500 ${isOpen ? 'bg-gold/10 rotate-90' : 'group-hover:bg-gray-50'}`}>
          <ChevronRight className={`transition-colors duration-500 ${isOpen ? 'text-gold' : 'text-gray-300'}`} size={16} />
        </div>
      </button>

      {/* Açık/Kapalı durumu - overflow-y-hidden ile dikey animasyon, yatay scroll serbest */}
      <div
        className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'max-h-[300px] opacity-100 mb-8' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        {/* Yatay Scroll Bonbon Kartları */}
        <div className="flex gap-4 overflow-x-auto pb-4 pr-4 scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent">
          {bonbons.map((bonbon: any, idx: number) => (
            <Link
              key={`${bonbon.id}-${idx}`}
              to={`/bonbonlar/${bonbon.slug || bonbon.id}`}
              state={{ fromBox: boxProduct }}
              className="flex-shrink-0 w-[130px] group/card"
            >
              {/* Görsel */}
              <div className="w-[130px] h-[130px] rounded-2xl overflow-hidden mb-3 border-2 border-gray-100 dark:border-gray-800 group-hover/card:border-gold transition-all duration-300 bg-cream-50 dark:bg-dark-800">
                {bonbon.image ? (
                  <img
                    src={bonbon.image}
                    alt={bonbon.title}
                    className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-icons-outlined text-3xl text-mocha-300 dark:text-gray-600">image</span>
                  </div>
                )}
              </div>
              {/* İsim */}
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-brown-900 dark:text-white text-center group-hover/card:text-gold transition-colors line-clamp-2">
                {bonbon.title}
              </h4>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { products } = useProducts();
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'shipping'>('desc');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // 🔙 Kutudan gelindiyse geri dönüş bilgisi
  const fromBox = (location.state as any)?.fromBox as { id: string; title: string } | undefined;

  const product = useMemo(() => {
    // Önce document ID ile ara (normal akış)
    const byId = products.find(p => p.id === id);
    if (byId) return byId;

    // Bulunamazsa slug benzeri eşleştirme dene (dış linkler için)
    if (id) {
      const slugLower = id.toLowerCase();
      const slugWords = slugLower.replace(/-/g, ' ');

      // Slug'dan sayısal suffix'i ayır (ör: "bitter-tablet-54" → "bitter tablet")
      const withoutTrailingNum = slugWords.replace(/\s+\d+$/, '').trim();

      return products.find(p => {
        const titleLower = p.title?.toLowerCase() || '';
        const titleSlug = titleLower.replace(/[^a-z0-9öüşıçğ\s]/g, '').replace(/\s+/g, ' ').trim();

        // Tam eşleşme (slug → title)
        if (titleSlug === slugWords || titleSlug === withoutTrailingNum) return true;
        // Title slug'a dönüştürüldüğünde eşleşme
        const titleAsSlug = titleLower.replace(/[^a-z0-9öüşıçğ\s]/g, '').replace(/\s+/g, '-').trim();
        if (titleAsSlug === slugLower || titleAsSlug === withoutTrailingNum.replace(/\s+/g, '-')) return true;
        // Title, slug kelimelerini içeriyorsa (kısmi eşleşme)
        if (withoutTrailingNum.length >= 3 && titleSlug.includes(withoutTrailingNum)) return true;

        return false;
      });
    }
    return undefined;
  }, [id, products]);

  // Urun detay sayfasi goruntuleme takibi
  useEffect(() => {
    if (product) {
      trackProductView(
        product.id,
        product.title,
        product.price,
        product.image || null,
        'detail'
      );
    }
  }, [product?.id]);

  // Ana görsel + galeri görselleri birleştirilmiş liste
  const allImages = useMemo(() => {
    if (!product) return [];
    const images: string[] = [];
    if (product.image) images.push(product.image); // Ana görsel ilk sırada
    if (product.images && product.images.length > 0) {
      // Galeri görsellerini ekle (ana görselle aynı değilse)
      product.images.forEach(img => {
        if (img !== product.image) images.push(img);
      });
    }
    return images;
  }, [product]);

  // 🎁 YENİ SİSTEM: Kutu içeriği bonbonları (boxContentIds'den)
  const boxContentProducts = useMemo(() => {
    if (!product || !product.boxContentIds || product.boxContentIds.length === 0) return [];
    // boxContentIds'deki her ID için ürünü bul (aynı ID birden fazla olabilir)
    return product.boxContentIds
      .map(id => products.find(p => p.id === id))
      .filter(Boolean); // undefined olanları çıkar
  }, [product, products]);

  // 🧮 KUTU İÇİN OTOMATİK HESAPLANAN DEĞERLER
  // Bonbonların içeriklerinden profesyonel liste oluşturma
  const computedIngredients = useMemo(() => {
    // Kutu değilse veya bonbon yoksa ürünün kendi değerini kullan
    if (product?.productType !== 'box' || boxContentProducts.length === 0) {
      return product?.ingredients;
    }

    // Tüm bonbonların içeriklerini topla
    const allIngredients = boxContentProducts
      .map((b: any) => b.ingredients)
      .filter(Boolean)
      .join(', ');

    if (!allIngredients) return product?.ingredients;

    // Normalize mapping - farklı yazımları standartlaştır
    const normalizeMap: Record<string, string> = {
      // Emülgatörler
      'emülgatör: lesitin (soya)': '__EMULSIFIER__',
      'emülgatör: soya lesitini': '__EMULSIFIER__',
      'emülgatör (soya lesitini)': '__EMULSIFIER__',
      'emülgatör: lesitin': '__EMULSIFIER__',
      'soya lesitini': '__EMULSIFIER__',
      'lesitin (soya)': '__EMULSIFIER__',
      // Asitlik düzenleyiciler
      'asitlik düzenleyici (sitrik asit)': '__ACIDITY__',
      'asitlik düzenleyici: sitrik asit': '__ACIDITY__',
      'sitrik asit': '__ACIDITY__',
      // Aroma vericiler
      'doğal vanilya aroması': '__AROMA__',
      'vanilya aroması': '__AROMA__',
      'aroma verici: doğal vanilya': '__AROMA__',
    };

    // Kategoriler
    const categories = {
      emulsifier: false,
      acidity: false,
      aroma: false,
    };

    // Her içeriği parçala
    const parts = allIngredients
      .split(',')
      .map((i: string) => i.trim())
      .filter((i: string) => i.length > 0);

    const seenBase = new Set<string>();
    const mainIngredients: string[] = [];

    for (const part of parts) {
      // Önce normalize mapping kontrolü
      const lowerPart = part.toLowerCase();
      let isSpecialCategory = false;

      for (const [pattern, category] of Object.entries(normalizeMap)) {
        if (lowerPart.includes(pattern) || pattern.includes(lowerPart.replace(/[():%]/g, '').trim())) {
          if (category === '__EMULSIFIER__') categories.emulsifier = true;
          if (category === '__ACIDITY__') categories.acidity = true;
          if (category === '__AROMA__') categories.aroma = true;
          isSpecialCategory = true;
          break;
        }
      }

      if (isSpecialCategory) continue;

      // Ana içerikler için base kelimeyi çıkar
      const base = part
        .replace(/\s*\([^)]*\)/g, '')   // Parantez içini çıkar
        .replace(/\s*%\s*[\d.]+/g, '')  // Yüzdeleri çıkar
        .replace(/[:]/g, '')            // İki nokta çıkar
        .trim()
        .toLowerCase();

      if (base && base.length > 1 && !seenBase.has(base)) {
        seenBase.add(base);
        // Temiz format: sadece isim, yüzdesiz
        const cleanName = part
          .replace(/\s*\([^)]*\)/g, '')
          .replace(/\s*%\s*[\d.]+/g, '')
          .replace(/[:]/g, '')
          .trim();
        // İlk harf büyük
        mainIngredients.push(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }

    // Sonucu formatla
    let result = mainIngredients.join(', ');

    // Özel kategorileri ekle
    const specialParts: string[] = [];
    if (categories.emulsifier) specialParts.push('Emülgatör: Soya Lesitini');
    if (categories.acidity) specialParts.push('Asitlik Düzenleyici: Sitrik Asit');
    if (categories.aroma) specialParts.push('Aroma Verici: Doğal Vanilya Aroması');

    if (specialParts.length > 0) {
      result += '.\n\n' + specialParts.join('. ') + '.';
    }

    return result;
  }, [product, boxContentProducts]);

  // Alerjenler - akıllı unique liste (kelime bazında tekrar önleme)
  const computedAllergens = useMemo(() => {
    if (product?.productType !== 'box' || boxContentProducts.length === 0) {
      return product?.allergens;
    }

    const allAllergens = boxContentProducts
      .map((b: any) => b.allergens)
      .filter(Boolean)
      .join(', ');

    if (!allAllergens) return product?.allergens;

    // Virgül ve "ve" ile parçala
    const parts = allAllergens
      .split(/[,]/)
      .map((a: string) => a.trim())
      .filter((a: string) => a.length > 0);

    // Her parçayı normalize ederek kelime gruplarına ayır
    const seenPhrases = new Set<string>();
    const uniqueParts: string[] = [];

    for (const part of parts) {
      // Normalize: küçük harf, fazla boşlukları temizle
      const normalized = part.toLowerCase().replace(/\s+/g, ' ').trim();

      // Bu ifade veya çok benzer bir ifade daha önce eklendi mi?
      // "eser miktarda X içerebilir" kalıplarını tek seferde al
      const isRedundant = [...seenPhrases].some(seen => {
        // Biri diğerini içeriyorsa veya %80+ kelime örtüşmesi varsa atla
        if (seen.includes(normalized) || normalized.includes(seen)) return true;

        // Kelime bazında örtüşme kontrolü
        const seenWords = new Set(seen.split(' '));
        const currentWords = normalized.split(' ');
        const overlap = currentWords.filter(w => seenWords.has(w)).length;
        const overlapRatio = overlap / Math.max(seenWords.size, currentWords.length);
        return overlapRatio > 0.7; // %70'ten fazla örtüşme varsa tekrar say
      });

      if (!isRedundant) {
        seenPhrases.add(normalized);
        // Orijinal formatı koru (ilk harf büyük)
        uniqueParts.push(part.charAt(0).toUpperCase() + part.slice(1));
      }
    }

    return uniqueParts.join(', ');
  }, [product, boxContentProducts]);

  // Besin değerleri - bonbon başına ortalama veya toplam
  const computedNutritionalValues = useMemo(() => {
    if (product?.productType !== 'box' || boxContentProducts.length === 0) {
      return product?.nutritionalValues;
    }

    // Eğer kutunun kendi besin değeri varsa onu kullan
    if (product?.nutritionalValues) return product.nutritionalValues;

    // Bonbonlardan besin değeri olan varsa genel bilgi göster
    const hasNutrition = boxContentProducts.some((b: any) => b.nutritionalValues);
    if (hasNutrition) {
      return `Bu kutu ${boxContentProducts.length} adet el yapımı bonbon içermektedir. Her bonbonun detaylı besin değerleri için ilgili ürün sayfasını ziyaret edebilirsiniz.`;
    }

    return undefined;
  }, [product, boxContentProducts]);

  // Menşei bilgisi
  const computedOrigin = useMemo(() => {
    if (product?.productType !== 'box' || boxContentProducts.length === 0) {
      return product?.origin;
    }

    // Eğer kutunun kendi origin'i varsa onu kullan
    if (product?.origin) return product.origin;

    // Bonbonlardan unique origin'leri topla
    const origins = boxContentProducts
      .map((b: any) => b.origin)
      .filter(Boolean);

    if (origins.length === 0) {
      return 'Sade Chocolate Atölyesi, Antalya';
    }

    const uniqueOrigins = [...new Set(origins)];
    if (uniqueOrigins.length === 1) {
      return uniqueOrigins[0];
    }

    return `Çeşitli menşei: ${uniqueOrigins.join(', ')}`;
  }, [product, boxContentProducts]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    // 1. Aynı kategoriye sahip diğer ürünleri bul (Küçük/Büyük harf duyarsız)
    let related = products.filter(p => 
      p.category?.toLowerCase() === product.category?.toLowerCase() && 
      p.id !== product.id
    );

    // 2. Eğer aynı kategoride ürün yoksa, sistemin boş kalmaması için diğer ürünlerden getir
    if (related.length === 0) {
      related = products.filter(p => p.id !== product.id);
    }
    
    return related.slice(0, 4);
  }, [product, products]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImageIndex(0); // Ürün değiştiğinde ilk görsele dön
  }, [id]);

  if (!product) {
    return (
      <main className="pt-32 text-center h-screen bg-white dark:bg-dark-900">
        <h2 className="text-3xl font-display mb-6">Ürün Bulunamadı</h2>
        <Button onClick={() => navigate('/catalog')}>Kataloga Dön</Button>
      </main>
    );
  }

  const isFav = isFavorite(product.id);
  const isOut = product.isOutOfStock;

  // GA4 ürün görüntüleme event'i
  useEffect(() => {
    trackViewItem({
      item_id: product.id,
      item_name: product.title,
      price: product.price,
      item_category: product.category
    });
    trackPixelViewContent({
      id: product.id,
      name: product.title,
      price: product.price,
      category: product.category
    });
  }, [product.id]);

  return (
    <>
    <SEOHead
      title={product.title}
      description={product.description || `${product.title} - Sade Chocolate premium el yapımı çikolata`}
      path={`/product/${product.id}`}
      image={product.image}
      type="product"
      product={{
        name: product.title,
        price: product.price,
        currency: 'TRY',
        availability: isOut ? 'OutOfStock' : 'InStock',
        image: product.image,
        description: product.description
      }}
      breadcrumbs={[
        { name: 'Ana Sayfa', url: '/' },
        { name: 'Katalog', url: '/catalog' },
        { name: product.title, url: `/product/${product.id}` }
      ]}
    />
    <main className="w-full max-w-screen-xl mx-auto pt-40 pb-28 md:pb-24 px-4 sm:px-6 lg:px-12 bg-cream-100 dark:bg-dark-900 min-h-screen">
      <div className="animate-fade-in">

        {/* 🔙 Geri Dön Butonu */}
        <Link
          to={fromBox ? `/product/${fromBox.id}` : '/catalog'}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-cream-200/50 hover:bg-cream-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-mocha-600 dark:text-gray-300 rounded-full text-xs font-bold uppercase tracking-wider transition-all group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>{fromBox ? `${fromBox.title} Kutusuna Dön` : 'Koleksiyonlar'}</span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Left Side: Visuals - Dandelion Tarzı Galeri */}
          <div className="space-y-6">
            {/* Ana Görsel */}
            <div className="relative aspect-square lg:aspect-[4/5] bg-gray-50 dark:bg-dark-800 rounded-[50px] overflow-hidden shadow-luxurious border border-gray-100 dark:border-gray-800 group">
              {isOut && (
                <div className="absolute inset-0 z-20 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center">
                  <div className="bg-brown-900 text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.3em] shadow-2xl">
                    Geçici Olarak Tükendi
                  </div>
                </div>
              )}
              {product.video ? (
                <video src={product.video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : allImages.length > 0 || product.image ? (
                <img
                  src={allImages[selectedImageIndex] || product.image}
                  alt={product.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-cream-100 dark:bg-dark-700">
                  <div className="text-center text-mocha-300 dark:text-gray-600">
                    <span className="material-icons-outlined text-6xl mb-2">image</span>
                    <p className="text-sm">Görsel Yükleniyor...</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => toggleFavorite(product.id)}
                className={`absolute top-8 right-8 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md transition-all ${isFav ? 'bg-red-500 text-white scale-110' : 'bg-white/90 dark:bg-dark-900/90 text-gray-400 hover:text-red-500'}`}
              >
                <span className="material-icons-outlined text-2xl">{isFav ? 'favorite' : 'favorite_border'}</span>
              </button>
            </div>

            {/* Thumbnail Galeri (Dandelion Tarzı) */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedImageIndex === index
                        ? 'border-gold shadow-lg scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.title} - ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            {/* Value Badges: Dinamik Admin Seçimi */}
            <div className="grid grid-cols-3 gap-6">
               {product.valueBadges && product.valueBadges.length > 0 ? (
                 product.valueBadges.map((badge: any, idx: number) => (
                   <div key={idx} className="bg-gray-50 dark:bg-dark-800 p-6 rounded-[30px] flex flex-col items-center text-center group transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm">
                     <span className="material-icons-outlined text-gold mb-3 text-3xl">{badge.icon}</span>
                     <span className="text-[10px] font-bold uppercase tracking-widest dark:text-gray-300">{badge.label}</span>
                   </div>
                 ))
               ) : (
                 // Üründe badge seçilmediyse varsayılanları göster (opsiyonel)
                 ['100% El Yapımı', 'Katkısız', 'Artisan'].map((txt, i) => (
                   <div key={i} className="bg-gray-50/50 dark:bg-dark-800/50 p-6 rounded-[30px] flex flex-col items-center text-center opacity-40">
                     <span className="material-icons-outlined text-gray-300 mb-3 text-3xl">verified</span>
                     <span className="text-[10px] font-bold uppercase tracking-widest dark:text-gray-600">{txt}</span>
                   </div>
                 ))
               )}
            </div>
          </div>

          {/* Right Side: Information */}
          <div className="flex flex-col pt-4">
            <div className="mb-10">
              {product.badge && ['New', 'Bestseller', 'Limited', 'Özel', 'Yeni', 'Popüler'].includes(product.badge) && (
                <span className="inline-block px-4 py-1.5 bg-brown-900 dark:bg-gold text-white dark:text-black text-[11px] font-bold uppercase tracking-[0.2em] rounded-full mb-6 shadow-md">
                  {product.badge === 'New' ? t('badge_new') : product.badge}
                </span>
              )}
              <h1 className="font-display text-5xl lg:text-7xl font-light leading-tight mb-4 italic tracking-tight">
  {product.title.split(' ').map((word, i) => (
    <span key={i} className={i % 2 === 0 ? 'text-mocha-900 dark:text-white' : 'text-gold-DEFAULT drop-shadow-sm'}>
      {word}{' '}
    </span>
  ))}
</h1>
              {/* Tablet Ürünler: Dandelion Tarzı Minimal Tasting Notes */}
{product.productType === 'tablet' && product.tastingNotes && (
  <div className="mt-6 mb-10">
    <p className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] mb-3">Tadım Notları</p>
    <p className="font-display text-xl lg:text-2xl italic text-gray-600 dark:text-gray-300 leading-relaxed">
      "{product.tastingNotes}"
    </p>
  </div>
)}

{/* Diğer Ürünler: Läderach Stil İkonlu İçerik Etiketleri */}
{product.productType !== 'tablet' && product.attributes && product.attributes.length > 0 && (
  <div className="flex flex-wrap gap-5 mt-4 mb-10">
    {product.attributes.map(attr => {
      const [name, iconId] = attr.includes('|') ? attr.split('|') : [attr, 'special'];
      return (
        <div key={name} className="flex flex-col items-center gap-1.5 group">
          <div className="text-gold/80 dark:text-gold/80 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:text-gold">
            <AttributeIcon iconId={iconId} />
          </div>
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">{name}</span>
        </div>
      );
    })}
  </div>
)}
              <div className="flex items-center gap-4 text-xs font-sans text-gray-400 uppercase tracking-[0.3em]">
                 <span>{product.category}</span>
                 <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                 <span>{product.origin || 'Sade Artisan Selection'}</span>
              </div>
            </div>

            <div className="flex items-end gap-4 mb-8">
  <span className="font-display text-2xl lg:text-3xl font-bold text-brown-900 dark:text-gold italic tracking-tight opacity-80">
    ₺{product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
  </span>
</div>

            {/* Sensory Profile */}
{/* Sadece Tablet gibi tekil ürünlerde görünmesi için admin onayı şartı */}
{product.showSensory && product.sensory && (
  <div className="mb-12 bg-gray-50 dark:bg-dark-800 p-10 rounded-[50px] border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-8 flex items-center gap-3">
                   <span className="material-icons-outlined text-gold">insights</span> {t('sensory_profile')}
                </h3>
                <div className="w-full h-[300px] mt-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: t('sensory_intensity'), A: product.sensory.intensity },
                      { subject: t('sensory_sweetness'), A: product.sensory.sweetness },
                      { subject: t('sensory_creaminess'), A: product.sensory.creaminess },
                      { subject: t('sensory_fruitiness'), A: product.sensory.fruitiness },
                      { subject: t('sensory_acidity'), A: product.sensory.acidity },
                      { subject: t('sensory_crunch'), A: product.sensory.crunch },
                    ]}>
                      <PolarGrid stroke="#E5D1B0" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#8D6E63', fontSize: 10, fontWeight: 700 }}
                      />
                      <Radar
                        name="Profil"
                        dataKey="A"
                        stroke="#C5A059"
                        fill="#C5A059"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Duyusal Profil Açıklaması */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Tat Profili</p>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-loose">
                    {(() => {
                      const s = product.sensory;
                      // Admin panelinde 0-100 skalası kullanılıyor
                      const desc = (val: number, low: string, mid: string, high: string) =>
                        val <= 30 ? low : val <= 60 ? mid : high;

                      const parts = [
                        desc(s.intensity, 'Hafif kakao karakteri', 'Dengeli yoğunluk', 'Yoğun kakao karakteri'),
                        desc(s.sweetness, 'minimal tatlılık', 'dengeli tatlılık', 'belirgin tatlılık'),
                        desc(s.creaminess, 'hafif kremsilik', 'kremsi doku', 'yoğun kremsi doku'),
                        desc(s.fruitiness, 'düşük meyvemsilik', 'dengeli meyvemsilik', 'belirgin meyve notaları'),
                        desc(s.acidity, 'düşük asidite', 'dengeli asidite', 'canlı asidite'),
                        desc(s.crunch, 'yumuşak doku', 'hafif çıtırlık', 'belirgin çıtırlık'),
                      ];

                      return `${parts[0]}, ${parts[1]}, ${parts[2]}, ${parts[3]}, ${parts[4]} ve ${parts[5]}.`;
                    })()}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 mb-16">
              {!isOut && (
                <div className="flex items-center h-20 bg-gray-100 dark:bg-dark-800 rounded-[25px] px-8 border border-gray-200 dark:border-gray-700 shadow-inner">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors">
                    <span className="material-icons-outlined text-2xl">remove</span>
                  </button>
                  <span className="w-16 text-center font-bold font-display text-2xl dark:text-white">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors">
                    <span className="material-icons-outlined text-2xl">add</span>
                  </button>
                </div>
              )}
              <Button 
                onClick={() => addToCart(product, quantity)}
                disabled={isOut}
                size="lg" 
                className="flex-1 h-20 text-sm tracking-[0.4em] rounded-[25px] shadow-2xl"
              >
                {isOut ? 'Geçici Olarak Tükendi' : t('add_to_cart')}
              </Button>
            </div>

           {/* Läderach Style Accordion Details */}
            <div className="mt-12 border-t border-gray-100 dark:border-gray-800">
              <Accordion title="Ürün Hikayesi & Detay" content={product.detailedDescription} defaultOpen={true} />

              {/* 🎁 Kutu İçeriği - Sadece kutu ürünlerinde */}
              {product.productType === 'box' && (
                <BoxContentAccordion
                  bonbons={boxContentProducts}
                  boxSize={product.boxSize}
                  boxProduct={{ id: product.id, title: product.title }}
                  defaultOpen={true}
                />
              )}

              <Accordion
                title="İçindekiler & Alerjen"
                content={computedIngredients + (computedAllergens ? `\n\nAlerjen: ${computedAllergens}` : '')}
              />
              <Accordion title="Besin Değerleri" content={computedNutritionalValues} />
              <Accordion title="Üretim & Menşei" content={computedOrigin} />
            </div>
          </div>
        </div>

       {/* --- LÄDERACH STYLE: YOU MAY ALSO LIKE --- */}
        {relatedProducts.length > 0 && (
          <section className="mt-48 pt-24 border-t border-gray-50 dark:border-gray-800">
            <div className="flex flex-col items-center text-center mb-20 space-y-4">
               <span className="text-gold text-[10px] font-black uppercase tracking-[0.4em]">Keşfetmeye Devam Et</span>
               <h2 className="font-display text-4xl lg:text-5xl italic dark:text-white tracking-tighter text-brown-900">Diğer Artisan Lezzetlerimiz</h2>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {relatedProducts.slice(0, 4).map(p => (
                <div key={p.id} className="group cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="aspect-square rounded-[40px] overflow-hidden bg-gray-50 dark:bg-dark-800 mb-6 border border-gray-100 dark:border-gray-800 transition-transform duration-700 group-hover:scale-95 shadow-sm">
                    <img src={p.image} alt={p.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-display text-xl italic text-center text-brown-900 dark:text-white group-hover:text-gold transition-colors">{p.title}</h4>
                  <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">₺{p.price.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-24">
              <Link to="/catalog" className="px-12 py-5 border border-brown-900/10 dark:border-gold/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-brown-900 dark:text-gold hover:bg-brown-900 hover:text-white transition-all">
                Tüm Koleksiyonu Gör
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Müşteri Yorumları */}
      <ProductReviews productId={product.id} />

      <Footer />

      {/* Mobil Sticky CTA - Sadece mobilde görünür */}
      {!isOut && (
        <div className="fixed bottom-0 inset-x-0 z-[100] md:hidden bg-white/95 dark:bg-dark-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-4 py-3 safe-area-bottom">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold text-brown-900 dark:text-gold italic">₺{product.price.toFixed(2)}</span>
            </div>
            <Button
              onClick={() => addToCart(product, quantity)}
              size="lg"
              className="flex-1 h-14 text-xs tracking-[0.3em] rounded-2xl shadow-lg"
            >
              {t('add_to_cart')}
            </Button>
          </div>
        </div>
      )}
    </main>
    </>
  );
};