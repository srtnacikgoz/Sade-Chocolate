import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Truck, Save, Package, DollarSign, TrendingUp, AlertCircle, CheckCircle, XCircle, BarChart3, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ShippingSettings {
  freeShippingLimit: number;
  defaultShippingCost: number;
}

interface CostAnalytics {
  totalOrders: number;
  ordersWithMNG: number;
  totalCustomerPaid: number;
  totalMNGCost: number;
  totalProfit: number;
  avgProfit: number;
  profitableOrders: number;
  lossOrders: number;
}

export const ShippingSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<ShippingSettings>({
    freeShippingLimit: 1500,
    defaultShippingCost: 95
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<CostAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Analitik verilerini yükle
  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);

      let totalOrders = 0;
      let ordersWithMNG = 0;
      let totalCustomerPaid = 0;
      let totalMNGCost = 0;
      let profitableOrders = 0;
      let lossOrders = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalOrders++;

        // Müşterinin ödediği kargo ücreti
        const customerPaid = data.payment?.shipping || data.costAnalysis?.customerPaid || 0;
        totalCustomerPaid += customerPaid;

        // MNG tahmini maliyet varsa
        if (data.costAnalysis?.mngEstimate) {
          ordersWithMNG++;
          const mngCost = data.costAnalysis.mngEstimate;
          totalMNGCost += mngCost;

          const profit = customerPaid - mngCost;
          if (profit >= 0) {
            profitableOrders++;
          } else {
            lossOrders++;
          }
        }
      });

      const totalProfit = totalCustomerPaid - totalMNGCost;
      const avgProfit = ordersWithMNG > 0 ? totalProfit / ordersWithMNG : 0;

      setAnalytics({
        totalOrders,
        ordersWithMNG,
        totalCustomerPaid,
        totalMNGCost,
        totalProfit,
        avgProfit,
        profitableOrders,
        lossOrders
      });
    } catch (error) {
      console.error('Analitik verileri yüklenemedi:', error);
      toast.error('Analitik verileri yüklenemedi');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'shipping');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            freeShippingLimit: data.freeShippingLimit ?? 1500,
            defaultShippingCost: data.defaultShippingCost ?? 95
          });
        }
      } catch (error) {
        console.error('Kargo ayarları yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
    loadAnalytics();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'shipping');
      await setDoc(docRef, settings, { merge: true });
      toast.success('Kargo ayarları kaydedildi!');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-t-transparent border-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <Truck className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kargo Ayarları</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Müşteriye yansıyan kargo ücretleri</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold hover:bg-gold/90 text-white font-bold transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              Bu ayarlar müşterinin gördüğü kargo ücretini belirler.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              MNG Kargo API entegrasyonu ile gerçek maliyetler arka planda takip edilir ve sipariş detaylarında gösterilir.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sabit Kargo Ücreti */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <Package className="text-orange-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Sabit Kargo Ücreti</h3>
              <p className="text-xs text-gray-500">Ücretsiz kargo limiti altındaki siparişler için</p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₺</span>
            <input
              type="number"
              value={settings.defaultShippingCost}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultShippingCost: Number(e.target.value) }))}
              className="w-full pl-10 pr-4 py-3 text-2xl font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-white focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
              min="0"
              step="1"
            />
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Örnek: Sepet tutarı 500₺ ise müşteri {settings.defaultShippingCost}₺ kargo öder
          </p>
        </div>

        {/* Ücretsiz Kargo Limiti */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Ücretsiz Kargo Limiti</h3>
              <p className="text-xs text-gray-500">Bu tutarın üzerindeki siparişlerde kargo bedava</p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₺</span>
            <input
              type="number"
              value={settings.freeShippingLimit}
              onChange={(e) => setSettings(prev => ({ ...prev, freeShippingLimit: Number(e.target.value) }))}
              className="w-full pl-10 pr-4 py-3 text-2xl font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-white focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
              min="0"
              step="50"
            />
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Örnek: Sepet tutarı {settings.freeShippingLimit}₺ ve üzeri ise kargo ücretsiz
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <DollarSign size={18} />
          Önizleme - Müşteri Ne Görür?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Örnek 1 */}
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Sepet: ₺500</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Kargo:</span>
              <span className="font-bold text-orange-600">₺{settings.defaultShippingCost}</span>
            </div>
          </div>

          {/* Örnek 2 */}
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Sepet: ₺{settings.freeShippingLimit - 100}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Kargo:</span>
              <span className="font-bold text-orange-600">₺{settings.defaultShippingCost}</span>
            </div>
            <p className="text-[10px] text-gold mt-2">
              Ücretsiz kargo için ₺100 kaldı
            </p>
          </div>

          {/* Örnek 3 */}
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
            <p className="text-xs text-gray-500 mb-2">Sepet: ₺{settings.freeShippingLimit}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Kargo:</span>
              <span className="font-bold text-green-600">Ücretsiz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kargo Maliyet Analizi */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Kargo Maliyet Analizi</h3>
              <p className="text-xs text-gray-500">Son 100 sipariş bazında</p>
            </div>
          </div>
          <button
            onClick={loadAnalytics}
            disabled={loadingAnalytics}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loadingAnalytics ? 'animate-spin' : ''} />
            <span>Yenile</span>
          </button>
        </div>

        {loadingAnalytics && !analytics ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : analytics ? (
          <div className="space-y-4">
            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Toplam Sipariş */}
              <div className="bg-gray-50 dark:bg-dark-900 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalOrders}</p>
              </div>

              {/* MNG Verisi Olan */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">MNG Verisi Olan</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{analytics.ordersWithMNG}</p>
              </div>

              {/* Kârlı Siparişler */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Kârlı Siparişler</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{analytics.profitableOrders}</p>
              </div>

              {/* Zararlı Siparişler */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Zararlı Siparişler</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{analytics.lossOrders}</p>
              </div>
            </div>

            {/* Finansal Özet */}
            {analytics.ordersWithMNG > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Müşteri Ödedi */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Müşteri Ödedi (Toplam)</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">₺{analytics.totalCustomerPaid.toFixed(2)}</p>
                  </div>

                  {/* MNG Maliyeti */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">MNG Maliyeti (Toplam)</p>
                    <p className="text-lg font-bold text-orange-600">₺{analytics.totalMNGCost.toFixed(2)}</p>
                  </div>

                  {/* Net Kâr/Zarar */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Net Kâr/Zarar</p>
                    <p className={`text-lg font-bold flex items-center gap-1 ${analytics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.totalProfit >= 0 ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      ₺{Math.abs(analytics.totalProfit).toFixed(2)}
                    </p>
                  </div>

                  {/* Ortalama Kâr */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sipariş Başına Ort.</p>
                    <p className={`text-lg font-bold ${analytics.avgProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₺{analytics.avgProfit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bilgi Notu */}
            {analytics.ordersWithMNG === 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Henüz MNG maliyet verisi olan sipariş bulunmuyor. Firebase Functions deploy edildikten sonra yeni siparişlerde maliyet analizi görünecektir.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Veriler yüklenemedi. Lütfen yenile butonuna tıklayın.</p>
          </div>
        )}
      </div>
    </div>
  );
};
