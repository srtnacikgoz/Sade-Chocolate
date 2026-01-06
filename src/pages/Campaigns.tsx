import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveCampaigns, ReferralCampaign } from '../services/referralCodeService';
import {
  Gift,
  Calendar,
  Users,
  Copy,
  CheckCircle,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Info,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<ReferralCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const activeCampaigns = await getActiveCampaigns();

      // Sadece campaign tipindeki ve geçerli tarihteki kampanyaları göster
      const now = new Date();
      const validCampaigns = activeCampaigns.filter(c =>
        c.type === 'campaign' &&
        new Date(c.validFrom) <= now &&
        new Date(c.validUntil) >= now &&
        (c.maxUses === -1 || c.currentUses < c.maxUses)
      );

      setCampaigns(validCampaigns);
    } catch (error) {
      console.error('Kampanyalar yüklenemedi:', error);
      toast.error('Kampanyalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kod kopyalandı! Kayıt sırasında kullanabilirsiniz. 🎉');
  };

  const getRemainingDays = (validUntil: string) => {
    const now = new Date();
    const end = new Date(validUntil);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-dark-900 flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-2xl mb-6">
              <Sparkles className="text-gold" size={32} />
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold italic text-brown-900 dark:text-white mb-4">
              Aktif Kampanyalar
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              İlk siparişinizde kullanabileceğiniz özel kampanya kodlarımızı keşfedin.
              Her kampanya size özel avantajlar sunuyor.
            </p>
          </div>

          {/* Info Banner */}
          <div className="mb-8 bg-gradient-to-r from-gold/10 to-amber-50/50 dark:from-gold/5 dark:to-amber-900/10 rounded-3xl p-6 border border-gold/20 dark:border-gold/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center shrink-0">
                <Info className="text-gold" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-brown-900 dark:text-white mb-2">Nasıl Kullanılır?</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-gold shrink-0" />
                    <span>Beğendiğiniz bir kampanya kodunu kopyalayın</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-gold shrink-0" />
                    <span>Kayıt olurken "Referans Kodu" alanına yapıştırın</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-gold shrink-0" />
                    <span>İlk siparişinizi tamamlayın ve bonusunuzu kazanın!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Campaigns Grid */}
          {campaigns.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {campaigns.map((campaign) => {
                const remainingDays = getRemainingDays(campaign.validUntil);
                const remainingUses = campaign.maxUses === -1 ? Infinity : campaign.maxUses - campaign.currentUses;
                const usagePercentage = campaign.maxUses === -1 ? 0 : (campaign.currentUses / campaign.maxUses) * 100;

                return (
                  <div
                    key={campaign.id}
                    className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Campaign Header */}
                    <div className="relative p-6 bg-gradient-to-br from-gold/10 to-amber-50/30 dark:from-gold/5 dark:to-amber-900/10 border-b border-gold/20 dark:border-gold/10">
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                          AKTİF
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white dark:bg-dark-700 rounded-2xl flex items-center justify-center shadow-sm">
                          <Gift className="text-gold" size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-brown-900 dark:text-white mb-1">
                            {campaign.description}
                          </h3>
                          <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-gold" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              <strong className="text-gold font-bold">{campaign.bonusPoints} puan</strong> kazanın
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Campaign Code */}
                      <div className="flex items-center gap-3 bg-white dark:bg-dark-900 rounded-xl p-4 shadow-sm">
                        <code className="flex-1 font-mono font-bold text-xl text-brown-900 dark:text-white tracking-wider">
                          {campaign.code}
                        </code>
                        <button
                          onClick={() => copyCode(campaign.code)}
                          className="p-3 bg-gold hover:bg-gold/90 text-black rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Campaign Details */}
                    <div className="p-6 space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-xl">
                          <Calendar size={18} className="text-gold" />
                          <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Kalan Süre</p>
                            <p className="text-sm font-bold text-brown-900 dark:text-white">
                              {remainingDays} gün
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-xl">
                          <Users size={18} className="text-gold" />
                          <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Kalan Kullanım</p>
                            <p className="text-sm font-bold text-brown-900 dark:text-white">
                              {campaign.maxUses === -1 ? 'Sınırsız' : `${remainingUses} kişi`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Usage Progress */}
                      {campaign.maxUses !== -1 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Kullanım Durumu</span>
                            <span>{campaign.currentUses} / {campaign.maxUses}</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-300"
                              style={{ width: `${usagePercentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      {campaign.discountPercent && campaign.discountPercent > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                          <Tag size={16} className="text-purple-600 dark:text-purple-400" />
                          <span className="text-sm text-purple-700 dark:text-purple-300">
                            <strong>%{campaign.discountPercent}</strong> ek indirim
                          </span>
                        </div>
                      )}

                      {/* Terms */}
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          • Kampanya <strong>{new Date(campaign.validUntil).toLocaleDateString('tr-TR')}</strong> tarihine kadar geçerlidir<br />
                          • Her kullanıcı bu kodu <strong>{campaign.perUserLimit} kez</strong> kullanabilir<br />
                          {campaign.minOrderAmount && campaign.minOrderAmount > 0 && (
                            <>• Minimum sipariş tutarı: <strong>{campaign.minOrderAmount}₺</strong><br /></>
                          )}
                          • Bonus puanlar ilk siparişiniz tamamlandıktan sonra hesabınıza tanımlanır
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 dark:bg-dark-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Gift size={48} className="text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-brown-900 dark:text-white mb-2">
                Şu Anda Aktif Kampanya Yok
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Yeni kampanyalar için bizi takip etmeye devam edin
              </p>
            </div>
          )}

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-brown-900 to-brown-800 dark:from-dark-800 dark:to-dark-900 rounded-3xl p-8 lg:p-12 text-center">
            <h2 className="font-display text-3xl lg:text-4xl font-bold italic text-white mb-4">
              Henüz Üye Değil Misiniz?
            </h2>
            <p className="text-cream-100 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Kampanya kodunuzu kullanmak için hemen kayıt olun ve özel avantajlardan yararlanmaya başlayın.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gold hover:bg-gold/90 text-black font-bold rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              Hemen Kayıt Ol
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
