import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';

export const AdminSetup: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUser();
  const [masterKey, setMasterKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAdmins, setIsCheckingAdmins] = useState(true);
  const [hasExistingAdmin, setHasExistingAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Mevcut admin var mı kontrol et
  useEffect(() => {
    const checkExistingAdmins = async () => {
      try {
        const adminsRef = collection(db, 'admin_users');
        const q = query(adminsRef, where('active', '==', true));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setHasExistingAdmin(true);
        }
      } catch (err) {
        console.error('Admin check error:', err);
      } finally {
        setIsCheckingAdmins(false);
      }
    };

    checkExistingAdmins();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!user?.email) {
      setError('Lütfen önce siteye giriş yapın.');
      setIsLoading(false);
      return;
    }

    try {
      const functions = getFunctions(undefined, 'europe-west3');
      const setAdminClaim = httpsCallable(functions, 'setAdminClaim');

      const result = await setAdminClaim({
        targetEmail: user.email,
        masterKey: masterKey
      });

      const data = result.data as any;

      if (data.success) {
        setSuccess(true);
        toast.success('Admin yetkisi başarıyla oluşturuldu!');

        // 3 saniye sonra admin paneline yönlendir
        setTimeout(() => {
          navigate('/admin');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Admin setup error:', err);

      if (err.code === 'functions/permission-denied') {
        setError('Geçersiz master key.');
      } else if (err.code === 'functions/not-found') {
        setError('Bu email ile kayıtlı kullanıcı bulunamadı.');
      } else {
        setError(err.message || 'Bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isCheckingAdmins) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="text-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Zaten admin varsa erişimi engelle
  if (hasExistingAdmin) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-amber-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Kurulum Tamamlanmış
          </h1>
          <p className="text-gray-500 mb-6">
            Sistemde zaten bir admin mevcut. Bu sayfa sadece ilk kurulum için kullanılabilir.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-brown-900 dark:bg-gold text-white dark:text-black py-4 rounded-2xl font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  // Giriş yapmamışsa uyar
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield size={32} className="text-gold" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Giriş Gerekli
          </h1>
          <p className="text-gray-500 mb-6">
            Admin kurulumu için önce hesabınıza giriş yapmalısınız.
          </p>
          <button
            onClick={() => navigate('/hesabim')}
            className="w-full bg-brown-900 dark:bg-gold text-white dark:text-black py-4 rounded-2xl font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  // Başarılı
  if (success) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Oluşturuldu!
          </h1>
          <p className="text-gray-500 mb-2">
            <span className="font-bold text-gold">{user?.email}</span>
          </p>
          <p className="text-gray-500 mb-6">
            artık admin yetkisine sahip.
          </p>
          <p className="text-sm text-gray-400">
            Admin paneline yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  // Kurulum formu
  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-10 max-w-md w-full shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-gold" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white italic mb-2">
            İlk Admin Kurulumu
          </h1>
          <p className="text-sm text-gray-400">
            Sisteme ilk admin kullanıcısını ekleyin
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Giriş yapan hesap:</strong><br />
            {user?.email}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Bu hesap admin yapılacak.
          </p>
        </div>

        <form onSubmit={handleSetup} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Master Key
            </label>
            <input
              type="password"
              value={masterKey}
              onChange={(e) => {
                setMasterKey(e.target.value);
                setError('');
              }}
              placeholder="••••••••••••••••"
              className="w-full px-6 py-4 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-gold transition-all"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-400 mt-2">
              .env dosyasındaki ADMIN_MASTER_KEY değeri
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !masterKey}
            className="w-full bg-brown-900 dark:bg-gold text-white dark:text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              'Admin Oluştur'
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-400 mt-6">
          Bu sayfa sadece sistemde hiç admin yokken çalışır.
        </p>
      </div>
    </div>
  );
};

export default AdminSetup;
