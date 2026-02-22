import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { GiftNoteTemplate } from '../../../types';
import { Heart, Gift, Star, Plus, Trash2, Save, Edit2, X, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

const EMOTION_CONFIG = {
  love: { label: 'Aşk & Tutku', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  gratitude: { label: 'Teşekkür & Minnet', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  celebration: { label: 'Kutlama & Başarı', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
};

const PERSONA_LABELS = {
  minimalist: 'Minimalist',
  poetic: 'Poetik',
  sensual: 'Duyusal',
};

// Varsayılan şablonlar (ilk kurulum için)
const DEFAULT_TEMPLATES: Omit<GiftNoteTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    emotion: 'love',
    emotionLabel: { tr: 'Aşk & Tutku', en: 'Love & Passion' },
    personas: {
      minimalist: "Zanaatın ve saflığın en tatlı haliyle... Tıpkı bizim gibi, yalın ve derin.",
      poetic: "Zamanla olgunlaşan, sabırla işlenen [ürün_adı] gibi... Her notada, paylaştığımız o eşsiz mirasın izleri var.",
      sensual: "[ürün_adı] tabletindeki [tadım_notları] notaları gibi, yerini bitişteki derin ve yoğun çikolata karakterine bırakan bir heyecan...",
    },
    active: true,
  },
  {
    emotion: 'gratitude',
    emotionLabel: { tr: 'Teşekkür & Minnet', en: 'Gratitude' },
    personas: {
      minimalist: "İnceliğin ve desteğin için küçük bir teşekkür. Tadı damağında, izi kalbimde.",
      poetic: "Bazı anlar, kelimelerin ötesinde bir zarafet hak eder. Hayatıma kattığın o tatlı dokunuş için minnettarım.",
      sensual: "Senin için seçtiğim [ürün_adı] içerisindeki [tadım_notları] aromaları, nezaketinin sıcaklığını temsil ediyor.",
    },
    active: true,
  },
  {
    emotion: 'celebration',
    emotionLabel: { tr: 'Kutlama & Başarı', en: 'Celebration' },
    personas: {
      minimalist: "Yeni bir zirve, yeni bir tat. Başarın daim, keyfin Sade olsun.",
      poetic: "Hayatın kutsal külliyatına altın harflerle yazılacak bir başarı. Bu anı, [köken] kökenli bu saf şaheserle taçlandırmak istedim.",
      sensual: "Damaktaki o enerjik ve [tadım_notları] aromaları, kutlamaya değer bu başarının ritmini tutuyor.",
    },
    active: true,
  },
];

export const GiftNotesTab: React.FC = () => {
  const [templates, setTemplates] = useState<GiftNoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GiftNoteTemplate> | null>(null);

  // Firebase'den şablonları çek
  const fetchTemplates = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'gift_note_templates'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GiftNoteTemplate[];
      setTemplates(data);

      // Eğer hiç şablon yoksa varsayılanları ekle
      if (data.length === 0) {
        await initializeDefaults();
      }
    } catch (error) {
      console.error('Şablonlar yüklenemedi:', error);
      toast.error('Şablonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Varsayılan şablonları Firebase'e ekle
  const initializeDefaults = async () => {
    try {
      for (const template of DEFAULT_TEMPLATES) {
        const docRef = doc(collection(db, 'gift_note_templates'));
        await setDoc(docRef, {
          ...template,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      toast.success('Varsayılan şablonlar oluşturuldu');
      fetchTemplates();
    } catch (error) {
      console.error('Varsayılan şablonlar eklenemedi:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Düzenleme modunu başlat
  const startEdit = (template: GiftNoteTemplate) => {
    setEditingId(template.id);
    setEditForm({ ...template });
  };

  // Düzenlemeyi kaydet
  const saveEdit = async () => {
    if (!editForm || !editingId) return;

    try {
      await updateDoc(doc(db, 'gift_note_templates', editingId), {
        ...editForm,
        updatedAt: serverTimestamp(),
      });
      toast.success('Şablon güncellendi');
      setEditingId(null);
      setEditForm(null);
      fetchTemplates();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast.error('Şablon güncellenemedi');
    }
  };

  // Şablonu sil
  const deleteTemplate = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return;

    try {
      await deleteDoc(doc(db, 'gift_note_templates', id));
      toast.success('Şablon silindi');
      fetchTemplates();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Şablon silinemedi');
    }
  };

  // Aktif/Pasif durumunu değiştir
  const toggleActive = async (template: GiftNoteTemplate) => {
    try {
      await updateDoc(doc(db, 'gift_note_templates', template.id), {
        active: !template.active,
        updatedAt: serverTimestamp(),
      });
      toast.success(template.active ? 'Şablon pasife alındı' : 'Şablon aktifleştirildi');
      fetchTemplates();
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center">
            <Wand2 className="text-gold" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-mocha-900">AI Sommelier Şablonları</h2>
            <p className="text-sm text-mocha-400">Hediye notu önerilerini düzenleyin</p>
          </div>
        </div>
      </div>

      {/* Yer Tutucu Bilgisi */}
      <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200">
        <p className="text-xs text-mocha-500">
          <strong>Kullanılabilir yer tutucular:</strong>{' '}
          <code className="bg-white px-2 py-0.5 rounded text-gold">[ürün_adı]</code>{' '}
          <code className="bg-white px-2 py-0.5 rounded text-gold">[köken]</code>{' '}
          <code className="bg-white px-2 py-0.5 rounded text-gold">[tadım_notları]</code>
        </p>
      </div>

      {/* Şablon Kartları */}
      <div className="space-y-6">
        {templates.map((template) => {
          const config = EMOTION_CONFIG[template.emotion];
          const Icon = config.icon;
          const isEditing = editingId === template.id;

          return (
            <div
              key={template.id}
              className={`bg-white rounded-xl border transition-all ${
                isEditing ? 'border-gold shadow-sm' : 'border-cream-200 hover:shadow-md'
              } ${!template.active ? 'opacity-60' : ''}`}
            >
              {/* Kart Header */}
              <div className={`p-6 ${config.bg} rounded-t-3xl flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm ${config.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-mocha-900">{config.label}</h3>
                    <p className="text-xs text-mocha-500">{template.emotionLabel.en}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Aktif/Pasif Toggle */}
                  <button
                    onClick={() => toggleActive(template)}
                    className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                      template.active
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-cream-200 text-mocha-500'
                    }`}
                  >
                    {template.active ? 'Aktif' : 'Pasif'}
                  </button>

                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => startEdit(template)}
                        className="p-2 text-mocha-400 hover:text-gold hover:bg-white rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 text-mocha-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={saveEdit}
                        className="p-2 text-emerald-500 hover:bg-white rounded-lg transition-all"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditForm(null); }}
                        className="p-2 text-mocha-400 hover:bg-white rounded-lg transition-all"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Persona Şablonları */}
              <div className="p-6 space-y-4">
                {(['minimalist', 'poetic', 'sensual'] as const).map((persona) => (
                  <div key={persona} className="space-y-2">
                    <label className="text-xs font-medium text-mocha-400 uppercase tracking-wider">
                      {PERSONA_LABELS[persona]}
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editForm?.personas?.[persona] || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            personas: {
                              ...editForm?.personas,
                              [persona]: e.target.value,
                            } as any,
                          })
                        }
                        className="w-full p-4 bg-cream-50 rounded-xl text-sm outline-none border border-transparent focus:border-gold/30 resize-none"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-mocha-600 bg-cream-50 p-4 rounded-xl italic">
                        "{template.personas[persona]}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
