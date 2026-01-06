import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Check } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { toast } from 'sonner';
import { sendWelcomeEmail } from '../services/emailService';
import { validateReferralCodeAdvanced, trackReferralUsage } from '../services/referralCodeService';

// Şifre gücü hesaplama yardımcı fonksiyonu
const calculatePasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  const labels = ['Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

  return {
    strength: Math.min(strength, 5),
    label: labels[Math.min(strength, 4)] || 'Çok Zayıf',
    color: colors[Math.min(strength, 4)] || 'bg-red-500'
  };
};

export const Register: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const passwordStrength = calculatePasswordStrength(formData.password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Şifreler eşleşmiyor.");
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(user, { displayName: `${formData.firstName} ${formData.lastName}` });

      await setDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        createdAt: new Date().toISOString(),
        role: 'user',
        referredBy: formData.referralCode || null
      });

      if (formData.referralCode) {
        const validation = await validateReferralCodeAdvanced(
          formData.referralCode,
          formData.email,
          user.uid
        );

        if (validation.isValid && validation.campaign) {
          await trackReferralUsage(
            formData.referralCode,
            validation.campaign.id,
            formData.email,
            validation.bonusPoints || 0,
            user.uid
          );

          await addDoc(collection(db, 'referral_bonuses'), {
            campaignId: validation.campaign.id,
            referralCode: formData.referralCode,
            refereeId: user.uid,
            refereeEmail: formData.email,
            bonusPoints: validation.bonusPoints || 0,
            bonusAwarded: false,
            firstOrderCompleted: false,
            createdAt: new Date().toISOString(),
            status: 'pending'
          });

          toast.success(`Referans kodunuz uygulandı! İlk siparişinizde ${validation.bonusPoints} puan kazanacaksınız.`);
        } else if (!validation.isValid) {
          toast.error(validation.error || 'Referans kodu geçersiz.');
        }
      }

      sendWelcomeEmail(formData.email, formData.firstName).catch(err => {
        console.log('Hoş geldin emaili gönderilemedi:', err);
      });

      toast.success("Aramıza hoş geldiniz! Kayıt başarılı.");
      navigate('/home');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyebilirsiniz.");
      } else {
        toast.error("Kayıt sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol edin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-cream-100 dark:bg-dark-900 px-6 py-12 animate-fade-in">
      <div className="w-full max-w-[480px]">

        {/* Ana Kart */}
        <div className="bg-white dark:bg-dark-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm p-8 lg:p-10 space-y-8">

          {/* Başlık */}
          <div className="text-center space-y-3">
            <h1 className="font-display text-4xl font-bold italic text-brown-900 dark:text-white">Hesap Oluşturun</h1>
            <p className="text-sm text-gray-400">Kişiselleştirilmiş lezzet deneyimine adım atın.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ADINIZ"
                placeholder="Can"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
              <Input
                label="SOYADINIZ"
                placeholder="Yılmaz"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>

            <Input
              label="E-POSTA"
              placeholder="isim@örnek.com"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />

            <div className="space-y-2">
              <Input
                label="ŞİFRE"
                placeholder="••••••••"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              {formData.password && (
                <div className="px-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Input
              label="ŞİFRE TEKRAR"
              placeholder="••••••••"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            />

            {/* KVKK Onay */}
            <div
              className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-gray-700 cursor-pointer group"
              onClick={() => setAgreedToTerms(!agreedToTerms)}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${agreedToTerms ? 'bg-brown-900 border-brown-900 dark:bg-gold dark:border-gold' : 'border-gray-300 dark:border-gray-600'}`}>
                {agreedToTerms && <Check size={12} className="text-white dark:text-black" />}
              </div>
              <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                <Link
                  to="/legal/kvkk"
                  className="text-brown-900 dark:text-white font-bold hover:text-gold transition-colors underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t('legal_kvkk')}
                </Link>
                {' '}metnini okudum ve onaylıyorum.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !agreedToTerms}
              className={`w-full h-14 rounded-full text-[11px] font-bold tracking-widest transition-all ${!agreedToTerms ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
            >
              {loading ? 'HESAP OLUŞTURULUYOR...' : 'KAYIT OL'}
            </Button>
          </form>

          {/* Giriş Yap Linki */}
          <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Zaten hesabınız var mı?{' '}
              <button
                onClick={() => navigate('/account')}
                className="text-brown-900 dark:text-gold underline decoration-gold/50 hover:decoration-gold transition-all underline-offset-4 font-black ml-1"
              >
                GİRİŞ YAPIN
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
