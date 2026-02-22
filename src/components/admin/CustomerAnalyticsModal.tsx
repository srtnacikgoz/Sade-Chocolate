import React, { useMemo } from 'react';
import { Order } from './tabs/OrdersTab';
import { X, User, Calendar, ShoppingBag, TrendingUp, Award, Heart, Gift, AlertTriangle, CheckCircle } from 'lucide-react';
import { BrandIcon } from '../ui/BrandIcon';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CustomerAnalyticsModalProps {
  customerEmail: string;
  allOrders: Order[];
  onClose: () => void;
}

export const CustomerAnalyticsModal: React.FC<CustomerAnalyticsModalProps> = ({
  customerEmail,
  allOrders,
  onClose
}) => {
  // Müşterinin tüm siparişlerini filtrele
  const customerOrders = useMemo(() =>
    allOrders.filter(order => order.customerInfo.email === customerEmail)
  , [allOrders, customerEmail]);

  if (customerOrders.length === 0) {
    return null;
  }

  const customer = customerOrders[0].customerInfo;

  // Analiz hesaplamaları
  const analytics = useMemo(() => {
    const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
    const orderCount = customerOrders.length;
    const avgOrderValue = totalSpent / orderCount;

    // Tarihleri sırala
    const sortedOrders = [...customerOrders].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });

    const firstOrderDate = sortedOrders[0].createdAt?.toDate?.() || new Date(sortedOrders[0].createdAt);
    const lastOrderDate = sortedOrders[sortedOrders.length - 1].createdAt?.toDate?.() || new Date(sortedOrders[sortedOrders.length - 1].createdAt);

    // Müşteri kıdemi (gün olarak)
    const tenureDays = Math.floor((new Date().getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24));

    // Son siparişten bu yana geçen gün
    const daysSinceLastOrder = Math.floor((new Date().getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

    // RFM Skoru hesaplama (basitleştirilmiş)
    // R (Recency): Son sipariş ne kadar yakın? (0-40 puan)
    const recencyScore = Math.max(0, 40 - (daysSinceLastOrder / 3));

    // F (Frequency): Ne kadar sık sipariş veriyor? (0-30 puan)
    const frequencyScore = Math.min(30, orderCount * 3);

    // M (Monetary): Ne kadar harcıyor? (0-30 puan)
    const monetaryScore = Math.min(30, totalSpent / 250);

    const rfmScore = Math.round(recencyScore + frequencyScore + monetaryScore);

    // Referral count (seed data'dan gelecek)
    const referralCount = (customer as any).referralCount || 0;

    // Ambassador seviyesi
    let ambassadorLevel = '';
    if (referralCount >= 10) ambassadorLevel = 'Süper Ambassador';
    else if (referralCount >= 5) ambassadorLevel = 'Marka Elçisi';
    else if (referralCount >= 3) ambassadorLevel = 'Rising Star';

    // Taste DNA - En çok satın alınan ürün attributeları
    const allAttributes: string[] = [];
    customerOrders.forEach(order => {
      order.items.forEach(item => {
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
  }, [customerOrders, customer]);

  // AI Öneri mantığı
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

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b bg-gradient-to-r from-brown-50 to-amber-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-mocha-900 rounded-2xl flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-mocha-900">{customer.name}</h2>
                <p className="text-sm text-mocha-500">{customer.email}</p>
                <p className="text-xs text-mocha-400 mt-1">{customer.phone}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white rounded-2xl transition-all"
            >
              <X size={24} className="text-mocha-400" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* RFM Skoru ve Temel Metrikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-purple-600" />
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
                <ShoppingBag size={20} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-600 uppercase">Sipariş Sayısı</span>
              </div>
              <div className="text-4xl font-semibold text-blue-900">{analytics.orderCount}</div>
              <div className="text-xs text-blue-600 mt-2">₺{analytics.avgOrderValue.toFixed(0)} ortalama sepet</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Heart size={20} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-600 uppercase">Toplam Harcama</span>
              </div>
              <div className="text-4xl font-semibold text-emerald-900">₺{analytics.totalSpent.toLocaleString()}</div>
              <div className="text-xs text-emerald-600 mt-2">{analytics.orderCount} siparişte</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={20} className="text-orange-600" />
                <span className="text-xs font-bold text-orange-600 uppercase">Kıdem</span>
              </div>
              <div className="text-4xl font-semibold text-orange-900">{analytics.tenureDays}</div>
              <div className="text-xs text-orange-600 mt-2">gün müşterimiz</div>
            </div>
          </div>

          {/* Zaman Çizelgesi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

            {/* Ambassador & Taste DNA */}
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

        {/* Footer */}
        <div className="p-6 border-t bg-cream-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-8 py-3 text-sm font-bold text-mocha-600 bg-white hover:bg-cream-50 rounded-2xl transition-all"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
