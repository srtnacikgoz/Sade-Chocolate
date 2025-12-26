import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Plus, MapPin, Trash2, Edit3, Check, AlertCircle, Loader2 } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'sonner';

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
    phone: user?.phone || ''
  });

const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];
    
    // Läderach Stili Validasyon
    Object.entries(formData).forEach(([key, value]) => {
      if (!value) newErrors.push(key);
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      toast.error("Eksik alanları lütfen kontrol edin.");
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
      const addressId = `addr-${Date.now()}`;
      const newAddress = { ...formData, id: addressId };

      // Doğrudan Firestore Güncellemesi (Daha Güvenli)
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        addresses: arrayUnion(newAddress)
      });

      toast.success("Adres profilinize mühürlendi. ✨");
      
      // Sayfayı temizle ve listeye dön
      setIsAdding(false);
      setErrors([]);
      setFormData({ title: '', firstName: user?.firstName || '', lastName: user?.lastName || '', street: '', postCode: '', city: '', phone: user?.phone || '' });
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
      await updateDoc(userRef, { addresses: updatedAddresses });
      toast.success("Adres profilinizden kaldırıldı. ✨");
      setConfirmDeleteId(null); // Modalı kapat
    } catch (err) {
      toast.error("İşlem sırasında bir hata oluştu.");
    }
  };

  const startEdit = (addr: any) => {
    setEditingId(addr.id);
    setFormData({
      title: addr.title,
      firstName: addr.firstName,
      lastName: addr.lastName,
      street: addr.street,
      postCode: addr.postCode,
      city: addr.city,
      phone: addr.phone
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
                  <p>{addr.postCode} {addr.city}</p>
                  <p className="pt-4 flex items-center gap-2 text-[10px]"><Check size={12} className="text-emerald-500" /> {addr.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
       /* LÄDERACH STYLE ADRES FORMU */
        <div className="max-w-3xl animate-fade-in pb-20">
          <div className="mb-10 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-display text-4xl font-bold dark:text-white italic tracking-tighter uppercase">Teslimat Bilgileri</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Lütfen tüm alanları eksiksiz doldurunuz.</p>
            </div>
            <button 
              onClick={() => { setIsAdding(false); setErrors([]); }} 
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
                 className={`h-16 rounded-none border-2 transition-all ${errors.includes('title') ? 'border-red-600 bg-red-50/5' : 'border-gray-100 dark:border-gray-800'}`}
               />
               {errors.includes('title') && <p className="text-[9px] text-red-600 font-black uppercase tracking-tighter pl-1">Bu alan gereklidir.</p>}
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input 
                    label="AD" 
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className={`h-16 rounded-none border-2 transition-all ${errors.includes('firstName') ? 'border-red-600 bg-red-50/5' : 'border-gray-100 dark:border-gray-800'}`}
                  />
                </div>
                <div className="space-y-1">
                  <Input 
                    label="SOYAD" 
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className={`h-16 rounded-none border-2 transition-all ${errors.includes('lastName') ? 'border-red-600 bg-red-50/5' : 'border-gray-100 dark:border-gray-800'}`}
                  />
                </div>
             </div>

             <div className="space-y-1 relative">
                <Input 
                  label="AÇIK ADRES" 
                  placeholder="Sokak, Mahalle, Bina ve Daire Bilgisi..." 
                  value={formData.street}
                  onChange={e => setFormData({...formData, street: e.target.value})}
                  className={`h-16 rounded-none border-2 transition-all ${errors.includes('street') ? 'border-red-600 bg-red-50/5' : 'border-gray-100 dark:border-gray-800'}`}
                />
                {errors.includes('street') && <AlertCircle size={16} className="absolute right-4 top-10 text-red-600 animate-pulse" />}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input 
                    label="POSTA KODU" 
                    placeholder="07160" 
                    value={formData.postCode}
                    onChange={e => setFormData({...formData, postCode: e.target.value})}
                    className={`h-16 rounded-none border-2 transition-all ${errors.includes('postCode') ? 'border-red-600 bg-red-50/5' : 'border-gray-100 dark:border-gray-800'}`}
                  />
                </div>
                <div className="space-y-1">
                  <Input 
                    label="ŞEHİR / İLÇE" 
                    placeholder="Antalya / Muratpaşa" 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className={`h-16 rounded-none border-2 transition-all ${errors.includes('city') ? 'border-red-600 bg-red-50/5' : 'border-gray-100 dark:border-gray-800'}`}
                  />
                </div>
             </div>

             <div className="space-y-1">
               <Input 
                 label="TELEFON" 
                 value={formData.phone}
                 onChange={e => setFormData({...formData, phone: e.target.value})}
                 className={`h-16 rounded-none border-2 transition-all ${errors.includes('phone') ? 'border-red-600 bg-red-50/5' : 'border-gray-100 dark:border-gray-800'}`}
               />
             </div>

             <div className="pt-10">
                <Button type="submit" disabled={isLoading} className="w-full h-20 rounded-[30px] bg-brown-900 dark:bg-gold text-white dark:text-black font-black text-[11px] tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      ADRES MÜHÜRLENİYOR...
                    </>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
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