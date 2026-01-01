import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, CheckCircle2, Sparkles, Gift, ShieldCheck, Check, CreditCard } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { toast } from 'sonner';
import { validateReferralCode } from '../services/loyaltyService';

export const Register: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || '' // URL'den referans kodu al
  });
const [agreedToTerms, setAgreedToTerms] = useState(false);
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Şifreler eşleşmiyor.");
    }

    setLoading(true);
    try {
      // 1. Firebase Auth Kaydı
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Profil Güncelleme (Ad Soyad)
      await updateProfile(user, { displayName: `${formData.firstName} ${formData.lastName}` });

      // 3. Firestore Kullanıcı Verisi Oluşturma
      await setDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
        createdAt: new Date().toISOString(),
        role: 'user',
        referredBy: formData.referralCode || null // Referans kodu kaydet
      });

      // 4. Referans Kodu Varsa - Bekleyen Bonus Oluştur
      if (formData.referralCode) {
        const referrer = await validateReferralCode(formData.referralCode);
        if (referrer) {
          // Bekleyen referans bonusu oluştur (ilk siparişte aktif olacak)
          await addDoc(collection(db, 'referral_bonuses'), {
            referrerId: referrer.id,
            refereeId: user.uid,
            refereeEmail: formData.email,
            referralCode: formData.referralCode,
            bonusPoints: 100, // Config'den alınacak
            bonusAwarded: false, // Henüz ödül verilmedi
            firstOrderCompleted: false, // İlk sipariş bekleniyor
            createdAt: new Date().toISOString(),
            status: 'pending'
          });
          toast.success(`${referrer.name || 'Arkadaşınız'} sizi davet etti! İlk siparişinizde ikiniz de puan kazanacaksınız.`);
        }
      }

      toast.success("Aramıza hoş geldiniz! Kayıt başarılı.");
      navigate('/home');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyebilirsiniz. ✨");
      } else {
        toast.error("Kayıt sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol edin.");
      }
    } finally {
      setLoading(false);
    }
  };

 return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-cream-100 dark:bg-dark-900 animate-fade-in">
      
      {/* --- KARŞILAMA ALANI (Mobilde Üstte, Desktopta Solda) --- */}
      <section className="relative w-full lg:w-1/2 min-h-[40vh] lg:min-h-screen flex flex-col justify-between p-8 lg:p-16 overflow-hidden bg-slate-50/50">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-[0.07] grayscale scale-110 animate-pulse-slow" 
            alt="Artisan Chocolate" 
          />
          <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-br from-white via-transparent to-slate-100/50"></div>
        </div>

       <div className="relative z-10">
          <button 
            onClick={() => navigate('/login-gateway')}
            className="flex items-center gap-3 text-gray-400 hover:text-brown-900 transition-all text-[10px] font-black uppercase tracking-[0.4em] group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform" /> {t('back_to_login') || 'GERİ DÖN'}
          </button>
        </div>

        <div className="relative z-10 mt-12 lg:mt-0 space-y-8 lg:space-y-12">
          <div className="space-y-4">
            <h2 className="font-display text-4xl lg:text-7xl text-brown-900 italic leading-tight">Sade <br /> <span className="text-gold">Artisan</span> Kulübü</h2>
          </div>

          <div className="grid gap-6 lg:gap-8">
            {[
              { icon: <ShieldCheck size={26} />, title: "Güvenli Erişim", desc: "Kişisel verileriniz ve hesabınız global güvenlik standartlarıyla korunur." },
              { icon: <CreditCard size={26} />, title: "Hızlı Ödeme", desc: "Adres ve kart bilgilerinizi kaydederek saniyeler içinde sipariş verin." },
              { icon: <ShieldCheck size={26} />, title: "Güvenli Deneyim", desc: "Isı yalıtımlı ambalaj ve %100 erime koruması ile güvenli teslimat." },
              { icon: <Sparkles size={26} />, title: "Öncelikli Erişim", desc: "Yeni koleksiyonlara ve sınırlı üretimlere herkesten önce siz ulaşın." }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-center group cursor-default">
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-white transition-all duration-500 group-hover:rotate-6 text-gold">
                  {item.icon}
                </div>
                <div className="group-hover:translate-x-2 transition-transform duration-500">
                  <h4 className="text-brown-900 font-bold text-sm lg:text-base mb-1">{item.title}</h4>
                  <p className="text-gray-400 text-[11px] lg:text-xs leading-relaxed max-w-[240px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-12 lg:mt-0 pt-8 border-t border-gray-100">
          <p className="text-gray-300 text-[9px] font-black uppercase tracking-[0.5em]">Premium Standards • 2025</p>
        </div>
      </section>

      {/* --- KAYIT FORMU (Sağ / Alt Alan) --- */}
      <section className="flex-1 flex flex-col justify-center items-center p-6 lg:p-24 bg-cream-100 dark:bg-dark-900 relative">
        <div className="w-full max-w-md space-y-10 lg:space-y-12">
          
          <div className="space-y-4">
             <h1 className="font-display text-4xl lg:text-5xl font-bold italic dark:text-white leading-tight">Kaydınızı Tamamlayın</h1>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">Kişiselleştirilmiş bir lezzet yolculuğu için.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5 lg:space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="ADINIZ" 
                  placeholder="Can" 
                  className="h-16 rounded-2xl"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
                <Input 
                  label="SOYADINIZ" 
                  placeholder="Yılmaz" 
                  className="h-16 rounded-2xl"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
             </div>

             <Input 
              label="E-POSTA ADRESİ" 
              placeholder="isim@örnek.com" 
              className="h-16 rounded-2xl"
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
             />
             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">DOĞUM TARİHİ</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select 
                      className="h-16 rounded-2xl bg-gray-50 dark:bg-dark-800 border-none px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
                      value={formData.birthDate.split('-')[2] || ''}
                      onChange={(e) => {
                        const parts = formData.birthDate.split('-');
                        const newDate = `${parts[0] || '1990'}-${parts[1] || '01'}-${e.target.value.padStart(2, '0')}`;
                        setFormData({...formData, birthDate: newDate});
                      }}
                      required
                    >
                      <option value="">Gün</option>
                      {[...Array(31)].map((_, i) => <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{i+1}</option>)}
                    </select>
                    <select 
                      className="h-16 rounded-2xl bg-gray-50 dark:bg-dark-800 border-none px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
                      value={formData.birthDate.split('-')[1] || ''}
                      onChange={(e) => {
                        const parts = formData.birthDate.split('-');
                        const newDate = `${parts[0] || '1990'}-${e.target.value.padStart(2, '0')}-${parts[2] || '01'}`;
                        setFormData({...formData, birthDate: newDate});
                      }}
                      required
                    >
                      <option value="">Ay</option>
                      {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map((m, i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{m}</option>)}
                    </select>
                    <select 
                      className="h-16 rounded-2xl bg-gray-50 dark:bg-dark-800 border-none px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
                      value={formData.birthDate.split('-')[0] || ''}
                      onChange={(e) => {
                        const parts = formData.birthDate.split('-');
                        const newDate = `${e.target.value}-${parts[1] || '01'}-${parts[2] || '01'}`;
                        setFormData({...formData, birthDate: newDate});
                      }}
                      required
                    >
                      <option value="">Yıl</option>
                      {[...Array(100)].map((_, i) => <option key={i} value={2010-i}>{2010-i}</option>)}
                    </select>
                  </div>
                </div>
                <Input 
                  label="TELEFON" 
                  type="tel" 
                  placeholder="05xx" 
                  className="h-16 rounded-2xl" 
                  required 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="ŞİFRE"
                  placeholder="••••••••"
                  className="h-16 rounded-2xl"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <Input
                  label="ŞİFRE TEKRAR"
                  placeholder="••••••••"
                  className="h-16 rounded-2xl"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
             </div>

             {/* Referans Kodu (Opsiyonel) */}
             <div className="relative">
               <Input
                 label="REFERANS KODU (OPSİYONEL)"
                 placeholder="SADE-XXXX"
                 value={formData.referralCode}
                 onChange={e => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                 className="h-16 rounded-2xl font-mono tracking-widest"
               />
               <p className="text-[9px] text-gray-400 mt-1 ml-2">
                 Arkadaşınızdan aldığınız kodu girin, ilk siparişinizde ikiniz de puan kazanın!
               </p>
             </div>

             {/* ✅ KVKK / GDPR Checkbox Modülü */}
             <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-gray-700 group cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${agreedToTerms ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold' : 'border-gray-200 dark:border-gray-600'}`}>
                  {agreedToTerms && <Check size={14} className="text-white dark:text-black" />}
                </div>
                <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 font-medium">
  <Link 
  to="/legal/kvkk" 
  className="text-brown-900 dark:text-white font-bold hover:text-gold transition-colors underline underline-offset-2"
  onClick={(e) => e.stopPropagation()}
>
    {t('legal_kvkk')}
  </Link>
  {' '} metnini okudum, kişisel verilerimin işlenmesine ve tarafıma ticari ileti gönderilmesine onay veriyorum.
</p>
             </div>
             
             <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={loading || !agreedToTerms}
                  className={`w-full h-20 rounded-[30px] text-[11px] font-black tracking-[0.4em] shadow-2xl transition-all ${!agreedToTerms ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 bg-brown-900 text-white dark:bg-gold dark:text-black'}`}
                >
                  {loading ? 'HESAP HAZIRLANIYOR...' : 'KULÜBE KATILIN'}
                </Button>
             </div>
          </form>

          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Zaten hesabınız var mı? {' '}
              <button 
                onClick={() => navigate('/login-gateway')} 
                className="text-brown-900 dark:text-white underline decoration-gold/50 hover:decoration-gold transition-all underline-offset-8 font-black ml-2"
              >
                GİRİŞ YAPIN
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};