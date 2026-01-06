import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  createReferralCampaign,
  updateReferralCampaign,
  deactivateReferralCampaign,
  getCampaignStats,
  generateCampaignCode,
  ReferralCampaign
} from '../../../services/referralCodeService';
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle,
  Copy,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface CampaignStats {
  totalUses: number;
  totalBonusAwarded: number;
  totalDiscountGiven: number;
  uniqueUsers: number;
  lastUsedAt: string | null;
}

export const ReferralCampaignsTab: React.FC = () => {
  const [campaigns, setCampaigns] = useState<ReferralCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [campaignStats, setCampaignStats] = useState<Record<string, CampaignStats>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<ReferralCampaign>>({
    code: '',
    type: 'campaign',
    isActive: true,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    maxUses: 100,
    bonusPoints: 50,
    discountPercent: 0,
    minOrderAmount: 0,
    perUserLimit: 1,
    description: '',
    createdBy: 'admin'
  });

  // Kampanyaları yükle
  const fetchCampaigns = async () => {
    try {
      const q = query(collection(db, 'referral_campaigns'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ReferralCampaign[];
      setCampaigns(data);
    } catch (error) {
      console.error('Kampanyalar yüklenemedi:', error);
      toast.error('Kampanyalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Kampanya istatistiklerini yükle
  const loadCampaignStats = async (campaignId: string) => {
    setLoadingStats(prev => ({ ...prev, [campaignId]: true }));
    try {
      const stats = await getCampaignStats(campaignId);
      setCampaignStats(prev => ({ ...prev, [campaignId]: stats }));
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    } finally {
      setLoadingStats(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Yeni kampanya oluştur
  const handleCreate = async () => {
    if (!formData.code || !formData.description || !formData.validFrom || !formData.validUntil) {
      toast.error('Tüm zorunlu alanları doldurun');
      return;
    }

    try {
      await createReferralCampaign(formData as Omit<ReferralCampaign, 'id' | 'currentUses' | 'createdAt' | 'updatedAt'>);
      toast.success('Kampanya oluşturuldu!');
      setCreatingNew(false);
      resetForm();
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || 'Kampanya oluşturulamadı');
    }
  };

  // Kampanyayı güncelle
  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      await updateReferralCampaign(editingId, formData);
      toast.success('Kampanya güncellendi');
      setEditingId(null);
      resetForm();
      fetchCampaigns();
    } catch (error) {
      toast.error('Kampanya güncellenemedi');
    }
  };

  // Kampanyayı sil
  const handleDelete = async (campaignId: string) => {
    if (!confirm('Bu kampanyayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

    try {
      await deleteDoc(doc(db, 'referral_campaigns', campaignId));
      toast.success('Kampanya silindi');
      fetchCampaigns();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Kampanya silinemedi');
    }
  };

  // Düzenleme başlat
  const startEdit = (campaign: ReferralCampaign) => {
    setEditingId(campaign.id);
    setFormData({
      code: campaign.code,
      type: campaign.type,
      isActive: campaign.isActive,
      validFrom: new Date(campaign.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(campaign.validUntil).toISOString().slice(0, 16),
      maxUses: campaign.maxUses,
      bonusPoints: campaign.bonusPoints,
      discountPercent: campaign.discountPercent,
      minOrderAmount: campaign.minOrderAmount,
      perUserLimit: campaign.perUserLimit,
      description: campaign.description,
      createdBy: campaign.createdBy
    });
  };

  // Formu sıfırla
  const resetForm = () => {
    setFormData({
      code: '',
      type: 'campaign',
      isActive: true,
      validFrom: new Date().toISOString().slice(0, 16),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxUses: 100,
      bonusPoints: 50,
      discountPercent: 0,
      minOrderAmount: 0,
      perUserLimit: 1,
      description: '',
      createdBy: 'admin'
    });
  };

  // Kod kopyala
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kod kopyalandı!');
  };

  // Otomatik kod üret
  const generateNewCode = () => {
    const newCode = generateCampaignCode('SADE');
    setFormData(prev => ({ ...prev, code: newCode }));
    toast.success('Yeni kod oluşturuldu');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center">
            <Gift className="text-gold" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Referans Kampanyaları</h2>
            <p className="text-sm text-slate-400">Kampanya kodlarını yönetin ve istatistikleri izleyin</p>
          </div>
        </div>

        <button
          onClick={() => {
            setCreatingNew(true);
            generateNewCode();
          }}
          className="flex items-center gap-2 px-4 py-3 bg-gold text-black rounded-xl font-bold text-sm hover:bg-gold/90 transition-all"
        >
          <Plus size={18} />
          Yeni Kampanya
        </button>
      </div>

      {/* Aggregate Statistics Dashboard */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Campaigns */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Gift size={20} className="text-white" />
              </div>
              <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              {campaigns.length}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
              Toplam Kampanya
            </div>
            <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
              {campaigns.filter(c => c.isActive).length} aktif, {campaigns.filter(c => !c.isActive).length} pasif
            </div>
          </div>

          {/* Total Uses */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">
              {campaigns.reduce((sum, c) => sum + c.currentUses, 0)}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              Toplam Kullanım
            </div>
            <div className="mt-3 text-xs text-emerald-700 dark:text-emerald-300">
              {campaigns.filter(c => c.currentUses > 0).length} kampanya kullanıldı
            </div>
          </div>

          {/* Total Bonus Points */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <TrendingUp size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-1">
              {campaigns.reduce((sum, c) => sum + (c.bonusPoints * c.currentUses), 0).toLocaleString()}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
              Verilen Puan
            </div>
            <div className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              Potansiyel değer
            </div>
          </div>

          {/* Average Usage */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <BarChart3 size={20} className="text-white" />
              </div>
              <TrendingUp size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              {campaigns.length > 0 ? Math.round(campaigns.reduce((sum, c) => sum + c.currentUses, 0) / campaigns.length) : 0}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
              Ort. Kullanım
            </div>
            <div className="mt-3 text-xs text-purple-700 dark:text-purple-300">
              Kampanya başına
            </div>
          </div>
        </div>
      )}

      {/* Yeni Kampanya Formu */}
      {creatingNew && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-700 pb-4">
            <h3 className="font-bold text-lg dark:text-white">Yeni Kampanya Oluştur</h3>
            <button
              onClick={() => {
                setCreatingNew(false);
                resetForm();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Kampanya Kodu */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Kampanya Kodu *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SADE-XXXX"
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-dark-700 rounded-xl font-mono text-sm outline-none border border-transparent focus:border-gold/30 dark:text-white"
                />
                <button
                  onClick={generateNewCode}
                  className="px-4 py-3 bg-gold/10 text-gold rounded-xl hover:bg-gold/20 transition-all"
                  title="Otomatik kod üret"
                >
                  <Sparkles size={18} />
                </button>
              </div>
            </div>

            {/* Bonus Puan */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Bonus Puan *
              </label>
              <input
                type="number"
                value={formData.bonusPoints}
                onChange={(e) => setFormData(prev => ({ ...prev, bonusPoints: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 dark:text-white"
              />
            </div>

            {/* Başlangıç Tarihi */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Başlangıç *
              </label>
              <input
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 dark:text-white"
              />
            </div>

            {/* Bitiş Tarihi */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Bitiş *
              </label>
              <input
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 dark:text-white"
              />
            </div>

            {/* Maksimum Kullanım */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Maks. Kullanım (-1 = Sınırsız)
              </label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData(prev => ({ ...prev, maxUses: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 dark:text-white"
              />
            </div>

            {/* Kullanıcı Başına Limit */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Kullanıcı Başına Limit
              </label>
              <input
                type="number"
                value={formData.perUserLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, perUserLimit: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 dark:text-white"
              />
            </div>

            {/* İndirim Yüzdesi */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                İndirim % (Opsiyonel)
              </label>
              <input
                type="number"
                value={formData.discountPercent || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 dark:text-white"
              />
            </div>

            {/* Min. Sipariş Tutarı */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Min. Sipariş (₺)
              </label>
              <input
                type="number"
                value={formData.minOrderAmount || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 dark:text-white"
              />
            </div>
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Kampanya Açıklaması *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Örn: Yeni Yıl Kampanyası - İlk siparişte 50 bonus puan"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 resize-none dark:text-white"
              rows={3}
            />
          </div>

          {/* Kaydet Butonu */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setCreatingNew(false);
                resetForm();
              }}
              className="px-6 py-3 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-dark-600 transition-all"
            >
              İptal
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-3 bg-gold text-black rounded-xl font-bold text-sm hover:bg-gold/90 transition-all"
            >
              <Save size={18} />
              Kampanyayı Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Kampanya Listesi */}
      <div className="space-y-4">
        {campaigns.map((campaign) => {
          const isEditing = editingId === campaign.id;
          const isExpired = new Date(campaign.validUntil) < new Date();
          const stats = campaignStats[campaign.id];

          return (
            <div
              key={campaign.id}
              className={`bg-white dark:bg-dark-800 rounded-2xl border transition-all ${
                isEditing ? 'border-gold shadow-lg' : 'border-slate-200 dark:border-gray-700'
              } ${!campaign.isActive || isExpired ? 'opacity-60' : ''}`}
            >
              {/* Kampanya Header */}
              <div className="p-6 border-b border-slate-100 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="px-3 py-1 bg-gold/10 text-gold font-mono font-bold text-sm rounded-lg">
                        {campaign.code}
                      </code>
                      <button
                        onClick={() => copyCode(campaign.code)}
                        className="p-1.5 text-slate-400 hover:text-gold transition-all"
                        title="Kodu kopyala"
                      >
                        <Copy size={16} />
                      </button>

                      {campaign.isActive && !isExpired ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <CheckCircle size={12} />
                          AKTİF
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <XCircle size={12} />
                          {isExpired ? 'SÜRESİ DOLDU' : 'PASİF'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-gray-300 mb-3">{campaign.description}</p>

                    <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Gift size={14} />
                        <span><strong>{campaign.bonusPoints}</strong> puan</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={14} />
                        <span><strong>{campaign.currentUses}</strong> / {campaign.maxUses === -1 ? '∞' : campaign.maxUses}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>{new Date(campaign.validFrom).toLocaleDateString('tr-TR')} - {new Date(campaign.validUntil).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => loadCampaignStats(campaign.id)}
                          className="p-2 text-slate-400 hover:text-gold hover:bg-slate-50 dark:hover:bg-dark-700 rounded-lg transition-all"
                          title="İstatistikleri göster"
                        >
                          <BarChart3 size={18} />
                        </button>
                        <button
                          onClick={() => startEdit(campaign)}
                          className="p-2 text-slate-400 hover:text-gold hover:bg-slate-50 dark:hover:bg-dark-700 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-dark-700 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleUpdate}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            resetForm();
                          }}
                          className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700 rounded-lg transition-all"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* İstatistikler */}
              {stats && (
                <div className="p-6 bg-slate-50 dark:bg-dark-700/50">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gold">{stats.totalUses}</div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-wider">Toplam Kullanım</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.uniqueUsers}</div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-wider">Benzersiz Kullanıcı</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalBonusAwarded}</div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-wider">Verilen Puan</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.lastUsedAt ? new Date(stats.lastUsedAt).toLocaleDateString('tr-TR') : '-'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-wider">Son Kullanım</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Düzenleme Formu */}
              {isEditing && (
                <div className="p-6 space-y-4 border-t border-slate-100 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bonus Puan</label>
                      <input
                        type="number"
                        value={formData.bonusPoints}
                        onChange={(e) => setFormData(prev => ({ ...prev, bonusPoints: Number(e.target.value) }))}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Maks. Kullanım</label>
                      <input
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxUses: Number(e.target.value) }))}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Açıklama</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-700 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 resize-none dark:text-white"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Gift size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">Henüz kampanya oluşturulmamış</p>
        </div>
      )}
    </div>
  );
};
