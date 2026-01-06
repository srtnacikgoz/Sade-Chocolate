import React, { useState, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  Plus, Receipt, Trash2, Edit3, Check, AlertCircle,
  Loader2, Building2, User as UserIcon, ShieldCheck
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { TURKEY_CITIES, ALL_TURKEY_CITIES } from '../../data/turkeyLocations';

export const InvoiceInfoView: React.FC = () => {
  const { user } = useUser();
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    lastName: '',
    tckn: '',
    companyName: '',
    taxOffice: '',
    taxNo: '',
    city: '',
    district: '', // ✅ Yeni eklendi
    address: ''
  });

  // İlçeleri şehre göre filtrele
  const availableDistricts = useMemo(() => {
    const selectedCity = TURKEY_CITIES.find(c => c.name === formData.city);
    return selectedCity?.districts || [];
  }, [formData.city]);

  // Validasyon - Tüm alanlar zorunlu
  const validate = () => {
    const newErrors: string[] = [];
    const taxNoRegex = /^[0-9]{10,11}$/; // Vergi No: 10 veya 11 hane

    // Zorunlu alanlar
    if (!formData.title) newErrors.push('title');
    if (!formData.firstName) newErrors.push('firstName');
    if (!formData.lastName) newErrors.push('lastName');
    if (!formData.companyName) newErrors.push('companyName');
    if (!formData.taxOffice) newErrors.push('taxOffice');
    if (!taxNoRegex.test(formData.taxNo)) newErrors.push('taxNo');
    if (!formData.city) newErrors.push('city');
    if (!formData.district) newErrors.push('district');
    if (!formData.address) newErrors.push('address');

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Lütfen kırmızı ile işaretli alanları lüks standartlarımıza uygun doldurun.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const currentProfiles = user?.invoiceProfiles || [];

      let updatedProfiles;
      if (editingId) {
        updatedProfiles = currentProfiles.map((p: any) =>
          p.id === editingId ? { ...formData, type: 'corporate', id: editingId } : p
        );
      } else {
        const newProfile = { ...formData, type: 'corporate', id: `inv-${Date.now()}` };
        updatedProfiles = [...currentProfiles, newProfile];
      }

      // Use setDoc with merge to handle cases where invoiceProfiles doesn't exist yet
      await setDoc(userRef, { invoiceProfiles: updatedProfiles }, { merge: true });
      toast.success(editingId ? "Profil başarıyla güncellendi." : "Yeni fatura profili mühürlendi. ✨");

      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', firstName: '', lastName: '', tckn: '', companyName: '', taxOffice: '', taxNo: '', city: '', district: '', address: '' });
    } catch (err: any) {
      console.error("❌ Fatura kaydetme hatası:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      toast.error(`İşlem sırasında hata: ${err.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedProfiles = user.invoiceProfiles?.filter((p: any) => p.id !== profileId);
      await setDoc(userRef, { invoiceProfiles: updatedProfiles }, { merge: true });
      toast.success("Profil sistemden kaldırıldı.");
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error("❌ Fatura silme hatası:", err);
      toast.error(`Silme işlemi başarısız: ${err.message || 'Bilinmeyen hata'}`);
    }
  };

  const startEdit = (profile: any) => {
    setEditingId(profile.id);
    setFormData({ ...profile });
    setIsAdding(true);
  };

  return (
    <div className="animate-fade-in space-y-12">
      {!isAdding ? (
        <>
          {/* Üst Bar */}
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-8">
             <div className="flex items-center gap-4 text-brown-900 dark:text-gold">
                <Receipt size={24} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">{user?.invoiceProfiles?.length || 0} FATURA PROFİLİ</span>
             </div>
             <button 
               onClick={() => setIsAdding(true)}
               className="h-14 px-8 border border-brown-900 dark:border-gold text-brown-900 dark:text-gold hover:bg-brown-900 hover:text-white dark:hover:bg-gold dark:hover:text-black transition-all font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center gap-3"
             >
               <Plus size={18} /> YENİ PROFİL EKLE
             </button>
          </div>

          {/* Profil Kartları Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user?.invoiceProfiles?.map((profile: any, index: number) => (
              <div key={profile.id} className="group p-8 bg-white dark:bg-dark-800 border border-gray-100 dark:border-gray-700 hover:border-gold transition-all relative overflow-hidden rounded-[28px] shadow-sm hover:shadow-xl">
                {index === 0 && (
                  <div className="absolute top-0 right-0 bg-gold text-black text-[8px] font-black px-4 py-1.5 uppercase tracking-widest rounded-bl-xl">VARSAYILAN</div>
                )}
                <div className="flex justify-between items-start mb-6">
                   <div className="w-10 h-10 bg-gray-50 dark:bg-dark-900 flex items-center justify-center text-gold rounded-xl">
                      {profile.type === 'corporate' ? <Building2 size={18} /> : <UserIcon size={18} />}
                   </div>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(profile)} className="p-2 text-gray-400 hover:text-gold"><Edit3 size={16} /></button>
                      <button onClick={() => setConfirmDeleteId(profile.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                   </div>
                </div>
                <h4 className="font-display text-xl font-bold dark:text-white italic uppercase mb-4">{profile.title}</h4>
                <div className="space-y-1 text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">
                  <p className="text-brown-900 dark:text-white">{profile.firstName} {profile.lastName}</p>
                  <p>{profile.companyName}</p>
                  <p>VN: {profile.taxNo}</p>
                  <p className="opacity-60">{profile.city} / {profile.district}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* LÄDERACH STYLE FATURA FORMU */
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
          <div className="mb-12 flex items-center justify-between">
            <h3 className="font-display text-5xl font-bold dark:text-white italic tracking-tighter uppercase">
              {editingId ? 'Profili Güncelle' : 'Fatura Detayları'}
            </h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); setErrors([]); }} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">İPTAL ET</button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <Input label="PROFİL BAŞLIĞI" placeholder="Örn: Şahsi Faturam, Şirket Bilgileri" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={errors.includes('title') ? 'border-red-600 border-2 bg-red-50/5' : ''} />
             </div>

             {/* BİLGİLER */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Input label="AD" placeholder="Can" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className={errors.includes('firstName') ? 'border-red-600 border-2' : ''} />
               <Input label="SOYAD" placeholder="Yılmaz" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className={errors.includes('lastName') ? 'border-red-600 border-2' : ''} />
             </div>

             <div className="md:col-span-2">
               <Input label="ŞİRKET TAM UNVANI" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className={errors.includes('companyName') ? 'border-red-600 border-2' : ''} />
             </div>

             <Input label="VERGİ DAİRESİ" value={formData.taxOffice} onChange={e => setFormData({...formData, taxOffice: e.target.value})} className={errors.includes('taxOffice') ? 'border-red-600 border-2' : ''} />
             <Input
               label="VERGİ NO"
               placeholder="10 veya 11 haneli Vergi No"
               value={formData.taxNo}
               onChange={e => {
                 const value = e.target.value.replace(/\D/g, '');
                 if (value.length <= 11) {
                   setFormData({...formData, taxNo: value});
                 }
               }}
               maxLength={11}
               inputMode="numeric"
               className={`h-16 rounded-2xl border-2 ${errors.includes('taxNo') ? 'border-red-600' : ''}`}
             />

             <div className="grid grid-cols-2 gap-4 md:col-span-2">
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
                </div>
             </div>
             <div className="md:col-span-2">
                <Input label="FATURA ADRESİ" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={errors.includes('address') ? 'border-red-600 border-2' : ''} />
             </div>

             {/* Hata Paneli */}
             {errors.length > 0 && (
               <div className="md:col-span-2 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 text-red-600">
                  <AlertCircle size={20} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Lütfen işaretli alanları kontrol edin (Vergi No: 10 veya 11 hane).</p>
               </div>
             )}

             <div className="md:col-span-2 pt-6">
                <Button type="submit" disabled={isLoading} className="w-full h-20 rounded-[30px] bg-brown-900 dark:bg-gold text-white dark:text-black font-black text-[11px] tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                  {isLoading ? <Loader2 className="animate-spin" /> : editingId ? 'BİLGİLERİ GÜNCELLE' : 'PROFİLİ KAYDET'}
                </Button>
             </div>
          </form>
        </div>
      )}

      {/* 🛡️ MODAL - SADE ARTISAN ONAY */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-brown-900/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}></div>
          <div className="relative bg-white dark:bg-dark-900 w-full max-w-md p-10 shadow-2xl border border-gray-100 dark:border-gray-800 rounded-[40px] animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center rounded-2xl"><Trash2 size={32} /></div>
              <div className="space-y-2">
                <h3 className="font-display text-3xl font-bold dark:text-white italic uppercase tracking-tighter">Profil Silinsin mi?</h3>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest leading-relaxed">Seçili fatura profilini kalıcı olarak kaldırmak istediğinize emin misiniz?</p>
              </div>
              <div className="flex gap-4 w-full pt-4">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 h-16 border border-gray-100 dark:border-gray-800 text-[10px] font-black uppercase tracking-[0.3em] dark:text-white hover:bg-gray-50 dark:hover:bg-dark-800 transition-all rounded-2xl">VAZGEÇ</button>
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 h-16 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-700 transition-all shadow-xl rounded-2xl">EVET, SİL</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};