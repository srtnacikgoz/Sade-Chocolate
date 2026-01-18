import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Package, Truck, CheckCircle2,
  ChevronRight, ArrowRight, X, Clock, MapPin, Receipt, Navigation, CreditCard, Building2
} from 'lucide-react';
import { ShipmentTracker } from './ShipmentTracker';
import { Order } from '../../context/UserContext';

// --- TİP TANIMLAMALARI ---
export interface OrderItem {
  id: string;
  title: string;
  name?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrdersViewProps {
  orders: Order[];
  trackOrderId?: string | null; // Email linkinden gelen kargo takip parametresi
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, trackOrderId }) => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTracking, setShowTracking] = useState(false);

  // URL'den gelen track parametresiyle otomatik kargo takip modalı aç
  React.useEffect(() => {
    if (trackOrderId && orders.length > 0) {
      // Sipariş ID'sine göre bul (orderNumber veya id)
      const orderToTrack = orders.find(
        o => o.orderNumber === trackOrderId || o.id === trackOrderId
      );
      if (orderToTrack) {
        setSelectedOrder(orderToTrack);
        setShowTracking(true);
      }
    }
  }, [trackOrderId, orders]);

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
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sipariş No: #{order.orderNumber || order.id}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${status.color}`}>
                      {status.icon} {status.label}
                    </div>
                  </div>
                  <h4 className="font-display text-xl font-bold dark:text-white italic">
                    {(() => {
                      const d = new Date(order.date);
                      return isNaN(d.getTime()) ? order.date : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                    })()}
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

      {/* 🛡️ SADE ARTISAN SİPARİŞ DETAY MODALI - Portal ile body'ye render */}
      {selectedOrder && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-10 animate-fade-in">
          {/* Estetik blur backdrop - QuickView tarzı */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => { setSelectedOrder(null); setShowTracking(false); }}></div>
          {/* Modal içeriği - solid background */}
          <div className="relative z-[100000] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl animate-scale-in" style={{ backgroundColor: '#ffffff' }}>

            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: '#ffffff' }}>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em]">Sipariş Detayı</span>
                <h3 className="font-display text-2xl font-bold dark:text-white italic tracking-tight uppercase">#{selectedOrder.orderNumber || selectedOrder.id}</h3>
              </div>
              <button onClick={() => { setSelectedOrder(null); setShowTracking(false); }} className="w-12 h-12 bg-gray-50 dark:bg-dark-800 flex items-center justify-center rounded-2xl text-gray-400 hover:text-red-500 transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Tab Navigasyonu - Kargoda veya Teslim Edildi ise göster */}
            {(selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') && (
              <div className="px-8 py-4 border-b border-gray-100 dark:border-gray-800 flex gap-2">
                <button
                  onClick={() => setShowTracking(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    !showTracking
                      ? 'bg-brown-900 dark:bg-gold text-white dark:text-black'
                      : 'bg-gray-50 dark:bg-dark-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700'
                  }`}
                >
                  <Receipt size={14} />
                  Sipariş Detayı
                </button>
                <button
                  onClick={() => setShowTracking(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    showTracking
                      ? 'bg-brown-900 dark:bg-gold text-white dark:text-black'
                      : 'bg-gray-50 dark:bg-dark-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700'
                  }`}
                >
                  <Navigation size={14} />
                  Kargo Takip
                </button>
              </div>
            )}

            {/* İçerik Alanı */}
            {showTracking ? (
              <ShipmentTracker
                orderId={selectedOrder.orderNumber || selectedOrder.id}
                trackingNumber={selectedOrder.tracking?.trackingNumber || selectedOrder.shipping?.trackingNumber}
                shipmentId={selectedOrder.tracking?.shipmentId}
                provider={selectedOrder.tracking?.provider}
              />
            ) : (
            <div className="p-8 space-y-8">
              {/* Zaman Çizelgesi Özeti */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">TARİH</span>
                  </div>
                  <p className="text-xs font-bold dark:text-white">{(() => {
                    const d = new Date(selectedOrder.date);
                    return isNaN(d.getTime()) ? selectedOrder.date : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                  })()}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Receipt size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">ÖDEME</span>
                  </div>
                  <p className={`text-xs font-bold uppercase ${selectedOrder.payment?.status === 'paid' ? 'text-emerald-500' : selectedOrder.payment?.status === 'failed' ? 'text-red-500' : 'text-amber-500'}`}>
                    {selectedOrder.payment?.status === 'paid' ? 'Ödendi' : selectedOrder.payment?.status === 'failed' ? 'Başarısız' : 'Bekliyor'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <CreditCard size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">YÖNTEM</span>
                  </div>
                  <p className="text-xs font-bold dark:text-white uppercase">
                    {selectedOrder.payment?.method === 'card' ? 'Kredi Kartı' : 'Havale/EFT'}
                    {selectedOrder.payment?.cardInfo && <span className="text-gray-400 ml-1">{selectedOrder.payment.cardInfo}</span>}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Truck size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">KARGO</span>
                  </div>
                  <p className="text-xs font-bold dark:text-white uppercase tracking-tighter">MNG Kargo</p>
                </div>
              </div>

              {/* Teslimat ve Fatura Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Teslimat Adresi */}
                <div className="p-5 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <MapPin size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">TESLİMAT ADRESİ</span>
                  </div>
                  {selectedOrder.shipping ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold dark:text-white">{selectedOrder.shipping.address || 'Belirtilmemiş'}</p>
                      <p className="text-[10px] text-gray-500">
                        {[selectedOrder.shipping.district, selectedOrder.shipping.city].filter(Boolean).join(', ') || 'Şehir belirtilmemiş'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Adres bilgisi bulunamadı</p>
                  )}
                </div>

                {/* Fatura Bilgileri */}
                <div className="p-5 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Building2 size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">FATURA BİLGİLERİ</span>
                  </div>
                  {selectedOrder.invoice ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold dark:text-white">
                        {selectedOrder.invoice.type === 'corporate' ? selectedOrder.invoice.name || 'Kurumsal' : 'Bireysel Fatura'}
                      </p>
                      {selectedOrder.invoice.type === 'corporate' && selectedOrder.invoice.taxOffice && (
                        <p className="text-[10px] text-gray-500">
                          {selectedOrder.invoice.taxOffice} - {selectedOrder.invoice.taxNo}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs dark:text-white">Bireysel Fatura</p>
                  )}
                </div>
              </div>

              {/* Ürün Listesi */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-brown-900 dark:text-gold uppercase tracking-[0.3em]">Sipariş İçeriği</h5>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={item.id || index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white dark:bg-dark-900 rounded-xl overflow-hidden shadow-sm flex items-center justify-center border border-gray-50 dark:border-gray-700 text-gold">
                           {item.image ? (
                             <img src={item.image} alt={item.name || item.title} className="w-full h-full object-cover" />
                           ) : (
                             <ShoppingBag size={20} />
                           )}
                        </div>
                        <div>
                          <h6 className="text-[11px] font-black dark:text-white uppercase tracking-wider">{item.name || item.title || 'Ürün'}</h6>
                          <p className="text-[10px] text-gray-400 font-bold">{item.quantity} Adet × ₺{(item.price || 0).toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black dark:text-white">₺{((item.price || 0) * (item.quantity || 1)).toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toplam Özeti */}
              <div className="p-6 bg-brown-900 dark:bg-gold text-white dark:text-black rounded-[24px] shadow-2xl">
                <div className="space-y-3">
                  {selectedOrder.subtotal && selectedOrder.subtotal !== selectedOrder.total && (
                    <div className="flex justify-between items-center text-white/70 dark:text-black/70">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Ara Toplam</span>
                      <span className="text-sm font-bold">₺{selectedOrder.subtotal.toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                  {selectedOrder.shippingCost !== undefined && selectedOrder.shippingCost > 0 && (
                    <div className="flex justify-between items-center text-white/70 dark:text-black/70">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Kargo</span>
                      <span className="text-sm font-bold">₺{selectedOrder.shippingCost.toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-white/20 dark:border-black/20">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Genel Toplam</span>
                    <span className="font-display text-3xl font-bold italic">₺{selectedOrder.total.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};