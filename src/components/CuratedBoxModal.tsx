import React, { useState, useMemo, useEffect } from 'react';
import { Product, BoxConfig, BoxSizeOption, BoxPreset } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { X, ShoppingCart, Package, Plus, Check, Loader2, Gift, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { collection, getDocs, query, where, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Varsayılan kutu boyutu seçenekleri (Firestore'dan yüklenemezse kullanılır)
const DEFAULT_BOX_SIZES: BoxSizeOption[] = [
  { id: '4-box', size: 4, label: "4'lü Kutu", gridCols: 2, gridRows: 2, description: 'Deneme paketi', basePrice: 0, enabled: true },
  { id: '8-box', size: 8, label: "8'li Kutu", gridCols: 4, gridRows: 2, description: 'Klasik seçim', basePrice: 0, enabled: true },
  { id: '16-box', size: 16, label: "16'lı Kutu", gridCols: 4, gridRows: 4, description: 'Aile boyu', basePrice: 0, enabled: true },
  { id: '25-box', size: 25, label: "25'li Kutu", gridCols: 5, gridRows: 5, description: 'Özel günler için', basePrice: 0, enabled: true },
];

interface CuratedBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableProducts?: Product[]; // Opsiyonel - verilmezse Firestore'dan çekilir
  initialProduct?: Product; // Bonbon detay sayfasından gelen başlangıç ürünü
}

export const CuratedBoxModal: React.FC<CuratedBoxModalProps> = ({ isOpen, onClose, availableProducts, initialProduct }) => {
  const [boxSizes, setBoxSizes] = useState<BoxSizeOption[]>(DEFAULT_BOX_SIZES);
  const [boxConfig, setBoxConfig] = useState<BoxConfig | null>(null);
  const [selectedBoxSize, setSelectedBoxSize] = useState(4);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [bonbonProducts, setBonbonProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTaste, setSelectedTaste] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'custom' | 'presets'>('custom');
  const [presets, setPresets] = useState<BoxPreset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const { addToCart } = useCart();
  const { t } = useLanguage();

  // Unique tat profilleri
  const tasteProfiles = useMemo(() => {
    const all = bonbonProducts.flatMap(p => p.attributes || []);
    return [...new Set(all)].sort();
  }, [bonbonProducts]);

  // Tat profiline göre filtrelenmiş bonbonlar
  const filteredBonbons = useMemo(() => {
    if (!selectedTaste) return bonbonProducts;
    return bonbonProducts.filter(p => p.attributes?.includes(selectedTaste));
  }, [bonbonProducts, selectedTaste]);

  // Firestore'dan box_config yapılandırmasını çek
  useEffect(() => {
    if (!isOpen) return;

    const fetchBoxConfig = async () => {
      try {
        const docRef = doc(db, 'box_config', 'default');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const config = docSnap.data() as BoxConfig;
          setBoxConfig(config);
          // Sadece aktif kutu boyutlarını al
          const enabledSizes = config.boxSizes?.filter(s => s.enabled) || [];
          if (enabledSizes.length > 0) {
            setBoxSizes(enabledSizes);
            // İlk aktif boyutu seç
            setSelectedBoxSize(enabledSizes[0].size);
          }
        }
      } catch (error) {
        console.error('Box config yüklenemedi:', error);
      }
    };

    fetchBoxConfig();
  }, [isOpen]);

  // Eğer availableProducts verilmemişse, Firestore'dan bonbonları çek
  useEffect(() => {
    if (availableProducts) {
      setBonbonProducts(availableProducts);
      return;
    }

    if (!isOpen) return;

    const fetchBonbons = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'products'), where('isBoxContent', '==', true));
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setBonbonProducts(products.filter(p => !p.isOutOfStock));
      } catch (error) {
        console.error('Bonbon ürünleri yüklenemedi:', error);
        toast.error('Ürünler yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBonbons();
  }, [isOpen, availableProducts]);

  // initialProduct verilmişse modal açıldığında otomatik ekle
  useEffect(() => {
    if (isOpen && initialProduct && selectedProducts.length === 0) {
      setSelectedProducts([initialProduct]);
    }
  }, [isOpen, initialProduct]);

  // Modal kapandığında seçimleri sıfırla
  useEffect(() => {
    if (!isOpen) {
      setSelectedProducts([]);
      setActiveTab('custom');
    }
  }, [isOpen]);

  // Preset'leri yükle
  useEffect(() => {
    if (!isOpen) return;

    const fetchPresets = async () => {
      setIsLoadingPresets(true);
      try {
        const presetsQuery = query(
          collection(db, 'box_presets'),
          where('enabled', '==', true),
          orderBy('sortOrder', 'asc')
        );
        const snapshot = await getDocs(presetsQuery);
        const loadedPresets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BoxPreset[];
        setPresets(loadedPresets);
      } catch (error) {
        console.error('Preset\'ler yüklenemedi:', error);
      } finally {
        setIsLoadingPresets(false);
      }
    };

    fetchPresets();
  }, [isOpen]);

  // Preset seçildiğinde bonbonları yükle
  const handleSelectPreset = async (preset: BoxPreset) => {
    // Preset'in kutu boyutunu seç
    const matchingBoxSize = boxSizes.find(b => b.size === preset.boxSize);
    if (matchingBoxSize) {
      setSelectedBoxSize(preset.boxSize);
    }

    // Preset'teki bonbonları bul ve selectedProducts'a ekle
    const presetProducts: Product[] = [];
    for (const productId of preset.productIds) {
      const product = bonbonProducts.find(p => p.id === productId);
      if (product) {
        presetProducts.push(product);
      }
    }

    if (presetProducts.length > 0) {
      setSelectedProducts(presetProducts);
      setActiveTab('custom');
      toast.success(`"${preset.name}" kutusu yüklendi!`);
    } else {
      toast.error('Bu kutudaki bonbonlar bulunamadı');
    }
  };

  // Seçilen kutu boyutu bilgisi
  const currentBox = boxSizes.find(b => b.size === selectedBoxSize) || boxSizes[0];

  // Kalan slot sayısı
  const remainingSlots = selectedBoxSize - selectedProducts.length;
  const progressPercentage = (selectedProducts.length / selectedBoxSize) * 100;

  // Ürün ekleme/çıkarma (aynı ürün birden fazla eklenebilir)
  const handleAddProduct = (product: Product) => {
    if (selectedProducts.length >= selectedBoxSize) {
      toast.error(`Kutu kapasitesi dolu! En fazla ${selectedBoxSize} bonbon seçebilirsiniz.`);
      return;
    }
    setSelectedProducts(prev => [...prev, product]);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  // Kutu boyutu değiştiğinde seçimleri sıfırla
  const handleBoxSizeChange = (size: number) => {
    setSelectedBoxSize(size);
    setSelectedProducts([]);
  };

  const handleAddSelectedToCart = () => {
    if (selectedProducts.length === 0) {
      toast.error('Lütfen en az bir bonbon seçin.');
      return;
    }

    // Her ürünü ayrı ayrı sepete ekle
    selectedProducts.forEach(p => addToCart(p));
    toast.success(`${selectedProducts.length} bonbon sepete eklendi!`);
    setSelectedProducts([]);
    onClose();
  };

  // Toplam fiyat: Kutu maliyeti + Bonbon fiyatları
  const totalPrice = useMemo(() => {
    const bonbonTotal = selectedProducts.reduce((total, p) => total + p.price, 0);
    const boxBasePrice = currentBox?.basePrice || 0;
    return bonbonTotal + boxBasePrice;
  }, [selectedProducts, currentBox]);

  // Her üründen kaç tane seçilmiş
  const getProductCount = (productId: string) => {
    return selectedProducts.filter(p => p.id === productId).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-800 rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-cream-100 dark:border-dark-700">
          <div className="flex items-center gap-3">
            {boxConfig?.cardImage ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
                <img src={boxConfig.cardImage} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-gold to-brand-mustard rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="text-white" size={24} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-brown-900 dark:text-white">
                {boxConfig?.modalTitle || t('create_custom_box') || 'Kendi Kutunu Oluştur'}
              </h2>
              <p className="text-xs text-mocha-400">{boxConfig?.modalSubtitle || 'Favori bonbonlarını seç, özel kutunu hazırla'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-cream-100 dark:bg-dark-700 flex items-center justify-center hover:bg-cream-200 dark:hover:bg-dark-600 transition-colors"
          >
            <X size={20} className="text-mocha-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

          {/* Sol Panel - Kutu Boyutu & Grid Görünümü */}
          <div className="lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-r border-cream-100 dark:border-dark-700 overflow-y-auto">

            {/* Sekme Butonları */}
            {presets.length > 0 && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'custom'
                      ? 'bg-gold text-white shadow-lg'
                      : 'bg-cream-100 dark:bg-dark-600 text-mocha-600 dark:text-mocha-300 hover:bg-cream-200 dark:hover:bg-dark-500'
                  }`}
                >
                  <Sparkles size={16} />
                  Kendi Kutun
                </button>
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'presets'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-cream-100 dark:bg-dark-600 text-mocha-600 dark:text-mocha-300 hover:bg-cream-200 dark:hover:bg-dark-500'
                  }`}
                >
                  <Gift size={16} />
                  Hazır Kutular
                </button>
              </div>
            )}

            {/* Hazır Kutular Sekmesi */}
            {activeTab === 'presets' ? (
              <div>
                <label className="text-[10px] font-black text-mocha-400 uppercase tracking-widest mb-3 block">
                  Hazır Kutulardan Seç
                </label>
                {isLoadingPresets ? (
                  <div className="text-center py-12 text-mocha-400">
                    <Loader2 size={32} className="mx-auto mb-4 animate-spin opacity-50" />
                    <p className="text-sm">Hazır kutular yükleniyor...</p>
                  </div>
                ) : presets.length === 0 ? (
                  <div className="text-center py-12 text-mocha-400">
                    <Gift size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Henüz hazır kutu yok</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {presets.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className="w-full p-4 rounded-2xl border-2 border-cream-200 dark:border-dark-600 hover:border-purple-500/50 bg-cream-50 dark:bg-dark-700 transition-all text-left group"
                      >
                        <div className="flex gap-4">
                          {/* Preset Görseli */}
                          {preset.image ? (
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-cream-100 dark:bg-dark-600">
                              <img src={preset.image} alt={preset.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                              <Gift size={24} className="text-purple-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-brown-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {preset.name}
                            </h4>
                            <p className="text-xs text-mocha-500 line-clamp-2 mb-2">
                              {preset.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                                {preset.boxSize}'li kutu
                              </span>
                              <span className="text-[10px] font-bold text-mocha-400 bg-cream-200 dark:bg-dark-600 px-2 py-0.5 rounded-full">
                                {preset.productIds.length} bonbon
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
            {/* Kutu Boyutu Seçimi */}
            <div className="mb-6">
              <label className="text-[10px] font-black text-mocha-400 uppercase tracking-widest mb-3 block">
                Kutu Boyutu Seç
              </label>
              <div className="grid grid-cols-2 gap-3">
                {boxSizes.map((box) => (
                  <button
                    key={box.size}
                    onClick={() => handleBoxSizeChange(box.size)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedBoxSize === box.size
                        ? 'border-gold bg-gold/10 shadow-lg ring-2 ring-gold/20'
                        : 'border-cream-200 dark:border-dark-600 hover:border-gold/50 bg-cream-50 dark:bg-dark-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-lg font-bold ${selectedBoxSize === box.size ? 'text-gold' : 'text-brown-900 dark:text-white'}`}>
                        {box.label}
                      </p>
                      {box.basePrice > 0 && (
                        <span className="text-xs font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                          +₺{box.basePrice}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-mocha-400 mt-1">{box.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Görsel Grid - Kutu İçeriği */}
            <div className="mb-6">
              <label className="text-[10px] font-black text-mocha-400 uppercase tracking-widest mb-3 block">
                Kutu İçeriği ({selectedProducts.length}/{selectedBoxSize})
              </label>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-2 bg-cream-200 dark:bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      progressPercentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-gold to-brand-mustard'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-mocha-400 mt-2 text-center">
                  {remainingSlots > 0
                    ? `${remainingSlots} slot daha ekleyebilirsin`
                    : '✓ Kutun hazır!'}
                </p>
              </div>

              {/* Grid Görünümü */}
              <div
                className="grid gap-2 p-4 bg-cream-50 dark:bg-dark-700 rounded-2xl border border-cream-200 dark:border-dark-600"
                style={{
                  gridTemplateColumns: `repeat(${currentBox.gridCols}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: selectedBoxSize }).map((_, index) => {
                  const product = selectedProducts[index];
                  return (
                    <div
                      key={index}
                      className={`aspect-square rounded-xl overflow-hidden transition-all ${
                        product
                          ? 'bg-white dark:bg-dark-600 shadow-md cursor-pointer hover:scale-105 group relative'
                          : 'bg-cream-200/50 dark:bg-dark-600/50 border-2 border-dashed border-cream-300 dark:border-dark-500'
                      }`}
                      onClick={() => product && handleRemoveProduct(index)}
                    >
                      {product ? (
                        <>
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <X size={16} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Plus size={14} className="text-cream-400 dark:text-dark-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
              </>
            )}
          </div>

          {/* Sağ Panel - Bonbon Seçimi */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            <label className="text-[10px] font-black text-mocha-400 uppercase tracking-widest mb-3 block">
              Bonbon Seç
            </label>

            {/* Tat Profili Filtreleme */}
            {tasteProfiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedTaste(null)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                    !selectedTaste
                      ? 'bg-gold text-white shadow-sm'
                      : 'bg-cream-100 dark:bg-dark-600 text-mocha-600 dark:text-mocha-300 hover:bg-cream-200 dark:hover:bg-dark-500'
                  }`}
                >
                  Tümü
                </button>
                {tasteProfiles.map(taste => (
                  <button
                    key={taste}
                    onClick={() => setSelectedTaste(taste)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                      selectedTaste === taste
                        ? 'bg-gold text-white shadow-sm'
                        : 'bg-cream-100 dark:bg-dark-600 text-mocha-600 dark:text-mocha-300 hover:bg-cream-200 dark:hover:bg-dark-500'
                    }`}
                  >
                    {taste}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12 text-mocha-400">
                <Loader2 size={48} className="mx-auto mb-4 animate-spin opacity-50" />
                <p className="text-sm">Bonbonlar yükleniyor...</p>
              </div>
            ) : bonbonProducts.length === 0 ? (
              <div className="text-center py-12 text-mocha-400">
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">Henüz seçilebilir bonbon yok</p>
              </div>
            ) : filteredBonbons.length === 0 ? (
              <div className="text-center py-12 text-mocha-400">
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">"{selectedTaste}" profilinde bonbon bulunamadı</p>
                <button
                  onClick={() => setSelectedTaste(null)}
                  className="mt-3 text-xs text-gold hover:underline"
                >
                  Filtreyi temizle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredBonbons.map(product => {
                  const count = getProductCount(product.id);
                  const isDisabled = selectedProducts.length >= selectedBoxSize && count === 0;

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      disabled={isDisabled}
                      className={`relative p-3 rounded-2xl border-2 transition-all text-left group ${
                        count > 0
                          ? 'border-gold bg-gold/5 shadow-md'
                          : isDisabled
                            ? 'border-cream-200 dark:border-dark-600 opacity-50 cursor-not-allowed'
                            : 'border-cream-200 dark:border-dark-600 hover:border-gold/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-cream-100 dark:bg-dark-600">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <p className="text-xs font-bold text-brown-900 dark:text-white line-clamp-2 mb-1">
                        {product.title}
                      </p>
                      <p className="text-[10px] text-gold font-bold">
                        ₺{product.price.toFixed(2)}
                      </p>

                      {/* Seçim sayısı badge */}
                      {count > 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                          {count}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cream-100 dark:border-dark-700 bg-cream-50 dark:bg-dark-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-mocha-400 uppercase tracking-widest">Toplam Tutar</p>
              <p className="text-2xl font-bold text-brown-900 dark:text-white">
                ₺{totalPrice.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleAddSelectedToCart}
              disabled={selectedProducts.length === 0}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold uppercase tracking-wider text-sm transition-all ${
                selectedProducts.length === 0
                  ? 'bg-cream-200 dark:bg-dark-600 text-mocha-400 cursor-not-allowed'
                  : selectedProducts.length === selectedBoxSize
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-brown-900 hover:bg-black text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {selectedProducts.length === selectedBoxSize ? (
                <>
                  <Check size={20} />
                  Kutunu Sepete Ekle
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  {selectedProducts.length > 0
                    ? `${selectedProducts.length} Bonbon Ekle`
                    : 'Bonbon Seç'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
