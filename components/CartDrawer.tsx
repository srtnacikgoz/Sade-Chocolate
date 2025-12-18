import React from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
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
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[80] transition-opacity duration-300 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />
      <div className={`fixed top-0 right-0 bottom-0 w-[90%] max-w-[400px] bg-white dark:bg-dark-900 z-[90] shadow-2xl transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-display text-xl text-gray-900 dark:text-white font-semibold">{t('cart')} ({items.length})</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-brown-900 dark:text-gray-500 dark:hover:text-white transition-colors">
                  <span className="material-icons-outlined text-2xl">close</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <span className="material-icons-outlined text-6xl text-gray-200 dark:text-gray-700 mb-4">shopping_bag</span>
                        <p className="font-display text-lg text-gray-900 dark:text-white mb-2">{t('cart_empty')}</p>
                        <Button onClick={() => { setIsCartOpen(false); navigate('/catalog'); }} size="md">{t('start_shopping')}</Button>
                    </div>
                ) : (
                    <div className="space-y-6 pb-6">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-4 animate-fade-in">
                                <div className="w-20 h-24 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
                                    <img src={item.image} alt="" className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                                </div>
                                <div className="flex flex-col flex-1 justify-between py-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-display text-base text-gray-900 dark:text-white leading-tight pr-4 font-semibold">{item.title}</h3>
                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><span className="material-icons-outlined text-lg">delete_outline</span></button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center border border-gray-100 dark:border-gray-800 rounded-full px-2 py-0.5">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-gray-400 hover:text-brown-900"><span className="material-icons-outlined text-xs block">remove</span></button>
                                            <span className="font-sans text-xs font-bold w-6 text-center dark:text-white">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-gray-400 hover:text-brown-900"><span className="material-icons-outlined text-xs block">add</span></button>
                                        </div>
                                        <span className="font-sans text-sm font-bold text-gray-900 dark:text-white">{item.currency}{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {items.length > 0 && (
                <div className="bg-gray-50 dark:bg-dark-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
                    <div className="px-5 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-display text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons-outlined text-gold">volunteer_activism</span> {t('is_gift_label')}
                            </span>
                            <button onClick={() => setIsGift(!isGift)} className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${isGift ? 'bg-gold' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${isGift ? 'left-[24px]' : 'left-1'}`}></div></button>
                        </div>
                        {isGift && <textarea value={giftNote} onChange={(e) => setGiftNote(e.target.value.slice(0, 140))} placeholder={t('gift_note_placeholder')} className="w-full p-3 mb-4 bg-white dark:bg-dark-900 border border-gray-100 dark:border-gray-700 rounded-lg text-sm h-16 resize-none dark:text-white outline-none" />}
                    </div>
                    <div className="p-5 pt-2">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t('subtotal')}</span>
                            <span className="font-display text-2xl font-bold text-gray-900 dark:text-white">₺{cartTotal.toFixed(2)}</span>
                        </div>
                        <Button onClick={handleStartCheckout} className="w-full" size="lg">{t('checkout')}</Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </>
  );
};