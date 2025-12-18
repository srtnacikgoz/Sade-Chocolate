import React from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/Button';

export const CartDrawer: React.FC = () => {
  const { 
      isCartOpen, setIsCartOpen, items, removeFromCart, updateQuantity, cartTotal,
      isGift, setIsGift, giftNote, setGiftNote
  } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleStartCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-dark-900 z-[101] shadow-2xl transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full relative">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col">
                  <h2 className="font-display text-2xl text-gray-900 dark:text-white font-bold italic">{t('cart')}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{items.length} {t('products_count').replace('{count}', '')}</span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors">
                  <span className="material-icons-outlined text-3xl">close</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mb-6">
                           <span className="material-icons-outlined text-5xl text-gray-200 dark:text-gray-700">shopping_bag</span>
                        </div>
                        <p className="font-display text-xl text-gray-900 dark:text-white mb-6 italic">{t('cart_empty')}</p>
                        <Button onClick={() => { setIsCartOpen(false); navigate('/catalog'); }} size="lg">{t('start_shopping')}</Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-4 animate-fade-in bg-gray-50/50 dark:bg-dark-800/30 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 group">
                                <Link 
                                  to={`/product/${item.id}`} 
                                  onClick={() => setIsCartOpen(false)}
                                  className="w-24 h-24 bg-white dark:bg-dark-900 rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-700 shadow-sm"
                                >
                                    <img src={item.image} alt="" className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transform group-hover:scale-110 transition-transform duration-700" />
                                </Link>
                                <div className="flex flex-col flex-1 justify-between py-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-display text-sm text-gray-900 dark:text-white leading-tight font-bold">{item.title}</h3>
                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                                          <span className="material-icons-outlined text-xl">delete_outline</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center bg-white dark:bg-dark-900 border border-gray-100 dark:border-gray-700 rounded-full p-1 shadow-sm">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors">
                                              <span className="material-icons-outlined text-sm">remove</span>
                                            </button>
                                            <span className="font-sans text-xs font-bold w-6 text-center dark:text-white">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors">
                                              <span className="material-icons-outlined text-sm">add</span>
                                            </button>
                                        </div>
                                        <span className="font-sans text-sm font-bold text-gray-900 dark:text-white">{item.currency}{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
                <div className="bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-gray-800 p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">{t('is_gift_label')}</span>
                            <button 
                              onClick={() => setIsGift(!isGift)} 
                              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isGift ? 'bg-gold' : 'bg-gray-200 dark:bg-dark-800'}`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-transform duration-300 ${isGift ? 'left-[26px]' : 'left-1'}`}></div>
                            </button>
                        </div>
                        {isGift && <textarea value={giftNote} onChange={(e) => setGiftNote(e.target.value.slice(0, 140))} placeholder={t('gift_note_placeholder')} className="w-full p-4 bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm h-20 resize-none dark:text-white outline-none focus:ring-1 focus:ring-gold animate-slide-up" />}
                    </div>
                    
                    <div className="flex justify-between items-end mb-6">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">{t('subtotal')}</span>
                           <span className="text-xs text-gray-500 italic">Antalya Atölyesinden Ücretsiz Kargo</span>
                        </div>
                        <span className="font-display text-4xl font-bold text-gray-900 dark:text-white leading-none italic">₺{cartTotal.toFixed(2)}</span>
                    </div>
                    
                    <Button onClick={handleStartCheckout} className="w-full h-16 text-sm tracking-[0.2em]" size="lg">
                      {t('checkout')}
                    </Button>
                </div>
            )}
        </div>
      </div>
    </>
  );
};