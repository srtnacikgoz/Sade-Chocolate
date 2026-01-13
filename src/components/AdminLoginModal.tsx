import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Shield, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, getIdTokenResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Firebase Auth ile giriş yap
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Token'ı yenile ve custom claims'i kontrol et
      const idTokenResult = await getIdTokenResult(user, true);

      if (idTokenResult.claims.admin === true) {
        // Admin yetkisi var - panele yönlendir
        toast.success('Admin paneline hoş geldiniz!');
        navigate('/admin');
        onClose();
        setEmail('');
        setPassword('');
        setError('');
      } else {
        // Admin yetkisi yok
        setError('Bu hesabın admin yetkisi bulunmuyor.');
        // Oturumu kapat (admin olmayan kullanıcı admin paneline girmeye çalışıyor)
        await auth.signOut();
      }
    } catch (err: any) {
      console.error('Admin login error:', err);

      // Hata mesajlarını Türkçeleştir
      const errorCode = err?.code || '';
      let errorMessage = 'Giriş yapılırken bir hata oluştu.';

      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        errorMessage = 'E-posta veya şifre hatalı.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi.';
      } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
      } else if (errorCode === 'auth/user-disabled') {
        errorMessage = 'Bu hesap devre dışı bırakılmış.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-900 rounded-3xl p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-full transition-all"
        >
          <X size={20} className="text-gray-400" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-gold" />
          </div>
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white italic mb-2">
            Admin Girişi
          </h2>
          <p className="text-sm text-gray-400">
            Yönetici hesabınızla giriş yapın
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              E-posta
            </label>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="admin@sadechocolate.com"
              className="w-full px-6 py-4 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-gold transition-all"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="••••••••"
              className="w-full px-6 py-4 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-gold transition-all"
              disabled={isLoading}
            />
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
            disabled={isLoading || !email || !password}
            className="w-full bg-brown-900 dark:bg-gold text-white dark:text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-gold dark:hover:bg-brown-900 dark:hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Kontrol Ediliyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <p className="text-center text-[10px] text-gray-400 leading-relaxed">
            * Sadece yetkili personel erişebilir<br />
            Admin yetkisi Firebase Custom Claims ile doğrulanır
          </p>
        </div>
      </div>
    </div>
  );
};
