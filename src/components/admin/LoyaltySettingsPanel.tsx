import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { LoyaltyConfiguration, LoyaltyTier } from '../../types/loyalty';
import { getLoyaltyConfig, updateLoyaltyConfig, getDefaultLoyaltyConfig } from '../../services/loyaltyService';
import { TierBadge } from '../ui/TierBadge';

export const LoyaltySettingsPanel: React.FC = () => {
  const [config, setConfig] = useState<LoyaltyConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const loadedConfig = await getLoyaltyConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Error loading config:', error);
      showMessage('error', 'Ayarlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setIsSaving(true);
      await updateLoyaltyConfig(config);
      showMessage('success', 'Ayarlar başarıyla kaydedildi');
    } catch (error) {
      console.error('Error saving config:', error);
      showMessage('error', 'Ayarlar kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Tüm ayarları varsayılan değerlere döndürmek istediğinizden emin misiniz?')) {
      setConfig(getDefaultLoyaltyConfig());
      showMessage('success', 'Ayarlar varsayılan değerlere döndürüldü');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const updateTierConfig = (tier: LoyaltyTier, field: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      tiers: {
        ...config.tiers,
        [tier]: {
          ...config.tiers[tier],
          [field]: value
        }
      }
    });
  };

  const updateConfig = (field: keyof LoyaltyConfiguration, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-mocha-500">Ayarlar yükleniyor...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Ayarlar yüklenemedi</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mocha-900">Sadakat Sistemi Ayarları</h1>
          <p className="text-mocha-500 mt-1">
            Müşteri tier seviyelerini, puan kurallarını ve faydaları yönetin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2 border border-cream-200 rounded-lg text-mocha-600 hover:bg-cream-50 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Varsayılana Dön
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Global Controls */}
      <div className="bg-white rounded-2xl p-6 border border-cream-200">
        <h2 className="text-xl font-semibold mb-4 text-mocha-900">Genel Ayarlar</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-mocha-900">Sadakat Sistemi</p>
            <p className="text-sm text-mocha-500">
              Sadakat sistemi {config.isActive ? 'aktif' : 'devre dışı'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.isActive}
              onChange={(e) => updateConfig('isActive', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-cream-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cream-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
          </label>
        </div>
      </div>

      {/* Tier Configuration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-mocha-900">Tier Seviyeleri</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['Bronze', 'Silver', 'Gold', 'Platinum'] as LoyaltyTier[]).map((tier) => (
            <div
              key={tier}
              className="bg-white rounded-2xl p-6 border border-cream-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <TierBadge tier={tier} size="lg" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-mocha-600 mb-2">
                    Minimum Harcama (₺)
                  </label>
                  <input
                    type="number"
                    value={config.tiers[tier].minSpent}
                    onChange={(e) => updateTierConfig(tier, 'minSpent', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
                    min="0"
                    step="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-mocha-600 mb-2">
                    Maksimum Harcama (₺)
                  </label>
                  <input
                    type="number"
                    value={config.tiers[tier].maxSpent || ''}
                    onChange={(e) => updateTierConfig(tier, 'maxSpent', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
                    min="0"
                    step="100"
                    placeholder="Sınırsız"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-mocha-600 mb-2">
                    Sabit Bonus Puan / Sipariş
                  </label>
                  <input
                    type="number"
                    value={config.tiers[tier].fixedBonusPoints || 0}
                    onChange={(e) => updateTierConfig(tier, 'fixedBonusPoints', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
                    min="0"
                    step="10"
                  />
                  <p className="text-xs text-mocha-500 mt-1">Her siparişte ekstra kazanılacak puan</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-mocha-600 mb-2">
                    Yıllık Koruma Harcaması (₺)
                  </label>
                  <input
                    type="number"
                    value={config.tiers[tier].annualSpentRequirement || 0}
                    onChange={(e) => updateTierConfig(tier, 'annualSpentRequirement', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
                    min="0"
                    step="100"
                  />
                  <p className="text-xs text-mocha-500 mt-1">Bu seviyeyi korumak için yıllık min. harcama</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-mocha-600 mb-2">
                    Doğum Günü İndirimi (%)
                  </label>
                  <input
                    type="number"
                    value={config.tiers[tier].birthdayDiscount}
                    onChange={(e) => updateTierConfig(tier, 'birthdayDiscount', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
                    min="0"
                    max="50"
                    step="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-mocha-600 mb-2">
                    Ücretsiz Kargo Eşiği (₺)
                  </label>
                  <input
                    type="number"
                    value={config.tiers[tier].freeShippingThreshold || ''}
                    onChange={(e) => updateTierConfig(tier, 'freeShippingThreshold', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
                    min="0"
                    step="50"
                    placeholder="Her zaman ücretsiz"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.tiers[tier].exclusiveAccess}
                      onChange={(e) => updateTierConfig(tier, 'exclusiveAccess', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-mocha-600">Özel Ürün Erişimi</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.tiers[tier].earlyAccess}
                      onChange={(e) => updateTierConfig(tier, 'earlyAccess', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-mocha-600">Erken Satın Alma</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Point Rules */}
      <div className="bg-white rounded-2xl p-6 border border-cream-200">
        <h2 className="text-xl font-semibold mb-4 text-mocha-900">Puan Kazanma Kuralları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-mocha-600 mb-2">
              Her 1₺ için (puan)
            </label>
            <input
              type="number"
              value={config.pointsPerLira}
              onChange={(e) => updateConfig('pointsPerLira', Number(e.target.value))}
              className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mocha-600 mb-2">
              Hoş Geldin Bonusu (puan)
            </label>
            <input
              type="number"
              value={config.welcomeBonusPoints}
              onChange={(e) => updateConfig('welcomeBonusPoints', Number(e.target.value))}
              className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mocha-600 mb-2">
              Referral Bonusu (puan)
            </label>
            <input
              type="number"
              value={config.referralBonusPoints}
              onChange={(e) => updateConfig('referralBonusPoints', Number(e.target.value))}
              className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mocha-600 mb-2">
              Doğum Günü Bonusu (puan)
            </label>
            <input
              type="number"
              value={config.birthdayBonusPoints}
              onChange={(e) => updateConfig('birthdayBonusPoints', Number(e.target.value))}
              className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mocha-600 mb-2">
              İnceleme Bonusu (puan)
            </label>
            <input
              type="number"
              value={config.reviewBonusPoints}
              onChange={(e) => updateConfig('reviewBonusPoints', Number(e.target.value))}
              className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Redemption Rules */}
      <div className="bg-white rounded-2xl p-6 border border-cream-200">
        <h2 className="text-xl font-semibold mb-4 text-mocha-900">Puan Kullanma Kuralları</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-mocha-600 mb-2">
              Puan/Lira Oranı
            </label>
            <input
              type="number"
              value={config.pointsToLiraRatio}
              onChange={(e) => updateConfig('pointsToLiraRatio', Number(e.target.value))}
              className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
              min="1"
            />
            <p className="text-xs text-mocha-500 mt-1">
              {config.pointsToLiraRatio} puan = 1₺ indirim
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-mocha-600 mb-2">
              Minimum Kullanılabilir Puan
            </label>
            <input
              type="number"
              value={config.minPointsRedemption}
              onChange={(e) => updateConfig('minPointsRedemption', Number(e.target.value))}
              className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mocha-600 mb-2">
              Sipariş Başına Maksimum Puan
            </label>
            <input
              type="number"
              value={config.maxPointsPerOrder}
              onChange={(e) => updateConfig('maxPointsPerOrder', Number(e.target.value))}
              className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Expiration Settings */}
      <div className="bg-white rounded-2xl p-6 border border-cream-200">
        <h2 className="text-xl font-semibold mb-4 text-mocha-900">Puan Geçerlilik Ayarları</h2>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-mocha-600 mb-2">
            Puan Geçerlilik Süresi (Ay)
          </label>
          <input
            type="number"
            value={config.pointsExpiryMonths}
            onChange={(e) => updateConfig('pointsExpiryMonths', Number(e.target.value))}
            className="w-full px-4 py-2 border border-cream-200 rounded-lg bg-white text-mocha-900"
            min="1"
            max="60"
          />
          <p className="text-sm text-mocha-500 mt-2">
            Kazanılan puanlar {config.pointsExpiryMonths} ay sonra sona erecek
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-mocha-500 pt-6 border-t border-cream-200">
        <p>Son güncelleme: {new Date(config.updatedAt).toLocaleString('tr-TR')}</p>
        {config.updatedBy && <p>Güncelleyen: {config.updatedBy}</p>}
      </div>
    </div>
  );
};
