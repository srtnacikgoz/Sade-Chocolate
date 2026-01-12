import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { BoxConfig, BoxSizeOption, BoxPreset, Product } from '../../../types';
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
  X,
  Gift,
  Edit3,
  Check,
  Loader2
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

  // Preset State
  const [presets, setPresets] = useState<BoxPreset[]>([]);
  const [bonbonProducts, setBonbonProducts] = useState<Product[]>([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<BoxPreset | null>(null);
  const [presetForm, setPresetForm] = useState({
    name: '',
    description: '',
    boxSize: 8,
    productIds: [] as string[],
    image: '',
    enabled: true,
    sortOrder: 0
  });
  const [isPresetSaving, setIsPresetSaving] = useState(false);

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

  // Preset'leri ve bonbon ürünlerini yükle
  useEffect(() => {
    const loadPresetsAndProducts = async () => {
      try {
        // Preset'leri yükle
        const presetsQuery = query(collection(db, 'box_presets'), orderBy('sortOrder', 'asc'));
        const presetsSnap = await getDocs(presetsQuery);
        const loadedPresets = presetsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BoxPreset[];
        setPresets(loadedPresets);

        // Bonbon ürünlerini yükle (isBoxContent === true)
        const productsQuery = query(collection(db, 'products'), where('isBoxContent', '==', true));
        const productsSnap = await getDocs(productsQuery);
        const loadedProducts = productsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setBonbonProducts(loadedProducts.filter(p => !p.isOutOfStock));
      } catch (error) {
        console.error('Preset veya ürünler yüklenemedi:', error);
      }
    };
    loadPresetsAndProducts();
  }, []);

  // Preset modal'ını aç (yeni veya düzenle)
  const openPresetModal = (preset?: BoxPreset) => {
    if (preset) {
      setEditingPreset(preset);
      setPresetForm({
        name: preset.name,
        description: preset.description,
        boxSize: preset.boxSize,
        productIds: preset.productIds,
        image: preset.image || '',
        enabled: preset.enabled,
        sortOrder: preset.sortOrder
      });
    } else {
      setEditingPreset(null);
      setPresetForm({
        name: '',
        description: '',
        boxSize: 8,
        productIds: [],
        image: '',
        enabled: true,
        sortOrder: presets.length
      });
    }
    setIsPresetModalOpen(true);
  };

  // Preset kaydet (ekle veya güncelle)
  const savePreset = async () => {
    if (!presetForm.name.trim()) {
      toast.error('Preset adı gerekli');
      return;
    }
    if (presetForm.productIds.length === 0) {
      toast.error('En az bir bonbon seçmelisiniz');
      return;
    }

    setIsPresetSaving(true);
    try {
      if (editingPreset) {
        // Güncelle
        await updateDoc(doc(db, 'box_presets', editingPreset.id), {
          ...presetForm,
          updatedAt: new Date().toISOString()
        });
        setPresets(prev => prev.map(p =>
          p.id === editingPreset.id
            ? { ...p, ...presetForm, updatedAt: new Date().toISOString() }
            : p
        ));
        toast.success('Hazır kutu güncellendi');
      } else {
        // Yeni ekle
        const newPreset = {
          ...presetForm,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'box_presets'), newPreset);
        setPresets(prev => [...prev, { id: docRef.id, ...newPreset } as BoxPreset]);
        toast.success('Hazır kutu eklendi');
      }
      setIsPresetModalOpen(false);
    } catch (error) {
      console.error('Preset kaydetme hatası:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setIsPresetSaving(false);
    }
  };

  // Preset sil
  const deletePreset = async (id: string) => {
    if (!confirm('Bu hazır kutuyu silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteDoc(doc(db, 'box_presets', id));
      setPresets(prev => prev.filter(p => p.id !== id));
      toast.success('Hazır kutu silindi');
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };

  // Preset aktif/pasif toggle
  const togglePresetEnabled = async (preset: BoxPreset) => {
    try {
      await updateDoc(doc(db, 'box_presets', preset.id), {
        enabled: !preset.enabled,
        updatedAt: new Date().toISOString()
      });
      setPresets(prev => prev.map(p =>
        p.id === preset.id ? { ...p, enabled: !p.enabled } : p
      ));
    } catch (error) {
      console.error('Toggle hatası:', error);
      toast.error('Durum değiştirilemedi');
    }
  };

  // Preset görsel yükle
  const handlePresetImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPresetSaving(true);
    try {
      const storageRef = ref(storage, `box-presets/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPresetForm(prev => ({ ...prev, image: url }));
      toast.success('Görsel yüklendi');
    } catch (error) {
      console.error('Görsel yükleme hatası:', error);
      toast.error('Görsel yüklenemedi');
    } finally {
      setIsPresetSaving(false);
    }
  };

  // Bonbon seçim toggle
  const toggleBonbonSelection = (productId: string) => {
    setPresetForm(prev => {
      const isSelected = prev.productIds.includes(productId);
      if (isSelected) {
        return { ...prev, productIds: prev.productIds.filter(id => id !== productId) };
      } else {
        if (prev.productIds.length >= prev.boxSize) {
          toast.error(`Maksimum ${prev.boxSize} bonbon seçebilirsiniz`);
          return prev;
        }
        return { ...prev, productIds: [...prev.productIds, productId] };
      }
    });
  };

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

      {/* Hazır Kutular */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Gift className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Hazır Kutular</h3>
              <p className="text-xs text-gray-500">Önceden hazırlanmış bonbon kutuları</p>
            </div>
          </div>
          <button
            onClick={() => openPresetModal()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl font-bold hover:bg-purple-500/20 transition-all"
          >
            <Plus size={18} />
            Yeni Hazır Kutu
          </button>
        </div>

        {presets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Gift size={48} className="mx-auto mb-4 opacity-30" />
            <p>Henüz hazır kutu eklenmemiş</p>
            <button
              onClick={() => openPresetModal()}
              className="mt-4 text-sm text-purple-500 hover:underline"
            >
              İlk hazır kutuyu oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map(preset => (
              <div
                key={preset.id}
                className={`relative p-4 rounded-2xl border-2 transition-all ${
                  preset.enabled
                    ? 'border-purple-500/30 bg-purple-50/50 dark:bg-purple-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-700 opacity-60'
                }`}
              >
                {/* Görsel */}
                {preset.image ? (
                  <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-dark-600">
                    <img src={preset.image} alt={preset.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl mb-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                    <Gift size={32} className="text-purple-400" />
                  </div>
                )}

                {/* Bilgiler */}
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">{preset.name}</h4>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{preset.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <span className="bg-gray-100 dark:bg-dark-600 px-2 py-0.5 rounded-full">
                    {preset.boxSize}'li kutu
                  </span>
                  <span className="bg-gray-100 dark:bg-dark-600 px-2 py-0.5 rounded-full">
                    {preset.productIds.length} bonbon
                  </span>
                </div>

                {/* Aksiyonlar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePresetEnabled(preset)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      preset.enabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400'
                    }`}
                  >
                    {preset.enabled ? 'Aktif' : 'Pasif'}
                  </button>
                  <button
                    onClick={() => openPresetModal(preset)}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preset Ekleme/Düzenleme Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingPreset ? 'Hazır Kutuyu Düzenle' : 'Yeni Hazır Kutu'}
              </h3>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sol - Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      Kutu Adı *
                    </label>
                    <input
                      type="text"
                      value={presetForm.name}
                      onChange={(e) => setPresetForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Meyvemsi Seçki"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      Açıklama
                    </label>
                    <textarea
                      value={presetForm.description}
                      onChange={(e) => setPresetForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Yaz meyvelerinin tatlı notaları..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      Kutu Boyutu
                    </label>
                    <select
                      value={presetForm.boxSize}
                      onChange={(e) => setPresetForm(prev => ({ ...prev, boxSize: parseInt(e.target.value), productIds: [] }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white"
                    >
                      {config.boxSizes.filter(b => b.enabled).map(box => (
                        <option key={box.id} value={box.size}>
                          {box.label} ({box.size} adet)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      Görsel (Opsiyonel)
                    </label>
                    <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-dark-700">
                      {presetForm.image ? (
                        <>
                          <img src={presetForm.image} alt="Preset" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setPresetForm(prev => ({ ...prev, image: '' }))}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
                          <Upload size={24} className="text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Görsel Yükle</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePresetImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sağ - Bonbon Seçimi */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    Bonbon Seç ({presetForm.productIds.length}/{presetForm.boxSize}) *
                  </label>
                  <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 max-h-80 overflow-y-auto bg-gray-50 dark:bg-dark-700">
                    {bonbonProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Package size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Seçilebilir bonbon yok</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {bonbonProducts.map(product => {
                          const isSelected = presetForm.productIds.includes(product.id);
                          return (
                            <button
                              key={product.id}
                              onClick={() => toggleBonbonSelection(product.id)}
                              className={`relative p-2 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                              }`}
                            >
                              <div className="aspect-square rounded-lg overflow-hidden mb-1 bg-white dark:bg-dark-600">
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                                {product.title}
                              </p>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center">
                                  <Check size={12} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-dark-700/50 flex justify-end gap-3">
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={savePreset}
                disabled={isPresetSaving}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-all disabled:opacity-50"
              >
                {isPresetSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingPreset ? 'Güncelle' : 'Kaydet'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
