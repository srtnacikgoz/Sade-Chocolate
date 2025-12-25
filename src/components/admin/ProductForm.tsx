import React, { useState, useRef } from 'react';
import { Product, BoxItem } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants';
import { Package, DollarSign, Image as ImageIcon, Video, Save, Activity, Info, AlertCircle, MapPin, Upload, X as CloseIcon, Loader2, Milk, Bean, Square, Nut, Cherry, Coffee, Sparkles, Cookie, Flame, IceCream } from 'lucide-react';

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
  { id: 'special', icon: Sparkles }
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
  return <Sparkles size={14} />;
};
export const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>(product || {
    title: '', price: 0, currency: '₺', category: PRODUCT_CATEGORIES[0].id, origin: '', image: '', video: '',
    description: '', detailedDescription: '', tastingNotes: '', ingredients: '', allergens: '',
    isOutOfStock: false, locationStock: { yesilbahce: 0 },
    boxItems: [],
    showSensory: true, // ✅ Varsayılan açık
    attributes: [], // ✅ Boş özellik dizisi
    nutritionalValues: '', // ✅ Besin değerleri
    valueBadges: [], // ✅ Dinamik değer simgeleri
    sensory: { intensity: 50, sweetness: 50, creaminess: 50, fruitiness: 0, acidity: 0, crunch: 0 }
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingBoxIndex, setUploadingBoxIndex] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
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

  React.useEffect(() => {
    localStorage.setItem('sade_collection_pool', JSON.stringify(collectionPool));
  }, [collectionPool]);

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
        <div className="col-span-4">
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
            <Sparkles size={20} className="text-gold" />
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
        const newItem: BoxItem = { id: `bi-${Date.now()}`, name: '', description: '', image: 'https://placehold.co/400x400/png?text=Sade' };
        setFormData({ ...formData, boxItems: [...(formData.boxItems || []), newItem] });
      }}
      className="flex items-center gap-2 px-4 py-2 bg-white text-gold border border-gold/20 rounded-full text-[10px] font-black uppercase hover:bg-gold hover:text-white transition-all shadow-sm"
    >
      <Plus size={14} /> Yeni Lezzet Ekle
    </button>
  </div>

  <div className="grid gap-3">
    {formData.boxItems?.map((item: BoxItem, index: number) => (
      <div key={item.id} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 group hover:shadow-md transition-all">
        {/* Görsel Yükleme Alanı */}
        <div 
          onClick={() => document.getElementById(`box-file-${index}`)?.click()}
          className="relative w-14 h-14 rounded-full bg-slate-100 flex-shrink-0 cursor-pointer overflow-hidden border-2 border-white shadow-inner"
        >
          {uploadingBoxIndex === index ? (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={16} /></div>
          ) : (
            <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
          )}
          <input id={`box-file-${index}`} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadBoxItemImage(e.target.files[0], index)} />
        </div>

        <div className="flex-1 space-y-1">
          <input 
            value={item.name}
            onChange={(e) => {
              const newItems = [...formData.boxItems];
              newItems[index].name = e.target.value;
              setFormData({ ...formData, boxItems: newItems });
            }}
            placeholder="Lezzet Adı (Örn: Tuzlu Karamel)"
            className="w-full bg-transparent text-[12px] font-bold text-slate-700 outline-none placeholder:text-slate-300"
          />
          <input 
            value={item.description}
            onChange={(e) => {
              const newItems = [...formData.boxItems];
              newItems[index].description = e.target.value;
              setFormData({ ...formData, boxItems: newItems });
            }}
            placeholder="Kısa açıklama..."
            className="w-full bg-transparent text-[10px] text-slate-400 outline-none italic"
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