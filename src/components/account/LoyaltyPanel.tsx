import React, { useEffect, useState } from 'react';
import { useLoyaltyStore } from '../../stores/loyaltyStore';
import { useUser } from '../../context/UserContext';
import type { LoyaltyTier } from '../../types/loyalty';
import { Gift, Star, Truck, Clock, Sparkles, AlertTriangle, Copy, Check, Share2, MessageCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

const TIER_COLORS: Record<LoyaltyTier, { bg: string; text: string; border: string; gradient: string }> = {
  Bronze: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', gradient: 'from-amber-100 to-amber-50' },
  Silver: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', gradient: 'from-slate-200 to-slate-100' },
  Gold: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', gradient: 'from-yellow-100 to-yellow-50' },
  Platinum: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', gradient: 'from-indigo-100 to-indigo-50' }
};

const TIER_ICONS: Record<LoyaltyTier, string> = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🏆',
  Platinum: '💎'
};

const TIER_ORDER: LoyaltyTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];

export const LoyaltyPanel: React.FC = () => {
  const { user } = useUser();
  const {
    currentCustomer,
    config,
    pointsHistory,
    isLoading,
    initialize,
    loadCustomer,
    getPointsBreakdown
  } = useLoyaltyStore();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user?.email && !currentCustomer) {
      loadCustomer(user.email, user.displayName || user.firstName);
    }
  }, [user, currentCustomer, loadCustomer]);

  if (isLoading || !currentCustomer || !config) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { available, expiring, lifetime } = getPointsBreakdown();
  const tierConfig = config.tiers[currentCustomer.tierLevel];
  const colors = TIER_COLORS[currentCustomer.tierLevel];
  const currentTierIndex = TIER_ORDER.indexOf(currentCustomer.tierLevel);
  const nextTier = currentTierIndex < 3 ? TIER_ORDER[currentTierIndex + 1] : null;
  const nextTierConfig = nextTier ? config.tiers[nextTier] : null;

  // Progress to next tier
  const progressToNext = nextTierConfig
    ? Math.min(100, (currentCustomer.totalSpent / nextTierConfig.minSpent) * 100)
    : 100;
  const amountToNextTier = nextTierConfig
    ? Math.max(0, nextTierConfig.minSpent - currentCustomer.totalSpent)
    : 0;

  // Annual spending progress for tier maintenance
  const annualSpent = currentCustomer.annualSpent || 0;
  const annualRequirement = tierConfig.annualSpentRequirement || 0;
  const annualProgress = annualRequirement > 0
    ? Math.min(100, (annualSpent / annualRequirement) * 100)
    : 100;
  const annualRemaining = Math.max(0, annualRequirement - annualSpent);

  // Points value in TL
  const pointsValueTL = Math.floor(available / config.pointsToLiraRatio);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(currentCustomer.referralCode);
    setCopied(true);
    toast.success('Referans kodu kopyalandı!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tier Badge & Points Hero */}
      <div className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br ${colors.gradient} p-8 border ${colors.border}`}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-3xl ${colors.bg} flex items-center justify-center text-4xl shadow-lg`}>
              {TIER_ICONS[currentCustomer.tierLevel]}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Üyelik Seviyeniz</p>
              <h2 className={`font-display text-3xl lg:text-4xl font-bold italic ${colors.text}`}>
                {currentCustomer.tierLevel}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(currentCustomer.tierSince).toLocaleDateString('tr-TR')} tarihinden beri
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Kullanılabilir Puan</p>
            <p className="font-display text-5xl font-bold text-brown-900 dark:text-gold italic">
              {available.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">= ₺{pointsValueTL.toLocaleString()} değerinde</p>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 opacity-10">
          <Sparkles size={160} className={colors.text} />
        </div>
      </div>

      {/* Point Expiration Info - Always Visible */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl ${
        expiring > 0
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          : 'bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30'
      }`}>
        {expiring > 0 ? (
          <AlertTriangle size={24} className="text-red-500 shrink-0" />
        ) : (
          <Clock size={24} className="text-amber-500 shrink-0" />
        )}
        <div className="flex-1">
          {expiring > 0 ? (
            <>
              <p className="font-bold text-red-700 dark:text-red-400">
                {expiring.toLocaleString()} puanınız 30 gün içinde sona erecek!
              </p>
              <p className="text-xs text-red-500 dark:text-red-400/80 mt-0.5">
                Hemen kullanın ve ₺{Math.floor(expiring / config.pointsToLiraRatio)} indirim kazanın.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Puanlarınız {config.pointsExpiryMonths} ay geçerlidir
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-0.5">
                Kullanılmayan puanlar {config.pointsExpiryMonths} ay sonra otomatik silinir. Düzenli alışveriş yaparak puanlarınızı aktif tutun!
              </p>
            </>
          )}
        </div>
      </div>

      {/* Puan vs Harcama Açıklaması */}
      <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 dark:text-blue-300">
          <p><strong>Puan</strong> = Alışverişlerde kullanabileceğiniz ödül ({config.pointsToLiraRatio} puan = ₺1)</p>
          <p className="mt-1"><strong>Seviye</strong> = Toplam harcamanıza göre belirlenir (puanlardan bağımsız)</p>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Tier Progress */}
        {nextTier && (
          <div className="bg-white dark:bg-dark-800 rounded-[24px] border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Sonraki Seviye</h3>
              <span className={`text-lg ${TIER_COLORS[nextTier].text}`}>{TIER_ICONS[nextTier]} {nextTier}</span>
            </div>
            <p className="text-[10px] text-gray-400 mb-3">
              Toplam harcama: ₺{currentCustomer.totalSpent.toLocaleString()} / ₺{nextTierConfig?.minSpent.toLocaleString()}
            </p>
            <div className="h-3 bg-gray-100 dark:bg-dark-900 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full transition-all duration-1000"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-bold text-brown-900 dark:text-gold">₺{amountToNextTier.toLocaleString()}</span> daha harcama yap, {nextTier} seviyesine ulaş!
            </p>
          </div>
        )}

        {/* Annual Maintenance (if not Bronze) */}
        {currentCustomer.tierLevel !== 'Bronze' && annualRequirement > 0 && (
          <div className="bg-white dark:bg-dark-800 rounded-[24px] border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Seviye Koruma</h3>
              <Clock size={18} className="text-gray-400" />
            </div>
            <div className="h-3 bg-gray-100 dark:bg-dark-900 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${annualProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${annualProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              {annualProgress >= 100 ? (
                <span className="text-emerald-600 font-bold">Seviyeniz güvende!</span>
              ) : (
                <>
                  <span className="font-bold text-brown-900 dark:text-gold">₺{annualRemaining.toLocaleString()}</span> daha harca, seviyeni koru!
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Tier Benefits */}
      <div className="bg-white dark:bg-dark-800 rounded-[32px] border border-gray-100 dark:border-gray-700 p-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">
          {currentCustomer.tierLevel} Avantajlarınız
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Gift size={20} />,
              label: 'Doğum Günü',
              value: `%${tierConfig.birthdayDiscount} İndirim`,
              active: true
            },
            {
              icon: <Star size={20} />,
              label: 'Bonus Puan',
              value: tierConfig.fixedBonusPoints > 0 ? `+${tierConfig.fixedBonusPoints} puan/sipariş` : 'Standart',
              active: tierConfig.fixedBonusPoints > 0
            },
            {
              icon: <Truck size={20} />,
              label: 'Kargo',
              value: tierConfig.freeShippingThreshold === null ? 'Ücretsiz' : `₺${tierConfig.freeShippingThreshold}+`,
              active: tierConfig.freeShippingThreshold === null || tierConfig.freeShippingThreshold < 500
            },
            {
              icon: <Sparkles size={20} />,
              label: 'Özel Erişim',
              value: tierConfig.exclusiveAccess ? 'Aktif' : 'Pasif',
              active: tierConfig.exclusiveAccess
            }
          ].map((benefit, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border transition-all ${
                benefit.active
                  ? 'bg-gold/5 border-gold/20 text-brown-900 dark:text-gold'
                  : 'bg-gray-50 dark:bg-dark-900 border-gray-100 dark:border-gray-700 text-gray-400'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                benefit.active ? 'bg-gold/10 text-gold' : 'bg-gray-100 dark:bg-dark-800'
              }`}>
                {benefit.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{benefit.label}</p>
              <p className="font-bold text-sm">{benefit.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All Tiers Overview */}
      <div className="bg-white dark:bg-dark-800 rounded-[32px] border border-gray-100 dark:border-gray-700 p-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Tüm Seviyeler</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TIER_ORDER.map((tier) => {
            const tc = config.tiers[tier];
            const isActive = tier === currentCustomer.tierLevel;
            const isPast = TIER_ORDER.indexOf(tier) < currentTierIndex;
            const isFuture = TIER_ORDER.indexOf(tier) > currentTierIndex;

            return (
              <div
                key={tier}
                className={`relative p-5 rounded-2xl border-2 transition-all ${
                  isActive
                    ? `${TIER_COLORS[tier].bg} ${TIER_COLORS[tier].border} ring-2 ring-offset-2 ring-gold/30`
                    : isPast
                      ? 'bg-gray-50 dark:bg-dark-900 border-gray-200 dark:border-gray-700 opacity-50'
                      : 'bg-gray-50 dark:bg-dark-900 border-gray-200 dark:border-gray-700'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-2 -right-2 bg-gold text-black text-[8px] font-black px-2 py-1 rounded-full">
                    SİZ
                  </span>
                )}
                <div className="text-2xl mb-2">{TIER_ICONS[tier]}</div>
                <h4 className={`font-bold text-sm ${isActive ? TIER_COLORS[tier].text : 'text-gray-600 dark:text-gray-400'}`}>
                  {tier}
                </h4>
                <p className="text-[10px] text-gray-400 mt-1">
                  {tc.minSpent > 0 ? `₺${tc.minSpent.toLocaleString()}+` : 'Başlangıç'}
                </p>
                <div className="mt-3 space-y-1 text-[9px] text-gray-500">
                  <p>+{tc.fixedBonusPoints} bonus puan</p>
                  <p>%{tc.birthdayDiscount} doğum günü</p>
                  {tc.freeShippingThreshold === null && <p>Ücretsiz kargo</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral Section - Modern Design */}
      <div className="bg-white dark:bg-dark-800 rounded-[32px] border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 border-b border-emerald-100 dark:border-emerald-800/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Share2 size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-display text-xl font-bold text-emerald-800 dark:text-emerald-300 italic">Arkadaşını Davet Et</h3>
          </div>
          <p className="text-sm text-emerald-700/70 dark:text-emerald-400/70">
            Arkadaşın ilk siparişini verdiğinde <strong className="text-emerald-700 dark:text-emerald-300">ikiniz de {config.referralBonusPoints} puan</strong> (₺{Math.floor(config.referralBonusPoints / config.pointsToLiraRatio)} değerinde) kazanırsınız!
          </p>
        </div>

        {/* How it works */}
        <div className="p-6 space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Nasıl Çalışır?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Kodu Paylaş', desc: 'Aşağıdaki kodu arkadaşına gönder' },
                { step: '2', title: 'Kayıt Olsun', desc: 'Arkadaşın bu kodla üye olsun' },
                { step: '3', title: 'Puan Kazan', desc: 'İlk siparişinde ikiniz de kazanın' }
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-dark-900 rounded-lg flex items-center justify-center text-sm font-black text-gray-400 shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Code Box */}
          <div className="bg-gray-50 dark:bg-dark-900 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Senin Referans Kodun</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white dark:bg-dark-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4">
                <span className="font-mono font-black text-2xl tracking-[0.2em] text-gray-900 dark:text-white">
                  {currentCustomer.referralCode}
                </span>
              </div>
              <button
                onClick={copyReferralCode}
                className={`h-14 px-5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-900 dark:bg-gold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gold/90'
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                const text = `Sade Chocolate'da ${config.referralBonusPoints} puan kazanmak ister misin? Kayıt olurken "${currentCustomer.referralCode}" kodunu kullan! 🍫`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl text-xs font-bold transition-all"
            >
              <MessageCircle size={18} />
              WhatsApp ile Paylaş
            </button>
            <button
              onClick={() => {
                const text = `Sade Chocolate'da ${config.referralBonusPoints} puan kazanmak ister misin? "${currentCustomer.referralCode}" kodunu kullan!`;
                navigator.clipboard.writeText(text);
                toast.success('Davet mesajı kopyalandı!');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gray-100 dark:bg-dark-900 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
            >
              <Copy size={18} />
              Mesajı Kopyala
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {pointsHistory.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-[32px] border border-gray-100 dark:border-gray-700 p-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Son Puan Hareketleri</h3>
          <div className="space-y-3">
            {pointsHistory.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'earn' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {tx.type === 'earn' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{tx.description}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(tx.timestamp).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-lg ${tx.type === 'earn' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.type === 'earn' ? '+' : ''}{tx.points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Harcama', value: `₺${currentCustomer.totalSpent.toLocaleString()}` },
          { label: 'Toplam Sipariş', value: currentCustomer.totalOrders.toString() },
          { label: 'Ömür Boyu Puan', value: lifetime.toLocaleString() },
          { label: 'Referans', value: `${currentCustomer.referralsCount} kişi` }
        ].map((stat, i) => (
          <div key={i} className="bg-gray-50 dark:bg-dark-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
            <p className="font-display text-2xl font-bold text-brown-900 dark:text-gold italic">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
