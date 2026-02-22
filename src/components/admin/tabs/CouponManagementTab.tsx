import React, { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  Plus, Trash2, X, Percent, DollarSign,
  Calendar, CheckCircle, XCircle, Tag
} from 'lucide-react';
import { toast } from 'sonner';

type CouponType = 'percentage' | 'fixed';

type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  reusable: boolean;
  maxUses?: number;
  usedCount: number;
  minCartTotal: number;
  maxDiscount?: number;
  expiresAt: Timestamp | null;
  description: string;
  isUsed: boolean;
  usedBy: string[];
  createdAt: Timestamp;
};

const defaultForm = {
  code: '',
  type: 'percentage' as CouponType,
  value: 10,
  reusable: true,
  maxUses: 100,
  minCartTotal: 0,
  maxDiscount: 0,
  expiresAt: '',
  description: '',
};

export const CouponManagementTab: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  // Kuponları yükle
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Coupon[];
      setCoupons(data);
    } catch (error) {
      console.error('Kuponlar yüklenemedi:', error);
      toast.error('Kuponlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Yeni kupon oluştur
  const handleCreate = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      toast.error('Kupon kodu zorunludur');
      return;
    }
    if (form.value <= 0) {
      toast.error('İndirim değeri 0\'dan büyük olmalıdır');
      return;
    }
    if (form.type === 'percentage' && form.value > 100) {
      toast.error('Yüzde değeri 100\'den büyük olamaz');
      return;
    }

    // Aynı kodla kupon var mı kontrol et
    const exists = coupons.some(c => c.code === code);
    if (exists) {
      toast.error('Bu kupon kodu zaten mevcut');
      return;
    }

    setSaving(true);
    try {
      const couponData: Record<string, unknown> = {
        code,
        type: form.type,
        value: Number(form.value),
        reusable: form.reusable,
        minCartTotal: Number(form.minCartTotal) || 0,
        isUsed: false,
        usedCount: 0,
        usedBy: [],
        description: form.description.trim(),
        createdAt: serverTimestamp(),
      };

      if (form.reusable && form.maxUses) {
        couponData.maxUses = Number(form.maxUses);
      }

      if (form.type === 'percentage' && form.maxDiscount && form.maxDiscount > 0) {
        couponData.maxDiscount = Number(form.maxDiscount);
      }

      if (form.expiresAt) {
        couponData.expiresAt = Timestamp.fromDate(new Date(form.expiresAt));
      } else {
        couponData.expiresAt = null;
      }

      await addDoc(collection(db, 'coupons'), couponData);
      toast.success(`Kupon "${code}" oluşturuldu`);
      setForm(defaultForm);
      setShowForm(false);
      fetchCoupons();
    } catch (error) {
      console.error('Kupon oluşturulamadı:', error);
      toast.error('Kupon oluşturulurken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Kupon sil
  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`"${coupon.code}" kuponunu silmek istediğinize emin misiniz?`)) return;

    try {
      await deleteDoc(doc(db, 'coupons', coupon.id));
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      toast.success('Kupon silindi');
    } catch (error) {
      console.error('Kupon silinemedi:', error);
      toast.error('Kupon silinirken hata oluştu');
    }
  };

  // Kupon durumunu kontrol et
  const getCouponStatus = (coupon: Coupon): { label: string; color: string } => {
    // Tek kullanımlık ve kullanılmış
    if (!coupon.reusable && coupon.isUsed) {
      return { label: 'Kullanıldı', color: 'text-mocha-500 bg-cream-100' };
    }
    // Süresi dolmuş
    if (coupon.expiresAt) {
      const expiry = coupon.expiresAt.toDate
        ? coupon.expiresAt.toDate()
        : new Date(coupon.expiresAt as unknown as string);
      if (expiry < new Date()) {
        return { label: 'Süresi Doldu', color: 'text-red-600 bg-red-50' };
      }
    }
    // Kullanım limiti aşılmış
    if (coupon.reusable && coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) {
      return { label: 'Limit Doldu', color: 'text-orange-600 bg-orange-50' };
    }
    return { label: 'Aktif', color: 'text-emerald-600 bg-emerald-50' };
  };

  // Tarih formatla
  const formatDate = (ts: Timestamp | null) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts as unknown as string);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-mocha-900">Kupon Yönetimi</h2>
          <p className="text-sm text-mocha-500 mt-1">
            Kampanya kuponları oluşturun ve yönetin
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-mocha-900 hover:bg-mocha-800 text-white rounded-xl transition-colors text-sm font-medium"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Kapat' : 'Yeni Kupon'}
        </button>
      </div>

      {/* Oluşturma Formu */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-mocha-900 mb-4">Yeni Kupon Oluştur</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Kupon Kodu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kupon Kodu</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="MERHABA10"
                className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm uppercase"
              />
            </div>

            {/* Tür */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İndirim Türü</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as CouponType })}
                className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm"
              >
                <option value="percentage">Yüzde (%)</option>
                <option value="fixed">Sabit Tutar (₺)</option>
              </select>
            </div>

            {/* Değer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Değer {form.type === 'percentage' ? '(%)' : '(₺)'}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                min={0}
                max={form.type === 'percentage' ? 100 : undefined}
                className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm"
              />
            </div>

            {/* Tekrar Kullanılabilir */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kullanım Tipi</label>
              <div className="flex items-center gap-3 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.reusable}
                    onChange={() => setForm({ ...form, reusable: true })}
                    className="accent-mocha-800"
                  />
                  <span className="text-sm">Kampanya (çoklu)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!form.reusable}
                    onChange={() => setForm({ ...form, reusable: false })}
                    className="accent-mocha-800"
                  />
                  <span className="text-sm">Tek kullanım</span>
                </label>
              </div>
            </div>

            {/* Maks Kullanım (sadece reusable) */}
            {form.reusable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maks Kullanım</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={e => setForm({ ...form, maxUses: Number(e.target.value) })}
                  min={1}
                  className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm"
                />
              </div>
            )}

            {/* Min Sepet Tutarı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Sepet Tutarı (₺)</label>
              <input
                type="number"
                value={form.minCartTotal}
                onChange={e => setForm({ ...form, minCartTotal: Number(e.target.value) })}
                min={0}
                className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm"
              />
            </div>

            {/* Maks İndirim (sadece yüzde) */}
            {form.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maks İndirim (₺) <span className="text-mocha-400 font-normal">opsiyonel</span>
                </label>
                <input
                  type="number"
                  value={form.maxDiscount}
                  onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                  min={0}
                  placeholder="0 = limitsiz"
                  className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm"
                />
              </div>
            )}

            {/* Son Kullanma Tarihi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Son Kullanma Tarihi</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm"
              />
            </div>

            {/* Açıklama */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Kampanya açıklaması (opsiyonel)"
                className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm"
              />
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-mocha-900 hover:bg-mocha-800 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kupon Oluştur'}
            </button>
          </div>
        </div>
      )}

      {/* Kupon Listesi */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-cream-100 h-16 rounded-xl" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-cream-200">
          <Tag size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-mocha-500">Henüz kupon oluşturulmamış</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-mocha-700 hover:text-mocha-900 font-medium"
          >
            İlk kuponu oluştur
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50">
                  <th className="text-left px-4 py-3 font-semibold text-mocha-600">Kod</th>
                  <th className="text-left px-4 py-3 font-semibold text-mocha-600">Tür</th>
                  <th className="text-left px-4 py-3 font-semibold text-mocha-600">Değer</th>
                  <th className="text-left px-4 py-3 font-semibold text-mocha-600">Kullanım</th>
                  <th className="text-left px-4 py-3 font-semibold text-mocha-600">Min Sepet</th>
                  <th className="text-left px-4 py-3 font-semibold text-mocha-600">Bitiş</th>
                  <th className="text-left px-4 py-3 font-semibold text-mocha-600">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold text-mocha-600">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr key={coupon.id} className="border-b border-cream-100 hover:bg-cream-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-mocha-900">{coupon.code}</span>
                        {coupon.description && (
                          <p className="text-xs text-mocha-400 mt-0.5">{coupon.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          {coupon.type === 'percentage' ? (
                            <Percent size={14} className="text-blue-500" />
                          ) : (
                            <DollarSign size={14} className="text-green-500" />
                          )}
                          {coupon.type === 'percentage' ? 'Yüzde' : 'Sabit'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {coupon.type === 'percentage' ? `%${coupon.value}` : `₺${coupon.value}`}
                        {coupon.type === 'percentage' && coupon.maxDiscount ? (
                          <span className="text-xs text-mocha-400 ml-1">(maks ₺{coupon.maxDiscount})</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {coupon.reusable ? (
                          <span>{coupon.usedCount || 0}/{coupon.maxUses || '∞'}</span>
                        ) : (
                          <span>{coupon.isUsed ? '1/1' : '0/1'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {coupon.minCartTotal > 0 ? `₺${coupon.minCartTotal}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {formatDate(coupon.expiresAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label === 'Aktif' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="p-1.5 text-mocha-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Kuponu sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
