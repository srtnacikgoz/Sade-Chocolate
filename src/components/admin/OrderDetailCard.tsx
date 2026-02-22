import React from 'react';
import { Order } from './tabs/OrdersTab';
import { X, MapPin, FileText, Package, Droplets, Gift, Box } from 'lucide-react';
import { BrandIcon } from '../ui/BrandIcon';

interface OrderDetailCardProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderDetailCard: React.FC<OrderDetailCardProps> = ({ order, onClose }) => {
  if (!order) return null;

  const sıcaklık = order.weatherAlert?.temp || 25; // Örnek sıcaklık
  const requiresIce = order.weatherAlert?.requiresIce || sıcaklık > 20;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-sm animate-in slide-in-from-right-full duration-500">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between bg-cream-50">
            <div>
              <h2 className="text-xl font-semibold text-mocha-900">Sipariş Detayları</h2>
              <p className="font-mono text-sm text-mocha-400">#{order.id.substring(0, 6)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-full hover:bg-cream-50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Weather Alert */}
          {requiresIce && (
            <div className="p-4 bg-orange-50 border-b border-orange-200 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                  <Droplets size={20} />
              </div>
              <div>
                  <p className="font-bold text-orange-700 text-sm">⚠️ BUZ AKÜSÜ ZORUNLU</p>
                  <p className="text-xs text-orange-600">Teslimat adresi sıcaklığı {sıcaklık}°C. Lütfen pakete buz aküsü ekleyin.</p>
              </div>
            </div>
          )}
          
          <div className="flex-grow overflow-y-auto p-8 grid grid-cols-2 gap-12">
            {/* Sol Sütun: Operasyonel Güvenlik */}
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600"><MapPin size={18}/> Adres & Müşteri</h3>
                <div className="space-y-3 p-4 bg-cream-50 rounded-2xl border">
                   <div>
                     <p className="text-xs font-bold text-mocha-500 mb-1">Müşteri</p>
                     <p className="text-sm text-mocha-900 font-medium">{order.customerInfo.name}</p>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-mocha-500 mb-1">Email</p>
                     <p className="text-sm text-mocha-900">{order.customerInfo.email}</p>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-mocha-500 mb-1">Telefon</p>
                     <p className="text-sm text-mocha-900">{order.customerInfo.phone}</p>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-mocha-500 mb-1">Teslimat Adresi</p>
                     <p className="text-sm text-mocha-900">{order.customerInfo.address}</p>
                   </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600"><Package size={18}/> Lojistik Durumu</h3>
                 <div className="space-y-4 p-4 bg-cream-50 rounded-2xl border">
                    {/* Buraya kargo durumu gelecek */}
                    <p className="text-sm text-mocha-600">Kargo Takip No: [Girilmedi]</p>
                    <input type="text" placeholder="Kargo No Girin" className="w-full mt-2 p-2 border rounded-md text-sm"/>
                 </div>
              </div>
            </div>

            {/* Sağ Sütun: Duygusal Veri */}
            <div className="space-y-8">
               <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600"><Gift size={18}/> Dijital Hediye Kartı</h3>
                <div className="aspect-video bg-zinc-800 rounded-2xl p-4 flex items-center justify-center border-4 border-zinc-200 shadow-sm">
                    {/* Hediye notu önizlemesi */}
                    <p className="text-white text-center italic" style={{ fontFamily: order.giftDetails?.fontFamily || 'sans-serif' }}>
                        {order.giftDetails?.note || "Hediye notu bulunmuyor."}
                    </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600"><BrandIcon size={18}/> Duyusal Profil</h3>
                <div className="space-y-4 p-4 bg-cream-50 rounded-2xl border">
                   {/* Duyusal profil grafikleri */}
                   <p className="text-sm text-mocha-600">Yoğunluk: [Grafik]</p>
                   <p className="text-sm text-mocha-600">Tatlılık: [Grafik]</p>
                   <p className="text-sm text-mocha-600">Meyvemsilik: [Grafik]</p>
                </div>
              </div>
               <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600"><Box size={18}/> Sipariş Ürünleri</h3>
                <div className="space-y-3 p-4 bg-cream-50 rounded-2xl border">
                   {order.items.map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between pb-3 border-b last:border-b-0 last:pb-0">
                       <div className="flex items-center gap-3">
                         {item.image && (
                           <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                         )}
                         <div>
                           <p className="text-sm font-bold text-mocha-900">{item.title}</p>
                           <p className="text-xs text-mocha-500">x{item.quantity}</p>
                         </div>
                       </div>
                       <p className="text-sm font-bold text-mocha-600">₺{(item.price * item.quantity).toFixed(2)}</p>
                     </div>
                   ))}
                   <div className="pt-3 border-t-2 flex justify-between items-center">
                     <span className="font-bold text-mocha-600">Toplam</span>
                     <span className="text-lg font-semibold text-mocha-900">₺{order.total.toFixed(2)}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

           {/* Footer Actions */}
           <div className="p-6 border-t bg-cream-50 flex items-center justify-end gap-4">
                <button className="px-6 py-2 text-sm font-bold text-mocha-600 hover:bg-cream-50 rounded-lg transition-colors" onClick={onClose}>
                    Kapat
                </button>
                <button className="px-8 py-3 text-sm font-bold text-white bg-mocha-900 hover:bg-black rounded-lg transition-colors shadow-sm">
                    Siparişi Güncelle
                </button>
           </div>
        </div>
      </div>
    </div>
  );
};
