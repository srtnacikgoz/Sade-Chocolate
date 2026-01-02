import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { BoxConfig, BoxSizeOption } from '../../../types';
import {
  Package,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Upload,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_BOX_CONFIG: BoxConfig = {
  id: 'default',
  enabled: true,

  // Kart Görünümü
  cardTitle: 'Kendi Kutunu Oluştur',
  cardSubtitle: 'Favori bonbonlarını seç',
  cardDescription: 'Dilediğin bonbonları seç, özel kutunu hazırla',
  cardImage: '',
  ctaText: 'Kutuya Git',

  // Modal Görünümü
  modalTitle: 'Kendi Kutunu Oluştur',
  modalSubtitle: 'Favori bonbonlarını seç, özel kutunu hazırla',

  // Kutu Boyutları
  boxSizes: [
    { id: 'box-4', size: 4, label: "4'lü Kutu", description: 'Deneme paketi', basePrice: 0, enabled: true, gridCols: 2, gridRows: 2 },
    { id: 'box-8', size: 8, label: "8'li Kutu", description: 'Klasik seçim', basePrice: 0, enabled: true, gridCols: 4, gridRows: 2 },
    { id: 'box-16', size: 16, label: "16'lı Kutu", description: 'Aile boyu', basePrice: 0, enabled: true, gridCols: 4, gridRows: 4 },
    { id: 'box-25', size: 25, label: "25'li Kutu", description: 'Özel günler için', basePrice: 0, enabled: true, gridCols: 5, gridRows: 5 },
  ]
};

export const BoxConfigTab: React.FC = () => {
  const [config, setConfig] = useState<BoxConfig>(DEFAULT_BOX_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Firestore'dan config'i yükle
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const docRef = doc(db, 'box_config', 'default');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig({ ...DEFAULT_BOX_CONFIG, ...docSnap.data() } as BoxConfig);
        }
      } catch (error) {
        console.error('Kutu ayarları yüklenemedi:', error);
        toast.error('Ayarlar yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Kaydet
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'box_config', 'default');
      await setDoc(docRef, {
        ...config,
        updatedAt: new Date().toISOString()
      });
      toast.success('Kutu ayarları kaydedildi');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // Görsel yükle
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `box-config/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setConfig(prev => ({ ...prev, cardImage: url }));
      toast.success('Görsel yüklendi');
    } catch (error) {
      console.error('Görsel yükleme hatası:', error);
      toast.error('Görsel yüklenemedi');
    } finally {
      setIsUploading(false);
    }
  };

  // Kutu boyutu ekle
  const addBoxSize = () => {
    const newSize: BoxSizeOption = {
      id: `box-${Date.now()}`,
      size: 6,
      label: "6'lı Kutu",
      description: 'Yeni kutu',
      basePrice: 0,
      enabled: true,
      gridCols: 3,
      gridRows: 2
    };
    setConfig(prev => ({
      ...prev,
      boxSizes: [...prev.boxSizes, newSize]
    }));
  };

  // Kutu boyutu sil
  const removeBoxSize = (id: string) => {
    setConfig(prev => ({
      ...prev,
      boxSizes: prev.boxSizes.filter(b => b.id !== id)
    }));
  };

  // Kutu boyutu güncelle
  const updateBoxSize = (id: string, updates: Partial<BoxSizeOption>) => {
    setConfig(prev => ({
      ...prev,
      boxSizes: prev.boxSizes.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-gold to-brand-mustard rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kutu Oluşturucu Ayarları</h2>
            <p className="text-sm text-gray-500">Müşterilerin kendi kutularını oluşturma özelliğini yönetin</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-xl font-bold hover:bg-brand-mustard transition-all disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      {/* Genel Ayar - Aktif/Pasif */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Özellik Durumu</h3>
            <p className="text-sm text-gray-500">Kutu oluşturma özelliğini açın veya kapatın</p>
          </div>
          <button
            onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              config.enabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400'
            }`}
          >
            {config.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            {config.enabled ? 'Aktif' : 'Pasif'}
          </button>
        </div>
      </div>

      {/* Kart Görünümü */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <ImageIcon size={20} className="text-gold" />
          Kart Görünümü
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol - Form */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Kart Başlığı
              </label>
              <input
                type="text"
                value={config.cardTitle}
                onChange={(e) => setConfig(prev => ({ ...prev, cardTitle: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Alt Başlık
              </label>
              <input
                type="text"
                value={config.cardSubtitle}
                onChange={(e) => setConfig(prev => ({ ...prev, cardSubtitle: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Açıklama
              </label>
              <textarea
                value={config.cardDescription}
                onChange={(e) => setConfig(prev => ({ ...prev, cardDescription: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Buton Metni
              </label>
              <input
                type="text"
                value={config.ctaText}
                onChange={(e) => setConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Sağ - Görsel */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Kart Görseli (Opsiyonel)
            </label>
            <div className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-dark-700">
              {config.cardImage ? (
                <>
                  <img
                    src={config.cardImage}
                    alt="Kart görseli"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, cardImage: '' }))}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
                  {isUploading ? (
                    <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Görsel Yükle</span>
                      <span className="text-xs text-gray-400 mt-1">veya varsayılan ikon kullanılır</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ayarları */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Modal Metinleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Modal Başlığı
            </label>
            <input
              type="text"
              value={config.modalTitle}
              onChange={(e) => setConfig(prev => ({ ...prev, modalTitle: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Modal Alt Başlığı
            </label>
            <input
              type="text"
              value={config.modalSubtitle}
              onChange={(e) => setConfig(prev => ({ ...prev, modalSubtitle: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Kutu Boyutları */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white">Kutu Boyutları</h3>
          <button
            onClick={addBoxSize}
            className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold rounded-xl font-bold hover:bg-gold/20 transition-all"
          >
            <Plus size={18} />
            Yeni Boyut
          </button>
        </div>

        <div className="space-y-4">
          {config.boxSizes.map((box, index) => (
            <div
              key={box.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                box.enabled
                  ? 'border-gold/30 bg-gold/5'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-700 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 text-gray-400 cursor-move">
                  <GripVertical size={20} />
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-4">
                  {/* Boyut */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Adet</label>
                    <input
                      type="number"
                      value={box.size}
                      onChange={(e) => updateBoxSize(box.id, { size: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  {/* Etiket */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Etiket</label>
                    <input
                      type="text"
                      value={box.label}
                      onChange={(e) => updateBoxSize(box.id, { label: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  {/* Açıklama */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Açıklama</label>
                    <input
                      type="text"
                      value={box.description}
                      onChange={(e) => updateBoxSize(box.id, { description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  {/* Fiyat */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Kutu Ücreti (₺)</label>
                    <input
                      type="number"
                      value={box.basePrice}
                      onChange={(e) => updateBoxSize(box.id, { basePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  {/* Grid */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Grid (Sütun x Satır)</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={box.gridCols}
                        onChange={(e) => updateBoxSize(box.id, { gridCols: parseInt(e.target.value) || 1 })}
                        className="w-1/2 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white text-sm text-center"
                        min={1}
                        max={10}
                      />
                      <input
                        type="number"
                        value={box.gridRows}
                        onChange={(e) => updateBoxSize(box.id, { gridRows: parseInt(e.target.value) || 1 })}
                        className="w-1/2 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-white text-sm text-center"
                        min={1}
                        max={10}
                      />
                    </div>
                  </div>

                  {/* Aktif/Pasif */}
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => updateBoxSize(box.id, { enabled: !box.enabled })}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        box.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400'
                      }`}
                    >
                      {box.enabled ? 'Aktif' : 'Pasif'}
                    </button>
                    <button
                      onClick={() => removeBoxSize(box.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {config.boxSizes.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p>Henüz kutu boyutu eklenmemiş</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
