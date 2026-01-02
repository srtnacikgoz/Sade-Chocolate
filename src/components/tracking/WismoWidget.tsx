import React, { useState } from 'react';
import { Package, Search, X, Clock, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Order } from '../admin/tabs/OrdersTab';
import { calculateEstimatedDeliveryDate, getDeliveryStatus } from '../../utils/estimatedDelivery';

interface WismoWidgetProps {
  onSearchOrder: (query: string) => Promise<Order | null>;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * WISMO Widget - "Where Is My Order?" Self-Servis Takip Widget'ı
 *
 * Müşteri kaygısını azaltmak için:
 * - Hızlı sipariş arama
 * - Minimal tıklama ile durum kontrolü
 * - Proaktif bilgilendirme
 */
export const WismoWidget: React.FC<WismoWidgetProps> = ({
  onSearchOrder,
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Lütfen sipariş numarası veya email girin');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const result = await onSearchOrder(searchQuery);
      if (result) {
        setOrder(result);
      } else {
        setError('Sipariş bulunamadı');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    setOrder(null);
    setError('');
  };

  const getQuickStatus = (status: Order['status']) => {
    const statusMap = {
      pending: { icon: Clock, label: 'Beklemede', color: 'text-yellow-600', bg: 'bg-yellow-50' },
      processing: { icon: Package, label: 'Hazırlanıyor', color: 'text-blue-600', bg: 'bg-blue-50' },
      shipped: { icon: Truck, label: 'Kargoda', color: 'text-purple-600', bg: 'bg-purple-50' },
      delivered: { icon: CheckCircle, label: 'Teslim Edildi', color: 'text-green-600', bg: 'bg-green-50' },
      cancelled: { icon: AlertCircle, label: 'İptal', color: 'text-red-600', bg: 'bg-red-50' },
    };
    return statusMap[status] || statusMap.pending;
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses[position]} z-50 group`}
          aria-label="Siparişimi Takip Et"
        >
          <div className="relative">
            {/* Pulse Animation */}
            <div className="absolute inset-0 bg-brown-900 rounded-full animate-ping opacity-20" />

            {/* Button */}
            <div className="relative w-16 h-16 bg-brown-900 hover:bg-black rounded-full shadow-2xl flex items-center justify-center transition-all group-hover:scale-110">
              <Package size={28} className="text-white" />
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Siparişimi Takip Et
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </button>
      )}

      {/* Widget Panel */}
      {isOpen && (
        <div
          className={`fixed ${positionClasses[position]} z-50 w-[420px] max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-4 duration-300`}
        >
          <div className="bg-white rounded-[32px] shadow-2xl border-2 border-brown-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brown-900 to-amber-900 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <h3 className="font-display font-bold text-lg">Siparişim Nerede?</h3>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  aria-label="Kapat"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-amber-100 text-xs">Hızlı sipariş takibi</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Search Form */}
              {!order && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Sipariş No veya Email
                    </label>
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Örn: A1B2C3 veya email@example.com"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-brown-900/20 focus:border-brown-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-600" />
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full py-3 bg-brown-900 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Aranıyor...
                      </span>
                    ) : (
                      'Sorgula'
                    )}
                  </button>

                  {/* Quick Tips */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-xs text-amber-900 leading-relaxed">
                      <strong>💡 İpucu:</strong> Sipariş numaranızı email onayında veya SMS'te bulabilirsiniz.
                    </p>
                  </div>
                </div>
              )}

              {/* Order Result */}
              {order && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Order Status */}
                  {(() => {
                    const quickStatus = getQuickStatus(order.status);
                    const StatusIcon = quickStatus.icon;
                    const deliveryStatus = getDeliveryStatus(order);
                    const edd = calculateEstimatedDeliveryDate(order);

                    return (
                      <>
                        <div className={`${quickStatus.bg} rounded-2xl p-4 border-2 border-${order.status === 'delivered' ? 'green' : order.status === 'cancelled' ? 'red' : 'brown'}-200`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 ${quickStatus.bg} rounded-xl flex items-center justify-center`}>
                              <StatusIcon size={24} className={quickStatus.color} />
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${quickStatus.color} uppercase`}>
                                {quickStatus.label}
                              </p>
                              <p className="font-mono text-sm font-bold text-gray-900">
                                #{order.id.substring(0, 8)}
                              </p>
                            </div>
                          </div>

                          {/* EDD */}
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <div className="bg-white/70 rounded-xl p-3">
                              <p className="text-xs text-gray-500 mb-1">Tahmini Teslimat</p>
                              <p className="font-display font-bold text-gray-900">
                                {format(edd, 'dd MMM', { locale: tr })} • {deliveryStatus.status}
                              </p>
                            </div>
                          )}

                          {order.status === 'delivered' && (
                            <div className="bg-white/70 rounded-xl p-3 text-center">
                              <p className="text-sm font-bold text-green-900">
                                ✅ Teslim Edildi!
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                Afiyet olsun 🍫
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Tracking Number */}
                        {order.logistics?.trackingNumber && (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Kargo Takip No</p>
                            <p className="font-mono font-bold text-gray-900 text-sm">
                              {order.logistics.trackingNumber}
                            </p>
                            {order.logistics.carrier && (
                              <p className="text-xs text-gray-500 mt-1 capitalize">
                                {order.logistics.carrier} Kargo
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setOrder(null);
                              setSearchQuery('');
                            }}
                            className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                          >
                            Yeni Arama
                          </button>
                          <a
                            href={`/track/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 text-sm font-bold text-white bg-brown-900 hover:bg-black rounded-xl transition-colors text-center"
                          >
                            Detaylar
                          </a>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Sorularınız için:{' '}
                <a href="tel:+902423211234" className="text-brown-900 font-bold hover:underline">
                  0242 321 12 34
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
