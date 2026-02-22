import React, { useState, useMemo } from 'react';
import { Order } from '../../types/order';
import {
  X, MapPin, Package, Droplets, Gift, Box,
  User, Calendar, ShoppingBag, TrendingUp, Award, Heart,
  CheckCircle, AlertTriangle, Phone, Mail, Clock, Truck, Send
} from 'lucide-react';
import { BrandIcon } from '../ui/BrandIcon';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { calculateEstimatedDeliveryDate, getDeliveryStatus } from '../../utils/estimatedDelivery';
import { sendPaymentSupportEmail } from '../../services/emailService';
import { toast } from 'sonner';

interface UnifiedOrderModalProps {
  order: Order;
  allOrders: Order[];
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: Order['status']) => Promise<void>;
}

type TabType = 'order' | 'customer' | 'logistics';

export const UnifiedOrderModal: React.FC<UnifiedOrderModalProps> = ({
  order,
  allOrders,
  onClose,
  onUpdateStatus
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('order');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Ödeme sorunu destek maili gönder
  const handleSendPaymentSupportEmail = async () => {
    const email = order.customer?.email;
    if (!email) {
      toast.error('Müşteri email adresi bulunamadı');
      return;
    }

    setIsSendingEmail(true);
    try {
      // Başarısız ödeme denemesi sayısını hesapla
      const customerOrders = allOrders.filter(
        o => o.customer?.email === email
      );
      const failedAttempts = customerOrders.filter(
        o => o.payment?.status === 'failed' || o.status === 'cancelled' || o.status === 'Cancelled'
      ).length;

      await sendPaymentSupportEmail(email, {
        customerName: order.customer?.name || 'Değerli Müşterimiz',
        orderId: order.id || '',
        orderTotal: `₺${(order.payment?.total || 0).toLocaleString('tr-TR')}`,
        attemptCount: failedAttempts
      });

      setEmailSent(true);
      toast.success('Ödeme destek maili gönderildi');
    } catch (error) {
      console.error('Email gönderilemedi:', error);
      toast.error('Email gönderilemedi');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Ödeme sorunu var mı kontrol et
  const hasPaymentIssue = order.payment?.status === 'failed'
    || order.status === 'cancelled'
    || order.status === 'Cancelled'
    || (order.status === 'pending' && order.payment?.method === 'card');

  // Müşterinin tüm siparişlerini filtrele
  const customerOrders = useMemo(() =>
    allOrders.filter(o => o.customer?.email === order.customer?.email)
  , [allOrders, order.customer?.email]);

  // Müşteri analitiği
  const analytics = useMemo(() => {
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
    const orderCount = customerOrders.length;
    const avgOrderValue = totalSpent / orderCount;

    const sortedOrders = [...customerOrders].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });

    const firstOrderDate = sortedOrders[0].createdAt?.toDate?.() || new Date(sortedOrders[0].createdAt);
    const lastOrderDate = sortedOrders[sortedOrders.length - 1].createdAt?.toDate?.() || new Date(sortedOrders[sortedOrders.length - 1].createdAt);

    const tenureDays = Math.floor((new Date().getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastOrder = Math.floor((new Date().getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

    // RFM Skoru
    const recencyScore = Math.max(0, 40 - (daysSinceLastOrder / 3));
    const frequencyScore = Math.min(30, orderCount * 3);
    const monetaryScore = Math.min(30, totalSpent / 250);
    const rfmScore = Math.round(recencyScore + frequencyScore + monetaryScore);

    const referralCount = (order.customer as any)?.referralCount || 0;

    let ambassadorLevel = '';
    if (referralCount >= 10) ambassadorLevel = 'Süper Ambassador';
    else if (referralCount >= 5) ambassadorLevel = 'Marka Elçisi';
    else if (referralCount >= 3) ambassadorLevel = 'Rising Star';

    const allAttributes: string[] = [];
    customerOrders.forEach(o => {
      o.items.forEach(item => {
        if ((item as any).attributes) {
          allAttributes.push(...(item as any).attributes);
        }
      });
    });
    const tasteDNA = [...new Set(allAttributes)].slice(0, 3);

    return {
      totalSpent,
      orderCount,
      avgOrderValue,
      firstOrderDate,
      lastOrderDate,
      tenureDays,
      daysSinceLastOrder,
      rfmScore,
      referralCount,
      ambassadorLevel,
      tasteDNA,
    };
  }, [customerOrders, order.customer]);

  // AI Önerisi
  const getAIRecommendation = () => {
    const { rfmScore, daysSinceLastOrder, orderCount, totalSpent } = analytics;

    if (rfmScore < 50) {
      return {
        type: 'critical',
        icon: AlertTriangle,
        color: 'bg-red-50 border-red-200',
        iconColor: 'text-red-600',
        title: '🚨 Acil Müdahale Gerekli',
        message: `Müşteri sadakati kritik seviyede (RFM: ${rfmScore}). ${daysSinceLastOrder} gündür sipariş yok.`,
        actions: [
          '🎁 %20 indirim kuponu veya 1 ücretsiz ürün gönderin',
          '💌 Kişisel "Özledik" mesajı atın',
          '⚡ Limited edition ürün erken erişimi sunun'
        ]
      };
    } else if (rfmScore < 70) {
      return {
        type: 'warning',
        icon: Gift,
        color: 'bg-yellow-50 border-yellow-200',
        iconColor: 'text-yellow-600',
        title: '🟡 Sadakat Azalıyor',
        message: `Orta düzey müşteri (RFM: ${rfmScore}). İlgiyi artırmak için aksiyon alın.`,
        actions: [
          '🎊 Teşekkür mesajı ve yeni ürün önerileri',
          '📦 Bir sonraki siparişte ücretsiz kargo',
          '🍫 Taste DNA\'sına göre özel öneriler'
        ]
      };
    } else {
      return {
        type: 'success',
        icon: CheckCircle,
        color: 'bg-emerald-50 border-emerald-200',
        iconColor: 'text-emerald-600',
        title: '🏆 VIP Müşteri - Mükemmel!',
        message: `Yüksek sadakat (RFM: ${rfmScore}). ${orderCount} sipariş, ${totalSpent.toLocaleString()}₺ toplam harcama.`,
        actions: [
          '💎 VIP statüsünü sürdürmek için özel ilgi',
          '🎁 Yıldönümü hediyesi planlayın',
          '👑 Early access ve exclusive ürünler sunun'
        ]
      };
    }
  };

  const recommendation = getAIRecommendation();
  const RecommendationIcon = recommendation.icon;

  const sıcaklık = order.weatherAlert?.temp || 25;
  const requiresIce = order.weatherAlert?.requiresIce || sıcaklık > 20;

  const tabs = [
    { id: 'order' as TabType, label: 'Sipariş Detayları', icon: Package },
    { id: 'customer' as TabType, label: 'Müşteri Analizi', icon: User },
    { id: 'logistics' as TabType, label: 'Lojistik & Operasyon', icon: MapPin },
  ];

  const statusConfig = {
    pending: { label: 'Beklemede', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
    processing: { label: 'İşleniyor', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    shipped: { label: 'Kargoda', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    delivered: { label: 'Teslim Edildi', color: 'bg-green-50 text-green-600 border-green-200' },
    cancelled: { label: 'İptal', color: 'bg-red-50 text-red-600 border-red-200' },
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" style={{ isolation: 'isolate' }}>
      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-white shadow-sm animate-in slide-in-from-right-full duration-500 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-brown-50 to-amber-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-semibold text-mocha-900">
                  Sipariş #{order.id.substring(0, 8)}
                </h2>
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusConfig[order.status]?.color || statusConfig.pending.color}`}>
                  {statusConfig[order.status]?.label.toUpperCase() || 'BEKLEMEDE'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-mocha-600">
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {order.customer?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {format(order.createdAt?.toDate?.() || new Date(order.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                </span>
                <span className="flex items-center gap-1 font-bold text-mocha-900">
                  <ShoppingBag size={14} />
                  ₺{order.payment?.total.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white rounded-2xl transition-all"
            >
              <X size={24} className="text-mocha-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-mocha-900 text-white shadow-sm'
                      : 'bg-white text-mocha-600 hover:bg-cream-50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weather Alert */}
        {requiresIce && activeTab === 'logistics' && (
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

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8">
          {/* TAB 1: Sipariş Detayları */}
          {activeTab === 'order' && (
            <div className="space-y-6">
              {/* Ürünler */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600">
                  <Box size={20} /> Sipariş Ürünleri
                </h3>
                <div className="space-y-3 p-6 bg-cream-50 rounded-xl border border-cream-200">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-mocha-900">{item.name}</p>
                          <p className="text-xs text-mocha-500">x{item.quantity} • ₺{item.price.toFixed(2)}</p>
                          {(item as any).isLimitedEdition && (
                            <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full mt-1 inline-block">
                              LIMITED EDITION
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-mocha-600">₺{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="pt-4 border-t-2 flex justify-between items-center">
                    <span className="font-bold text-mocha-600">Toplam</span>
                    <span className="text-2xl font-semibold text-mocha-900">₺{order.payment?.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Hediye Detayları */}
              {order.giftDetails && (
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600">
                    <Gift size={20} /> Dijital Hediye Kartı
                  </h3>
                  <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-8 flex items-center justify-center border-4 border-zinc-200 shadow-sm">
                    <div className="text-center">
                      {order.giftDetails.recipientName && (
                        <p className="text-amber-400 text-sm font-bold mb-3">Kime: {order.giftDetails.recipientName}</p>
                      )}
                      <p
                        className="text-white text-lg italic leading-relaxed"
                        style={{ fontFamily: order.giftDetails.fontFamily || 'serif' }}
                      >
                        "{order.giftDetails.note}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Duyusal Profil (Placeholder) */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600">
                  <BrandIcon size={20} /> Duyusal Profil
                </h3>
                <div className="space-y-3 p-6 bg-cream-50 rounded-xl border border-cream-200">
                  <p className="text-sm text-mocha-500 italic">Ürün taste profili bilgisi eklendiğinde burada gösterilecek</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Müşteri Analizi */}
          {activeTab === 'customer' && (
            <div className="space-y-6">
              {/* RFM Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-purple-600" />
                    <span className="text-xs font-bold text-purple-600 uppercase">RFM Skoru</span>
                  </div>
                  <div className="text-4xl font-semibold text-purple-900">{analytics.rfmScore}</div>
                  <div className="mt-3 bg-white/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-1000"
                      style={{ width: `${analytics.rfmScore}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag size={18} className="text-blue-600" />
                    <span className="text-xs font-bold text-blue-600 uppercase">Sipariş</span>
                  </div>
                  <div className="text-4xl font-semibold text-blue-900">{analytics.orderCount}</div>
                  <div className="text-xs text-blue-600 mt-2">₺{analytics.avgOrderValue.toFixed(0)} ortalama</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart size={18} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-600 uppercase">Toplam</span>
                  </div>
                  <div className="text-3xl font-semibold text-emerald-900">₺{analytics.totalSpent.toLocaleString()}</div>
                  <div className="text-xs text-emerald-600 mt-2">{analytics.orderCount} siparişte</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-orange-600" />
                    <span className="text-xs font-bold text-orange-600 uppercase">Kıdem</span>
                  </div>
                  <div className="text-4xl font-semibold text-orange-900">{analytics.tenureDays}</div>
                  <div className="text-xs text-orange-600 mt-2">gün müşteri</div>
                </div>
              </div>

              {/* Müşteri Geçmişi & Özel Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cream-50 p-6 rounded-xl border border-cream-200">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-mocha-600">
                    <Calendar size={18} /> Müşteri Geçmişi
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold text-mocha-500 mb-1">İlk Sipariş</p>
                      <p className="text-sm text-mocha-900">{format(analytics.firstOrderDate, 'dd MMMM yyyy', { locale: tr })}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-mocha-500 mb-1">Son Sipariş</p>
                      <p className="text-sm text-mocha-900">{format(analytics.lastOrderDate, 'dd MMMM yyyy', { locale: tr })}</p>
                      <p className="text-xs text-mocha-400 mt-1">{analytics.daysSinceLastOrder} gün önce</p>
                    </div>
                  </div>
                </div>

                <div className="bg-cream-50 p-6 rounded-xl border border-cream-200">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-mocha-600">
                    <BrandIcon size={18} /> Özel Bilgiler
                  </h3>
                  <div className="space-y-3">
                    {analytics.referralCount > 0 && (
                      <div>
                        <p className="text-xs font-bold text-mocha-500 mb-1">Ambassador Durumu</p>
                        <div className="flex items-center gap-2">
                          <Award size={16} className="text-amber-600" />
                          <span className="text-sm font-bold text-amber-900">{analytics.ambassadorLevel}</span>
                          <span className="text-xs text-mocha-500">({analytics.referralCount} referral)</span>
                        </div>
                      </div>
                    )}
                    {analytics.tasteDNA.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-mocha-500 mb-2">Taste DNA</p>
                        <div className="flex flex-wrap gap-2">
                          {analytics.tasteDNA.map((taste, idx) => (
                            <span key={idx} className="px-3 py-1 bg-brown-100 text-mocha-900 text-xs font-bold rounded-full">
                              {taste}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Önerisi */}
              <div className={`${recommendation.color} border-2 rounded-xl p-6`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${recommendation.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <RecommendationIcon size={24} className={recommendation.iconColor} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 text-mocha-900">{recommendation.title}</h3>
                    <p className="text-sm text-mocha-600 mb-4">{recommendation.message}</p>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-mocha-600 uppercase mb-2">Önerilen Aksiyonlar:</p>
                      {recommendation.actions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-xs">•</span>
                          <span className="text-sm text-mocha-900">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Lojistik & Operasyon */}
          {activeTab === 'logistics' && (
            <div className="space-y-6">
              {/* Adres & İletişim */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600">
                  <MapPin size={20} /> Adres & İletişim
                </h3>
                <div className="space-y-4 p-6 bg-cream-50 rounded-xl border border-cream-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-mocha-500 mb-1 flex items-center gap-1">
                        <User size={12} /> Müşteri
                      </p>
                      <p className="text-sm text-mocha-900 font-medium">{order.customer?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-mocha-500 mb-1 flex items-center gap-1">
                        <Phone size={12} /> Telefon
                      </p>
                      <p className="text-sm text-mocha-900">{order.customer?.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-bold text-mocha-500 mb-1 flex items-center gap-1">
                        <Mail size={12} /> Email
                      </p>
                      <p className="text-sm text-mocha-900">{order.customer?.email}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-bold text-mocha-500 mb-1 flex items-center gap-1">
                        <MapPin size={12} /> Teslimat Adresi
                      </p>
                      <p className="text-sm text-mocha-900">{order.shipping?.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dinamik Teslimat Tarihi (EDD) */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600">
                  <Clock size={20} /> Tahmini Teslimat Tarihi
                </h3>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
                  {(() => {
                    const edd = calculateEstimatedDeliveryDate(order);
                    const deliveryStatus = getDeliveryStatus(order);
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 ${deliveryStatus.bgColor} rounded-2xl flex items-center justify-center text-3xl`}>
                            {deliveryStatus.emoji}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${deliveryStatus.color} uppercase mb-1`}>
                              {deliveryStatus.status}
                            </p>
                            <p className="text-2xl font-semibold text-mocha-900">
                              {format(edd, 'dd MMMM yyyy, EEEE', { locale: tr })}
                            </p>
                            <p className="text-xs text-mocha-500 mt-1">
                              {format(edd, 'HH:mm', { locale: tr })} civarı
                            </p>
                          </div>
                        </div>

                        {/* EDD Açıklama */}
                        <div className="bg-white/60 p-4 rounded-2xl border border-purple-100">
                          <p className="text-xs text-mocha-600 leading-relaxed">
                            <strong>Not:</strong> Bu tarih, sipariş hazırlama süresi, kargo süresi ve hava koşulları dikkate alınarak hesaplanmıştır.
                            {order.weatherAlert?.requiresIce && (
                              <span className="text-orange-600 font-bold"> Yüksek sıcaklık nedeniyle özel paketleme süresi eklenmiştir.</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Kargo Durumu */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-mocha-600">
                  <Package size={20} /> Lojistik Durumu
                </h3>
                <div className="space-y-4 p-6 bg-cream-50 rounded-xl border border-cream-200">
                  <div>
                    <p className="text-xs font-bold text-mocha-500 mb-2 flex items-center gap-1">
                      <Truck size={12} /> Kargo Takip No
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Kargo takip numarasını girin"
                        defaultValue={order.logistics?.trackingNumber || ''}
                        className="flex-1 p-3 border border-cream-200 rounded-xl text-sm focus:ring-2 focus:ring-brown-900/20 outline-none"
                      />
                      {order.logistics?.trackingNumber && (
                        <a
                          href={`/track/${order.logistics.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-3 bg-mocha-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
                        >
                          TAKİP ET
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-mocha-500 mb-2">Kargo Firması</p>
                    <p className="text-sm text-mocha-900 p-3 bg-cream-50 rounded-xl">
                      {order.tracking?.carrier || order.shipping?.carrier || 'Henüz atanmadı'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-mocha-500 mb-2">Ödeme Yöntemi</p>
                    <p className="text-sm text-mocha-900">{order.paymentMethod || 'Kredi Kartı'}</p>
                  </div>

                  {/* Ödeme Sorunu Destek Maili */}
                  {hasPaymentIssue && (
                    <div className="col-span-2 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-amber-800 flex items-center gap-2 mb-1">
                            <AlertTriangle size={14} />
                            ÖDEME SORUNU TESPİT EDİLDİ
                          </p>
                          <p className="text-xs text-amber-600">
                            {order.payment?.failureReason || 'Ödeme başarısız olmuş veya tamamlanmamış'}
                            {order.payment?.retryCount ? ` (${order.payment.retryCount} deneme)` : ''}
                          </p>
                        </div>
                        <button
                          onClick={handleSendPaymentSupportEmail}
                          disabled={isSendingEmail || emailSent}
                          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm ${
                            emailSent
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default'
                              : isSendingEmail
                                ? 'bg-amber-100 text-amber-600 cursor-wait'
                                : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95'
                          }`}
                        >
                          {emailSent ? (
                            <>
                              <CheckCircle size={14} />
                              Mail Gönderildi
                            </>
                          ) : isSendingEmail ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              Gönderiliyor...
                            </>
                          ) : (
                            <>
                              <Send size={14} />
                              Ödeme Destek Maili Gönder
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Kargo Maliyet Analizi - Sadece Admin Görür */}
                  {(order.tracking?.price || order.payment?.shipping !== undefined) && (
                    <div className="col-span-2 mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                      <p className="text-xs font-black text-blue-800 mb-3 flex items-center gap-2">
                        <TrendingUp size={14} />
                        KARGO MALİYET ANALİZİ
                        {order.tracking?.carrier && (
                          <span className="text-xs font-normal text-blue-600">({order.tracking.carrier})</span>
                        )}
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                          <p className="text-xs text-mocha-500 mb-1">Müşteriden Alınan</p>
                          <p className="text-lg font-black text-mocha-900">
                            {order.payment?.shipping ?? 0}₺
                          </p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                          <p className="text-xs text-mocha-500 mb-1">Gerçek Maliyet</p>
                          <p className="text-lg font-black text-mocha-900">
                            {order.tracking?.price
                              ? `${order.tracking.price.toFixed(2)}₺`
                              : <span className="text-xs text-mocha-400">Kargo oluşturulmadı</span>
                            }
                          </p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                          <p className="text-xs text-mocha-500 mb-1">Kar/Zarar</p>
                          {(() => {
                            const customerPaid = order.payment?.shipping ?? 0;
                            const actualCost = order.tracking?.price;
                            if (!actualCost) return <p className="text-lg font-black text-mocha-400">-</p>;
                            const profit = customerPaid - actualCost;
                            return (
                              <p className={`text-lg font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {profit >= 0 ? '+' : ''}{profit.toFixed(0)}₺
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                      {order.tracking?.createdAt && (
                        <p className="text-xs text-mocha-400 mt-2 text-right">
                          Kargo: {new Date(order.tracking.createdAt).toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-mocha-500 mb-2">Sipariş Durumu Güncelle</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <button
                          key={status}
                          onClick={() => onUpdateStatus?.(order.id, status as Order['status'])}
                          disabled={order.status === status}
                          className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                            order.status === status
                              ? config.color + ' border'
                              : 'bg-cream-100 text-mocha-400 hover:bg-cream-50'
                          } disabled:cursor-not-allowed`}
                        >
                          {config.label.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-cream-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-mocha-600 hover:bg-cream-50 rounded-2xl transition-colors"
          >
            Kapat
          </button>
          <button className="px-8 py-3 text-sm font-bold text-white bg-mocha-900 hover:bg-black rounded-2xl transition-colors shadow-sm">
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};
