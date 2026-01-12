import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  LayoutGrid,
  Save,
  Rows3,
  Package,
  Eye,
  EyeOff,
  ArrowUpDown,
  Layers,
  PackageCheck,
  Candy
} from 'lucide-react';
import { toast } from 'sonner';

interface CatalogSettings {
  gridColumns: number;
  defaultViewMode: 'grid' | 'list';
  boxCardPosition: 'first' | 'last' | 'hidden';
  bonbonCardPosition: 'first' | 'last' | 'hidden';
  defaultSortMode: 'manual' | 'category' | 'stock';
}

const DEFAULT_SETTINGS: CatalogSettings = {
  gridColumns: 4,
  defaultViewMode: 'grid',
  boxCardPosition: 'first',
  bonbonCardPosition: 'first',
  defaultSortMode: 'manual'
};

const SORT_OPTIONS = [
  {
    value: 'manual',
    label: 'Manuel Sıralama',
    icon: ArrowUpDown,
    description: 'Ürünlere verdiğin sıra numarasına göre'
  },
  {
    value: 'category',
    label: 'Kategori Gruplama',
    icon: Layers,
    description: 'Tabletler, bonbonlar, kutular gruplu'
  },
  {
    value: 'stock',
    label: 'Stok Öncelikli',
    icon: PackageCheck,
    description: 'Stokta olanlar önce, tükenenler sona'
  }
];

const COLUMN_OPTIONS = [
  { value: 3, label: '3 Ürün', description: 'Geniş kartlar' },
  { value: 4, label: '4 Ürün', description: 'Varsayılan' },
  { value: 5, label: '5 Ürün', description: 'Kompakt' },
  { value: 6, label: '6 Ürün', description: 'Çok kompakt' }
];

const BOX_POSITION_OPTIONS = [
  { value: 'first', label: 'İlk Sırada', icon: Package, description: 'Katalogda en başta görünür' },
  { value: 'last', label: 'Son Sırada', icon: Package, description: 'Katalogda en sonda görünür' },
  { value: 'hidden', label: 'Gizli', icon: EyeOff, description: 'Katalogda görünmez' }
];

const BONBON_POSITION_OPTIONS = [
  { value: 'first', label: 'İlk Sırada', icon: Candy, description: 'Kutu kartından sonra görünür' },
  { value: 'last', label: 'Son Sırada', icon: Candy, description: 'Katalogda en sonda görünür' },
  { value: 'hidden', label: 'Gizli', icon: EyeOff, description: 'Katalogda görünmez' }
];

