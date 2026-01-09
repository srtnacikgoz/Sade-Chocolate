import React, { useState, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
import { Input } from '../ui/Input';
import { PhoneInput } from '../ui/PhoneInput';
import { Button } from '../ui/Button';
import { Plus, MapPin, Trash2, Edit3, Check, AlertCircle, Loader2 } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { doc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'sonner';
import { TURKEY_CITIES, ALL_TURKEY_CITIES } from '../../data/turkeyLocations';

export const AddressesView: React.FC = () => {
  const { user, updateProfile } = useUser();
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    street: '',
    postCode: '',
    city: '',
    district: '',
    phone: user?.phone || '',
    phoneCountry: '+90'
  });

const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    // Läderach Stili Validasyon - Posta kodu ve phoneCountry optional
    const requiredFields = ['title', 'firstName', 'lastName', 'street', 'city', 'district', 'phone'];
    requiredFields.forEach(key => {
      if (!formData[key as keyof typeof formData]) {
        newErrors.push(key);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      // Toast yerine inline error gösteriyoruz
      return;
    }

    // Oturum Kontrolü (Misafir hatasını bypass eder)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Oturumunuzun süresi dolmuş olabilir. Lütfen tekrar giriş yapın.");
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);

      if (editingId) {
        // Güncelleme: Mevcut adresi bul ve güncelle
        const updatedAddresses = (user?.addresses || []).map((addr: any) =>
          addr.id === editingId ? { ...formData, id: editingId } : addr
        );
        await setDoc(userRef, { addresses: updatedAddresses }, { merge: true });
        toast.success("Adres güncellendi. ✨");
      } else {
        // Yeni ekleme
        const addressId = `addr-${Date.now()}`;
        const newAddress = { ...formData, id: addressId };
        await setDoc(userRef, {
          addresses: arrayUnion(newAddress)
        }, { merge: true });
        toast.success("Adres profilinize mühürlendi. ✨");
      }

      // Sayfayı temizle ve listeye dön
      setIsAdding(false);
      setEditingId(null);
      setErrors([]);
      setFormData({ title: '', firstName: user?.firstName || '', lastName: user?.lastName || '', street: '', postCode: '', city: '', district: '', phone: user?.phone || '', phoneCountry: '+90' });
    } catch (err: any) {
      console.error("Firestore Error:", err);
      toast.error("Sunucu bağlantısında bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = async (addressId: string) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedAddresses = user.addresses?.filter((a: any) => a.id !== addressId);
      await setDoc(userRef, { addresses: updatedAddresses }, { merge: true });
      toast.success("Adres profilinizden kaldırıldı. ✨");
      setConfirmDeleteId(null); // Modalı kapat
    } catch (err) {
      toast.error("İşlem sırasında bir hata oluştu.");
    }
  };

  // İlçeleri şehre göre filtrele
  const availableDistricts = useMemo(() => {
    const selectedCity = TURKEY_CITIES.find(c => c.name === formData.city);
    return selectedCity?.districts || [];
  }, [formData.city]);

  const startEdit = (addr: any) => {
    setEditingId(addr.id);
    setFormData({
      title: addr.title,
      firstName: addr.firstName,
      lastName: addr.lastName,
      street: addr.street,
      postCode: addr.postCode || '',
      city: addr.city,
      district: addr.district || '',
      phone: addr.phone,
      phoneCountry: addr.phoneCountry || '+90'
    });
    setIsAdding(true);
  };

  return (
    <div className="animate-fade-in space-y-12">
      
      {!isAdding ? (
        <>
          {/* Adres Listesi Üst Bar */}
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-8">
             <div className="flex items-center gap-4 text-brown-900 dark:text-gold">
                <MapPin size={24} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">{user?.addresses?.length || 0} KAYITLI ADRES</span>
             </div>
             <button 
               onClick={() => setIsAdding(true)}
               className="h-14 px-8 border border-brown-900 dark:border-gold text-brown-900 dark:text-gold hover:bg-brown-900 hover:text-white dark:hover:bg-gold dark:hover:text-black transition-all font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center gap-3"
             >
               <Plus size={18} /> YENİ ADRES EKLE
             </button>
          </div>

          {/* Kayıtlı Adres Kartları - Katalog Galeri Düzeni */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user?.addresses?.map((addr: any) => (
              <div key={addr.id} className="group p-8 bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-gray-700 hover:border-gold transition-all relative overflow-hidden rounded-[28px]">
                <div className="flex justify-between items-start mb-6">
                   <h4 className="font-display text-xl font-bold dark:text-white italic uppercase tracking-tight">{addr.title}</h4>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(addr)} 
                        className="p-2 text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
  onClick={() => setConfirmDeleteId(addr.id)} 
  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
>
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">
                  <p className="text-brown-900 dark:text-white font-bold">{addr.firstName} {addr.lastName}</p>
                  <p>{addr.street}</p>
                  <p>{addr.city} / {addr.district}{addr.postCode ? ` • ${addr.postCode}` : ''}</p>
                  <p className="pt-4 flex items-center gap-2 text-[10px]"><Check size={12} className="text-emerald-500" /> {addr.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
       /* LÄDERACH STYLE ADRES FORMU */
        <div className="max-w-3xl mx-auto animate-fade-in pb-20">
          <div className="mb-10 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-display text-4xl font-bold dark:text-white italic tracking-tighter uppercase">
                {editingId ? 'Adresi Güncelle' : 'Teslimat Bilgileri'}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Lütfen tüm alanları eksiksiz doldurunuz.</p>
            </div>
            <button
              onClick={() => { setIsAdding(false); setEditingId(null); setErrors([]); }}
              className="text-[10px] font-black text-gray-400 hover:text-brown-900 dark:hover:text-gold uppercase tracking-widest transition-colors border-b border-gray-200 dark:border-gray-800 pb-1"
            >
              VAZGEÇ
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
             <div className="space-y-1">
               <Input
                 label="ADRES BAŞLIĞI"
                 placeholder="Örn: Sade Adresim, Ev, Ofis"
                 value={formData.title}
                 onChange={e => setFormData({...formData, title: e.target.value})}
                 className={`h-16 rounded-md bg-white dark:bg-dark-800 border transition-all text-gray-900 dark:text-white placeholder-gray-500 ${errors.includes('title') ? 'border-red-500 border-2 bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20' : 'border-gray-400 dark:border-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30'}`}
               />
               {errors.includes('title') && (
                 <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                   <AlertCircle size={14} />
                   Bu alan zorunludur
                 </p>
               )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    label="AD"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className={`h-16 rounded-md bg-white dark:bg-dark-800 border transition-all text-gray-900 dark:text-white placeholder-gray-500 ${errors.includes('firstName') ? 'border-red-500 border-2 bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20' : 'border-gray-400 dark:border-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30'}`}
                  />
                  {errors.includes('firstName') && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={14} />
                      Bu alan zorunludur
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Input
                    label="SOYAD"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className={`h-16 rounded-md bg-white dark:bg-dark-800 border transition-all text-gray-900 dark:text-white placeholder-gray-500 ${errors.includes('lastName') ? 'border-red-500 border-2 bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20' : 'border-gray-400 dark:border-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30'}`}
                  />
                  {errors.includes('lastName') && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={14} />
                      Bu alan zorunludur
                    </p>
                  )}
                </div>
             </div>

             <div className="space-y-1">
                <Input
                  label="AÇIK ADRES"
                  placeholder="Sokak, Mahalle, Bina ve Daire Bilgisi..."
                  value={formData.street}
                  onChange={e => setFormData({...formData, street: e.target.value})}
                  className={`h-16 rounded-md bg-white dark:bg-dark-800 border transition-all text-gray-900 dark:text-white placeholder-gray-500 ${errors.includes('street') ? 'border-red-500 border-2 bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20' : 'border-gray-400 dark:border-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30'}`}
                />
                {errors.includes('street') && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Bu alan zorunludur
                  </p>
                )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ŞEHİR</label>
                  <select
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value, district: ''})}
                    className={`w-full h-16 px-4 rounded-md border bg-white dark:bg-dark-800 text-gray-900 dark:text-white transition-all focus:outline-none appearance-none cursor-pointer ${errors.includes('city') ? 'border-red-500 border-2 bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20' : 'border-gray-400 dark:border-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30'}
                    bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3c%2Fsvg%3E')]
                    bg-[length:16px_16px] bg-[right_1rem_center] bg-no-repeat`}
                  >
                    <option value="" className="text-gray-500">Şehir seçin...</option>
                    {ALL_TURKEY_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.includes('city') && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={14} />
                      Bu alan zorunludur
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">İLÇE</label>
                  <select
                    value={formData.district}
                    onChange={e => setFormData({...formData, district: e.target.value})}
                    disabled={!formData.city || availableDistricts.length === 0}
                    className={`w-full h-16 px-4 rounded-md border bg-white dark:bg-dark-800 text-gray-900 dark:text-white transition-all focus:outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${errors.includes('district') ? 'border-red-500 border-2 bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20' : 'border-gray-400 dark:border-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30'}
                    bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3c%2Fsvg%3E')]
                    bg-[length:16px_16px] bg-[right_1rem_center] bg-no-repeat`}
                  >
                    <option value="" className="text-gray-500">{!formData.city ? 'Önce şehir seçin' : 'İlçe seçin...'}</option>
                    {availableDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  {errors.includes('district') && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={14} />
                      Bu alan zorunludur
                    </p>
                  )}
                </div>
             </div>

             <div className="space-y-1">
               <Input
                 label="POSTA KODU (İsteğe Bağlı)"
                 placeholder="Bilmiyorsanız boş bırakabilirsiniz"
                 value={formData.postCode}
                 onChange={e => setFormData({...formData, postCode: e.target.value})}
                 className="h-16 rounded-md bg-white dark:bg-dark-800 border border-gray-400 dark:border-gray-500 text-gray-900 dark:text-white placeholder-gray-500 focus:border-brown-600 dark:focus:border-gold focus:ring-1 focus:ring-brown-200 dark:focus:ring-gold/30 transition-all"
               />
             </div>

             <PhoneInput
               label="TELEFON"
               value={formData.phone}
               countryCode={formData.phoneCountry}
               onValueChange={(value) => setFormData({...formData, phone: value})}
               onCountryCodeChange={(code) => setFormData({...formData, phoneCountry: code})}
               placeholder="5** *** ** **"
               error={errors.includes('phone')}
             />
             {errors.includes('phone') && (
               <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 ml-2">
                 <AlertCircle size={14} />
                 Bu alan zorunludur
               </p>
             )}

             <div className="pt-10">
                <Button type="submit" disabled={isLoading} className="w-full h-20 rounded-[30px] bg-brown-900 dark:bg-gold text-white dark:text-black font-black text-[11px] tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {editingId ? 'GÜNCELLENİYOR...' : 'ADRES MÜHÜRLENİYOR...'}
                    </>
                  ) : editingId ? (
                    'ADRESİ GÜNCELLE'
                  ) : (
                    'ADRESİ KAYDET VE DEVAM ET'
                  )}
                </Button>
             </div>
          </form>
        </div>
      )}
      {/* 🛡️ SADE ARTISAN ONAY MODALI */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-brown-900/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}></div>
          <div className="relative bg-white dark:bg-dark-900 w-full max-w-md p-10 shadow-2xl border border-gray-100 dark:border-gray-800 rounded-[40px] animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center rounded-none">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-3xl font-bold dark:text-white italic uppercase tracking-tighter">Adresi Sil</h3>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest leading-relaxed">
                  Bu işlem geri alınamaz. Seçili adresi profilinizden mühürlü bir şekilde kaldırmak istediğinize emin misiniz?
                </p>
              </div>
              <div className="flex gap-4 w-full pt-4">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 h-16 border border-gray-100 dark:border-gray-800 text-[10px] font-black uppercase tracking-[0.3em] dark:text-white hover:bg-gray-50 dark:hover:bg-dark-800 transition-all rounded-none"
                >
                  VAZGEÇ
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 h-16 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-700 transition-all shadow-xl rounded-none"
                >
                  SİL VE ONAYLA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};