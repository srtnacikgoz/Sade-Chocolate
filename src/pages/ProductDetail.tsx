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
import { ViewMode, GiftNoteTemplate } from '../types';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer
} from 'recharts';
import { ChevronLeft, ChevronRight, Milk, Bean, Square, Nut, Cherry, Coffee, Sparkles, Cookie, Flame, IceCream, Wand2, Heart, Gift as GiftIcon, Star } from 'lucide-react';
import { Emotion } from '../constants/giftNoteTemplates';
import { generateGiftNotes, generateGiftNotesFromFirebase } from '../utils/giftNoteGenerator';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    special: <Sparkles size={16} />
  };
  return icons[iconId] || <Sparkles size={16} />;
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
  const { addToCart, toggleFavorite, isFavorite, setIsGift, setGiftMessage, isGift, giftMessage } = useCart();
  const [showGiftForm, setShowGiftForm] = useState(false);
  const { t } = useLanguage();
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [generatedNotes, setGeneratedNotes] = useState<Record<string, string> | null>(null);
  const [giftTemplates, setGiftTemplates] = useState<GiftNoteTemplate[]>([]);

  // Firebase'den hediye notu şablonlarını çek
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const q = query(collection(db, 'gift_note_templates'), where('active', '==', true));
        const snapshot = await getDocs(q);
        const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GiftNoteTemplate[];
        setGiftTemplates(templates);
      } catch (error) {
        console.error('Hediye şablonları yüklenemedi:', error);
      }
    };
    fetchTemplates();
  }, []);
  
  
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
              {product.badge && (
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
                {/* 🪄 Duygu Küratörü: Hediye Notu Asistanı */}
<div className="mt-12 space-y-6">
  <div 
    onClick={() => {
      const newStatus = !showGiftForm;
      setShowGiftForm(newStatus);
      setIsGift(newStatus);
      // Hediye modu kapandığında state'leri sıfırla
      if (!newStatus) {
        setSelectedEmotion(null);
        setGeneratedNotes(null);
      }
    }}
    className={`p-8 border rounded-[40px] flex items-center justify-between group cursor-pointer transition-all duration-500 ${showGiftForm ? 'border-gold bg-white shadow-luxurious' : 'border-gold/20 bg-cream-50 hover:bg-gold/5'}`}
  >
    <div className="flex items-center gap-6">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showGiftForm ? 'bg-gold text-white' : 'bg-white text-gold shadow-sm'}`}>
        <GiftIcon size={20} />
      </div>
      <div>
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-mocha-900">Bu bir hediye mi?</h4>
        <p className="text-[10px] text-gray-400 font-medium italic mt-1">
          {showGiftForm ? 'Hediye seçeneği aktif.' : 'Zarif bir not ve mühürlü kağıt eklemek için dokunun.'}
        </p>
      </div>
    </div>
    <ChevronRight className={`transition-transform duration-500 ${showGiftForm ? 'rotate-90 text-gold' : 'text-gold/30'}`} size={20} />
  </div>

{showGiftForm && (
  <div className="space-y-12 animate-in fade-in slide-in-from-top-6 duration-1000 p-4">
    
    {/* Adım 1: Duygu Seçimi */}
    {!generatedNotes && (
      <div className="text-center animate-in fade-in duration-500">
        <h5 className="flex items-center justify-center gap-3 text-sm font-bold text-gray-500 mb-6 tracking-widest uppercase"><Wand2 size={16} className="text-gold" /> AI Sommelier Soruyor</h5>
        <p className="font-display text-2xl italic mb-8">Kime ve hangi duyguyla gönderiyorsunuz?</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {(giftTemplates.length > 0 ? giftTemplates : [
            { emotion: 'love' as Emotion, emotionLabel: { tr: 'Aşk & Tutku', en: 'Love' } },
            { emotion: 'gratitude' as Emotion, emotionLabel: { tr: 'Teşekkür & Minnet', en: 'Gratitude' } },
            { emotion: 'celebration' as Emotion, emotionLabel: { tr: 'Kutlama & Başarı', en: 'Celebration' } },
          ]).map((template) => {
            const emotionIcons = {
              love: <Heart size={18}/>,
              gratitude: <GiftIcon size={18}/>,
              celebration: <Star size={18}/>,
            };

            return (
              <button
                key={template.emotion}
                onClick={() => {
                  setSelectedEmotion(template.emotion);
                  // Firebase şablonu varsa onu kullan, yoksa fallback
                  const firebaseTemplate = giftTemplates.find(t => t.emotion === template.emotion);
                  if (firebaseTemplate) {
                    setGeneratedNotes(generateGiftNotesFromFirebase(product, firebaseTemplate));
                  } else {
                    setGeneratedNotes(generateGiftNotes(product, template.emotion));
                  }
                }}
                className="flex-1 p-6 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-gold/30 dark:hover:border-gold/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-4"
              >
                <span className="text-gold">{emotionIcons[template.emotion]}</span>
                <span className="font-bold text-sm text-mocha-900 dark:text-gray-200">{template.emotionLabel.tr}</span>
              </button>
            );
          })}
        </div>
      </div>
    )}

    {/* Adım 2: Öneri ve Düzenleme */}
    {selectedEmotion && generatedNotes && (
       <div className="animate-in fade-in duration-700 space-y-12">
        <div>
          <h5 className="flex items-center justify-center gap-3 text-sm font-bold text-gray-500 mb-6 tracking-widest uppercase"><Wand2 size={16} className="text-gold" /> AI Sommelier Öneriyor</h5>
          <p className="font-display text-center text-xl italic mb-8">Sizin için 3 farklı üslupta not taslağı hazırladım:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(generatedNotes).map(([persona, note]) => (
              <div 
                key={persona} 
                onClick={() => setGiftMessage(note)}
                className="p-8 rounded-3xl border bg-white dark:bg-dark-800 dark:border-gray-800 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <h6 className="font-bold text-xs uppercase tracking-widest text-gold mb-4">{persona}</h6>
                <p className="text-sm italic text-gray-600 dark:text-gray-300">"{note}"</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Hediye Notunuz (Düzenleyebilirsiniz)</label>
          <textarea 
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            placeholder="Duygularınızı buraya fısıldayın..."
            className="w-full bg-white dark:bg-dark-800 border border-gold/10 rounded-[25px] p-6 text-sm italic focus:ring-4 focus:ring-gold/10 outline-none text-mocha-900 dark:text-gray-200 transition-all shadow-inner"
            rows={4}
          />
        </div>
       </div>
    )}

    {/* 📜 Dijital Kanvas - Her zaman göster */}
    <div className="max-w-sm mx-auto pt-8 border-t border-gray-100 dark:border-gray-800">
      <h6 className="text-center text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Not Kartı Önizlemesi</h6>
      <div className="relative aspect-[4/3] bg-[#FFFEFA] dark:bg-dark-800/50 border border-gold/15 shadow-xl rounded-sm -rotate-1 overflow-hidden transform hover:rotate-0 transition-transform duration-700 flex flex-col items-center justify-center p-8 cursor-default">
        {/* Kart Dokusu Efekti */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] opacity-10 dark:opacity-5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gold/20" />
        
        <div className="relative z-10 w-full text-center py-4">
          <p className="text-lg text-mocha-900 dark:text-gray-200 leading-relaxed italic font-serif break-words">
            {giftMessage || "Zarif bir dokunuş, unutulmaz bir an..."}
          </p>
        </div>

        <div className="mt-auto pt-4 w-full flex flex-col items-center opacity-60">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gold">Sade Chocolate</p>
        </div>
      </div>
      
      <p className="mt-6 text-[9px] text-center text-gray-400 font-medium italic">
        "Hediye gönderimlerinde fiyat bilgisi faturada/irsaliyede gizlenir."
      </p>
    </div>
  </div>
)}
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