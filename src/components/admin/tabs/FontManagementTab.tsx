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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mocha-900"></div>
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
          <div className="w-10 h-10 bg-mocha-900 rounded-2xl flex items-center justify-center shadow-sm">
            <Type className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-mocha-900 ">
              Font Yönetimi
            </h2>
            <p className="text-sm text-mocha-500">Email ve tipografi için kullanılabilir fontlar</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-mocha-500 hover:text-mocha-600 hover:bg-cream-100 rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Varsayılana Sıfırla
          </button>
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-4 py-2 text-sm bg-cream-100 hover:bg-cream-200 text-mocha-600 rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Yeni Font Ekle
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm bg-mocha-900 hover:bg-mocha-800 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Yeni Font Ekleme Formu */}
      {isAddingNew && (
        <div className="bg-white rounded-2xl p-6 border-2 border-gold/20">
          <h3 className="text-lg font-bold mb-4 text-mocha-900">Yeni Font Ekle</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-mocha-500 mb-1 block">ID (benzersiz, küçük harf)</label>
              <input
                type="text"
                value={newFont.id}
                onChange={(e) => setNewFont({ ...newFont, id: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                className="w-full px-4 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm outline-none"
                placeholder="brush-script"
              />
            </div>
            <div>
              <label className="text-xs text-mocha-500 mb-1 block">Kategori</label>
              <select
                value={newFont.category}
                onChange={(e) => setNewFont({ ...newFont, category: e.target.value as any })}
                className="w-full px-4 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm outline-none"
              >
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans-serif</option>
                <option value="cursive">El Yazısı (Cursive)</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-mocha-500 mb-1 block">CSS Değeri</label>
              <input
                type="text"
                value={newFont.value}
                onChange={(e) => setNewFont({ ...newFont, value: e.target.value })}
                className="w-full px-4 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm outline-none font-mono"
                placeholder="Brush Script MT, cursive"
              />
            </div>
            <div>
              <label className="text-xs text-mocha-500 mb-1 block">Görünen İsim</label>
              <input
                type="text"
                value={newFont.label}
                onChange={(e) => setNewFont({ ...newFont, label: e.target.value })}
                className="w-full px-4 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm outline-none"
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
              className="px-4 py-2 text-sm text-mocha-500 hover:text-mocha-600"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Font Listeleri - Kategorilere Göre */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedFonts).map(([category, categoryFonts]) => (
          <div key={category} className="bg-white rounded-2xl p-6 border border-cream-200">
            <h3 className="text-sm font-bold text-mocha-600 mb-4 uppercase tracking-wider">
              {category === 'serif' && '📖 Serif Fonts'}
              {category === 'sans-serif' && '🎨 Sans-serif Fonts'}
              {category === 'cursive' && '✍️ El Yazısı Fonts'}
              {category === 'monospace' && '🖥️ Monospace Fonts'}
              <span className="ml-2 text-xs text-mocha-400">({categoryFonts.length})</span>
            </h3>
            <div className="space-y-2">
              {categoryFonts.map((font) => (
                <div
                  key={font.id}
                  className={`p-3 rounded-xl border transition-all ${
                    font.isActive
                      ? 'bg-cream-50 border-cream-200'
                      : 'bg-cream-100/50 border-cream-200 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p style={{ fontFamily: font.value }} className="text-sm font-medium text-mocha-900 mb-1">
                        {font.label}
                      </p>
                      <p className="text-xs text-mocha-400 font-mono">{font.value}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(font.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          font.isActive
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-mocha-400 hover:bg-cream-100'
                        }`}
                        title={font.isActive ? 'Aktif' : 'Pasif'}
                      >
                        {font.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => handleDeleteFont(font.id)}
                        className="p-2 text-mocha-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm text-blue-700">
          <strong>Not:</strong> Email'lerde sadece sistem fontları (email-safe fonts) çalışır.
          Google Fonts gibi web fontlar email istemcilerinde görünmez.
          Eklediğiniz fontların tüm platformlarda (Gmail, Outlook, Apple Mail) yüklü olduğundan emin olun.
        </p>
      </div>
    </div>
  );
};

export default FontManagementTab;
