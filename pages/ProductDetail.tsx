import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { ShippingInfo } from '../components/ShippingInfo';
import { NutritionalInfo } from '../components/NutritionalInfo';
import { ProductCard } from '../components/ProductCard';
import { ViewMode } from '../types';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const { t } = useLanguage();
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'shipping'>('desc');

  const product = useMemo(() => products.find(p => p.id === id), [id, products]);
  
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  }, [product, products]);

  useEffect(() => {
    window.scrollTo(0, 0);
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
    <main className="w-full max-w-screen-xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-12 bg-white dark:bg-dark-900 min-h-screen">
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
          
          {/* Left Side: Visuals */}
          <div className="space-y-8">
            <div className="relative aspect-square lg:aspect-[4/5] bg-gray-50 dark:bg-dark-800 rounded-[50px] overflow-hidden shadow-luxurious border border-gray-100 dark:border-gray-800 group">
              {isOut && (
                <div className="absolute inset-0 z-20 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="bg-brown-900 text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.3em] shadow-2xl">
                    Geçici Olarak Tükendi
                  </div>
                </div>
              )}
              {product.video ? (
                <video src={product.video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={product.image} alt={product.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[2s]" />
              )}
              <button 
                onClick={() => toggleFavorite(product.id)}
                className={`absolute top-8 right-8 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md transition-all ${isFav ? 'bg-red-500 text-white scale-110' : 'bg-white/90 dark:bg-dark-900/90 text-gray-400 hover:text-red-500'}`}
              >
                <span className="material-icons-outlined text-2xl">{isFav ? 'favorite' : 'favorite_border'}</span>
              </button>
              
              <div className="absolute bottom-8 left-8 flex flex-col gap-2 z-10">
                 <span className="bg-white/90 dark:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest text-brown-900 dark:text-white">Handmade with Love</span>
              </div>
            </div>
            
            {/* Value Badges */}
            <div className="grid grid-cols-3 gap-6">
               <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-[30px] flex flex-col items-center text-center group hover:bg-white dark:hover:bg-dark-700 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                 <span className="material-icons-outlined text-gold mb-3 text-3xl group-hover:scale-110 transition-transform">back_hand</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest dark:text-gray-300">100% El Yapımı</span>
               </div>
               <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-[30px] flex flex-col items-center text-center group hover:bg-white dark:hover:bg-dark-700 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                 <span className="material-icons-outlined text-gold mb-3 text-3xl group-hover:scale-110 transition-transform">nature_people</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest dark:text-gray-300">Katkısız</span>
               </div>
               <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-[30px] flex flex-col items-center text-center group hover:bg-white dark:hover:bg-dark-700 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                 <span className="material-icons-outlined text-gold mb-3 text-3xl group-hover:scale-110 transition-transform">workspace_premium</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest dark:text-gray-300">Belçika Kalitesi</span>
               </div>
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
              <h1 className="font-display text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-4 italic tracking-tighter">
                {product.title}
              </h1>
              <div className="flex items-center gap-4 text-xs font-sans text-gray-400 uppercase tracking-[0.3em]">
                 <span>{product.category}</span>
                 <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                 <span>{product.origin || 'Sade Artisan Selection'}</span>
              </div>
            </div>

            <div className="flex items-end gap-4 mb-12">
              <span className="font-display text-6xl font-bold text-brown-900 dark:text-gold italic">₺{product.price.toFixed(2)}</span>
              {product.originalPrice && <span className="text-2xl text-gray-300 line-through mb-2">₺{product.originalPrice.toFixed(2)}</span>}
            </div>

            {/* Sensory Profile */}
            {product.sensory && (
              <div className="mb-12 bg-gray-50 dark:bg-dark-800 p-10 rounded-[50px] border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-8 flex items-center gap-3">
                   <span className="material-icons-outlined text-gold">insights</span> {t('sensory_profile')}
                </h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  {(Object.keys(product.sensory) as Array<keyof typeof product.sensory>).map(key => (
                    <div key={key} className="flex flex-col gap-2.5">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-gray-500">{t(`sensory_${key}` as any)}</span>
                        <span className="text-brown-900 dark:text-gold">{product.sensory?.[key]}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gold transition-all duration-1000 ease-out" style={{ width: `${product.sensory?.[key]}%` }}></div>
                      </div>
                    </div>
                  ))}
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

            {/* Info Tabs */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-10">
               <div className="flex gap-10 mb-10 overflow-x-auto hide-scrollbar border-b border-gray-50 dark:border-gray-800">
                  <button onClick={() => setActiveTab('desc')} className={`text-[11px] font-bold uppercase tracking-[0.3em] pb-4 border-b-2 transition-all shrink-0 ${activeTab === 'desc' ? 'border-brown-900 dark:border-gold text-brown-900 dark:text-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Hikaye & Tadım</button>
                  <button onClick={() => setActiveTab('ingredients')} className={`text-[11px] font-bold uppercase tracking-[0.3em] pb-4 border-b-2 transition-all shrink-0 ${activeTab === 'ingredients' ? 'border-brown-900 dark:border-gold text-brown-900 dark:text-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>İçerik & Alerjen</button>
                  <button onClick={() => setActiveTab('shipping')} className={`text-[11px] font-bold uppercase tracking-[0.3em] pb-4 border-b-2 transition-all shrink-0 ${activeTab === 'shipping' ? 'border-brown-900 dark:border-gold text-brown-900 dark:text-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Güvenli Gönderim</button>
               </div>
               
               <div className="animate-fade-in min-h-[200px]">
                  {activeTab === 'desc' && (
                    <div className="space-y-6">
                      <p className="text-lg leading-relaxed text-gray-500 dark:text-gray-400 italic">"{product.description}"</p>
                      <p className="text-base text-gray-700 dark:text-gray-200 leading-loose font-sans opacity-90">{product.detailedDescription}</p>
                      {product.tastingNotes && (
                        <div className="mt-8 flex items-center gap-4 p-6 bg-gold/5 dark:bg-gold/10 rounded-3xl border border-gold/10">
                          <span className="material-icons-outlined text-gold text-3xl">local_offer</span>
                          <div>
                             <p className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] mb-1">Tadım Notları</p>
                             <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{product.tastingNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 'ingredients' && (
                    <NutritionalInfo ingredients={product.ingredients} allergens={product.allergens} />
                  )}
                  {activeTab === 'shipping' && (
                    <ShippingInfo />
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-40">
            <div className="flex items-center justify-between mb-12">
               <h2 className="font-display text-4xl font-bold italic dark:text-white tracking-tighter">İlginizi Çekebilir</h2>
               <Link to="/catalog" className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold border-b-2 border-gold/30 pb-1 hover:border-gold transition-all">Koleksiyonu Gör</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} viewMode={ViewMode.GRID} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};