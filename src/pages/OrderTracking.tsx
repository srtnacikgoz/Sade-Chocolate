import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Package, Truck, MapPin, CreditCard, CheckCircle, Clock, AlertCircle, ArrowRight, ShoppingBag } from 'lucide-react';

type TrackingOrder = {
  firestoreId: string;
  id: string;
  status: string;
  customer: { name: string; email: string; phone: string };
  items: { name: string; price: number; quantity: number; image?: string }[];
  payment: { method: string; status: string; total: number; subtotal: number; shipping: number };
  shipping?: { address: string; city: string; district: string; trackingNumber?: string; carrier?: string };
  tracking?: { trackingNumber: string; carrier: string };
  createdAt: string;
};

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Ödeme Bekleniyor', color: 'text-amber-600 bg-amber-50', icon: <Clock size={16} /> },
  processing: { label: 'Hazırlanıyor', color: 'text-blue-600 bg-blue-50', icon: <Package size={16} /> },
  shipped: { label: 'Kargoda', color: 'text-purple-600 bg-purple-50', icon: <Truck size={16} /> },
  delivered: { label: 'Teslim Edildi', color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle size={16} /> },
  cancelled: { label: 'İptal Edildi', color: 'text-red-600 bg-red-50', icon: <AlertCircle size={16} /> },
};

export const OrderTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setSearched(true);

    if (!email.trim() || !orderNumber.trim()) {
      setError('Lütfen e-posta adresinizi ve sipariş numaranızı girin.');
      return;
    }

    setLoading(true);

    try {
      const lookupOrder = httpsCallable<
        { orderNumber: string; email: string },
        { found: boolean; order?: TrackingOrder }
      >(functions, 'lookupOrder');

      const result = await lookupOrder({
        orderNumber: orderNumber.trim(),
        email: email.trim()
      });

      if (!result.data.found || !result.data.order) {
        setError('Bu bilgilerle eşleşen sipariş bulunamadı. Lütfen bilgilerinizi kontrol edin.');
        setLoading(false);
        return;
      }

      setOrder(result.data.order);
    } catch (err) {
      console.error('Order tracking error:', err);
      setError('Sipariş sorgulanırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = order ? (statusMap[order.status] || statusMap.pending) : null;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100 dark:from-dark-900 dark:to-dark-800 py-8 px-4"
      style={{ paddingTop: 'calc(var(--top-bar-height, 0px) + var(--header-height, 80px) + 32px)' }}
    >
      <div className="max-w-lg mx-auto">
        {/* Başlık */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-mocha-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-mocha-600 dark:text-mocha-300" />
          </div>
          <h1 className="text-2xl font-bold text-mocha-900 dark:text-white mb-2">Sipariş Sorgula</h1>
          <p className="text-mocha-600 dark:text-mocha-400 text-sm">
            Siparişinizin durumunu öğrenmek için e-posta adresinizi ve sipariş numaranızı girin.
          </p>
        </div>

        {/* Arama Formu */}
        <form onSubmit={handleSearch} className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-mocha-700 dark:text-mocha-300 mb-1">
                E-posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full rounded-xl border border-cream-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-3 text-mocha-900 dark:text-white placeholder-mocha-400 focus:outline-none focus:ring-2 focus:ring-mocha-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-mocha-700 dark:text-mocha-300 mb-1">
                Sipariş Numarası
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="SADE-abc1234"
                className="w-full rounded-xl border border-cream-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-3 text-mocha-900 dark:text-white placeholder-mocha-400 focus:outline-none focus:ring-2 focus:ring-mocha-400"
                required
              />
              <p className="text-xs text-mocha-500 dark:text-mocha-400 mt-1">
                Sipariş numaranız e-posta ile gönderilmiştir.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-mocha-600 hover:bg-mocha-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search size={18} />
                  Sipariş Sorgula
                </>
              )}
            </button>
          </div>
        </form>

        {/* Hata */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 text-center">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Sipariş Bulunamadı */}
        {searched && !loading && !error && !order && (
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg text-center">
            <Package className="w-10 h-10 text-mocha-400 mx-auto mb-3" />
            <p className="text-mocha-600 dark:text-mocha-400">Sipariş bulunamadı.</p>
          </div>
        )}

        {/* Sipariş Detayları */}
        {order && statusInfo && (
          <div className="space-y-4">
            {/* Durum */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-mocha-900 dark:text-white">#{order.id}</h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>
              </div>

              {/* Durum Timeline */}
              <div className="flex items-center gap-2 mt-4">
                {['pending', 'processing', 'shipped', 'delivered'].map((step, i) => {
                  const steps = ['pending', 'processing', 'shipped', 'delivered'];
                  const currentIdx = steps.indexOf(order.status);
                  const isActive = i <= currentIdx && order.status !== 'cancelled';
                  return (
                    <React.Fragment key={step}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-dark-600 text-gray-400'}`}>
                        {i === 0 && <CreditCard size={14} />}
                        {i === 1 && <Package size={14} />}
                        {i === 2 && <Truck size={14} />}
                        {i === 3 && <MapPin size={14} />}
                      </div>
                      {i < 3 && <div className={`flex-1 h-1 rounded ${isActive && i < currentIdx ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-dark-600'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-mocha-500 dark:text-mocha-400">
                <span>Ödeme</span>
                <span>Hazırlanıyor</span>
                <span>Kargoda</span>
                <span>Teslim</span>
              </div>

              {/* Kargo Takip */}
              {(order.shipping?.trackingNumber || order.tracking?.trackingNumber) && (
                <div className="mt-4 p-3 bg-cream-50 dark:bg-dark-700 rounded-xl">
                  <p className="text-sm text-mocha-600 dark:text-mocha-400">
                    <strong>Kargo Takip:</strong>{' '}
                    {order.tracking?.carrier || order.shipping?.carrier || 'Kargo'} -{' '}
                    {order.tracking?.trackingNumber || order.shipping?.trackingNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Ürünler */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-mocha-900 dark:text-white mb-3 flex items-center gap-2">
                <ShoppingBag size={16} />
                Sipariş Özeti
              </h3>
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-cream-100 dark:border-dark-600 last:border-0">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-mocha-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-mocha-500">{item.quantity} adet</p>
                    </div>
                    <p className="text-sm font-bold text-mocha-900 dark:text-white">
                      ₺{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Toplam */}
              <div className="border-t border-cream-200 dark:border-dark-600 pt-3 mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-mocha-500">Ara Toplam</span>
                  <span className="text-mocha-900 dark:text-white">₺{(order.payment.subtotal || 0).toFixed(2)}</span>
                </div>
                {order.payment.shipping > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-mocha-500">Kargo</span>
                    <span className="text-mocha-900 dark:text-white">₺{order.payment.shipping.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-cream-200 dark:border-dark-600">
                  <span className="text-mocha-900 dark:text-white">Toplam</span>
                  <span className="text-mocha-900 dark:text-white">₺{(order.payment.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Sipariş Detayını Görüntüle */}
            <Link
              to={`/order-confirmation/${order.firestoreId}`}
              className="block w-full py-3 bg-mocha-600 hover:bg-mocha-700 text-white rounded-xl font-medium text-center transition-colors flex items-center justify-center gap-2"
            >
              Sipariş Detayını Görüntüle
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Yardım Notu */}
        <div className="text-center mt-8">
          <p className="text-xs text-mocha-500 dark:text-mocha-400">
            Sorun yaşıyorsanız{' '}
            <a href="mailto:bilgi@sadechocolate.com" className="underline text-mocha-700 dark:text-mocha-300">
              bilgi@sadechocolate.com
            </a>{' '}
            adresinden bize ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
