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
        <h2 className="text-2xl font-display mb-4">Ürün Bulunamadı</h2>
        <Button onClick={() => navigate('/catalog')}>Kataloga Dön</Button>
      </main>
    );
  }

  const isFav = isFavorite(product.id);
  const isOut = product.isOutOfStock;

  return (
    <main className="pt-20 lg:pt-28 pb-32 bg-white dark:bg-dark-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <Link to="/home" className="hover:text-brown-900 dark:hover:text-white">Sade</Link>
          <span className="material-icons-outlined text-xs">chevron_right</span>
          <Link to="/catalog" className="hover:text-brown-900 dark:hover:text-white">Koleksiyonlar</Link>
          <span className="material-icons-outlined text-xs">chevron_right</span>
          <span className="text-gray-900 dark:text-gold">{product.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Left Side: Visuals */}
          <div className="space-y-6">
            <div className="relative aspect-square lg:aspect-[4/5] bg-gray-50 dark:bg-dark-800 rounded-3xl overflow-hidden shadow-luxurious border border-gray-100 dark:border-gray-800">
              {isOut && (
                <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="bg-brown-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-2xl">
                    Geçici Olarak Tükendi
                  </div>
                </div>
              )}
              {product.video ? (
                <video src={product.video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              )}
              <button 
                onClick={() => toggleFavorite(product.id)}
                className={`absolute top-6 right-6 z-30 w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all ${isFav ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-dark-900/80 text-gray-400 hover:text-red-500'}`}
              >
                <span className="material-icons-outlined text-2xl">{isFav ? 'favorite' : 'favorite_border'}</span>
              </button>
            </div>
            
            {/* Value Badges */}
            <div className="grid grid-cols-3 gap-4">
               <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-2xl flex flex-col items-center text-center">
                 <span className="material-icons-outlined text-gold mb-2">back_hand</span>
                 <span className="text-[9px] font-bold uppercase tracking-widest dark:text-gray-300">Handmade</span>
               </div>
               <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-2xl flex flex-col items-center text-center">
                 <span className="material-icons-outlined text-gold mb-2">eco</span>
                 <span className="text-[9px] font-bold uppercase tracking-widest dark:text-gray-300">100% Natural</span>
               </div>
               <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-2xl flex flex-col items-center text-center">
                 <span className="material-icons-outlined text-gold mb-2">workspace_premium</span>
                 <span className="text-[9px] font-bold uppercase tracking-widest dark:text-gray-300">Premium Origin</span>
               </div>
            </div>
          </div>

          {/* Right Side: Information */}
          <div className="flex flex-col">
            <div className="mb-8">
              {product.badge && (
                <span className="inline-block px-3 py-1 bg-brown-900 dark:bg-gold text-white dark:text-black text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                  {product.badge}
                </span>
              )}
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-2 italic">
                {product.title}
              </h1>
              <p className="text-sm font-sans text-gray-400 uppercase tracking-widest">{product.category} • {product.origin || 'Artisan Selection'}</p>
            </div>

            <div className="flex items-end gap-3 mb-10">
              <span className="font-display text-4xl font-bold text-brown-900 dark:text-gold">₺{product.price.toFixed(2)}</span>
              {product.originalPrice && <span className="text-xl text-gray-300 line-through mb-1">₺{product.originalPrice.toFixed(2)}</span>}
            </div>

            {/* Sensory Profile */}
            {product.sensory && (
              <div className="mb-10 bg-gray-50 dark:bg-dark-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-2">
                   <span className="material-icons-outlined text-gold text-lg">insights</span> Duyusal Karakteristik
                </h3>
                <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                  {(Object.keys(product.sensory) as Array<keyof typeof product.sensory>).map(key => (
                    <div key={key} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-gray-500">{t(`sensory_${key}` as any)}</span>
                        <span className="text-brown-900 dark:text-gold">{product.sensory?.[key]}%</span>
                      </div>
                      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gold transition-all duration-1000 ease-out" style={{ width: `${product.sensory?.[key]}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mb-12">
              {!isOut && (
                <div className="flex items-center h-16 bg-gray-100 dark:bg-dark-800 rounded-2xl px-6 border border-gray-200 dark:border-gray-700">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-400 hover:text-brown-900 transition-colors">
                    <span className="material-icons-outlined">remove</span>
                  </button>
                  <span className="w-12 text-center font-bold font-display text-lg dark:text-white">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="text-gray-400 hover:text-brown-900 transition-colors">
                    <span className="material-icons-outlined">add</span>
                  </button>
                </div>
              )}
              <Button 
                onClick={() => addToCart(product, quantity)}
                disabled={isOut}
                size="lg" 
                className="flex-1 h-16 text-sm tracking-[0.2em]"
              >
                {isOut ? 'Geçici Olarak Tükendi' : t('add_to_cart')}
              </Button>
            </div>

            {/* Info Tabs */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
               <div className="flex gap-8 mb-8 overflow-x-auto hide-scrollbar">
                  <button onClick={() => setActiveTab('desc')} className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all shrink-0 ${activeTab === 'desc' ? 'border-brown-900 dark:border-gold text-brown-900 dark:text-gold' : 'border-transparent text-gray-400'}`}>Ürün Hikayesi</button>
                  <button onClick={() => setActiveTab('ingredients')} className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all shrink-0 ${activeTab === 'ingredients' ? 'border-brown-900 dark:border-gold text-brown-900 dark:text-gold' : 'border-transparent text-gray-400'}`}>İçerik & Besin</button>
                  <button onClick={() => setActiveTab('shipping')} className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all shrink-0 ${activeTab === 'shipping' ? 'border-brown-900 dark:border-gold text-brown-900 dark:text-gold' : 'border-transparent text-gray-400'}`}>Gönderim Detayı</button>
               </div>
               
               <div className="animate-fade-in min-h-[150px]">
                  {activeTab === 'desc' && (
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400 italic mb-4">{product.description}</p>
                      <p className="text-base text-gray-700 dark:text-gray-200 leading-relaxed font-sans">{product.detailedDescription}</p>
                      {product.tastingNotes && (
                        <div className="mt-6 flex items-start gap-3 p-4 bg-gray-50 dark:bg-dark-800 rounded-2xl">
                          <span className="material-icons-outlined text-gold">local_offer</span>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">Tadım Notları: {product.tastingNotes}</p>
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
          <section className="mt-32">
            <div className="flex items-center justify-between mb-10">
               <h2 className="font-display text-3xl font-bold italic dark:text-white">Benzer Lezzetler</h2>
               <Link to="/catalog" className="text-[10px] font-bold uppercase tracking-widest text-gold border-b border-gold pb-1">Tümünü Gör</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
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