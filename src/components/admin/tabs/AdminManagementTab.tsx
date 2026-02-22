import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Shield, UserPlus, Trash2, Loader2, Crown, Mail, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface AdminUser {
  email: string;
  uid: string;
  createdAt?: any;
  createdBy?: string;
}

export const AdminManagementTab: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [removingAdmin, setRemovingAdmin] = useState<string | null>(null);
  const [adminToRemove, setAdminToRemove] = useState<AdminUser | null>(null);

  const functions = getFunctions(undefined, 'europe-west3');

  // Admin listesini yükle
  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      const listAdminsFn = httpsCallable(functions, 'listAdmins');
      const result = await listAdminsFn();
      const data = result.data as { admins: AdminUser[] };
      setAdmins(data.admins || []);
    } catch (error: any) {
      console.error('Admin listesi yüklenemedi:', error);
      toast.error('Admin listesi yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // Yeni admin ekle
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdminEmail.trim()) {
      toast.error('Email adresi gerekli');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast.error('Geçerli bir email adresi girin');
      return;
    }

    try {
      setIsAdding(true);
      const setAdminClaimFn = httpsCallable(functions, 'setAdminClaim');
      await setAdminClaimFn({ targetEmail: newAdminEmail.trim() });

      toast.success(`${newAdminEmail} admin olarak eklendi`);
      setNewAdminEmail('');
      await loadAdmins();
    } catch (error: any) {
      console.error('Admin eklenemedi:', error);
      if (error.code === 'functions/not-found') {
        toast.error('Bu email ile kayıtlı kullanıcı bulunamadı');
      } else if (error.code === 'functions/permission-denied') {
        toast.error('Bu işlem için yetkiniz yok');
      } else {
        toast.error(error.message || 'Admin eklenemedi');
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Admin yetkisini kaldır
  const handleRemoveAdmin = async (admin: AdminUser) => {
    try {
      setRemovingAdmin(admin.uid);
      const removeAdminClaimFn = httpsCallable(functions, 'removeAdminClaim');
      await removeAdminClaimFn({ targetUid: admin.uid });

      toast.success(`${admin.email} admin yetkisi kaldırıldı`);
      setAdminToRemove(null);
      await loadAdmins();
    } catch (error: any) {
      console.error('Admin yetkisi kaldırılamadı:', error);
      if (error.code === 'functions/permission-denied') {
        toast.error('Kendi admin yetkinizi kaldıramazsınız');
      } else {
        toast.error(error.message || 'Admin yetkisi kaldırılamadı');
      }
    } finally {
      setRemovingAdmin(null);
    }
  };

  // Tarih formatlama
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center">
            <Shield size={24} className="text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-mocha-900">
              Admin Yönetimi
            </h2>
            <p className="text-sm text-mocha-500">
              Admin kullanıcılarını yönetin
            </p>
          </div>
        </div>
      </div>

      {/* Yeni Admin Ekle */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
        <h3 className="text-sm font-bold text-mocha-600 uppercase tracking-wider mb-4 flex items-center gap-2">
          <UserPlus size={16} />
          Yeni Admin Ekle
        </h3>

        <form onSubmit={handleAddAdmin} className="flex gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="kullanici@email.com"
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-mocha-900 placeholder:text-mocha-400 outline-none focus:border-gold transition-all"
              disabled={isAdding}
            />
            <p className="text-xs text-mocha-400 mt-2">
              Kullanıcının önce siteye kayıt olması gerekir
            </p>
          </div>
          <button
            type="submit"
            disabled={isAdding || !newAdminEmail.trim()}
            className="px-6 py-3 bg-gold text-black font-bold rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
          >
            {isAdding ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Ekleniyor...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Ekle
              </>
            )}
          </button>
        </form>
      </div>

      {/* Admin Listesi */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
        <h3 className="text-sm font-bold text-mocha-600 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Crown size={16} />
          Mevcut Adminler ({admins.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-gold animate-spin" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-mocha-500">
            Henüz admin bulunmuyor
          </div>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.uid}
                className="flex items-center justify-between p-4 bg-cream-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                    <Shield size={20} className="text-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-mocha-400" />
                      <span className="font-medium text-mocha-900">
                        {admin.email}
                      </span>
                    </div>
                    {admin.createdAt && (
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={12} className="text-mocha-400" />
                        <span className="text-xs text-mocha-500">
                          {formatDate(admin.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <button
                      onClick={() => setAdminToRemove(admin)}
                      disabled={removingAdmin === admin.uid}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title="Admin yetkisini kaldır"
                    >
                      {removingAdmin === admin.uid ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </AlertDialog.Trigger>

                  <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-full max-w-md z-50 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle size={24} className="text-red-600" />
                        </div>
                        <div>
                          <AlertDialog.Title className="text-lg font-bold text-mocha-900">
                            Admin Yetkisini Kaldır
                          </AlertDialog.Title>
                          <AlertDialog.Description className="text-sm text-mocha-500">
                            Bu işlem geri alınabilir
                          </AlertDialog.Description>
                        </div>
                      </div>

                      <p className="text-mocha-600 mb-6">
                        <span className="font-bold text-gold">{admin.email}</span> kullanıcısının admin yetkisini kaldırmak istediğinize emin misiniz?
                      </p>

                      <div className="flex gap-3 justify-end">
                        <AlertDialog.Cancel asChild>
                          <button className="px-4 py-2 text-mocha-600 hover:bg-cream-100 rounded-lg transition-all">
                            İptal
                          </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <button
                            onClick={() => handleRemoveAdmin(admin)}
                            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all"
                          >
                            Yetkiyi Kaldır
                          </button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bilgi Notu */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800 text-sm">
              Önemli Notlar
            </h4>
            <ul className="text-sm text-amber-700 mt-1 space-y-1">
              <li>• Admin eklemek için kullanıcının önce siteye kayıt olması gerekir</li>
              <li>• Kendi admin yetkinizi kaldıramazsınız</li>
              <li>• Admin yetkisi verilen kullanıcı tüm panele erişebilir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManagementTab;
