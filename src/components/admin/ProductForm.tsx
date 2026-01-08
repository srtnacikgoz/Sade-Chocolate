import React, { useState, useRef, useEffect } from 'react';
import { Product, BoxItem, ProductBadge, ProductType } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Package, DollarSign, Image as ImageIcon, Video, Save, Activity, Info, AlertCircle, MapPin, Upload, X as CloseIcon, Loader2, Milk, Bean, Square, Nut, Cherry, Coffee, Cookie, Flame, IceCream, Truck, Scale, Ruler } from 'lucide-react';
import { BrandIcon } from '../ui/BrandIcon';

// ✅ Senin seçebileceğin ikon kütüphanen
const ICON_LIBRARY = [
  { id: 'milk', icon: Milk },
  { id: 'dark', icon: Bean },
  { id: 'white', icon: Square },
  { id: 'nut', icon: Nut },
  { id: 'fruit', icon: Cherry },
  { id: 'coffee', icon: Coffee },
  { id: 'cookie', icon: Cookie },
  { id: 'flame', icon: Flame },
  { id: 'icecream', icon: IceCream },
  { id: 'special', icon: BrandIcon }
];
import { toast } from 'sonner';
// ✅ Firebase Storage Araçları
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { Trash2, Plus } from 'lucide-react';
const FormAccordion = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-[24px] overflow-hidden bg-slate-50/30">
      <button 
        type="button" onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400">
            <Icon size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
        </div>
        <Plus size={16} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 p-4 pt-0' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        {children}
      </div>
    </div>
  );
};
interface ProductFormProps {
  product: Product | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}
const getAttrIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('sütlü')) return <Milk size={14} />;
  if (lowerName.includes('bitter')) return <Bean size={14} />;
  if (lowerName.includes('beyaz')) return <Square size={14} />;
  if (lowerName.includes('fındık') || lowerName.includes('ceviz') || lowerName.includes('fıstık')) return <Nut size={14} />;
  if (lowerName.includes('meyve') || lowerName.includes('vişne')) return <Cherry size={14} />;
  if (lowerName.includes('kahve')) return <Coffee size={14} />;
  return <BrandIcon size={14} />;
};
export const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>(product || {
    title: '', price: 0, currency: '₺', category: PRODUCT_CATEGORIES[0].id, origin: '', image: '', video: '',
    description: '', detailedDescription: '', tastingNotes: '', ingredients: '', allergens: '',
    isOutOfStock: false, locationStock: { yesilbahce: 0 },
    boxItems: [],
    images: [], // ✅ Dandelion tarzı çoklu görsel galerisi
    productType: 'other' as ProductType, // ✅ Ürün tipi: tablet, filled, other
    showSensory: true, // ✅ Varsayılan açık
    attributes: [], // ✅ Boş özellik dizisi
    nutritionalValues: '', // ✅ Besin değerleri
    valueBadges: [], // ✅ Dinamik değer simgeleri
    sensory: { intensity: 50, sweetness: 50, creaminess: 50, fruitiness: 0, acidity: 0, crunch: 0 },
    // 🎁 Kutu içeriği sistemi
    isBoxContent: false,
    boxContentIds: [],
    boxSize: 4,
    // 📦 Kargo bilgileri
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 }
  });

  // 🔄 Product prop'u değiştiğinde formData'yı güncelle
  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAlternate, setIsUploadingAlternate] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [uploadingBoxIndex, setUploadingBoxIndex] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveAlternate, setDragActiveAlternate] = useState(false);
  const [dragActiveGallery, setDragActiveGallery] = useState(false);
  const [newAttr, setNewAttr] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('special'); // Varsayılan ikon
  // ✅ Dinamik Lezzet Havuzu (Başlangıçta boş veya temel öğelerle başlayabilir)
  // ✅ Dinamik Lezzet Havuzu (Hafızalı: Tarayıcıyı kapatsan da oluşturduğun lezzetler silinmez)
  const [attributePool, setAttributePool] = useState<string[]>(() => {
    const saved = localStorage.getItem('sade_chef_attributes');
    return saved ? JSON.parse(saved) : ['Sütlü Çikolata', 'Bitter Çikolata(%55)', 'Fındıklı'];
  });

  // ✅ Koleksiyon Havuzu (Hafızalı)
  const [collectionPool, setCollectionPool] = useState<string[]>(() => {
    const saved = localStorage.getItem('sade_collection_pool');
    return saved ? JSON.parse(saved) : ['Tablet', 'Gift Box', 'Truffle'];
  });
  const [newCollection, setNewCollection] = useState('');
  const [badges, setBadges] = useState<ProductBadge[]>([]);
  const [bonbonProducts, setBonbonProducts] = useState<Product[]>([]); // Kutu içeriği olarak seçilebilir ürünler

  React.useEffect(() => {
    localStorage.setItem('sade_collection_pool', JSON.stringify(collectionPool));
  }, [collectionPool]);

  // Fetch badges from Firebase
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const q = query(collection(db, 'product_badges'), orderBy('priority', 'asc'));
        const snapshot = await getDocs(q);
        const badgeData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ProductBadge[];
        setBadges(badgeData.filter(b => b.active)); // Only show active badges
      } catch (error) {
        console.error('Badge verileri yüklenemedi:', error);
      }
    };
    fetchBadges();
  }, []);

  // Fetch bonbon products (isBoxContent = true)
  useEffect(() => {
    const fetchBonbons = async () => {
      try {
        const q = query(collection(db, 'products'));
        const snapshot = await getDocs(q);
        const allProducts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Product[];
        // Sadece isBoxContent === true olanları filtrele, kendi ID'mizi çıkar
        setBonbonProducts(allProducts.filter(p => p.isBoxContent && p.id !== product?.id));
      } catch (error) {
        console.error('Bonbon ürünleri yüklenemedi:', error);
      }
    };
    fetchBonbons();
  }, [product?.id]);

  // Bonbon seçme/çıkarma (aynı bonbon birden fazla eklenebilir)
  const toggleBonbon = (bonbonId: string) => {
    const currentContents = formData.boxContentIds || [];
    const boxCapacity = formData.boxSize || 4;

    // Çıkartma: bonbon zaten seçiliyse bir tanesini çıkar
    if (currentContents.includes(bonbonId)) {
      const index = currentContents.indexOf(bonbonId);
      setFormData({
        ...formData,
        boxContentIds: [...currentContents.slice(0, index), ...currentContents.slice(index + 1)]
      });
      return;
    }

    // Ekleme: Kapasite doluysa uyar
    if (currentContents.length >= boxCapacity) {
      toast.error(`En fazla ${boxCapacity} bonbon seçebilirsiniz!`);
      return;
    }

    // Ekle
    setFormData({
      ...formData,
      boxContentIds: [...currentContents, bonbonId]
    });
  };

  // Kategori seçim/kaldırma (Checkbox mantığı)
  const toggleCategory = (cat: string) => {
    const current = formData.categories || [];
    const next = current.includes(cat)
      ? current.filter((c: string) => c !== cat)
      : [...current, cat];
    setFormData({ ...formData, categories: next });
  };

  const addToCollectionPool = () => {
    if (!newCollection.trim()) return;
    if (!collectionPool.includes(newCollection.trim())) {
      setCollectionPool(prev => [...prev, newCollection.trim()]);
    }
    toggleCategory(newCollection.trim());
    setNewCollection('');
  };
  // ✅ Değer Etiketleri Havuzu (Hafızalı)
  const [badgePool, setBadgePool] = useState<{icon: string, label: string}[]>(() => {
    const saved = localStorage.getItem('sade_badge_pool');
    return saved ? JSON.parse(saved) : [
      { icon: 'back_hand', label: '100% El Yapımı' },
      { icon: 'nature_people', label: 'Katkısız' },
      { icon: 'workspace_premium', label: 'Belçika Kalitesi' }
    ];
  });
  const [newBadgeLabel, setNewBadgeLabel] = useState('');
  const [selectedBadgeIcon, setSelectedBadgeIcon] = useState('verified');

  React.useEffect(() => {
    localStorage.setItem('sade_badge_pool', JSON.stringify(badgePool));
  }, [badgePool]);

  const removeFromBadgePool = (labelToDelete: string) => {
    const updated = badgePool.filter(b => b.label !== labelToDelete);
    setBadgePool(updated);
    const nextBadges = (formData.valueBadges || []).filter((b: any) => b.label !== labelToDelete);
    setFormData({ ...formData, valueBadges: nextBadges });
  };
  // ✅ Lezzet Havuzundan Silme
  const removeFromPool = (attrToDelete: string) => {
    const updatedPool = attributePool.filter(attr => attr !== attrToDelete);
    setAttributePool(updatedPool);
    if (formData.attributes?.includes(attrToDelete)) {
      setFormData({ ...formData, attributes: formData.attributes.filter((a: string) => a !== attrToDelete) });
    }
    toast.info(`${attrToDelete} havuzdan kaldırıldı.`);
  };

  // ✅ Koleksiyon Havuzundan Silme
  const removeFromCollectionPool = (catToDelete: string) => {
    const updatedPool = collectionPool.filter(cat => cat !== catToDelete);
    setCollectionPool(updatedPool);
    if (formData.category === catToDelete) {
      setFormData({ ...formData, category: updatedPool[0] || '' });
    }
    toast.info(`${catToDelete} koleksiyonu kaldırıldı.`);
  };

  // Havuz her değiştiğinde tarayıcı hafızasına kaydet
  React.useEffect(() => {
    localStorage.setItem('sade_chef_attributes', JSON.stringify(attributePool));
  }, [attributePool]);

  // Havuza yeni öğe ekler ve otomatik seçer
  const addToPoolAndSelect = () => {
    if (!newAttr.trim()) return;
    // Artık havuzda "İsim|İkonID" şeklinde saklıyoruz
    const entry = `${newAttr.trim()}|${selectedIcon}`;
    if (!attributePool.some(a => a.split('|')[0] === newAttr.trim())) {
      setAttributePool(prev => [...prev, entry]);
    }
    toggleAttribute(entry);
    setNewAttr('');
  };

  // Ürün için etiketi seç/kaldır (Checkbox mantığı)
  const toggleAttribute = (attr: string) => {
    const current = formData.attributes || [];
    const next = current.includes(attr) 
      ? current.filter((a: string) => a !== attr) 
      : [...current, attr];
    setFormData({ ...formData, attributes: next });
  };


  const fileInputRef = useRef<HTMLInputElement>(null);
  const alternateFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // ✅ GERÇEK YÜKLEME FONKSİYONU
  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setFormData((prev: any) => ({ ...prev, image: downloadURL }));
      toast.success("Görsel buluta başarıyla yüklendi! ☁️");
    } catch (error) {
      toast.error("Görsel yüklenirken bir hata oluştu.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ ALTERNATİF GÖRSEL YÜKLEME FONKSİYONU
  const uploadAlternateImage = async (file: File) => {
    try {
      setIsUploadingAlternate(true);
      const storageRef = ref(storage, `products/alternate/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setFormData((prev: any) => ({ ...prev, alternateImage: downloadURL }));
      toast.success("Alternatif görsel yüklendi! 🎨");
    } catch (error) {
      toast.error("Alternatif görsel yüklenemedi.");
      console.error(error);
    } finally {
      setIsUploadingAlternate(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadImage(e.dataTransfer.files[0]); // ✅ Dosyayı direkt buluta gönder
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]); // ✅ Seçilen dosyayı direkt buluta gönder
    }
  };

  // Alternate image handlers
  const handleDragAlternate = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActiveAlternate(true);
    else if (e.type === "dragleave") setDragActiveAlternate(false);
  };

  const handleDropAlternate = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveAlternate(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadAlternateImage(e.dataTransfer.files[0]);
    }
  };

  const onAlternateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAlternateImage(e.target.files[0]);
    }
  };

  // ✅ GALERİ GÖRSEL YÜKLEME FONKSİYONLARI (Dandelion Tarzı)
  const uploadGalleryImage = async (file: File) => {
    try {
      setIsUploadingGallery(true);
      const storageRef = ref(storage, `products/gallery/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setFormData((prev: any) => ({
        ...prev,
        images: [...(prev.images || []), downloadURL]
      }));
      toast.success("Galeri görseli eklendi! 🖼️");
    } catch (error) {
      toast.error("Galeri görseli yüklenemedi.");
      console.error(error);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleDragGallery = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActiveGallery(true);
    else if (e.type === "dragleave") setDragActiveGallery(false);
  };

  const handleDropGallery = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveGallery(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Birden fazla dosya yüklenebilir
      Array.from(files).forEach(file => uploadGalleryImage(file));
    }
  };

  const onGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => uploadGalleryImage(file));
    }
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setFormData((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: string, i: number) => i !== indexToRemove)
    }));
    toast.info("Görsel galeriden kaldırıldı");
  };

  const uploadBoxItemImage = async (file: File, index: number) => {
  try {
    setUploadingBoxIndex(index);
    const storageRef = ref(storage, `box-items/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    const newBoxItems = [...(formData.boxItems || [])];
    newBoxItems[index].image = downloadURL;
    setFormData({ ...formData, boxItems: newBoxItems });
    toast.success("Lezzet görseli güncellendi! ✨");
  } catch (error) {
    toast.error("Görsel yüklenemedi.");
  } finally {
    setUploadingBoxIndex(null);
  }
};
const addAttribute = () => {
    if (!newAttr.trim()) return;
    const current = formData.attributes || [];
    if (!current.includes(newAttr.trim())) {
      setFormData({ ...formData, attributes: [...current, newAttr.trim()] });
    }
    setNewAttr(''); // Giriş alanını temizle
  };
  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // ✅ CEO Standartlarında Doğrulama: Boş lezzet kaydını engeller
  if (formData.boxItems?.some((item: BoxItem) => !item.name || !item.description)) {
    toast.error('Lütfen tüm lezzetlerin adını ve açıklamasını doldurun! 🍫');
    return;
  }

  if (!formData.title.trim() || formData.price <= 0) {
    toast.error('Geçerli bir isim ve fiyat giriniz.');
    return;
  }
  onSave(formData);
};

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-8 overflow-y-auto px-8 md:px-12 py-8 custom-scrollbar w-full bg-white dark:bg-dark-900 transition-all">
      
      <div className="grid grid-cols-12 gap-12 items-start">
        {/* Sol: Görsel Yükleme */}
        <div className="col-span-4 space-y-6">
          {/* Ana Görsel */}
          <div
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative group h-64 rounded-[40px] border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden
              ${dragActive ? 'border-brown-900 bg-brown-50' : 'border-slate-200 bg-slate-50 hover:border-brown-900/30'}
              ${isUploading ? 'cursor-wait opacity-70' : ''}`}
          >
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={onFileChange} />
            {formData.image && <img src={formData.image} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40" alt="" />}
            <div className="relative z-10 text-center">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3">
                {isUploading ? <Loader2 className="animate-spin text-brown-900" /> : <Upload className="text-slate-400" />}
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                {isUploading ? 'YÜKLENİYOR...' : 'ANA GÖRSEL'}
              </p>
            </div>
          </div>

          {/* Alternatif Görsel (Hover) */}
          <div
            onDragEnter={handleDragAlternate} onDragLeave={handleDragAlternate} onDragOver={handleDragAlternate} onDrop={handleDropAlternate}
            onClick={() => !isUploadingAlternate && alternateFileInputRef.current?.click()}
            className={`relative group h-48 rounded-[40px] border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden
              ${dragActiveAlternate ? 'border-gold bg-gold/5' : 'border-slate-200 bg-slate-50 hover:border-gold/50'}
              ${isUploadingAlternate ? 'cursor-wait opacity-70' : ''}`}
          >
            <input ref={alternateFileInputRef} type="file" className="hidden" accept="image/*" onChange={onAlternateFileChange} />
            {formData.alternateImage && <img src={formData.alternateImage} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40" alt="" />}
            <div className="relative z-10 text-center">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-2">
                {isUploadingAlternate ? <Loader2 className="animate-spin text-gold" /> : <Upload className="text-slate-400" size={18} />}
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                {isUploadingAlternate ? 'YÜKLENİYOR...' : 'HOVER GÖRSELI'}
              </p>
              <p className="text-[7px] text-slate-300 mt-1">İsteğe bağlı</p>
            </div>
          </div>

          {/* ✅ Galeri Görselleri (Dandelion Tarzı) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Galeri Görselleri</label>
              <span className="text-[9px] text-slate-300">{formData.images?.length || 0} görsel</span>
            </div>

            {/* Mevcut Galeriler */}
            {formData.images && formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.images.map((img: string, index: number) => (
                  <div key={index} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                    <img src={img} alt={`Galeri ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <CloseIcon size={16} className="text-white" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-gold text-white text-[6px] text-center py-0.5 font-black">ANA</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Galeri Yükleme Alanı */}
            <div
              onDragEnter={handleDragGallery} onDragLeave={handleDragGallery} onDragOver={handleDragGallery} onDrop={handleDropGallery}
              onClick={() => !isUploadingGallery && galleryFileInputRef.current?.click()}
              className={`relative group h-24 rounded-[24px] border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer
                ${dragActiveGallery ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50/50 hover:border-emerald-500/50'}
                ${isUploadingGallery ? 'cursor-wait opacity-70' : ''}`}
            >
              <input ref={galleryFileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={onGalleryFileChange} />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  {isUploadingGallery ? <Loader2 className="animate-spin text-emerald-500" size={18} /> : <Plus className="text-slate-400" size={18} />}
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {isUploadingGallery ? 'YÜKLENİYOR...' : 'GÖRSEL EKLE'}
                  </p>
                  <p className="text-[7px] text-slate-300">Birden fazla seçebilirsiniz</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ: Temel Bilgiler */}
        <div className="col-span-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ürün Adı</label>
              <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-slate-50 rounded-[20px] text-sm outline-none border border-transparent focus:border-brown-900/20" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiyat & Menşei</label>
              <div className="flex gap-3">
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="flex-1 p-4 bg-slate-50 rounded-[20px] text-sm" required />
                <input value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} placeholder="Ülke" className="flex-1 p-4 bg-slate-50 rounded-[20px] text-sm" />
              </div>
            </div>
          </div>

          {/* --- ROZET SEÇİCİ --- */}
          <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ürün Rozeti</label>
            <div className="flex items-center gap-4">
              <select
                value={formData.badge || ''}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brown-900/20"
              >
                <option value="">Rozet Yok</option>
                {badges.map(badge => (
                  <option key={badge.id} value={badge.id}>
                    {badge.name.tr} / {badge.name.en} / {badge.name.ru}
                  </option>
                ))}
              </select>
              {formData.badge && badges.find(b => b.id === formData.badge) && (
                <div
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded"
                  style={{
                    backgroundColor: badges.find(b => b.id === formData.badge)!.bgColor,
                    color: badges.find(b => b.id === formData.badge)!.textColor
                  }}
                >
                  {badges.find(b => b.id === formData.badge)!.name.tr}
                </div>
              )}
            </div>
          </div>

          {/* --- STOK DURUMU --- */}
          <div className={`p-6 rounded-[32px] border-2 transition-all ${formData.isOutOfStock ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <span className="material-icons-outlined">{formData.isOutOfStock ? 'remove_shopping_cart' : 'check_circle'}</span>
                </div>
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest ${formData.isOutOfStock ? 'text-red-700' : 'text-emerald-700'}`}>
                    Stok Durumu
                  </label>
                  <p className="text-xs text-slate-500">
                    {formData.isOutOfStock ? 'Ürün şu anda tükendi' : 'Ürün stokta mevcut'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isOutOfStock: !formData.isOutOfStock })}
                className={`relative w-14 h-8 rounded-full transition-all ${formData.isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'}`}
              >
                <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${formData.isOutOfStock ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

         {/* --- KATEGORİ SEÇİMİ --- */}
          <div className="bg-gradient-to-r from-brown-50 to-amber-50 p-6 rounded-[32px] border border-brown-200/50 space-y-4">
            <label className="text-[10px] font-black text-brown-700 uppercase tracking-widest">Kategori</label>
            <div className="flex gap-3">
              {PRODUCT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`flex-1 px-5 py-3 rounded-xl border-2 transition-all text-sm font-bold ${
                    formData.category === cat.id
                      ? 'border-brown-900 bg-white text-brown-900 shadow-md'
                      : 'border-slate-200 bg-white/50 text-slate-400 hover:border-brown-900/30'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

         {/* --- ÜRÜN TİPİ SEÇİMİ (Tablet vs Diğer) --- */}
          <div className="bg-gradient-to-r from-gold/5 to-amber-50 p-8 rounded-[40px] border border-gold/20 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gold uppercase tracking-widest">Ürün Tipi</label>
              <span className="text-[9px] text-slate-400 italic">Tablet ürünler Dandelion tarzı minimal görünüm kullanır</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'tablet', label: 'Tablet', desc: 'Dandelion tarzı minimal layout' },
                { id: 'filled', label: 'Dolgulu', desc: 'Pralin, truffle vb.' },
                { id: 'box', label: '🎁 Kutu', desc: 'Bonbon kutusu (6lı, 9lu, vb.)' },
                { id: 'other', label: 'Diğer', desc: 'Standart görünüm' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, productType: type.id })}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${
                    formData.productType === type.id
                      ? 'border-gold bg-white shadow-lg'
                      : 'border-slate-200 bg-white/50 hover:border-gold/50'
                  }`}
                >
                  <p className={`text-sm font-bold ${formData.productType === type.id ? 'text-gold' : 'text-slate-600'}`}>
                    {type.label}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

         {/* --- 🎁 KUTU İÇERİĞİ TOGGLE --- */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-[40px] border border-orange-200/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isBoxContent"
                  checked={formData.isBoxContent || false}
                  onChange={(e) => setFormData({ ...formData, isBoxContent: e.target.checked })}
                  className="w-5 h-5 rounded border-orange-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="isBoxContent" className="text-[10px] font-black text-orange-600 uppercase tracking-widest cursor-pointer">
                  Kutu İçeriği Olarak Seçilebilsin Mi?
                </label>
              </div>
              <span className="text-[9px] text-slate-400 italic">Bonbonlar kutularda kullanılabilir</span>
            </div>
            {formData.isBoxContent && (
              <p className="text-xs text-orange-600 bg-white/70 p-3 rounded-xl border border-orange-200">
                ✓ Bu ürün, kutu oluştururken içerik olarak seçilebilecek.
              </p>
            )}
          </div>

         {/* --- 🎁 KUTU İÇERİĞİ SEÇİCİ (Sadece productType === 'box' ise) --- */}
         {formData.productType === 'box' && (
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-8 rounded-[40px] border border-rose-200/50 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Kutu İçeriği Seç</label>
              <div className="flex items-center gap-4">
                <span className="text-[9px] text-slate-400 italic">
                  {(formData.boxContentIds || []).length} / {formData.boxSize || 4} bonbon seçildi
                </span>
                <select
                  value={formData.boxSize || 4}
                  onChange={(e) => setFormData({ ...formData, boxSize: +e.target.value, boxContentIds: [] })}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 bg-white"
                >
                  <option value={4}>4'lü Kutu</option>
                  <option value={8}>8'li Kutu</option>
                  <option value={16}>16'lı Kutu</option>
                  <option value={25}>25'li Kutu</option>
                </select>
              </div>
            </div>

            {bonbonProducts.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white/70 p-4 rounded-xl text-center">
                Henüz kutu içeriği olarak işaretlenmiş bonbon yok. Önce bonbon ürünleri oluşturup "Kutu İçeriği Olarak Seçilebilsin Mi?" seçeneğini aktifleştirin.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {bonbonProducts.map((bonbon) => {
                  const selectedCount = (formData.boxContentIds || []).filter((id: string) => id === bonbon.id).length;
                  const isSelected = selectedCount > 0;

                  return (
                    <button
                      key={bonbon.id}
                      type="button"
                      onClick={() => toggleBonbon(bonbon.id)}
                      className={`relative border-2 rounded-2xl p-3 transition-all group ${
                        isSelected
                          ? 'border-rose-400 bg-rose-50 shadow-lg ring-2 ring-rose-200'
                          : 'border-slate-200 bg-white hover:border-rose-300 hover:shadow'
                      }`}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-2">
                        <img
                          src={bonbon.image}
                          alt={bonbon.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <p className={`text-xs font-bold line-clamp-2 ${isSelected ? 'text-rose-600' : 'text-slate-600'}`}>
                        {bonbon.title}
                      </p>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                          {selectedCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {(formData.boxContentIds || []).length > 0 && (
              <div className="bg-white/70 p-4 rounded-xl border border-rose-200">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2">Seçilen Bonbonlar:</p>
                <div className="flex flex-wrap gap-2">
                  {(formData.boxContentIds || []).map((id: string, idx: number) => {
                    const bonbon = bonbonProducts.find(b => b.id === id);
                    return bonbon ? (
                      <span key={idx} className="text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-full">
                        {bonbon.title}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
         )}

         {/* --- KOLEKSİYON YÖNETİMİ (DYNAMIC POOL) --- */}
          <div className="bg-slate-50/50 p-8 rounded-[40px] border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategoriler</label>
            </div>
            
            <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200/60">
              {collectionPool.map(cat => (
  <div key={cat} className="relative group">
    <button 
      type="button" 
      onClick={() => toggleCategory(cat)}
      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all border
        ${formData.categories?.includes(cat) ? 'bg-brown-900 text-white border-brown-900 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-brown-900/30'}`}
    >
      {cat}
    </button>
    
    {/* Silme Butonu - Sadece Hover'da görünür */}
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); removeFromCollectionPool(cat); }}
      className="absolute -top-2 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 z-10 scale-75 hover:scale-100"
    >
      <CloseIcon size={10} strokeWidth={3} />
    </button>
  </div>
))}
            </div>

            <div className="flex gap-3">
              <input value={newCollection} onChange={e => setNewCollection(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addToCollectionPool())} placeholder="Yeni kategori adı..." className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
              <button type="button" onClick={addToCollectionPool} className="px-6 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-brown-900 hover:text-white transition-all">HAVUZA EKLE</button>
            </div>
          </div>
        </div>
      </div>
{/* --- DEĞER ETİKETLERİ YÖNETİMİ (CEO SELECTION) --- */}
      <div className="p-10 bg-slate-50/30 rounded-[40px] border border-slate-100 space-y-8">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Değer Simgeleri (Dinamik Etiketler)</label>
          <span className="text-[10px] text-slate-400 italic">Ürünün en güçlü 3 özelliğini buradan seçin veya havuza ekleyin.</span>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {badgePool.map((b, i) => {
            const isSelected = formData.valueBadges?.some((v: any) => v.label === b.label);
            return (
              <div key={i} className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    const current = formData.valueBadges || [];
                    const next = isSelected ? current.filter((v: any) => v.label !== b.label) : [...current, b];
                    setFormData({ ...formData, valueBadges: next });
                  }}
                  className={`flex items-center gap-3 px-6 py-4 rounded-[24px] border transition-all ${isSelected ? 'bg-brown-900 text-gold border-brown-900 shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-200'}`}
                >
                  <span className="material-icons-outlined text-xl">{b.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">{b.label}</span>
                </button>
                <button type="button" onClick={() => removeFromBadgePool(b.label)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 z-10 scale-75 hover:scale-100">
                  <CloseIcon size={12} strokeWidth={3} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <input value={selectedBadgeIcon} onChange={e => setSelectedBadgeIcon(e.target.value)} placeholder="İkon Adı (verified, eco vb.)" className="w-48 p-4 bg-white border border-slate-200 rounded-2xl text-xs outline-none" />
          <input value={newBadgeLabel} onChange={e => setNewBadgeLabel(e.target.value)} placeholder="Etiket Metni (Örn: Taze Üretim)" className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl text-xs outline-none" />
          <button 
            type="button" 
            onClick={() => {
              if(!newBadgeLabel) return;
              const newB = { icon: selectedBadgeIcon, label: newBadgeLabel };
              setBadgePool([...badgePool, newB]);
              setNewBadgeLabel('');
            }}
            className="px-8 bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:bg-brown-900 hover:text-white transition-all"
          >
            HAVUZA EKLE
          </button>
        </div>
      </div>
      
{/* --- DİNAMİK LEZZET HAVUZU (CHEF'S SELECTION) --- */}
      <div className="p-10 bg-slate-50/50 rounded-[40px] border border-slate-100 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandIcon size={20} className="text-gold" />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Lezzet Havuzu</span>
          </div>
          <span className="text-[10px] text-slate-400 italic font-medium">Havuzdan seçim yapın veya yeni bir karakter oluşturun.</span>
        </div>

        <div className="flex flex-wrap gap-3 pb-8 border-b border-slate-200/60">
          {attributePool.map(attr => {
  const isSelected = formData.attributes?.includes(attr);
  return (
    <div key={attr} className="relative group">
      <button
        type="button"
        onClick={() => toggleAttribute(attr)}
        className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all border
          ${isSelected 
            ? 'bg-brown-900 text-white border-brown-900 shadow-xl shadow-brown-900/20 scale-105' 
            : 'bg-white text-slate-500 border-slate-200 hover:border-brown-900/30 hover:bg-slate-50'}`}
      >
        <div className={`flex items-center justify-center transition-all ${isSelected ? 'text-gold scale-110 drop-shadow-md' : 'text-slate-300'}`}>
  {getAttrIcon(attr)}
</div>
<span className="ml-1">{attr}</span>
      </button>
      
      {/* Silme Butonu - Sadece Hover'da görünür */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); removeFromPool(attr); }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 z-10 scale-75 hover:scale-100"
      >
        <CloseIcon size={12} strokeWidth={3} />
      </button>
    </div>
  );
})}
        </div>

      <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 w-fit">
            <span className="text-[9px] font-black text-slate-400 uppercase ml-2">İkon Seç:</span>
            <div className="flex gap-2">
              {ICON_LIBRARY.map(item => (
                <button 
                  key={item.id} type="button" onClick={() => setSelectedIcon(item.id)}
                  className={`p-2 rounded-lg transition-all ${selectedIcon === item.id ? 'bg-brown-900 text-gold shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  <item.icon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <input 
              value={newAttr} 
              onChange={e => setNewAttr(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addToPoolAndSelect())} 
              placeholder="Yeni lezzet karakteri yazın..." 
              className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-brown-900/5 transition-all" 
            />
            <button 
              type="button" 
              onClick={addToPoolAndSelect} 
              className="px-8 bg-brown-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-black transition-all"
            >
              HAVUZA EKLE
            </button>
          </div>
        </div>
      </div>

      {/* --- DUYUSAL PROFİL KONTROLÜ (FULL WIDTH & TOGGLE) --- */}
      <div className={`p-10 bg-slate-50/50 rounded-[40px] border border-slate-100 space-y-12 transition-all duration-500 ${!formData.showSensory ? 'bg-slate-100/50 ring-0 shadow-none' : 'bg-white shadow-sm ring-1 ring-slate-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${formData.showSensory ? 'bg-brown-900 text-gold shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
              <Activity size={28} />
            </div>
            <div>
              <span className="text-[12px] font-black text-slate-600 uppercase tracking-[0.2em]">Duyusal Karakter Analizi</span>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                {formData.showSensory ? 'Profil Analizi Sayfada Gösterilecek' : 'Profil Analizi Sayfada Gizlenecek'}
              </p>
            </div>
          </div>
          
          {/* Bölüm Aktif/Pasif Butonu */}
          <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl border border-slate-200">
            <span className={`text-[9px] font-black uppercase tracking-widest ${formData.showSensory ? 'text-emerald-600' : 'text-slate-400'}`}>
              {formData.showSensory ? 'AKTİF' : 'PASİF'}
            </span>
            <button 
              type="button" 
              onClick={() => setFormData({...formData, showSensory: !formData.showSensory})} 
              className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${formData.showSensory ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData.showSensory ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* 3 Sütunlu Izgara (Sadece aktifken etkileşime açık) */}
        <div className={`grid grid-cols-3 gap-x-16 gap-y-10 transition-all duration-500 ${!formData.showSensory ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
          {Object.keys(formData.sensory).map((key) => (
            <div key={key} className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{key}</span>
                <span className="text-sm font-display font-bold text-brown-900 italic">{formData.sensory[key]}%</span>
              </div>
              <input 
                type="range" 
                value={formData.sensory[key]} 
                onChange={e => setFormData({...formData, sensory: { ...formData.sensory, [key]: parseInt(e.target.value) }})} 
                className="w-full h-1.5 bg-slate-200 accent-brown-900 appearance-none rounded-full cursor-pointer transition-all hover:accent-gold" 
              />
            </div>
          ))}
        </div>
      </div>
      {/* --- LÄDERACH AKORDİYON İÇERİK GİRİŞLERİ (HER ZAMAN AKTİF) --- */}
      <div className="p-10 bg-white rounded-[40px] border border-slate-100 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Info size={20} className="text-slate-400" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Detaylı Ürün Bilgileri</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <FormAccordion title="Ürün Hikayesi & Detay" icon={Info}>
            <textarea value={formData.detailedDescription} onChange={e => setFormData({...formData, detailedDescription: e.target.value})} placeholder="Ürünün hikayesini yazın..." className="w-full p-4 bg-white rounded-2xl text-xs min-h-[120px] outline-none border border-slate-100" />
          </FormAccordion>

          <FormAccordion title="İçindekiler & Alerjenler" icon={AlertCircle}>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <textarea value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} placeholder="İçindekiler..." className="p-4 bg-white rounded-2xl text-xs min-h-[100px] outline-none border border-slate-100" />
              <textarea value={formData.allergens} onChange={e => setFormData({...formData, allergens: e.target.value})} placeholder="Alerjenler..." className="p-4 bg-white rounded-2xl text-xs min-h-[100px] outline-none border border-slate-100" />
            </div>
          </FormAccordion>

          <FormAccordion title="Besin Değerleri & Menşei" icon={MapPin}>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <textarea value={formData.nutritionalValues} onChange={e => setFormData({...formData, nutritionalValues: e.target.value})} placeholder="Besin Değerleri..." className="p-4 bg-white rounded-2xl text-xs min-h-[100px] outline-none border border-slate-100" />
              <input value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} placeholder="Menşei" className="p-4 bg-white rounded-2xl text-xs outline-none border border-slate-100" />
            </div>
          </FormAccordion>

          <FormAccordion title="Kargo Bilgileri" icon={Truck}>
            <div className="space-y-4 pt-2">
              {/* Ağırlık */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <Scale size={12} />
                  Ürün Ağırlığı (gram)
                </label>
                <input
                  type="number"
                  value={formData.weight || ''}
                  onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                  placeholder="Örn: 100"
                  className="w-full p-3 bg-white rounded-xl text-sm outline-none border border-slate-100 focus:border-gold"
                />
              </div>

              {/* Kutu Ölçüleri */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <Ruler size={12} />
                  Paket Ölçüleri (cm)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1">Uzunluk</span>
                    <input
                      type="number"
                      value={formData.dimensions?.length || ''}
                      onChange={e => setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, length: Number(e.target.value) }
                      })}
                      placeholder="U"
                      className="w-full p-3 bg-white rounded-xl text-sm outline-none border border-slate-100 focus:border-gold text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1">Genişlik</span>
                    <input
                      type="number"
                      value={formData.dimensions?.width || ''}
                      onChange={e => setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, width: Number(e.target.value) }
                      })}
                      placeholder="G"
                      className="w-full p-3 bg-white rounded-xl text-sm outline-none border border-slate-100 focus:border-gold text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1">Yükseklik</span>
                    <input
                      type="number"
                      value={formData.dimensions?.height || ''}
                      onChange={e => setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, height: Number(e.target.value) }
                      })}
                      placeholder="Y"
                      className="w-full p-3 bg-white rounded-xl text-sm outline-none border border-slate-100 focus:border-gold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Desi Hesaplaması */}
              {formData.dimensions?.length > 0 && formData.dimensions?.width > 0 && formData.dimensions?.height > 0 && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Hesaplanan Desi</p>
                      <p className="text-[9px] text-blue-500 mt-1">
                        ({formData.dimensions.length} × {formData.dimensions.width} × {formData.dimensions.height}) ÷ 3000
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-700">
                        {((formData.dimensions.length * formData.dimensions.width * formData.dimensions.height) / 3000).toFixed(2)}
                      </p>
                      <p className="text-[9px] text-blue-500">desi</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ağırlık vs Desi Karşılaştırma */}
              {formData.weight > 0 && formData.dimensions?.length > 0 && formData.dimensions?.width > 0 && formData.dimensions?.height > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-[9px] text-amber-700">
                    <strong>Not:</strong> Kargo firmaları ağırlık ({(formData.weight / 1000).toFixed(2)} kg) ve desi ({((formData.dimensions.length * formData.dimensions.width * formData.dimensions.height) / 3000).toFixed(2)}) arasından büyük olanı ücretlendirir.
                  </p>
                </div>
              )}
            </div>
          </FormAccordion>
        </div>
      </div>

      <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 space-y-4">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center">
        <Package size={16} className="text-gold" />
      </div>
      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Kutu İçeriği (Marcolini Stil)</span>
    </div>
    <button
      type="button"
      onClick={() => {
        const newItem: BoxItem = {
          id: `bi-${Date.now()}`,
          name: '',
          description: '',
          image: 'https://placehold.co/400x400/png?text=Sade',
          percentage: undefined,
          origin: '',
          tastingNotes: []
        };
        setFormData({ ...formData, boxItems: [...(formData.boxItems || []), newItem] });
      }}
      className="flex items-center gap-2 px-4 py-2 bg-white text-gold border border-gold/20 rounded-full text-[10px] font-black uppercase hover:bg-gold hover:text-white transition-all shadow-sm"
    >
      <Plus size={14} /> Yeni Lezzet Ekle
    </button>
  </div>

  <div className="grid gap-4">
    {formData.boxItems?.map((item: BoxItem, index: number) => (
      <div key={item.id} className="p-4 bg-white rounded-2xl border border-slate-100 group hover:shadow-md transition-all">
        <div className="flex items-start gap-4">
          {/* Görsel Yükleme Alanı */}
          <div
            onClick={() => document.getElementById(`box-file-${index}`)?.click()}
            className="relative w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 cursor-pointer overflow-hidden border-2 border-white shadow-inner"
          >
            {uploadingBoxIndex === index ? (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={16} /></div>
            ) : (
              <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
            )}
            <input id={`box-file-${index}`} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadBoxItemImage(e.target.files[0], index)} />
          </div>

          {/* Ana Bilgiler */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={item.name}
                onChange={(e) => {
                  const newItems = [...formData.boxItems];
                  newItems[index].name = e.target.value;
                  setFormData({ ...formData, boxItems: newItems });
                }}
                placeholder="Lezzet Adı (Örn: Anamalai)"
                className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-700 outline-none placeholder:text-slate-300"
              />
              <input
                type="number"
                value={item.percentage || ''}
                onChange={(e) => {
                  const newItems = [...formData.boxItems];
                  newItems[index].percentage = e.target.value ? parseInt(e.target.value) : undefined;
                  setFormData({ ...formData, boxItems: newItems });
                }}
                placeholder="%"
                className="w-16 bg-slate-50 rounded-lg px-2 py-2 text-[11px] font-bold text-gold text-center outline-none placeholder:text-slate-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                value={item.origin || ''}
                onChange={(e) => {
                  const newItems = [...formData.boxItems];
                  newItems[index].origin = e.target.value;
                  setFormData({ ...formData, boxItems: newItems });
                }}
                placeholder="Menşei (Örn: India, Tanzania)"
                className="flex-1 bg-slate-50 rounded-lg px-3 py-1.5 text-[10px] text-slate-500 outline-none placeholder:text-slate-300"
              />
            </div>

            <input
              value={item.description}
              onChange={(e) => {
                const newItems = [...formData.boxItems];
                newItems[index].description = e.target.value;
                setFormData({ ...formData, boxItems: newItems });
              }}
              placeholder="Kısa açıklama..."
              className="w-full bg-slate-50 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 outline-none italic placeholder:text-slate-300"
            />

            {/* Tasting Notes */}
            <input
              value={item.tastingNotes?.join(', ') || ''}
              onChange={(e) => {
                const newItems = [...formData.boxItems];
                newItems[index].tastingNotes = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                setFormData({ ...formData, boxItems: newItems });
              }}
              placeholder="Tadım notları (virgülle ayırın: kumquat, hojicha, vanilya)"
              className="w-full bg-gold/5 border border-gold/10 rounded-lg px-3 py-1.5 text-[10px] text-gold outline-none placeholder:text-gold/40"
            />
          </div>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, boxItems: formData.boxItems.filter((_: any, i: number) => i !== index) })}
            className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50/50 rounded-full transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    ))}
  </div>
</div>

      <div className="flex gap-3 sticky bottom-0 bg-white pt-4 pb-2">
        <button type="button" onClick={onCancel} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase">İptal</button>
        <button type="submit" disabled={isUploading} className="flex-[2] bg-brown-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all disabled:bg-slate-300">
          {isUploading ? 'Yükleniyor...' : <><Save size={16} /> Ürünü Kaydet</>}
        </button>
      </div>
    </form>
  );
};