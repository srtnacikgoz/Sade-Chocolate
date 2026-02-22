import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types/order';
import { CheckCircle, Package, Truck, MapPin, CreditCard, ArrowRight, Home, ShoppingBag, Loader } from 'lucide-react';
import { trackPixelPurchase } from '../services/metaPixelService';
import { trackPurchase } from '../services/analyticsService';
import { trackOrderCompleted } from '../services/visitorTrackingService';

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Sipariş numarası bulunamadı');
        setLoading(false);
        return;
      }

      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));

        if (!orderDoc.exists()) {
          setError('Sipariş bulunamadı');
          setLoading(false);
          return;
        }

        const orderData = { ...orderDoc.data(), firestoreId: orderDoc.id } as Order;
        setOrder(orderData);

        // Tracking event'leri (sadece ilk yüklemede, session check ile)
        const purchaseTracked = sessionStorage.getItem(`purchase_tracked_${orderId}`);
        if (!purchaseTracked && orderData.items?.length) {
          const orderItems = orderData.items.map((item) => ({
            id: item.id,
            quantity: item.quantity || 1,
            price: item.price || 0
          }));
          const total = orderData.payment?.total || 0;

          // Meta Pixel Purchase (pixelEventId varsa CAPI ile deduplication sağlanır)
          const pixelEventId = (orderData as any).pixelEventId;
          trackPixelPurchase({ orderId: orderId!, items: orderItems, total, eventId: pixelEventId });

          // GA4 Purchase
          trackPurchase(
            orderId!,
            orderItems.map((i) => ({ item_id: i.id, item_name: '', price: i.price, quantity: i.quantity })),
            total,
            orderData.payment?.shipping || 0
          );

          // Visitor Tracking - Sipariş tamamlandı (3D Secure redirect sonrası)
          trackOrderCompleted(orderData.id || orderId!).catch((err) => {
            console.warn('Order completion tracking failed:', err);
          });

          sessionStorage.setItem(`purchase_tracked_${orderId}`, 'true');
        }
      } catch (err) {
        console.error('Order fetch error:', err);
        setError('Sipariş bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-mocha-600 animate-spin mx-auto mb-4" />
          <p className="text-mocha-600 dark:text-mocha-300">Sipariş bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-mocha-900 dark:text-white mb-2">
            {error || 'Sipariş bulunamadı'}
          </h1>
          <p className="text-mocha-600 dark:text-mocha-400 mb-6">
            Sipariş bilgilerine ulaşılamadı. Lütfen hesabınızdan siparişlerinizi kontrol edin.
          </p>
          <div className="flex gap-3">
            <Link
              to="/"
              className="flex-1 py-3 px-4 bg-cream-100 dark:bg-dark-700 text-mocha-700 dark:text-mocha-300 rounded-xl font-medium hover:bg-cream-200 dark:hover:bg-dark-600 transition-colors"
            >
              Ana Sayfa
            </Link>
            <Link
              to="/account"
              className="flex-1 py-3 px-4 bg-mocha-600 text-white rounded-xl font-medium hover:bg-mocha-700 transition-colors"
            >
              Siparişlerim
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = order.payment?.status === 'paid';
  const isCard = order.payment?.method === 'card';

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100 dark:from-dark-900 dark:to-dark-800 py-8 px-4"
      style={{ paddingTop: 'calc(var(--top-bar-height, 0px) + var(--header-height, 80px) + 32px)' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-xl mb-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-mocha-900 dark:text-white mb-2">
            Siparişiniz Alındı!
          </h1>

          <p className="text-mocha-600 dark:text-mocha-400 mb-4">
            Teşekkür ederiz, {order.customer?.name?.split(' ')[0] || 'Değerli Müşterimiz'}!
          </p>

          <div className="inline-flex items-center gap-2 bg-mocha-100 dark:bg-dark-700 px-4 py-2 rounded-full">
            <span className="text-sm text-mocha-600 dark:text-mocha-400">Sipariş No:</span>
            <span className="font-bold text-mocha-900 dark:text-white">{order.id}</span>
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-xl mb-6">
          <h2 className="text-lg font-bold text-mocha-900 dark:text-white mb-4 flex items-center gap-2">
            <Package size={20} />
            Sipariş Durumu
          </h2>

          <div className="flex items-center gap-4">
            {/* Status Steps */}
            <div className="flex-1">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPaid ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                  <CreditCard size={18} />
                </div>
                <div className={`flex-1 h-1 ${isPaid ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-dark-600'}`} />
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPaid ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-dark-600 text-gray-400'}`}>
                  <Package size={18} />
                </div>
                <div className="flex-1 h-1 bg-gray-200 dark:bg-dark-600" />
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-dark-600 text-gray-400">
                  <Truck size={18} />
                </div>
                <div className="flex-1 h-1 bg-gray-200 dark:bg-dark-600" />
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-dark-600 text-gray-400">
                  <MapPin size={18} />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-mocha-600 dark:text-mocha-400">
                <span>{isPaid ? 'Ödendi' : 'Ödeme Bekleniyor'}</span>
                <span>Hazırlanıyor</span>
                <span>Kargoda</span>
                <span>Teslim</span>
              </div>
            </div>
          </div>

          {!isPaid && order.payment?.method === 'eft' && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Havale/EFT ile ödeme:</strong> Ödemenizi yaptıktan sonra siparişiniz onaylanacaktır.
              </p>
            </div>
          )}
        </div>

        {/* Payment Info */}
        {isCard && isPaid && (
          <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-xl mb-6">
            <h2 className="text-lg font-bold text-mocha-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Ödeme Bilgileri
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-cream-200 dark:border-dark-600">
                <span className="text-mocha-600 dark:text-mocha-400">Ödeme Yöntemi</span>
                <span className="font-medium text-mocha-900 dark:text-white">Kredi Kartı</span>
              </div>
              {order.payment?.cardAssociation && (
                <div className="flex justify-between items-center py-2 border-b border-cream-200 dark:border-dark-600">
                  <span className="text-mocha-600 dark:text-mocha-400">Kart</span>
                  <span className="font-medium text-mocha-900 dark:text-white">
                    {order.payment.cardAssociation} **** {order.payment.lastFourDigits}
                  </span>
                </div>
              )}
              {order.payment?.iyzicoPaymentId && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-mocha-600 dark:text-mocha-400">İşlem No</span>
                  <span className="font-mono text-sm text-mocha-900 dark:text-white">
                    {order.payment.iyzicoPaymentId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-xl mb-6">
          <h2 className="text-lg font-bold text-mocha-900 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBag size={20} />
            Sipariş Özeti
          </h2>

          {/* Items */}
          <div className="space-y-3 mb-4">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center gap-3 py-2 border-b border-cream-100 dark:border-dark-600 last:border-0">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-xl"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-mocha-900 dark:text-white text-sm">{item.name}</p>
                  <p className="text-xs text-mocha-500 dark:text-mocha-400">
                    {item.quantity} adet
                  </p>
                </div>
                <p className="font-bold text-mocha-900 dark:text-white">
                  ₺{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-cream-200 dark:border-dark-600 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-mocha-600 dark:text-mocha-400">Ara Toplam</span>
              <span className="text-mocha-900 dark:text-white">₺{order.payment?.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            {order.payment?.shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-mocha-600 dark:text-mocha-400">Kargo</span>
                <span className="text-mocha-900 dark:text-white">₺{order.payment.shipping.toFixed(2)}</span>
              </div>
            )}
            {order.payment?.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>İndirim</span>
                <span>-₺{order.payment.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-cream-200 dark:border-dark-600">
              <span className="text-mocha-900 dark:text-white">Toplam</span>
              <span className="text-mocha-900 dark:text-white">₺{order.payment?.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {order.shipping && (
          <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-xl mb-6">
            <h2 className="text-lg font-bold text-mocha-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Teslimat Adresi
            </h2>

            <div className="text-mocha-700 dark:text-mocha-300">
              <p className="font-medium">{order.customer?.name}</p>
              <p className="text-sm mt-1">{order.shipping.address}</p>
              <p className="text-sm">{order.shipping.district}, {order.shipping.city}</p>
              {order.customer?.phone && (
                <p className="text-sm mt-2 text-mocha-500">{order.customer.phone}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            to="/"
            className="flex-1 py-4 px-6 bg-white dark:bg-dark-800 text-mocha-700 dark:text-mocha-300 rounded-2xl font-medium hover:bg-cream-100 dark:hover:bg-dark-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Home size={18} />
            Ana Sayfa
          </Link>
          <Link
            to="/catalog"
            className="flex-1 py-4 px-6 bg-mocha-900 text-white rounded-2xl font-semibold hover:bg-mocha-400 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <span>Alışverişe Devam</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Email Notice */}
        <p className="text-center text-sm text-mocha-500 dark:text-mocha-400 mt-6">
          Sipariş detayları <strong>{order.customer?.email}</strong> adresine gönderildi.
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmation;