export const CatalogSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<CatalogSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Firestore'dan ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'catalog');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() } as CatalogSettings);
        }
      } catch (error) {
        console.error('Katalog ayarları yüklenemedi:', error);
        toast.error('Ayarlar yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Kaydet
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'site_settings', 'catalog');
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      });
      toast.success('Katalog ayarları kaydedildi');
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
          <h2 className="text-2xl font-display font-bold text-gray-900">Katalog Ayarları</h2>
          <p className="text-sm text-gray-500 mt-1">Ürün kataloğunun görünümünü özelleştirin</p>
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

      {/* Grid Kolon Sayısı */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
            <LayoutGrid className="text-gold" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Satır Başına Ürün Sayısı</h3>
            <p className="text-sm text-gray-500">Desktop görünümde bir satırda kaç ürün gösterilsin</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {COLUMN_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSettings(prev => ({ ...prev, gridColumns: option.value }))}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                ${settings.gridColumns === option.value
                  ? 'border-gold bg-gold/5 ring-2 ring-gold/20'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              {/* Grid Preview */}
              <div className="flex justify-center gap-1 mb-3">
                {Array.from({ length: option.value }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-4 rounded-sm ${
                      settings.gridColumns === option.value ? 'bg-gold' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-center">
                <span className={`font-semibold ${settings.gridColumns === option.value ? 'text-gold' : 'text-gray-900'}`}>
                  {option.label}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
              </div>
              {settings.gridColumns === option.value && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Varsayılan Görünüm Modu */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-mocha-100 flex items-center justify-center">
            <Eye className="text-mocha-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Varsayılan Görünüm</h3>
            <p className="text-sm text-gray-500">Sayfa açıldığında hangi görünüm aktif olsun</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => setSettings(prev => ({ ...prev, defaultViewMode: 'grid' }))}
            className={`
              flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
              ${settings.defaultViewMode === 'grid'
                ? 'border-gold bg-gold/5 ring-2 ring-gold/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
          >
            <LayoutGrid size={24} className={settings.defaultViewMode === 'grid' ? 'text-gold' : 'text-gray-400'} />
            <div className="text-left">
              <span className={`font-semibold ${settings.defaultViewMode === 'grid' ? 'text-gold' : 'text-gray-900'}`}>
                Grid Görünüm
              </span>
              <p className="text-xs text-gray-500">Kartlar yan yana</p>
            </div>
          </button>

          <button
            onClick={() => setSettings(prev => ({ ...prev, defaultViewMode: 'list' }))}
            className={`
              flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
              ${settings.defaultViewMode === 'list'
                ? 'border-gold bg-gold/5 ring-2 ring-gold/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
          >
            <Rows3 size={24} className={settings.defaultViewMode === 'list' ? 'text-gold' : 'text-gray-400'} />
            <div className="text-left">
              <span className={`font-semibold ${settings.defaultViewMode === 'list' ? 'text-gold' : 'text-gray-900'}`}>
                Liste Görünüm
              </span>
              <p className="text-xs text-gray-500">Kartlar alt alta</p>
            </div>
          </button>
        </div>
      </div>

      {/* Kutu Kartı Pozisyonu */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center">
            <Package className="text-brown-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">"Kendi Kutunu Oluştur" Kartı</h3>
            <p className="text-sm text-gray-500">Özel kutu kartının katalogdaki konumu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {BOX_POSITION_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setSettings(prev => ({ ...prev, boxCardPosition: option.value as CatalogSettings['boxCardPosition'] }))}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                  ${settings.boxCardPosition === option.value
                    ? 'border-gold bg-gold/5 ring-2 ring-gold/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <Icon size={20} className={settings.boxCardPosition === option.value ? 'text-gold' : 'text-gray-400'} />
                <div className="text-left">
                  <span className={`font-semibold ${settings.boxCardPosition === option.value ? 'text-gold' : 'text-gray-900'}`}>
                    {option.label}
                  </span>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bonbon Koleksiyon Kartı Pozisyonu */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
            <Candy className="text-pink-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">"Bonbon Koleksiyonu" Kartı</h3>
            <p className="text-sm text-gray-500">Bonbon koleksiyon kartının katalogdaki konumu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {BONBON_POSITION_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setSettings(prev => ({ ...prev, bonbonCardPosition: option.value as CatalogSettings['bonbonCardPosition'] }))}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                  ${settings.bonbonCardPosition === option.value
                    ? 'border-gold bg-gold/5 ring-2 ring-gold/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <Icon size={20} className={settings.bonbonCardPosition === option.value ? 'text-gold' : 'text-gray-400'} />
                <div className="text-left">
                  <span className={`font-semibold ${settings.bonbonCardPosition === option.value ? 'text-gold' : 'text-gray-900'}`}>
                    {option.label}
                  </span>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Varsayılan Sıralama */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <ArrowUpDown className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Varsayılan Sıralama</h3>
            <p className="text-sm text-gray-500">Katalog açıldığında ürünler nasıl sıralansın</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setSettings(prev => ({ ...prev, defaultSortMode: option.value as CatalogSettings['defaultSortMode'] }))}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                  ${settings.defaultSortMode === option.value
                    ? 'border-gold bg-gold/5 ring-2 ring-gold/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <Icon size={20} className={settings.defaultSortMode === option.value ? 'text-gold' : 'text-gray-400'} />
                <div className="text-left">
                  <span className={`font-semibold ${settings.defaultSortMode === option.value ? 'text-gold' : 'text-gray-900'}`}>
                    {option.label}
                  </span>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Önizleme</h3>
        <div
          className="grid gap-3 transition-all duration-300"
          style={{ gridTemplateColumns: `repeat(${settings.gridColumns}, 1fr)` }}
        >
          {/* Kutu kartı - ilk sırada */}
          {settings.boxCardPosition === 'first' && (
            <div className="aspect-[4/5] rounded-lg bg-gold/20 border-2 border-gold/30 flex items-center justify-center">
              <Package className="text-gold" size={24} />
            </div>
          )}
          {/* Bonbon kartı - ilk sırada (kutu kartından sonra) */}
          {settings.bonbonCardPosition === 'first' && (
            <div className="aspect-[4/5] rounded-lg bg-pink-100 border-2 border-pink-300 flex items-center justify-center">
              <Candy className="text-pink-500" size={24} />
            </div>
          )}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-lg bg-gray-200 border border-gray-300" />
          ))}
          {/* Bonbon kartı - son sırada */}
          {settings.bonbonCardPosition === 'last' && (
            <div className="aspect-[4/5] rounded-lg bg-pink-100 border-2 border-pink-300 flex items-center justify-center">
              <Candy className="text-pink-500" size={24} />
            </div>
          )}
          {/* Kutu kartı - son sırada */}
          {settings.boxCardPosition === 'last' && (
            <div className="aspect-[4/5] rounded-lg bg-gold/20 border-2 border-gold/30 flex items-center justify-center">
              <Package className="text-gold" size={24} />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          {settings.gridColumns} ürün/satır • {settings.defaultViewMode === 'grid' ? 'Grid' : 'Liste'} görünüm
          {settings.boxCardPosition === 'hidden' && ' • Kutu kartı gizli'}
          {settings.bonbonCardPosition === 'hidden' && ' • Bonbon kartı gizli'}
        </p>
      </div>
    </div>
  );
};

export default CatalogSettingsTab;
