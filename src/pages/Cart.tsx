import React from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useProducts } from '../context/ProductContext';
import { Footer } from '../components/Footer';
import { ShoppingBag, ArrowRight, Trash2, Gift, Info } from 'lucide-react';

export const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, cartTotal, isGift, setIsGift, giftMessage, setGiftMessage, hasGiftBag, setHasGiftBag } = useCart();
  const { settings } = useProducts();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const freeShippingLimit = settings?.freeShippingLimit || 1500;
  const remaining = freeShippingLimit - cartTotal;
  const progress = Math.min((cartTotal / freeShippingLimit) * 100, 100);

  if (items.length === 0) {
    return (
      <main className="pt-40 pb-20 text-center px-4 animate-fade-in bg-white dark:bg-dark-900 min-h-screen">
        <ShoppingBag className="mx-auto text-gray-200 mb-8" size={80} strokeWidth={1} />
        <h1 className="font-display text-4xl italic mb-6 dark:text-white">{t('cart_empty')}</h1>
        <Button onClick={() => navigate('/catalog')}>{t('start_shopping')}</Button>
        <Footer />
      </main>
    );
  }

  return (
    <main className="w-full max-w-screen-xl mx-auto pt-32 pb-24 px-4 sm:px-8 lg:px-12 animate-fade-in bg-cream-100 dark:bg-dark-900 min-h-screen">
      <div className="flex items-center gap-4 mb-16">
        <h1 className="font-display text-5xl font-bold italic dark:text-white">Sepetim</h1>
        <div className="h-px flex-1 bg-gray-100 dark:bg-dark-800"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-16 lg:gap-24">
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-8">
            {items.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-gray-50 dark:border-dark-800 group">
                <img src={item.image} className="w-full sm:w-40 h-40 object-cover rounded-[40px] shadow-sm group-hover:shadow-md transition-all" alt={item.title} />
                <div className="flex-1 py-2 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display text-2xl italic dark:text-white mb-2">{item.title}</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.category}</p>
                    </div>
                    <span className="font-display text-2xl font-bold text-brown-900 dark:text-gold italic">₺{item.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center bg-gray-50 dark:bg-dark-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors">-</button>
                      <span className="px-4 font-bold dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="flex items-center gap-2 text-[10px] font-black text-gray-300 hover:text-red-500 uppercase tracking-widest transition-all">
                      <Trash2 size={14} /> {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasGiftBag && (
            <div className="flex gap-8 py-8 border-b border-gray-50 dark:border-dark-800 animate-in fade-in duration-500">
              <div className="w-40 h-40 bg-gray-50 dark:bg-dark-800 rounded-[40px] flex items-center justify-center">
                 <ShoppingBag className="text-gray-300" size={48} strokeWidth={1} />
              </div>
              <div className="flex-1 py-4 flex flex-col justify-center">
                 <h3 className="font-display text-2xl italic dark:text-white">Sade Chocolate Hediye Çantası</h3>
                 <div className="flex justify-between items-center mt-4">
                    <span className="text-[11px] font-black text-green-500 uppercase tracking-widest">Hediye (Ücretsiz)</span>
                    <button onClick={() => setHasGiftBag(false)} className="text-[10px] font-black text-gray-300 hover:text-red-500 uppercase tracking-widest">Kaldır</button>
                 </div>
              </div>
            </div>
          )}

          {/* Hediye ve Çanta Seçenekleri */}
          <div className="space-y-6">
            {/* Çanta Seçeneği */}
            <div 
              onClick={() => setHasGiftBag(!hasGiftBag)}
              className={`p-8 rounded-[40px] border transition-all cursor-pointer flex items-center justify-between group ${hasGiftBag ? 'bg-gold/5 border-gold/20' : 'bg-white dark:bg-dark-800 border-gray-100 dark:border-gray-800 hover:border-gray-200'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${hasGiftBag ? 'bg-brown-900 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h4 className="font-display text-xl italic dark:text-white leading-none">Hediye Çantası İstiyorum</h4>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-2">Siparişinize ücretsiz çanta ekleyin</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${hasGiftBag ? 'bg-brown-900 border-brown-900 text-white' : 'border-gray-200'}`}>
                {hasGiftBag && <ArrowRight size={14} />}
              </div>
            </div>

            {/* Hediye Notu */}
            <div className="p-10 bg-gray-50 dark:bg-dark-800/50 rounded-[50px] border border-gray-100 dark:border-gray-800">
               <label className="flex items-center gap-5 cursor-pointer mb-8" onClick={() => setIsGift(!isGift)}>
                 <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isGift ? 'bg-brown-900 border-brown-900 text-white shadow-md' : 'border-gray-200'}`}>
                   {isGift && <ArrowRight size={16} />}
                 </div>
                 <span className="font-display text-2xl italic dark:text-white">Bu bir hediyedir</span>
               </label>
               
               {isGift && (
                 <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                   <textarea 
                     placeholder="Mesajınızı buraya yazabilirsiniz..."
                     value={giftMessage}
                     onChange={e => setGiftMessage(e.target.value)}
                     className="w-full p-8 bg-white dark:bg-dark-900 border-none rounded-[30px] shadow-inner text-base italic outline-none focus:ring-1 focus:ring-gold/30 min-h-[140px] dark:text-white"
                   />
                   <div className="mt-6 flex items-center gap-3 text-gray-400">
                     <Info size={14} />
                     <p className="text-[10px] font-bold uppercase tracking-widest">Fiyat bilgisi içermeyen fatura düzenlenecektir.</p>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Sağ: Özet ve Dinamik Kargo Barı */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 space-y-8">
            <div className="bg-white dark:bg-dark-800 p-10 rounded-[60px] border border-gray-100 dark:border-gray-700 shadow-luxurious">
              <div className="mb-12">
  <div className="mb-4">
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
      {remaining > 0 ? `Ücretsiz kargo için ₺${remaining.toFixed(2)} kaldı` : 'Kargo bedelsiz gönderilecektir'}
    </p>
    {remaining <= 0 && (
      <span className="text-[11px] font-black text-green-500 uppercase tracking-widest">Ücretsiz Kargo Avantajı 🎉</span>
    )}
  </div>
                <div className="h-2 bg-gray-50 dark:bg-dark-900 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gold transition-all duration-1000 ease-out shadow-sm" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <div className="space-y-6 mb-12">
                <div className="flex justify-between text-sm text-gray-500 uppercase tracking-widest font-bold">
                  <span>{t('subtotal')}</span>
                  <span className="dark:text-white">₺{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 uppercase tracking-widest font-bold">
                  <span>Kargo</span>
                  <span className={remaining <= 0 ? 'text-green-500' : 'dark:text-white'}>{remaining <= 0 ? 'Bedava' : 'Hesaplanacak'}</span>
                </div>
                <div className="pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-between items-end">
                  <span className="font-display text-2xl italic dark:text-white">Toplam</span>
                  <span className="font-display text-4xl font-bold text-brown-900 dark:text-gold italic">₺{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button onClick={() => navigate('/checkout')} size="lg" className="w-full h-20 rounded-[30px] text-xs tracking-[0.4em] shadow-2xl group">
                ÖDEME ADIMINA GEÇ <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};