import React, { useState } from 'react';
import { Search, Package, Clock, CheckCircle, XCircle, Truck, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Order } from '../admin/tabs/OrdersTab';
import { calculateEstimatedDeliveryDate, getDeliveryStatus } from '../../utils/estimatedDelivery';

interface OrderTrackingPageProps {
  // Gerçek uygulamada API'den sipariş çekilecek
  onSearchOrder?: (query: string) => Promise<Order | null>;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ onSearchOrder }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Lütfen sipariş numarası veya email adresi girin');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      if (onSearchOrder) {
        const result = await onSearchOrder(searchQuery);
        if (result) {
          setOrder(result);
        } else {
          setError('Sipariş bulunamadı. Lütfen sipariş numaranızı veya email adresinizi kontrol edin.');
        }
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTimeline = (currentStatus: Order['status']) => {
    const statuses = [
      { key: 'pending', label: 'Sipariş Alındı', icon: Clock },
      { key: 'processing', label: 'Hazırlanıyor', icon: Package },
      { key: 'shipped', label: 'Kargoda', icon: Truck },
      { key: 'delivered', label: 'Teslim Edildi', icon: CheckCircle },
    ];

    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return statuses.map((status, index) => ({
      ...status,
      completed: index <= currentIndex,
      active: status.key === currentStatus,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-50 via-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-brown-900 text-white py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold italic mb-2">Sade Chocolate</h1>
              <p className="text-amber-200 text-sm">Sipariş Takip Sistemi</p>
            </div>
            <Package size={48} className="text-amber-200" />
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="bg-white rounded-[48px] shadow-2xl p-8 md:p-12 border-2 border-brown-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Siparişiniz Nerede? 📦
            </h2>
            <p className="text-gray-600">
              Sipariş numaranızı veya email adresinizi girerek siparişinizi takip edebilirsiniz
            </p>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Sipariş numarası veya email adresi"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-gray-200 rounded-3xl text-sm focus:ring-2 focus:ring-brown-900/20 focus:border-brown-900 outline-none transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-10 py-5 bg-brown-900 text-white font-bold rounded-3xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Aranıyor...' : 'Takip Et'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <XCircle size={20} className="text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        {order && (
          <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Status Timeline */}
            <div className="bg-white rounded-[48px] shadow-xl p-8 border-2 border-brown-100">
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-8 text-center">
                Sipariş Durumu
              </h3>

              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-brown-900 to-amber-600 transition-all duration-1000"
                    style={{
                      width: `${
                        (getStatusTimeline(order.status).filter((s) => s.completed).length / 4) * 100
                      }%`,
                    }}
                  />
                </div>

                {/* Status Steps */}
                <div className="relative grid grid-cols-4 gap-4">
                  {getStatusTimeline(order.status).map((status, index) => {
                    const Icon = status.icon;
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-all ${
                            status.completed
                              ? 'bg-brown-900 text-white shadow-lg scale-110'
                              : 'bg-gray-100 text-gray-400'
                          } ${status.active ? 'ring-4 ring-amber-400 ring-offset-2' : ''}`}
                        >
                          <Icon size={28} />
                        </div>
                        <p
                          className={`text-xs font-bold text-center ${
                            status.completed ? 'text-brown-900' : 'text-gray-400'
                          }`}
                        >
                          {status.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.status === 'cancelled' && (
                <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                  <XCircle size={48} className="mx-auto text-red-600 mb-3" />
                  <p className="text-lg font-bold text-red-900 mb-1">Sipariş İptal Edildi</p>
                  <p className="text-sm text-red-600">
                    Daha fazla bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.
                  </p>
                </div>
              )}
            </div>

            {/* Estimated Delivery Date */}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-[48px] shadow-xl p-8 border-2 border-purple-200">
                {(() => {
                  const edd = calculateEstimatedDeliveryDate(order);
                  const deliveryStatus = getDeliveryStatus(order);
                  return (
                    <>
                      <h3 className="text-2xl font-display font-bold text-gray-900 mb-6 text-center">
                        Tahmini Teslimat Tarihi
                      </h3>
                      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <div className={`w-24 h-24 ${deliveryStatus.bgColor} rounded-3xl flex items-center justify-center text-5xl`}>
                          {deliveryStatus.emoji}
                        </div>
                        <div className="text-center md:text-left">
                          <p className={`text-sm font-bold ${deliveryStatus.color} uppercase mb-2`}>
                            {deliveryStatus.status}
                          </p>
                          <p className="text-3xl font-display font-bold text-gray-900">
                            {format(edd, 'dd MMMM yyyy', { locale: tr })}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {format(edd, 'EEEE', { locale: tr })} • {format(edd, 'HH:mm', { locale: tr })} civarı
                          </p>
                        </div>
                      </div>
                      {order.weatherAlert?.requiresIce && (
                        <div className="mt-6 bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Package size={20} className="text-orange-600" />
                          </div>
                          <p className="text-sm text-orange-700">
                            <strong>Özel Paketleme:</strong> Yüksek sıcaklık nedeniyle ürününüz özel soğutmalı ambalajla gönderilmektedir.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Delivery Complete */}
            {order.status === 'delivered' && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[48px] shadow-xl p-8 border-2 border-green-200">
                <div className="text-center">
                  <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
                  <h3 className="text-3xl font-display font-bold text-green-900 mb-2">
                    Teslim Edildi! 🎉
                  </h3>
                  <p className="text-gray-700">
                    Siparişiniz başarıyla teslim edilmiştir. Afiyet olsun!
                  </p>
                  {order.logistics?.actualDeliveryDate && (
                    <p className="text-sm text-gray-500 mt-2">
                      Teslimat: {format(order.logistics.actualDeliveryDate, 'dd MMMM yyyy, HH:mm', { locale: tr })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Order & Shipping Info */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Order Info */}
              <div className="bg-white rounded-[32px] shadow-lg p-6 border border-gray-200">
                <h4 className="font-display font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                  <Package size={20} /> Sipariş Bilgileri
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sipariş No:</span>
                    <span className="font-mono font-bold text-gray-900">#{order.id.substring(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tarih:</span>
                    <span className="text-gray-900">
                      {format(order.createdAt?.toDate?.() || new Date(order.createdAt), 'dd MMM yyyy', {
                        locale: tr,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ürün Sayısı:</span>
                    <span className="text-gray-900">{order.items.length} adet</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-bold text-gray-700">Toplam:</span>
                    <span className="text-xl font-display font-bold text-brown-900">₺{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-white rounded-[32px] shadow-lg p-6 border border-gray-200">
                <h4 className="font-display font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                  <Truck size={20} /> Kargo Bilgileri
                </h4>
                <div className="space-y-3 text-sm">
                  {order.logistics?.carrier && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kargo Firması:</span>
                      <span className="text-gray-900 font-medium capitalize">{order.logistics.carrier}</span>
                    </div>
                  )}
                  {order.logistics?.trackingNumber && (
                    <div>
                      <p className="text-gray-500 mb-1">Takip Numarası:</p>
                      <p className="font-mono font-bold text-brown-900 bg-brown-50 px-3 py-2 rounded-lg">
                        {order.logistics.trackingNumber}
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-2 pt-3 border-t">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-500 text-xs mb-1">Teslimat Adresi:</p>
                      <p className="text-gray-900">{order.customerInfo.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-amber-50 rounded-[32px] shadow-lg p-6 border-2 border-amber-200">
              <div className="text-center">
                <h4 className="font-display font-bold text-lg text-gray-900 mb-2">
                  Yardıma mı İhtiyacınız Var?
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Siparişinizle ilgili sorularınız için bizimle iletişime geçebilirsiniz
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a
                    href="tel:+902423211234"
                    className="flex items-center gap-2 px-6 py-3 bg-brown-900 text-white rounded-2xl hover:bg-black transition-all"
                  >
                    <Phone size={18} />
                    <span className="font-bold text-sm">Bizi Arayın</span>
                  </a>
                  <a
                    href="mailto:info@sadechocolate.com"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-brown-900 border-2 border-brown-900 rounded-2xl hover:bg-brown-50 transition-all"
                  >
                    <Mail size={18} />
                    <span className="font-bold text-sm">Email Gönderin</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
