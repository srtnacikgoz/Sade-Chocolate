import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { toast } from 'sonner';
import { Type, Plus, Trash2, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';
import type { EmailFont } from '../../../types';
import { DEFAULT_EMAIL_FONTS, seedEmailFonts } from '../../../utils/seedEmailFonts';
import { Button } from '../../ui/Button';

export const FontManagementTab: React.FC = () => {
  const [fonts, setFonts] = useState<EmailFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFont, setNewFont] = useState<Partial<EmailFont>>({
    id: '',
    value: '',
    label: '',
    category: 'serif',
    isActive: true,
    order: 100
  });

  // Firestore'dan fontları yükle
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const docRef = doc(db, 'email_settings', 'fonts');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFonts(docSnap.data().fonts || []);
        } else {
          // İlk kez - seed data yükle
          await seedEmailFonts();
          setFonts(DEFAULT_EMAIL_FONTS);
        }
      } catch (error) {
        console.error('Font yüklenemedi:', error);
        toast.error('Fontlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    loadFonts();
  }, []);

  // Kaydet
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'email_settings', 'fonts'), {
        fonts,
        updatedAt: serverTimestamp(),
        updatedBy: 'admin'
      });
      toast.success('Fontlar kaydedildi!');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  // Varsayılana sıfırla
  const handleReset = async () => {
    if (confirm('Tüm fontları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
      await seedEmailFonts();
      setFonts(DEFAULT_EMAIL_FONTS);
      toast.success('Fontlar varsayılana sıfırlandı. Kaydetmeyi unutmayın.');
    }
  };

  // Yeni font ekle
  const handleAddFont = () => {
    if (!newFont.id || !newFont.value || !newFont.label) {
      toast.error('Tüm alanları doldurun');
      return;
    }

    // ID benzersiz mi kontrol et
    if (fonts.some(f => f.id === newFont.id)) {
      toast.error('Bu ID zaten kullanılıyor');
      return;
    }

    setFonts([...fonts, newFont as EmailFont]);
    setNewFont({
      id: '',
      value: '',
      label: '',
      category: 'serif',
      isActive: true,
      order: 100
    });
    setIsAddingNew(false);
    toast.success('Font eklendi. Kaydetmeyi unutmayın.');
  };

  // Font sil
  const handleDeleteFont = (id: string) => {
    if (confirm('Bu fontu silmek istediğinizden emin misiniz?')) {
      setFonts(fonts.filter(f => f.id !== id));
      toast.success('Font silindi. Kaydetmeyi unutmayın.');
    }
  };

  // Aktif/Pasif toggle
  const toggleActive = (id: string) => {
    setFonts(fonts.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown-900"></div>
      </div>
    );
  }

  const groupedFonts = {
    serif: fonts.filter(f => f.category === 'serif').sort((a, b) => (a.order || 0) - (b.order || 0)),
    'sans-serif': fonts.filter(f => f.category === 'sans-serif').sort((a, b) => (a.order || 0) - (b.order || 0)),
    cursive: fonts.filter(f => f.category === 'cursive').sort((a, b) => (a.order || 0) - (b.order || 0)),
    monospace: fonts.filter(f => f.category === 'monospace').sort((a, b) => (a.order || 0) - (b.order || 0)),
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-3 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-brown-900 to-brown-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Type className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white italic">
              Font Yönetimi
            </h2>
            <p className="text-sm text-gray-500">Email ve tipografi için kullanılabilir fontlar</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Varsayılana Sıfırla
          </button>
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Yeni Font Ekle
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm bg-brown-900 hover:bg-brown-800 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Yeni Font Ekleme Formu */}
      {isAddingNew && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border-2 border-gold/20">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Yeni Font Ekle</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ID (benzersiz, küçük harf)</label>
              <input
                type="text"
                value={newFont.id}
                onChange={(e) => setNewFont({ ...newFont, id: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                placeholder="brush-script"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Kategori</label>
              <select
                value={newFont.category}
                onChange={(e) => setNewFont({ ...newFont, category: e.target.value as any })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
              >
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans-serif</option>
                <option value="cursive">El Yazısı (Cursive)</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">CSS Değeri</label>
              <input
                type="text"
                value={newFont.value}
                onChange={(e) => setNewFont({ ...newFont, value: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none font-mono"
                placeholder="Brush Script MT, cursive"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Görünen İsim</label>
              <input
                type="text"
                value={newFont.label}
                onChange={(e) => setNewFont({ ...newFont, label: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                placeholder="✍️ Brush Script (El Yazısı)"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAddFont} size="sm">
              <Plus size={16} /> Ekle
            </Button>
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Font Listeleri - Kategorilere Göre */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedFonts).map(([category, categoryFonts]) => (
          <div key={category} className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
              {category === 'serif' && '📖 Serif Fonts'}
              {category === 'sans-serif' && '🎨 Sans-serif Fonts'}
              {category === 'cursive' && '✍️ El Yazısı Fonts'}
              {category === 'monospace' && '🖥️ Monospace Fonts'}
              <span className="ml-2 text-xs text-gray-400">({categoryFonts.length})</span>
            </h3>
            <div className="space-y-2">
              {categoryFonts.map((font) => (
                <div
                  key={font.id}
                  className={`p-3 rounded-xl border transition-all ${
                    font.isActive
                      ? 'bg-gray-50 dark:bg-dark-900 border-gray-200 dark:border-gray-700'
                      : 'bg-gray-100/50 dark:bg-dark-900/50 border-gray-100 dark:border-gray-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p style={{ fontFamily: font.value }} className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {font.label}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{font.value}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(font.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          font.isActive
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={font.isActive ? 'Aktif' : 'Pasif'}
                      >
                        {font.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => handleDeleteFont(font.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Not:</strong> Email'lerde sadece sistem fontları (email-safe fonts) çalışır.
          Google Fonts gibi web fontlar email istemcilerinde görünmez.
          Eklediğiniz fontların tüm platformlarda (Gmail, Outlook, Apple Mail) yüklü olduğundan emin olun.
        </p>
      </div>
    </div>
  );
};

export default FontManagementTab;
