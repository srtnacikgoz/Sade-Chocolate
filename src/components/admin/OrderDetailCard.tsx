import React from 'react';
import { Order } from '../../context/UserContext';
import { X, MapPin, FileText, Package, Droplets, Gift, Sparkles, Box } from 'lucide-react';

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
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl animate-in slide-in-from-right-full duration-500">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-xl font-display font-bold italic text-gray-800">Sipariş Detayları</h2>
              <p className="font-mono text-sm text-gray-400">#{order.id.substring(0, 6)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-full hover:bg-slate-200 transition-colors"
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
                <h3 className="font-display font-bold italic text-lg mb-4 flex items-center gap-2 text-gray-700"><MapPin size={18}/> Adres & Fatura</h3>
                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border">
                   {/* Buraya adres ve fatura bilgileri gelecek */}
                   <p className="text-sm text-gray-600">Teslimat Adresi: [Adres Bilgisi]</p>
                   <p className="text-sm text-gray-600">Fatura Adresi: [Fatura Bilgisi]</p>
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold italic text-lg mb-4 flex items-center gap-2 text-gray-700"><Package size={18}/> Lojistik Durumu</h3>
                 <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border">
                    {/* Buraya kargo durumu gelecek */}
                    <p className="text-sm text-gray-600">Kargo Takip No: [Girilmedi]</p>
                    <input type="text" placeholder="Kargo No Girin" className="w-full mt-2 p-2 border rounded-md text-sm"/>
                 </div>
              </div>
            </div>

            {/* Sağ Sütun: Duygusal Veri */}
            <div className="space-y-8">
               <div>
                <h3 className="font-display font-bold italic text-lg mb-4 flex items-center gap-2 text-gray-700"><Gift size={18}/> Dijital Hediye Kartı</h3>
                <div className="aspect-video bg-zinc-800 rounded-2xl p-4 flex items-center justify-center border-4 border-zinc-200 shadow-lg">
                    {/* Hediye notu önizlemesi */}
                    <p className="text-white text-center italic" style={{ fontFamily: order.giftDetails?.fontFamily || 'sans-serif' }}>
                        {order.giftDetails?.note || "Hediye notu bulunmuyor."}
                    </p>
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold italic text-lg mb-4 flex items-center gap-2 text-gray-700"><Sparkles size={18}/> Duyusal Profil</h3>
                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border">
                   {/* Duyusal profil grafikleri */}
                   <p className="text-sm text-gray-600">Yoğunluk: [Grafik]</p>
                   <p className="text-sm text-gray-600">Tatlılık: [Grafik]</p>
                   <p className="text-sm text-gray-600">Meyvemsilik: [Grafik]</p>
                </div>
              </div>
               <div>
                <h3 className="font-display font-bold italic text-lg mb-4 flex items-center gap-2 text-gray-700"><Box size={18}/> Ürün Varyantları</h3>
                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border">
                   {/* Kutu boyutu ve ürün listesi */}
                   <p className="text-sm text-gray-600">Kutu Boyutu: [Grid/List]</p>
                </div>
              </div>
            </div>
          </div>

           {/* Footer Actions */}
           <div className="p-6 border-t bg-slate-50 flex items-center justify-end gap-4">
                <button className="px-6 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" onClick={onClose}>
                    Kapat
                </button>
                <button className="px-8 py-3 text-sm font-bold text-white bg-brown-900 hover:bg-black rounded-lg transition-colors shadow-lg">
                    Siparişi Güncelle
                </button>
           </div>
        </div>
      </div>
    </div>
  );
};
