import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Package, Truck, CheckCircle2, 
  ChevronRight, ArrowRight, X, Clock, MapPin, Receipt 
} from 'lucide-react';

// --- TİP TANIMLAMALARI ---
export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'processing' | 'shipped' | 'delivered' | 'received';
  items: OrderItem[];
}

interface OrdersViewProps {
  orders: Order[];
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders }) => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Sipariş Durum Renkleri ve İkonları
  const getStatusDetails = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return { color: 'text-amber-600 bg-amber-50', icon: <Package size={14} />, label: 'Hazırlanıyor' };
      case 'shipped':
        return { color: 'text-blue-600 bg-blue-50', icon: <Truck size={14} />, label: 'Kargoda' };
      case 'delivered':
        return { color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle2 size={14} />, label: 'Teslim Edildi' };
      default:
        return { color: 'text-gray-500 bg-gray-50', icon: <ShoppingBag size={14} />, label: 'Alındı' };
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="py-20 text-center animate-fade-in">
        <div className="w-24 h-24 bg-gray-50 dark:bg-dark-800 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h3 className="font-display text-3xl text-gray-900 dark:text-white mb-4 italic leading-tight">Henüz bir siparişiniz bulunmuyor.</h3>
        <p className="text-gray-400 max-w-sm mx-auto text-[10px] uppercase tracking-widest font-black mb-10 leading-relaxed">
          Sade Chocolate koleksiyonlarını keşfederek artisan bir yolculuğa başlamaya ne dersiniz?
        </p>
        <button 
          onClick={() => navigate('/catalog')}
          className="inline-flex items-center gap-4 px-12 py-5 bg-brown-900 dark:bg-gold text-white dark:text-black text-[10px] font-black uppercase tracking-[0.4em] rounded-[30px] shadow-2xl hover:scale-105 transition-all group"
        >
          KOLEKSİYONLARI KEŞFET <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {orders.map((order) => {
        const status = getStatusDetails(order.status);
        return (
          <div 
            key={order.id} 
            onClick={() => setSelectedOrder(order)}
            className="group bg-white dark:bg-dark-800 border border-gray-100 dark:border-gray-700 p-8 rounded-[28px] hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-brown-900 dark:text-gold rounded-2xl group-hover:scale-110 transition-transform">
                  <ShoppingBag size={24} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sipariş No: #{order.id}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${status.color}`}>
                      {status.icon} {status.label}
                    </div>
                  </div>
                  <h4 className="font-display text-xl font-bold dark:text-white italic">
                    {new Date(order.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h4>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-12 border-t md:border-t-0 border-gray-50 dark:border-gray-700 pt-6 md:pt-0">
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOPLAM TUTAR</p>
                  <p className="font-display text-2xl font-bold text-brown-900 dark:text-gold italic">₺{order.total.toLocaleString('tr-TR')}</p>
                </div>
                <div className="w-12 h-12 bg-brown-900 dark:bg-gold text-white dark:text-black flex items-center justify-center rounded-2xl group-hover:translate-x-2 transition-all shadow-lg">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
            {/* Alt Dekoratif Şerit */}
            <div className="absolute left-0 bottom-0 h-1.5 w-0 bg-gold transition-all duration-700 group-hover:w-full"></div>
          </div>
        );
      })}

      {/* 🛡️ SADE ARTISAN SİPARİŞ DETAY MODALI */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in">
          <div className="absolute inset-0 bg-brown-900/60 backdrop-blur-md" onClick={() => setSelectedOrder(null)}></div>
          <div className="relative bg-white dark:bg-dark-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl animate-scale-in">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em]">Sipariş Detayı</span>
                <h3 className="font-display text-2xl font-bold dark:text-white italic tracking-tight uppercase">#{selectedOrder.id}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 bg-gray-50 dark:bg-dark-800 flex items-center justify-center rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-10">
              {/* Zaman Çizelgesi Özeti */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">SİPARİŞ TARİHİ</span>
                  </div>
                  <p className="text-xs font-bold dark:text-white">{new Date(selectedOrder.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Receipt size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">ÖDEME DURUMU</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-500 uppercase">Ödendi</p>
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">TESLİMAT</span>
                  </div>
                  <p className="text-xs font-bold dark:text-white opacity-80 uppercase tracking-tighter">Artisan Özel Kurye</p>
                </div>
              </div>

              {/* Ürün Listesi */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-brown-900 dark:text-gold uppercase tracking-[0.3em]">Sipariş İçeriği</h5>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white dark:bg-dark-900 rounded-xl overflow-hidden shadow-sm flex items-center justify-center border border-gray-50 dark:border-gray-700 text-gold">
                           <ShoppingBag size={20} />
                        </div>
                        <div>
                          <h6 className="text-[11px] font-black dark:text-white uppercase tracking-wider">{item.title}</h6>
                          <p className="text-[10px] text-gray-400 font-bold">{item.quantity} Adet × ₺{item.price.toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black dark:text-white">₺{(item.price * item.quantity).toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toplam Özeti */}
              <div className="p-8 bg-brown-900 dark:bg-gold text-white dark:text-black rounded-[32px] shadow-2xl">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Genel Toplam</span>
                  <span className="font-display text-4xl font-bold italic">₺{selectedOrder.total.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};