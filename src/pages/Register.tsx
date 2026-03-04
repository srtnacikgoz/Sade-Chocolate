import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Check } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { sendWelcomeEmail } from '../services/emailService';

// Benzersiz kupon kodu üretme
const generateCouponCode = (): string => {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `HOSGELDIN${random}`;
};
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
  const { loginWithGoogle } = useUser();
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

  // Google ile kayıt ol
  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser?.email) throw new Error('Google hesabı alınamadı');

      // Bu email için daha önce kayıt kuponu oluşturulmuş mu kontrol et
      const existingCoupons = await getDocs(
        query(
          collection(db, 'coupons'),
          where('email', '==', firebaseUser.email),
          where('source', '==', 'registration')
        )
      );

      if (existingCoupons.empty) {
        // İlk kez kayıt - kupon oluştur
        const couponCode = generateCouponCode();
        await addDoc(collection(db, 'coupons'), {
          code: couponCode,
          type: 'percentage',
          value: 10,
          email: firebaseUser.email,
          isUsed: false,
          createdAt: serverTimestamp(),
          source: 'registration'
        });
        localStorage.setItem('newsletter_coupon', couponCode);

        const firstName = firebaseUser.displayName?.split(' ')[0] || '';
        sendWelcomeEmail(firebaseUser.email, firstName, couponCode).catch(err => {
          console.log('Hoş geldin emaili gönderilemedi:', err);
        });
      }

      toast.success('Google ile kayıt başarılı!');
      navigate('/home');
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        toast.error('Kayıt işlemi iptal edildi.');
      } else if (err?.code === 'auth/popup-blocked') {
        toast.error('Pop-up engellendi. Lütfen tarayıcı ayarlarınızı kontrol edin.');
      } else {
        console.error('Google kayıt hatası:', err);
        toast.error('Google ile kayıt yapılırken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

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

      // Benzersiz %10 indirim kuponu oluştur
      const couponCode = generateCouponCode();
      await addDoc(collection(db, 'coupons'), {
        code: couponCode,
        type: 'percentage',
        value: 10,
        email: formData.email,
        isUsed: false,
        createdAt: serverTimestamp(),
        source: 'registration'
      });

      // Kupon kodunu localStorage'a kaydet (Checkout'ta otomatik uygulanması için)
      localStorage.setItem('newsletter_coupon', couponCode);

      // Kupon kodunu içeren hoş geldin emaili gönder
      sendWelcomeEmail(formData.email, formData.firstName, couponCode).catch(err => {
        console.log('Hoş geldin emaili gönderilemedi:', err);
      });

      toast.success("Aramıza hoş geldiniz! Kayıt başarılı.");
      navigate('/home');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // Auth'da var ama Firestore'da profil olmayabilir - giriş yaptırıp profili oluştur
        try {
          const { user } = await signInWithEmailAndPassword(auth, formData.email, formData.password);
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          const profileData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            role: 'user',
            referredBy: formData.referralCode || null
          };

          if (!userDoc.exists()) {
            // Firestore profili hiç yok, oluştur
            await setDoc(userRef, {
              ...profileData,
              createdAt: new Date().toISOString()
            });

            // İlk kez profil tamamlanıyor - kupon oluştur ve email gönder
            const couponCode = generateCouponCode();
            await addDoc(collection(db, 'coupons'), {
              code: couponCode,
              type: 'percentage',
              value: 10,
              email: formData.email,
              isUsed: false,
              createdAt: serverTimestamp(),
              source: 'registration'
            });
            localStorage.setItem('newsletter_coupon', couponCode);

            sendWelcomeEmail(formData.email, formData.firstName, couponCode).catch(err => {
              console.log('Hoş geldin emaili gönderilemedi:', err);
            });

            toast.success("Hesabınız tamamlandı! Hoş geldiniz.");
          } else if (!userDoc.data()?.firstName) {
            // Doküman var ama profil bilgileri eksik, tamamla
            await setDoc(userRef, profileData, { merge: true });

            // Profil tamamlanıyor - kupon oluştur ve email gönder
            const couponCode = generateCouponCode();
            await addDoc(collection(db, 'coupons'), {
              code: couponCode,
              type: 'percentage',
              value: 10,
              email: formData.email,
              isUsed: false,
              createdAt: serverTimestamp(),
              source: 'registration'
            });
            localStorage.setItem('newsletter_coupon', couponCode);

            sendWelcomeEmail(formData.email, formData.firstName, couponCode).catch(err => {
              console.log('Hoş geldin emaili gönderilemedi:', err);
            });

            toast.success("Hesabınız tamamlandı! Hoş geldiniz.");
          } else {
            toast.success("Bu e-posta ile zaten hesabınız var. Giriş yapıldı.");
          }
          navigate('/home');
        } catch (loginError: any) {
          // Şifre yanlışsa giriş sayfasına yönlendir
          toast.error("Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin veya şifrenizi sıfırlayın.");
          navigate('/account');
        }
      } else if (error.code === 'auth/weak-password') {
        toast.error("Şifre çok zayıf. En az 6 karakter kullanın.");
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

          {/* Google ile Kayıt */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
                <span className="bg-white dark:bg-dark-800 px-4 text-gray-400 font-bold">veya</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full h-14 rounded-full bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-gray-700 text-brown-900 dark:text-white font-bold text-[11px] uppercase tracking-[0.2em] shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google ile Kayıt Ol
            </button>
          </div>

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
