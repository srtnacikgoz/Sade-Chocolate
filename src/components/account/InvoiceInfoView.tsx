import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { 
  Plus, Receipt, Trash2, Edit3, Check, AlertCircle, 
  Loader2, Building2, User as UserIcon, ShieldCheck 
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export const InvoiceInfoView: React.FC = () => {
  const { user } = useUser();
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [type, setType] = useState<'individual' | 'corporate'>('individual');
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

  // Läderach Stili Validasyon Paneli
  const validate = () => {
    const newErrors: string[] = [];
    const tcknRegex = /^[1-9][0-9]{10}$/;
    const taxNoRegex = /^[0-9]{10,11}$/; // ✅ 10 veya 11 hane (Şahıs şirketleri için)

    if (!formData.title) newErrors.push('title');
    if (!formData.city) newErrors.push('city');
    if (!formData.district) newErrors.push('district'); // ✅ Zorunlu alan
    if (!formData.address) newErrors.push('address');

    if (type === 'individual') {
      if (!formData.firstName) newErrors.push('firstName');
      if (!formData.lastName) newErrors.push('lastName');
      if (!tcknRegex.test(formData.tckn)) newErrors.push('tckn');
    } else {
      if (!formData.companyName) newErrors.push('companyName');
      if (!formData.taxOffice) newErrors.push('taxOffice');
      if (!taxNoRegex.test(formData.taxNo)) newErrors.push('taxNo');
    }

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
          p.id === editingId ? { ...formData, type, id: editingId } : p
        );
      } else {
        const newProfile = { ...formData, type, id: `inv-${Date.now()}` };
        updatedProfiles = [...currentProfiles, newProfile];
      }

      await updateDoc(userRef, { invoiceProfiles: updatedProfiles });
      toast.success(editingId ? "Profil başarıyla güncellendi." : "Yeni fatura profili mühürlendi. ✨");
      
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', firstName: '', lastName: '', tckn: '', companyName: '', taxOffice: '', taxNo: '', city: '', address: '' });
    } catch (err) {
      toast.error("İşlem sırasında sunucu hatası oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedProfiles = user.invoiceProfiles?.filter((p: any) => p.id !== profileId);
      await updateDoc(userRef, { invoiceProfiles: updatedProfiles });
      toast.success("Profil sistemden kaldırıldı.");
      setConfirmDeleteId(null);
    } catch (err) {
      toast.error("Silme işlemi başarısız oldu.");
    }
  };

  const startEdit = (profile: any) => {
    setEditingId(profile.id);
    setType(profile.type);
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
                  <p className="text-brown-900 dark:text-white">{profile.type === 'corporate' ? profile.companyName : `${profile.firstName} ${profile.lastName}`}</p>
                  <p>{profile.type === 'corporate' ? `VN: ${profile.taxNo}` : `TC: ${profile.tckn}`}</p>
                  <p className="opacity-60">{profile.city} / {profile.district}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* LÄDERACH STYLE FATURA FORMU */
        <div className="max-w-4xl animate-fade-in pb-20">
          <div className="mb-12 flex items-center justify-between">
            <h3 className="font-display text-5xl font-bold dark:text-white italic tracking-tighter uppercase">
              {editingId ? 'Profili Güncelle' : 'Fatura Detayları'}
            </h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); setErrors([]); }} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">İPTAL ET</button>
          </div>

          {/* Segmented Control */}
          <div className="bg-gray-50 dark:bg-dark-800 p-1.5 rounded-[24px] flex border border-gray-100 dark:border-gray-700 shadow-inner mb-10 max-w-sm">
              <button type="button" onClick={() => setType('individual')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-[20px] transition-all ${type === 'individual' ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-lg' : 'text-gray-400'}`}>Bireysel</button>
              <button type="button" onClick={() => setType('corporate')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-[20px] transition-all ${type === 'corporate' ? 'bg-white dark:bg-dark-900 text-brown-900 dark:text-gold shadow-lg' : 'text-gray-400'}`}>Kurumsal</button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <Input label="PROFİL BAŞLIĞI" placeholder="Örn: Şahsi Faturam, Şirket Bilgileri" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`h-16 rounded-2xl border-2 transition-all ${errors.includes('title') ? 'border-red-600 bg-red-50/5' : 'border-gray-100 dark:border-gray-800'}`} />
             </div>

             {type === 'individual' ? (
                <>
                  <Input label="AD" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className={`h-16 rounded-2xl border-2 ${errors.includes('firstName') ? 'border-red-600' : ''}`} />
                  <Input label="SOYAD" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className={`h-16 rounded-2xl border-2 ${errors.includes('lastName') ? 'border-red-600' : ''}`} />
                  <div className="md:col-span-2">
                    <Input label="VERGİ / KİMLİK NO" placeholder="T.C. Kimlik Numaranız" value={formData.tckn} onChange={e => setFormData({...formData, tckn: e.target.value})} className={`h-16 rounded-2xl border-2 ${errors.includes('tckn') ? 'border-red-600' : ''}`} />
                  </div>
                </>
             ) : (
                <>
                  <div className="md:col-span-2">
                    <Input label="ŞİRKET TAM UNVANI" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className={`h-16 rounded-2xl border-2 ${errors.includes('companyName') ? 'border-red-600' : ''}`} />
                  </div>
                  <Input label="VERGİ DAİRESİ" value={formData.taxOffice} onChange={e => setFormData({...formData, taxOffice: e.target.value})} className={`h-16 rounded-2xl border-2 ${errors.includes('taxOffice') ? 'border-red-600' : ''}`} />
                  <Input label="VERGİ / KİMLİK NO" placeholder="Vergi Numaranız" value={formData.taxNo} onChange={e => setFormData({...formData, taxNo: e.target.value})} className={`h-16 rounded-2xl border-2 ${errors.includes('taxNo') ? 'border-red-600' : ''}`} />
                </>
             )}

             <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <Input label="ŞEHİR" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className={`h-16 rounded-2xl border-2 ${errors.includes('city') ? 'border-red-600' : ''}`} />
                <Input label="İLÇE" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className={`h-16 rounded-2xl border-2 ${errors.includes('district') ? 'border-red-600' : ''}`} />
             </div>
             <div className="md:col-span-2">
                <Input label="FATURA ADRESİ" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={`h-16 rounded-2xl border-2 ${errors.includes('address') ? 'border-red-600' : ''}`} />
             </div>

             {/* Hata Paneli */}
             {errors.length > 0 && (
               <div className="md:col-span-2 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 text-red-600">
                  <AlertCircle size={20} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Lütfen işaretli alanları kontrol edin (TCKN: 11 hane, Vergi No: 10 veya 11 hane).</p>
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