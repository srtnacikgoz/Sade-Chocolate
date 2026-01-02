import React, { useState } from 'react';
import { seedOrders } from '../utils/seedOrders';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export const SeedData: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await seedOrders();
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Veri eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-50 to-amber-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin')}
          className="mb-8 flex items-center gap-2 text-brown-600 hover:text-brown-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Admin Paneline Dön</span>
        </button>

        <div className="bg-white rounded-[32px] p-12 shadow-2xl border border-gray-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-brown-100 rounded-2xl flex items-center justify-center">
              <Package size={32} className="text-brown-600" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                Örnek Müşteri Verileri
              </h1>
              <p className="text-gray-500 mt-1">
                Sade Chocolate OMS test verisi
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 mb-8">
            <h2 className="font-display font-bold text-lg mb-4 text-gray-900">
              📊 Eklenecek Müşteri Tipleri:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                { icon: '🏆', label: 'VIP Müşteri', detail: 'Ayşe Demir - 12 sipariş, 7.500₺, RFM: ~92' },
                { icon: '💜', label: 'Sadık Müşteri', detail: 'Mehmet Yılmaz - 5 sipariş, 2.100₺, RFM: ~65' },
                { icon: '🌟', label: 'Yeni Müşteri', detail: 'Zeynep Kaya - İlk sipariş, 320₺' },
                { icon: '🚨', label: 'Risk Altında', detail: 'Can Öztürk - 120 gün önce, RFM: ~28' },
                { icon: '🎉', label: 'Milestone (10. sipariş)', detail: 'Elif Arslan - Hediye talimatı tetikler' },
                { icon: '💌', label: 'Geri Dönen', detail: 'Ahmet Şahin - 100 gün sonra döndü' },
                { icon: '⚡', label: 'Sınırlı Üretim', detail: 'Selin Aydın - Limited edition ürünler' },
                { icon: '🍷', label: 'Sommelier Bekliyor', detail: 'Deniz Yurt - 48 saat önce teslim' },
                { icon: '🎁', label: 'Hediye Paketi', detail: 'Burak Tekin - Özel paket talimatı' },
                { icon: '🟡', label: 'Sadakati Azalıyor', detail: 'Gizem Kılıç - 60 gün önce, RFM: ~45' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="font-bold text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">⚠️ Önemli Notlar:</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Toplam <strong>~60 sipariş</strong> oluşturulacak</li>
                  <li>• Tüm müşteri tipleri ve RFM skorları test edilebilir</li>
                  <li>• Hediye Karar Motoru tüm senaryoları tetikleyecek</li>
                  <li>• Limited edition ürünler ve sommelier uyarıları aktif</li>
                  <li>• Test sonrası isterseniz siparişleri silebilirsiniz</li>
                </ul>
              </div>
            </div>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 animate-in fade-in duration-500">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-emerald-600" />
                <div>
                  <h3 className="font-bold text-emerald-900">Başarılı!</h3>
                  <p className="text-sm text-emerald-700 mt-1">
                    Örnek müşteriler eklendi. Admin paneline yönlendiriliyorsunuz...
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="text-red-600" />
                <div>
                  <h3 className="font-bold text-red-900">Hata!</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSeed}
            disabled={loading || success}
            className="w-full py-5 bg-brown-900 text-white rounded-2xl font-bold text-lg hover:bg-brown-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Veriler Ekleniyor...
              </span>
            ) : success ? (
              'Tamamlandı ✓'
            ) : (
              'Örnek Müşterileri Ekle'
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Bu işlem geri alınamaz. Admin panelinden siparişleri manuel olarak silebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};
