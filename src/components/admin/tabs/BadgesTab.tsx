import React, { useState, useEffect } from 'react';
import { Tag, Eye, EyeOff, Plus, X, Trash2, ChevronDown } from 'lucide-react';
import { collection, getDocs, query, orderBy, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { toast } from 'sonner';
import { BrandIcon } from '../../ui/BrandIcon';
import { AdminCard } from '../shared/AdminCard';
import { AdminEmptyState } from '../shared/AdminEmptyState';

export const BadgesTab: React.FC = () => {
  const [badges, setBadges] = useState<any[]>([]);
  const [isAddingBadge, setIsAddingBadge] = useState(false);
  const [isBadgeInfoOpen, setIsBadgeInfoOpen] = useState(false);
  const [newBadge, setNewBadge] = useState<any>({
    name: { tr: '', en: '', ru: '' },
    bgColor: '#1a1a1a',
    textColor: '#ffffff',
    icon: '',
    active: true,
    priority: 1
  });

  const fetchBadges = async () => {
    try {
      const q = query(collection(db, 'product_badges'), orderBy('priority', 'asc'));
      const snapshot = await getDocs(q);
      setBadges(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Badge verileri yüklenemedi:', error);
    }
  };

  useEffect(() => { fetchBadges(); }, []);

  const handleAddExampleBadges = async () => {
    try {
      const exampleBadges = [
        { name: { tr: 'YENİ', en: 'NEW', ru: 'НОВИНКА' }, bgColor: '#D4AF37', textColor: '#000000', priority: 1 },
        { name: { tr: 'RAMAZAN ÖZEL', en: 'RAMADAN SPECIAL', ru: 'РАМАДАН СПЕЦИАЛЬНЫЙ' }, bgColor: '#059669', textColor: '#FFFFFF', priority: 2 },
        { name: { tr: 'SINIRLI ÜRETİM', en: 'LIMITED EDITION', ru: 'ОГРАНИЧЕННАЯ СЕРИЯ' }, bgColor: '#1a1a1a', textColor: '#D4AF37', priority: 3 },
        { name: { tr: 'BESTSELLER', en: 'BESTSELLER', ru: 'БЕСТСЕЛЛЕР' }, bgColor: '#78350f', textColor: '#FFFFFF', priority: 4 },
        { name: { tr: 'İNDİRİM', en: 'SALE', ru: 'СКИДКА' }, bgColor: '#dc2626', textColor: '#FFFFFF', priority: 5 },
        { name: { tr: 'SON FIRSAT', en: 'LAST CHANCE', ru: 'ПОСЛЕДНИЙ ШАНС' }, bgColor: '#ea580c', textColor: '#FFFFFF', priority: 6 },
        { name: { tr: 'VEGAN', en: 'VEGAN', ru: 'ВЕГАН' }, bgColor: '#16a34a', textColor: '#FFFFFF', priority: 7 },
        { name: { tr: 'SEVGİLİLER GÜNÜ', en: 'VALENTINE\'S DAY', ru: 'ДЕНЬ СВЯТОГО ВАЛЕНТИНА' }, bgColor: '#ec4899', textColor: '#FFFFFF', priority: 8 },
        { name: { tr: 'ORGANİK', en: 'ORGANIC', ru: 'ОРГАНИЧЕСКИЙ' }, bgColor: '#2563eb', textColor: '#FFFFFF', priority: 9 },
        { name: { tr: 'EL YAPIMI', en: 'HANDMADE', ru: 'РУЧНАЯ РАБОТА' }, bgColor: '#9333ea', textColor: '#FFFFFF', priority: 10 }
      ];
      for (const badge of exampleBadges) {
        await addDoc(collection(db, 'product_badges'), { ...badge, icon: '', active: true, createdAt: serverTimestamp() });
      }
      toast.success('10 örnek rozet eklendi');
      fetchBadges();
    } catch (error: any) {
      toast.error('Rozetler eklenirken hata oluştu: ' + error.message);
    }
  };

  const handleAddBadge = async () => {
    try {
      if (!newBadge.name.tr || !newBadge.name.en || !newBadge.name.ru) {
        toast.error('Tüm dillerde isim girmelisiniz');
        return;
      }
      await addDoc(collection(db, 'product_badges'), { ...newBadge, createdAt: serverTimestamp() });
      toast.success('Badge oluşturuldu');
      setNewBadge({ name: { tr: '', en: '', ru: '' }, bgColor: '#1a1a1a', textColor: '#ffffff', icon: '', active: true, priority: badges.length + 1 });
      setIsAddingBadge(false);
      fetchBadges();
    } catch (error) {
      toast.error('Badge eklenemedi');
      console.error(error);
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    try {
      await deleteDoc(doc(db, 'product_badges', badgeId));
      toast.success('Badge silindi');
      fetchBadges();
    } catch (error) {
      toast.error('Badge silinemedi');
      console.error(error);
    }
  };

  const handleToggleBadgeActive = async (badgeId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'product_badges', badgeId), { active: !currentStatus });
      toast.success(currentStatus ? 'Badge devre dışı' : 'Badge aktif');
      fetchBadges();
    } catch (error) {
      toast.error('Durum değiştirilemedi');
      console.error(error);
    }
  };

  const statCards = [
    { label: 'Toplam Rozet', val: badges.length, icon: Tag, color: 'bg-brand-blue/10 text-blue-700' },
    { label: 'Aktif Rozetler', val: badges.filter(b => b.active).length, icon: Eye, color: 'bg-brand-green/10 text-green-700' },
    { label: 'Pasif Rozetler', val: badges.filter(b => !b.active).length, icon: EyeOff, color: 'bg-red-50 text-red-600' }
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((item, idx) => (
          <AdminCard key={idx}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                <item.icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-mocha-900">{item.val}</div>
                <div className="text-xs text-mocha-400 font-medium">{item.label}</div>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Info Section */}
      <AdminCard>
        <button
          onClick={() => setIsBadgeInfoOpen(!isBadgeInfoOpen)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-blue/10 rounded-lg flex items-center justify-center">
              <Tag size={18} className="text-blue-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-mocha-900">Rozet Kullanım Örnekleri</h3>
              <p className="text-xs text-mocha-500">Rozetlerin nasıl kullanılacağını öğrenin</p>
            </div>
          </div>
          <ChevronDown size={18} className={`text-mocha-400 transition-transform duration-150 ${isBadgeInfoOpen ? 'rotate-180' : ''}`} />
        </button>

        {isBadgeInfoOpen && (
          <div className="mt-4 pt-4 border-t border-cream-200 space-y-3">
            {[
              { title: 'Yeni Tablet Serisi', desc: '"YENİ" rozeti oluşturup yeni ürünlere ekleyin' },
              { title: 'Ramazan Kampanyası', desc: '"RAMAZAN ÖZEL" rozeti ile hediye kutularını öne çıkarın' },
              { title: 'Sınırlı Üretim', desc: '"SINIRLI ÜRETİM" rozeti ile eksklüzif ürünleri belirtin' },
              { title: 'En Çok Satanlar', desc: '"BESTSELLER" rozeti ile sosyal kanıt oluşturun' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-cream-50 rounded-lg">
                <span className="w-6 h-6 bg-brand-mustard/10 rounded text-brand-mustard text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                <div>
                  <p className="text-sm font-medium text-mocha-900">{item.title}</p>
                  <p className="text-xs text-mocha-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Add Badge */}
      <AdminCard>
        {!isAddingBadge ? (
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddingBadge(true)}
              className="flex-1 py-4 border-2 border-dashed border-cream-300 rounded-lg hover:border-brand-mustard hover:bg-brand-mustard/5 transition-colors duration-150 flex items-center justify-center gap-2 text-mocha-400 hover:text-brand-mustard"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Yeni Rozet Ekle</span>
            </button>
            <button
              onClick={handleAddExampleBadges}
              className="px-6 py-4 bg-brand-mustard hover:bg-brand-mustard/90 text-white rounded-lg text-sm font-medium transition-colors duration-150 flex items-center gap-2"
            >
              <BrandIcon size={16} />
              Örnek Rozetleri Ekle
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-mocha-900">Yeni Rozet Oluştur</h3>
              <button onClick={() => setIsAddingBadge(false)} className="text-mocha-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'İsim (Türkçe)', key: 'tr', placeholder: 'Yeni' },
                { label: 'Name (English)', key: 'en', placeholder: 'New' },
                { label: 'Название (Russian)', key: 'ru', placeholder: 'Новинка' }
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-mocha-400 mb-1.5">{f.label}</label>
                  <input type="text" value={newBadge.name[f.key]} onChange={(e) => setNewBadge({...newBadge, name: {...newBadge.name, [f.key]: e.target.value}})} placeholder={f.placeholder} className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-mustard/20 outline-none text-mocha-900" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-mocha-400 mb-1.5">Arka Plan Rengi</label>
                <input type="color" value={newBadge.bgColor} onChange={(e) => setNewBadge({...newBadge, bgColor: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs font-medium text-mocha-400 mb-1.5">Metin Rengi</label>
                <input type="color" value={newBadge.textColor} onChange={(e) => setNewBadge({...newBadge, textColor: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs font-medium text-mocha-400 mb-1.5">Öncelik (1-10)</label>
                <input type="number" min="1" max="10" value={newBadge.priority} onChange={(e) => setNewBadge({...newBadge, priority: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-mustard/20 outline-none text-mocha-900" />
              </div>
            </div>

            <div className="bg-cream-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-mocha-400 mb-2">Önizleme</p>
              <span className="text-xs font-medium px-3 py-1.5 uppercase tracking-wider rounded" style={{backgroundColor: newBadge.bgColor, color: newBadge.textColor}}>
                {newBadge.name.tr || 'Örnek Rozet'}
              </span>
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddBadge} className="flex-1 px-4 py-2.5 bg-brand-mustard hover:bg-brand-mustard/90 text-white rounded-lg text-sm font-medium transition-colors">Rozet Oluştur</button>
              <button onClick={() => setIsAddingBadge(false)} className="px-4 py-2.5 bg-cream-100 text-mocha-600 rounded-lg text-sm font-medium hover:bg-cream-200 transition-colors">İptal</button>
            </div>
          </div>
        )}
      </AdminCard>

      {/* Badge List */}
      <AdminCard title="Tüm Rozetler" subtitle="Rozetleri düzenleyin ve yönetin" noPadding>
        <div className="divide-y divide-cream-100">
          {badges.map((badge: any) => (
            <div key={badge.id} className="px-6 py-4 hover:bg-cream-50 flex items-center justify-between group transition-colors duration-150">
              <div className="flex items-center gap-4 flex-1">
                <span className="text-xs font-medium px-3 py-1 uppercase tracking-wider rounded" style={{backgroundColor: badge.bgColor, color: badge.textColor}}>
                  {badge.name.tr}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-mocha-900">{badge.name.tr} / {badge.name.en} / {badge.name.ru}</span>
                    {badge.active ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-brand-green/10 text-green-700 px-2 py-0.5 rounded-md font-medium"><Eye size={10} /> Aktif</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-cream-100 text-mocha-400 px-2 py-0.5 rounded-md font-medium"><EyeOff size={10} /> Pasif</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-mocha-400">Öncelik: {badge.priority}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleToggleBadgeActive(badge.id, badge.active)} className="p-1.5 text-mocha-400 hover:text-blue-600 hover:bg-brand-blue/10 rounded-lg transition-colors">
                  {badge.active ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <button className="p-1.5 text-mocha-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[130]" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl z-[131] w-full max-w-sm">
                      <AlertDialog.Title className="text-lg font-semibold text-mocha-900 mb-2">Rozeti Sil</AlertDialog.Title>
                      <AlertDialog.Description className="text-sm text-mocha-500 mb-6">Bu rozeti kalıcı olarak silmek istediğinizden emin misiniz?</AlertDialog.Description>
                      <div className="flex justify-end gap-3">
                        <AlertDialog.Cancel asChild>
                          <button className="px-4 py-2 text-sm font-medium text-mocha-600 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors">Vazgeç</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <button onClick={() => handleDeleteBadge(badge.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Sil</button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </div>
            </div>
          ))}
          {badges.length === 0 && (
            <AdminEmptyState
              icon={Tag}
              title="Henüz rozet oluşturulmadı"
              action={
                <button onClick={() => setIsAddingBadge(true)} className="px-4 py-2 bg-brand-mustard text-white rounded-lg text-sm font-medium hover:bg-brand-mustard/90 transition-colors">İlk Rozeti Oluştur</button>
              }
            />
          )}
        </div>
      </AdminCard>
    </div>
  );
};
