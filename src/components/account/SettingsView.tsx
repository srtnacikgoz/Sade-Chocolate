import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { toast } from 'sonner';
import { User, Mail, Phone, Calendar, Globe, Moon, Sun, Shield, Download, Trash2 } from 'lucide-react';
import { downloadUserData, deleteAccount } from '../../services/accountService';

export const SettingsView: React.FC = () => {
  const { user, updateProfile, logout } = useUser();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    birthDate: user?.birthDate || ''
  });

  useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      birthDate: user?.birthDate || ''
    });
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profil bilgileriniz güncellendi.');
      setIsEditing(false);
    } catch (error) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');
  };

  const handleDownloadData = async () => {
    if (!user?.uid || !user?.email) return;
    setIsDownloading(true);
    try {
      await downloadUserData(user.uid, user.email);
      toast.success('Verileriniz indirildi.');
    } catch (error) {
      console.error('Veri indirme hatası:', error);
      toast.error('Veriler indirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid || !user?.email) return;
    setIsDeleting(true);
    try {
      await deleteAccount(user.uid, user.email);
      toast.success('Hesabınız başarıyla silindi.');
      navigate('/');
    } catch (error) {
      console.error('Hesap silme hatası:', error);
      toast.error('Hesap silinemedi. Lütfen tekrar deneyin.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profil Bilgileri */}
      <section className="bg-gray-50 dark:bg-dark-800 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brown-900 dark:bg-gold rounded-2xl flex items-center justify-center">
              <User className="text-white dark:text-black" size={20} />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold dark:text-white">Profil Bilgileri</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Kişisel bilgilerinizi düzenleyin</p>
            </div>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Düzenle
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                İptal
              </Button>
              <Button size="sm" onClick={handleSave} loading={isSaving}>
                Kaydet
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Ad</label>
            {isEditing ? (
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Adınız"
              />
            ) : (
              <p className="text-lg font-medium dark:text-white">{user?.firstName || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Soyad</label>
            {isEditing ? (
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Soyadınız"
              />
            ) : (
              <p className="text-lg font-medium dark:text-white">{user?.lastName || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              <Mail size={12} className="inline mr-1" />
              E-posta
            </label>
            <p className="text-lg font-medium dark:text-white">{user?.email || '-'}</p>
            <p className="text-xs text-gray-400 mt-1">E-posta adresi değiştirilemez</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              <Phone size={12} className="inline mr-1" />
              Telefon
            </label>
            {isEditing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="5** *** ** **"
              />
            ) : (
              <p className="text-lg font-medium dark:text-white">{user?.phone || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              <Calendar size={12} className="inline mr-1" />
              Doğum Tarihi
            </label>
            {isEditing ? (
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            ) : (
              <p className="text-lg font-medium dark:text-white">{user?.birthDate || '-'}</p>
            )}
          </div>
        </div>
      </section>

      {/* Dil ve Tema Ayarları */}
      <section className="bg-gray-50 dark:bg-dark-800 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-brown-900 dark:bg-gold rounded-2xl flex items-center justify-center">
            <Globe className="text-white dark:text-black" size={20} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold dark:text-white">Tercihler</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Dil ve görünüm ayarları</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Dil Seçimi */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-900 rounded-2xl">
            <div>
              <p className="font-medium dark:text-white">Dil</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Site dilini değiştirin</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('tr')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  language === 'tr'
                    ? 'bg-brown-900 dark:bg-gold text-white dark:text-black'
                    : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700'
                }`}
              >
                Türkçe
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  language === 'en'
                    ? 'bg-brown-900 dark:bg-gold text-white dark:text-black'
                    : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Tema Seçimi */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-900 rounded-2xl">
            <div>
              <p className="font-medium dark:text-white">Tema</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Açık veya koyu mod</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700 transition-all"
            >
              {isDarkMode ? (
                <>
                  <Sun size={16} />
                  <span className="text-sm font-bold">Açık Mod</span>
                </>
              ) : (
                <>
                  <Moon size={16} />
                  <span className="text-sm font-bold">Koyu Mod</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Veri ve Gizlilik */}
      <section className="bg-gray-50 dark:bg-dark-800 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-brown-900 dark:bg-gold rounded-2xl flex items-center justify-center">
            <Shield className="text-white dark:text-black" size={20} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold dark:text-white">Veri ve Gizlilik</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">KVKK kapsamındaki haklarınız</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Verilerimi İndir */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-900 rounded-2xl">
            <div>
              <p className="font-medium dark:text-white">Verilerimi İndir</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                KVKK kapsamında kişisel verilerinizi JSON formatında indirebilirsiniz
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadData}
              loading={isDownloading}
            >
              <Download size={14} className="mr-1" />
              {isDownloading ? 'İndiriliyor...' : 'İndir'}
            </Button>
          </div>

          {/* Ayırıcı */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Hesabımı Sil */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-900 rounded-2xl">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Hesabımı Sil</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hesabınız kalıcı olarak silinir, siparişleriniz yasal zorunluluk gereği anonimleştirilir
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              loading={isDeleting}
              className="!border-red-300 !text-red-600 hover:!bg-red-50 dark:!border-red-700 dark:!text-red-400 dark:hover:!bg-red-900/20"
            >
              <Trash2 size={14} className="mr-1" />
              {isDeleting ? 'Siliniyor...' : 'Hesabı Sil'}
            </Button>
          </div>
        </div>
      </section>

      {/* Hesap Silme Onay Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Hesabınızı silmek istediğinize emin misiniz?"
        message="Bu işlem geri alınamaz. Tüm kişisel verileriniz silinecek, siparişleriniz yasal zorunluluk (TTK 10 yıl saklama) gereği anonimleştirilecektir. Silmeden önce verilerinizi indirmenizi öneririz."
        confirmText="Evet, Hesabımı Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
