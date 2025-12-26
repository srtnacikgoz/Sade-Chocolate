import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Admin şifresi - Gerçek projede bu Firebase'de veya environment variable'da olmalı
  const ADMIN_PASSWORD = 'sade2025';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      // Şifre doğru - Admin paneline yönlendir
      sessionStorage.setItem('admin_authenticated', 'true');
      navigate('/admin');
      onClose();
      setPassword('');
      setError('');
    } else {
      // Şifre yanlış
      setError('Yanlış şifre');
      setPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
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
            <span className="material-icons-outlined text-3xl text-gold">lock</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white italic mb-2">
            Admin Girişi
          </h2>
          <p className="text-sm text-gray-400">
            Yönetici paneline erişim için şifrenizi girin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Şifre"
              className="w-full px-6 py-4 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-gold transition-all"
            />
            {error && (
              <p className="text-red-500 text-xs mt-2 ml-2 animate-in fade-in duration-200">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-brown-900 dark:bg-gold text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-gold dark:hover:bg-brown-900 transition-all shadow-xl active:scale-95"
          >
            Giriş Yap
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-400 mt-6">
          * Sadece yetkili personel erişebilir
        </p>
      </div>
    </div>
  );
};
