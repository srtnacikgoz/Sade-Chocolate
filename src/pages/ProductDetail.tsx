import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { ShippingInfo } from '../components/ShippingInfo';
import { NutritionalInfo } from '../components/NutritionalInfo';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { ViewMode } from '../types';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer
} from 'recharts';
import { ChevronLeft, ChevronRight, Milk, Bean, Square, Nut, Cherry, Coffee, Cookie, Flame, IceCream } from 'lucide-react';
import { BrandIcon } from '../components/ui/BrandIcon';

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
export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'shipping'>('desc');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const product = useMemo(() => products.find(p => p.id === id), [id, products]);

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

  return (
    <main className="w-full max-w-screen-xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-12 bg-cream-100 dark:bg-dark-900 min-h-screen">
      <div className="animate-fade-in">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-3 mb-12 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          <Link to="/home" className="hover:text-brown-900 dark:hover:text-white transition-colors">Sade</Link>
          <span className="material-icons-outlined text-[10px]">chevron_right</span>
          <Link to="/catalog" className="hover:text-brown-900 dark:hover:text-white transition-colors">Koleksiyonlar</Link>
          <span className="material-icons-outlined text-[10px]">chevron_right</span>
          <span className="text-gold">{product.title}</span>
        </nav>

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
              ) : (
                <img
                  src={allImages[selectedImageIndex] || product.image}
                  alt={product.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
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
              <Accordion title="İçindekiler & Alerjen" content={product.ingredients + (product.allergens ? `\n\nAlerjen: ${product.allergens}` : '')} />
              <Accordion title="Besin Değerleri" content={product.nutritionalValues} />
              <Accordion title="Üretim & Menşei" content={product.origin} />
            </div>
          </div>
        </div>

        {/* --- MARCOLINI STYLE BOX CONTENT SLIDER --- */}
{product.boxItems && product.boxItems.length > 0 && (
  <section className="mt-32 pt-24 border-t border-gray-50 dark:border-gray-800 relative group/slider">
    <div className="text-center mb-16">
      <span className="text-gold text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">Koleksiyon İçeriği</span>
      <h2 className="font-display text-4xl italic dark:text-white">Kutudaki Sanat</h2>
    </div>

    <div className="relative px-4 lg:px-12">
      {/* Sol Ok */}
      <button 
        onClick={() => {
  const scrollAmount = window.innerWidth >= 1024 ? 1000 : 300;
  document.getElementById('box-slider')?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
}}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-300 hover:text-gold transition-colors opacity-0 group-hover/slider:opacity-100 hidden md:block"
      >
        <ChevronLeft size={48} strokeWidth={1} />
      </button>

      {/* Slider Alanı: Tek sırada 6 ürün sığacak şekilde optimize edildi */}
      <div 
        id="box-slider"
        className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-6 pb-8 touch-pan-x scroll-smooth"
      >
        {product.boxItems.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-[180px] lg:w-[220px] snap-start flex flex-col items-center text-center group"
          >
            {/* Görsel: Dandelion & Sade Stil */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 mb-6 rounded-full shadow-luxurious border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-dark-800 transition-transform duration-700 group-hover:scale-110">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain p-2"
              />
            </div>

            {/* Yüzde ve Menşei (Dandelion Tarzı) */}
            {(item.percentage || item.origin) && (
              <div className="flex items-center justify-center gap-2 mb-3">
                {item.percentage && (
                  <span className="text-gold font-bold text-sm">{item.percentage}%</span>
                )}
                {item.percentage && item.origin && (
                  <span className="text-gray-300">•</span>
                )}
                {item.origin && (
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.origin}</span>
                )}
              </div>
            )}

            {/* İsim */}
            <h4 className="text-[11px] font-black uppercase tracking-widest text-brown-900 dark:text-gold mb-2">
              {item.name}
            </h4>

            {/* Açıklama */}
            <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 italic line-clamp-2 px-2 mb-3">
              {item.description}
            </p>

            {/* Tasting Notes (Dandelion Tarzı) */}
            {item.tastingNotes && item.tastingNotes.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 px-2">
                {item.tastingNotes.map((note, idx) => (
                  <span
                    key={idx}
                    className="text-[8px] font-bold uppercase tracking-wider text-gold/80 bg-gold/10 px-2 py-1 rounded-full"
                  >
                    {note}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sağ Ok */}
      <button 
        onClick={() => {
  const scrollAmount = window.innerWidth >= 1024 ? 1000 : 300;
  document.getElementById('box-slider')?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-300 hover:text-gold transition-colors opacity-0 group-hover/slider:opacity-100 hidden md:block"
      >
        <ChevronRight size={48} strokeWidth={1} />
      </button>
    </div>
  </section>
)}

{/* --- 🎁 YENİ SİSTEM: KUTU İÇERİĞİ (boxContentIds) --- */}
{product.productType === 'box' && boxContentProducts.length > 0 && (
  <section className="mt-32 pt-24 border-t border-gray-50 dark:border-gray-800">
    <div className="text-center mb-16">
      <span className="text-gold text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">Kutu İçeriği</span>
      <h2 className="font-display text-4xl italic dark:text-white">Seçilen Bonbonlar</h2>
      <p className="text-xs text-gray-400 mt-2">{product.boxSize || boxContentProducts.length} Adet Bonbon</p>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {boxContentProducts.map((bonbon: any, idx) => (
        <Link
          key={idx}
          to={`/urun/${bonbon.id}`}
          className="group border-2 border-gray-100 dark:border-gray-800 rounded-3xl p-4 hover:border-gold dark:hover:border-gold transition-all hover:shadow-lg"
        >
          <div className="aspect-square rounded-2xl overflow-hidden mb-4">
            <img
              src={bonbon.image}
              alt={bonbon.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <h4 className="text-xs font-black uppercase tracking-widest text-brown-900 dark:text-gold text-center mb-2">
            {bonbon.title}
          </h4>
          {bonbon.description && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400 italic text-center line-clamp-2">
              {bonbon.description}
            </p>
          )}
          {bonbon.price && (
            <p className="text-xs font-bold text-center mt-3 text-gray-900 dark:text-white">
              ₺{bonbon.price}
            </p>
          )}
        </Link>
      ))}
    </div>
  </section>
)}

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
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
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

      <Footer />
    </main>
  );
};