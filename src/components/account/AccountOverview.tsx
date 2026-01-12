// components/account/AccountOverview.tsx
// Hesap genel bakış dashboard'u

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Award,
  Gift,
  MapPin,
  ArrowRight,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import { BrandIcon } from '../ui/BrandIcon';
import { useLoyaltyStore } from '../../stores/loyaltyStore';
import type { Order } from '../../context/UserContext';
import type { AccountView } from './AccountSidebar';

interface AccountOverviewProps {
  user: {
    displayName?: string;
    firstName?: string;
    email?: string;
  } | null;
  orders: Order[];
  onNavigate: (view: AccountView) => void;
}

// Sipariş durumu badge'i
const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const config: Record<Order['status'], { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Beklemede', color: 'bg-amber-100 text-amber-700', icon: Clock },
    processing: { label: 'İşleniyor', color: 'bg-blue-100 text-blue-700', icon: Package },
    preparing: { label: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-700', icon: Package },
    shipped: { label: 'Kargoda', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
    delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  };

  const { label, color, icon: Icon } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

export const AccountOverview: React.FC<AccountOverviewProps> = ({
  user,
  orders,
  onNavigate
}) => {
  const { currentCustomer, config } = useLoyaltyStore();
  const displayName = user?.displayName || user?.firstName || user?.email?.split('@')[0] || 'Değerli Müşterimiz';

  // İstatistikler
  const totalOrders = orders.length;
  const availablePoints = currentCustomer?.availablePoints || 0;
  const currentTier = currentCustomer?.currentTier || 'Bronze';

  // Sonraki tier hesaplama
  // config.tiers bir Record<LoyaltyTier, TierConfig> objesi
  const tiersObj = config?.tiers || {};
  const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const currentTierIndex = tierOrder.indexOf(currentTier);
  const nextTierName = tierOrder[currentTierIndex + 1];
  const nextTier = nextTierName ? tiersObj[nextTierName as keyof typeof tiersObj] : null;
  const pointsToNextTier = nextTier
    ? Math.max(0, nextTier.minPoints - (currentCustomer?.lifetimePoints || 0))
    : 0;

  // Son 3 sipariş
  const recentOrders = orders
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Para formatla
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price);
  };

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hoş Geldin Başlığı */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          Hoş Geldin, <span className="text-gold">{displayName.split(' ')[0]}</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">Hesabınızın genel durumuna buradan göz atabilirsiniz.</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Toplam Sipariş */}
        <button
          onClick={() => onNavigate('orders')}
          className="group bg-white dark:bg-dark-800 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 text-left hover:border-gold/50 hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShoppingBag className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gold group-hover:translate-x-1 transition-all hidden sm:block" />
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Toplam Sipariş</p>
          </div>
        </button>

        {/* Sadakat Puanı */}
        <button
          onClick={() => onNavigate('loyalty')}
          className="group bg-white dark:bg-dark-800 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 text-left hover:border-gold/50 hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
              <Award className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gold group-hover:translate-x-1 transition-all hidden sm:block" />
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {availablePoints.toLocaleString('tr-TR')}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Kullanılabilir Puan</p>
          </div>
        </button>

        {/* Tier / Sonraki Avantaj */}
        <button
          onClick={() => onNavigate('loyalty')}
          className="col-span-2 sm:col-span-1 group bg-gradient-to-br from-gold/5 to-amber-50 dark:from-gold/10 dark:to-amber-900/10 border border-gold/20 rounded-2xl p-4 sm:p-5 text-left hover:border-gold/50 hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
              <Gift className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-gold bg-gold/10 px-2 py-1 rounded-full">
              {currentTier}
            </span>
          </div>
          <div className="mt-3 sm:mt-4">
            {nextTier ? (
              <>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {pointsToNextTier.toLocaleString('tr-TR')} puan
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{nextTierName} seviyesine</p>
              </>
            ) : (
              <>
                <p className="text-base sm:text-lg font-bold text-gold">En Üst Seviye</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Tebrikler!</p>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Son Siparişler */}
      <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Son Siparişler
          </h2>
          {orders.length > 3 && (
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs sm:text-sm text-gold font-medium hover:underline flex items-center gap-1"
            >
              Tümünü Gör <ArrowRight size={14} />
            </button>
          )}
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => onNavigate('orders')}
                className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-dark-700 active:bg-gray-100 dark:active:bg-dark-600 transition-colors text-left"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-dark-700 flex-shrink-0 flex items-center justify-center text-gray-400">
                  <Package className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                      #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                    {formatDate(order.date)} • {order.items?.length || 0} ürün
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                    {formatPrice(order.total)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">Henüz sipariş vermediniz</p>
            <Link
              to="/katalog"
              className="inline-flex items-center gap-2 text-gold font-medium hover:underline"
            >
              Alışverişe Başla <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Hızlı Aksiyonlar */}
      <div>
        <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Hızlı Aksiyonlar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Adres Ekle */}
          <button
            onClick={() => onNavigate('addresses')}
            className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-dark-800 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gold/50 active:bg-gray-50 dark:active:bg-dark-700 transition-all"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-gray-500 group-hover:bg-gold group-hover:text-white transition-all">
              <MapPin className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
            <span className="font-medium text-sm sm:text-base text-gray-700 dark:text-gray-300 group-hover:text-gold transition-colors">
              Adres Yönet
            </span>
          </button>

          {/* Damak Tadı Quiz */}
          <Link
            to="/tasting-quiz"
            className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-dark-800 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gold/50 active:bg-gray-50 dark:active:bg-dark-700 transition-all"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
              <BrandIcon size={18} />
            </div>
            <span className="font-medium text-sm sm:text-base text-gray-700 dark:text-gray-300 group-hover:text-gold transition-colors">
              Damak Tadı Testi
            </span>
          </Link>

          {/* Arkadaş Davet */}
          <button
            onClick={() => onNavigate('loyalty')}
            className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-dark-800 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gold/50 active:bg-gray-50 dark:active:bg-dark-700 transition-all"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-gray-500 group-hover:bg-gold group-hover:text-white transition-all">
              <Users className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
            <span className="font-medium text-sm sm:text-base text-gray-700 dark:text-gray-300 group-hover:text-gold transition-colors">
              Arkadaş Davet Et
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountOverview;
