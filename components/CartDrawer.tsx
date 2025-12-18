import React from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, cartTotal, isGift, setIsGift, giftMessage, setGiftMessage } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleStartCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className={`fixed inset-0 z-[150] overflow-hidden transition-all duration-500 ${isCartOpen ? 'visible' : 'invisible pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={() => setIsCartOpen(false)} 
      />
      
      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className={`w-screen max-w-md bg-white dark:bg-dark-900 shadow-2xl flex flex-col transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between py-8 px-6 sm:px-8 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col">
              <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white italic tracking-tighter leading-none">{t('cart')}</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">
                {items.length} {t('products_count').replace('{count}', '')}
              </span>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)} 
              className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-dark-800 text-gray-400 hover:text-brown-900 dark:hover:text-white rounded-full transition-all group"
            >
              <span className="material-icons-outlined text-2xl group-hover:rotate-90 transition-transform">close</span>
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 hide-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                     <span className="material-icons-outlined text-5xl text-gray-200 dark:text-gray-700">shopping_bag</span>
                  </div>
                  <p className="font-display text-xl text-gray-900 dark:text-white mb-8 italic">{t('cart_empty')}</p>
                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/catalog'); }}
                    className="px-8 py-4 bg-brown-900 text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-xl hover:bg-gold transition-all active:scale-95"
                  >
                    {t('start_shopping')}
                  </button>
              </div>
            ) : (
              <ul className="space-y-8">
                {items.map((product) => (
                  <li key={product.id} className="flex group animate-fade-in border-b border-gray-50 dark:border-gray-800 pb-8 last:border-0">
                    <Link 
                      to={`/product/${product.id}`}
                      onClick={() => setIsCartOpen(false)}
                      className="flex-shrink-0 w-24 h-24 bg-gray-50 dark:bg-dark-800 rounded-3xl overflow-hidden shadow-sm group-hover:shadow-md transition-all border border-gray-100 dark:border-gray-800"
                    >
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" />
                    </Link>
                    <div className="ml-5 flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <Link 
                            to={`/product/${product.id}`}
                            onClick={() => setIsCartOpen(false)}
                            className="font-display text-lg font-bold text-gray-900 dark:text-white italic leading-tight hover:text-gold transition-colors"
                          >
                            {product.title}
                          </Link>
                          <span className="font-bold text-sm dark:text-gold whitespace-nowrap">{product.currency}{product.price.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest font-sans">{product.category}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-1 shadow-inner">
                          <button 
                            onClick={() => updateQuantity(product.id, product.quantity - 1)} 
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors"
                          >
                            <span className="material-icons-outlined text-sm">remove</span>
                          </button>
                          <span className="px-3 font-bold text-xs dark:text-white min-w-[24px] text-center font-sans">{product.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(product.id, product.quantity + 1)} 
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors"
                          >
                            <span className="material-icons-outlined text-sm">add</span>
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(product.id)} 
                          className="text-gray-300 hover:text-red-500 transition-colors group/del"
                          title="Kaldır"
                        >
                          <span className="material-icons-outlined text-xl group-hover/del:rotate-12 transition-transform">delete_outline</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {items.length > 0 && (
                <div className="mt-6 p-4 bg-gold/5 dark:bg-gold/10 rounded-xl border border-gold/10 dark:border-gold/20">
                    <label className="flex items-center cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={isGift} 
                            onChange={(e) => setIsGift(e.target.checked)}
                            className="w-5 h-5 accent-brown-900 dark:accent-gold rounded border-gray-300 dark:border-gray-600 focus:ring-0"
                        />
                        <span className="ml-3 font-display text-sm font-medium text-brown-900 dark:text-gold uppercase tracking-wider">
                            {t('gift_checkbox_label')}
                        </span>
                    </label>
                    
                    {isGift && (
                        <div className="mt-4 animate-fade-in">
                            <textarea 
                                placeholder={t('gift_textarea_placeholder')}
                                value={giftMessage}
                                onChange={(e) => setGiftMessage(e.target.value)}
                                className="w-full p-3 text-xs bg-white dark:bg-dark-900 border border-gold/20 dark:border-gold/30 rounded-lg focus:ring-1 focus:ring-gold outline-none h-20 resize-none dark:text-white placeholder:text-gray-400"
                            />
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 py-8 px-8 bg-gray-50/50 dark:bg-dark-800/50 shadow-[0_-15px_50px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-1">{t('subtotal')}</p>
                  <p className="text-xs text-gray-500 italic">Antalya Atölyesinden Ücretsiz Kargo</p>
                </div>
                <p className="font-display text-5xl font-bold text-brown-900 dark:text-gold italic tracking-tighter leading-none">₺{cartTotal.toFixed(2)}</p>
              </div>
              <p className="mb-8 text-[10px] text-gray-400 italic text-center leading-relaxed font-sans">
                 * Siparişiniz özel ısı yalıtımlı paketler ve buz aküleri ile kargoya verilir.
              </p>
              <button 
                onClick={handleStartCheckout}
                className="w-full flex justify-center items-center h-20 rounded-[30px] shadow-luxurious text-xs font-bold text-white bg-brown-900 hover:bg-gold transition-all duration-500 uppercase tracking-[0.4em] transform active:scale-95 group"
              >
                {t('checkout')}
                <span className="material-icons-outlined ml-2 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};