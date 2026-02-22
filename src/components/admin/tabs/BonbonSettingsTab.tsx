// components/admin/tabs/BonbonSettingsTab.tsx
// Bonbon koleksiyon kartı ayarları

import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { Save, Upload, Trash2, Candy, Image } from 'lucide-react';
import { toast } from 'sonner';

interface BonbonConfig {
  cardImage?: string;
  cardTitle: string;
  cardSubtitle: string;
  ctaText: string;
}

const DEFAULT_CONFIG: BonbonConfig = {
  cardTitle: 'Bonbon Koleksiyonu',
  cardSubtitle: 'Her biri özenle hazırlanmış eşsiz tatlar',
  ctaText: 'Koleksiyonu Keşfet'
};

export const BonbonSettingsTab: React.FC = () => {
  const [config, setConfig] = useState<BonbonConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore'dan ayarları yükle
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'bonbon');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig({ ...DEFAULT_CONFIG, ...docSnap.data() } as BonbonConfig);
        }
      } catch (error) {
        console.error('Bonbon ayarları yüklenemedi:', error);
        toast.error('Ayarlar yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Görsel yükle
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `bonbon-card/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setConfig(prev => ({ ...prev, cardImage: url }));
      toast.success('Görsel yüklendi');
    } catch (error) {
      console.error('Görsel yükleme hatası:', error);
      toast.error('Görsel yüklenirken hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  // Görseli kaldır
  const handleRemoveImage = () => {
    setConfig(prev => ({ ...prev, cardImage: undefined }));
  };

  // Kaydet
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'site_settings', 'bonbon');
      await setDoc(docRef, {
        ...config,
        updatedAt: new Date().toISOString()
      });
      toast.success('Bonbon ayarları kaydedildi');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    } finally {
      setIsSaving(false);
    }
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
        <div>
          <h2 className="text-2xl font-semibold text-mocha-900">Bonbon Kartı Ayarları</h2>
          <p className="text-sm text-mocha-500 mt-1">Katalogdaki bonbon koleksiyon kartını özelleştirin</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sol: Form */}
        <div className="space-y-6">
          {/* Kart Görseli */}
          <div className="bg-white rounded-xl border border-cream-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-mocha-100 flex items-center justify-center">
                <Image className="text-mocha-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-mocha-900">Kart Görseli</h3>
                <p className="text-sm text-mocha-500">Katalogda görünecek görsel</p>
              </div>
            </div>

            {config.cardImage ? (
              <div className="relative">
                <img
                  src={config.cardImage}
                  alt="Bonbon kart görseli"
                  className="w-full aspect-[4/5] object-cover rounded-lg"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/5] border-2 border-dashed border-cream-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors"
              >
                {isUploading ? (
                  <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="text-mocha-400 mb-2" size={32} />
                    <span className="text-sm text-mocha-500">Görsel Yükle</span>
                    <span className="text-xs text-mocha-400 mt-1">PNG, JPG (max 5MB)</span>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Metinler */}
          <div className="bg-white rounded-xl border border-cream-200 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Candy className="text-gold" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-mocha-900">Kart Metinleri</h3>
                <p className="text-sm text-mocha-500">Başlık, açıklama ve buton metni</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-mocha-600 mb-1">
                Başlık
              </label>
              <input
                type="text"
                value={config.cardTitle}
                onChange={(e) => setConfig(prev => ({ ...prev, cardTitle: e.target.value }))}
                className="w-full px-4 py-2.5 border border-cream-200 rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                placeholder="Bonbon Koleksiyonu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-mocha-600 mb-1">
                Alt Başlık
              </label>
              <input
                type="text"
                value={config.cardSubtitle}
                onChange={(e) => setConfig(prev => ({ ...prev, cardSubtitle: e.target.value }))}
                className="w-full px-4 py-2.5 border border-cream-200 rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                placeholder="Her biri özenle hazırlanmış eşsiz tatlar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-mocha-600 mb-1">
                Buton Metni
              </label>
              <input
                type="text"
                value={config.ctaText}
                onChange={(e) => setConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                className="w-full px-4 py-2.5 border border-cream-200 rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                placeholder="Koleksiyonu Keşfet"
              />
            </div>
          </div>
        </div>

        {/* Sağ: Önizleme */}
        <div>
          <h3 className="font-semibold text-mocha-900 mb-4">Önizleme</h3>
          <div className="bg-cream-100 rounded-xl p-6">
            <div className="max-w-[280px] mx-auto">
              <article className="bg-cream-50 rounded-xl shadow-sm overflow-hidden">
                {/* Görsel */}
                <div className="relative aspect-[4/5] bg-cream-200">
                  <span className="absolute top-0 left-0 text-xs font-medium px-3 py-1 uppercase tracking-wider z-20 bg-mocha-800 text-white">
                    Koleksiyon
                  </span>
                  {config.cardImage ? (
                    <img
                      src={config.cardImage}
                      alt="Önizleme"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mocha-100 to-mocha-200">
                      <div className="w-16 h-16 bg-mocha-700 rounded-xl flex items-center justify-center">
                        <Candy className="text-white" size={32} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Alt bilgi */}
                <div className="p-4 bg-cream-50">
                  <h3 className="text-lg font-semibold text-mocha-900 mb-1">
                    {config.cardTitle || 'Bonbon Koleksiyonu'}
                  </h3>
                  <p className="text-xs text-mocha-500 mb-3">
                    {config.cardSubtitle || 'Her biri özenle hazırlanmış eşsiz tatlar'}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gold uppercase">Keşfet • Tümünü Gör</span>
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">→</span>
                    </div>
                  </div>
                  <button className="w-full py-2.5 text-xs font-medium uppercase tracking-wider text-mocha-900 border border-gold/20 rounded-lg">
                    {config.ctaText || 'Koleksiyonu Keşfet'}
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonbonSettingsTab;
