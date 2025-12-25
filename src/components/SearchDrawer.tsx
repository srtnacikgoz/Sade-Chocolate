import React, { useState, useMemo } from 'react';
import { X, Search as SearchIcon, ArrowRight } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const SearchDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { products } = useProducts();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // 🍫 Arama Mantığı
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const term = query.toLowerCase();
    return products.filter(p => 
      p.title.toLowerCase().includes(term) || 
      p.attributes?.some(a => a.toLowerCase().includes(term))
    ).slice(0, 5); 
  }, [query, products]);

  // ✨ Arama sonucu bulunamazsa gösterilecek 3 rastgele öneri
  const recommendations = useMemo(() => {
    return [...products]
      .filter(p => !p.isOutOfStock)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
  }, [isOpen, query === '']); // Çekmece açıldığında veya arama temizlendiğinde yenilenir

  if (!isOpen) return null;

  const handleViewAll = () => {
    onClose();
    navigate(`/catalog?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-white dark:bg-dark-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="p-8 flex items-center justify-between">
          <span className="font-sans text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Sade Arama
          </span>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-full transition-all"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* İçerik Alanı */}
        <div className="flex-1 px-12 pb-12 space-y-12 overflow-y-auto">
          
          {/* 🔍 Arama Girişi */}
          <div className="relative border-b border-gray-100 dark:border-gray-800 pb-2">
            <input 
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ne aramıştınız?..."
              className="w-full bg-transparent text-4xl font-serif italic text-mocha-900 dark:text-white outline-none placeholder:text-gray-100"
            />
          </div>

          {!query ? (
            /* --- Varsayılan Görünüm (Arama Yokken) --- */
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('popular_searches')}</h3>
                <div className="flex flex-wrap gap-3">
                  {['MAĞAZA', 'ARTISAN', 'KOLEKSİYONLAR', 'HEDİYELİK'].map(tag => {
                    const handleTagClick = () => {
                      onClose();
                      switch (tag) {
                        case 'MAĞAZA':
                        case 'KOLEKSİYONLAR':
                          navigate('/catalog');
                          break;
                        case 'HEDİYELİK':
                          navigate('/catalog?category=Hediye Kutusu');
                          break;
                        case 'ARTISAN':
                          navigate('/catalog?search=Artisan');
                          break;
                        default:
                          navigate(`/catalog?search=${encodeURIComponent(tag)}`);
                          break;
                      }
                    };

                    return (
                      <button 
                        key={tag} 
                        onClick={handleTagClick} 
                        className="px-6 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-[10px] font-bold uppercase tracking-widest hover:border-mocha-900 dark:hover:border-gold transition-all dark:text-white"
                      >
                        {t(`search_tag_${tag.toLocaleLowerCase('tr')}`) || tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Öne Çıkanlar</h3>
                <div className="grid grid-cols-1 gap-4">
                  {['Bitter Koleksiyonu', 'Vegan Tabletler', 'Fındık Pralin'].map(item => (
                    <button 
                      key={item} 
                      onClick={() => setQuery(item)} 
                      className="text-left text-xl font-serif italic text-gray-700 dark:text-gray-300 hover:text-gold transition-colors flex items-center justify-between group"
                    >
                      {item}
                      <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* --- Arama Yapıldığında --- */
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {results.length > 0 ? (
                /* ✅ Sonuç Varsa */
                <>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Öneriler</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.slice(0, 3).map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => setQuery(p.title)}
                          className="px-5 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-[9px] font-black uppercase tracking-widest hover:border-mocha-900 transition-all dark:text-white"
                        >
                          {p.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Arama Sonuçları</h3>
                    <div className="space-y-4">
                      {results.map(product => (
                        <Link 
                          key={product.id} 
                          to={`/product/${product.id}`} 
                          onClick={onClose} 
                          className="flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-dark-800 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
                        >
                          <img src={product.image} className="w-16 h-16 object-cover rounded-xl shadow-sm" alt={product.title} />
                          <div className="flex-1">
                            <h4 className="font-display text-lg italic text-mocha-900 dark:text-white group-hover:text-gold transition-colors">
                              {product.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                              ₺{product.price.toFixed(2)}
                            </p>
                          </div>
                          <ArrowRight size={18} className="text-gray-200 group-hover:text-gold transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* 🚫 Sonuç Yoksa - Şefin Önerileri */
                <div className="space-y-12 animate-in fade-in duration-500">
                  <div className="py-10 text-center border-b border-gray-100 dark:border-gray-800 pb-12">
                    <p className="text-lg italic text-gray-400">
                      "{query}" için bir lezzet bulunamadı...
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="material-icons-outlined text-gold">auto_awesome</span>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">Sizin İçin Seçtiğimiz Diğer Lezzetler</h3>
                    </div>
                    <div className="space-y-4">
                      {recommendations.map(product => (
                        <Link 
                          key={`rec-${product.id}`} 
                          to={`/product/${product.id}`} 
                          onClick={onClose} 
                          className="flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-dark-800 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
                        >
                          <img src={product.image} className="w-16 h-16 object-cover rounded-xl shadow-sm" alt={product.title} />
                          <div className="flex-1">
                            <h4 className="font-display text-lg italic text-mocha-900 dark:text-white group-hover:text-gold transition-colors">
                              {product.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                              ₺{product.price.toFixed(2)}
                            </p>
                          </div>
                          <ArrowRight size={18} className="text-gray-200 group-hover:text-gold transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🔗 Sabit Alt Buton (Sadece sonuç varsa gösterilir) */}
        {query.trim() && results.length > 0 && (
          <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-900 z-10">
            <button 
              onClick={handleViewAll}
              className="w-full bg-mocha-900 dark:bg-white text-white dark:text-black py-5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-gold dark:hover:bg-gold hover:text-white transition-all shadow-xl"
            >
              TÜM SONUÇLARI GÖR ({results.length})
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};