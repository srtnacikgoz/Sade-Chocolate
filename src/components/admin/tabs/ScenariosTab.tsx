import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { GitBranch, Plus, Trash2, Edit3, Save, X, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ConversationFlow, ConversationStep } from '../../../types/conversationFlow';

export const ScenariosTab: React.FC = () => {
  const [scenarios, setScenarios] = useState<ConversationFlow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingScenario, setEditingScenario] = useState<ConversationFlow | null>(null);

  const [newScenario, setNewScenario] = useState<Partial<ConversationFlow>>({
    name: '',
    description: '',
    trigger: '',
    startStepId: 'step1',
    personaType: 'gifter', // ✨ Varsay\u0131lan persona
    steps: [
      {
        id: 'step1',
        type: 'question',
        question: '',
        options: [
          { label: '', nextStepId: 'step2' },
          { label: '', nextStepId: 'step3' }
        ]
      }
    ],
    active: true
  });

  // Fetch scenarios
  useEffect(() => {
    const q = query(collection(db, 'conversation_flows'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setScenarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConversationFlow)));
    }, (error) => {
      console.error("Error fetching scenarios:", error);
      toast.error("Senaryolar yüklenemedi.");
    });
    return () => unsubscribe();
  }, []);

  const handleAddStep = (type: 'question' | 'result') => {
    const newStepId = `step${(newScenario.steps?.length || 0) + 1}`;
    const newStep: ConversationStep = {
      id: newStepId,
      type,
      ...(type === 'question' ? {
        question: '',
        options: [
          { label: '', nextStepId: null },
          { label: '', nextStepId: null }
        ]
      } : {
        resultMessage: '',
        productRecommendations: []
      })
    };

    setNewScenario({
      ...newScenario,
      steps: [...(newScenario.steps || []), newStep]
    });
  };

  const handleRemoveStep = (stepId: string) => {
    setNewScenario({
      ...newScenario,
      steps: newScenario.steps?.filter(s => s.id !== stepId)
    });
  };

  const handleUpdateStep = (stepId: string, updates: Partial<ConversationStep>) => {
    setNewScenario({
      ...newScenario,
      steps: newScenario.steps?.map(s => s.id === stepId ? { ...s, ...updates } : s)
    });
  };

  const handleAddOption = (stepId: string) => {
    setNewScenario({
      ...newScenario,
      steps: newScenario.steps?.map(s => {
        if (s.id === stepId && s.options) {
          return {
            ...s,
            options: [...s.options, { label: '', nextStepId: null }]
          };
        }
        return s;
      })
    });
  };

  const handleUpdateOption = (stepId: string, optionIndex: number, updates: Partial<{ label: string; nextStepId: string | null }>) => {
    setNewScenario({
      ...newScenario,
      steps: newScenario.steps?.map(s => {
        if (s.id === stepId && s.options) {
          return {
            ...s,
            options: s.options.map((opt, idx) => idx === optionIndex ? { ...opt, ...updates } : opt)
          };
        }
        return s;
      })
    });
  };

  const handleSaveScenario = async () => {
    if (!newScenario.name || !newScenario.trigger) {
      toast.error('Senaryo adı ve tetikleyici zorunludur.');
      return;
    }

    if (!newScenario.steps || newScenario.steps.length === 0) {
      toast.error('En az bir adım eklemelisiniz.');
      return;
    }

    try {
      if (editingScenario) {
        await updateDoc(doc(db, 'conversation_flows', editingScenario.id), {
          ...newScenario,
          updatedAt: serverTimestamp()
        });
        toast.success('Senaryo güncellendi!');
      } else {
        await addDoc(collection(db, 'conversation_flows'), {
          ...newScenario,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Senaryo oluşturuldu!');
      }

      setIsCreating(false);
      setEditingScenario(null);
      setNewScenario({
        name: '',
        description: '',
        trigger: '',
        startStepId: 'step1',
        personaType: 'gifter',
        steps: [
          {
            id: 'step1',
            type: 'question',
            question: '',
            options: [
              { label: '', nextStepId: 'step2' },
              { label: '', nextStepId: 'step3' }
            ]
          }
        ],
        active: true
      });
    } catch (error) {
      console.error("Error saving scenario:", error);
      toast.error('Senaryo kaydedilemedi.');
    }
  };

  const handleDeleteScenario = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'conversation_flows', id));
      toast.success('Senaryo silindi.');
    } catch (error) {
      console.error("Error deleting scenario:", error);
      toast.error('Senaryo silinemedi.');
    }
  };

  const handleEditScenario = (scenario: ConversationFlow) => {
    setEditingScenario(scenario);
    setNewScenario(scenario);
    setIsCreating(true);
  };

  const handleToggleActive = async (scenario: ConversationFlow) => {
    try {
      await updateDoc(doc(db, 'conversation_flows', scenario.id), {
        active: !scenario.active,
        updatedAt: serverTimestamp()
      });
      toast.success(scenario.active ? 'Senaryo devre dışı bırakıldı.' : 'Senaryo aktif edildi.');
    } catch (error) {
      console.error("Error toggling scenario:", error);
      toast.error('Durum değiştirilemedi.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <GitBranch className="text-purple-500" /> Konuşma Senaryoları
          </h2>
          <p className="text-sm text-gray-500 mt-2">Müşterilerle interaktif diyaloglar oluşturun</p>
        </div>
        <button
          onClick={() => {
            setEditingScenario(null);
            setNewScenario({
              name: '',
              description: '',
              trigger: '',
              startStepId: 'step1',
              personaType: 'gifter',
              steps: [
                {
                  id: 'step1',
                  type: 'question',
                  question: '',
                  options: [
                    { label: '', nextStepId: 'step2' },
                    { label: '', nextStepId: 'step3' }
                  ]
                }
              ],
              active: true
            });
            setIsCreating(true);
          }}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Yeni Senaryo
        </button>
      </div>

      {/* Scenario List */}
      {!isCreating && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="bg-white dark:bg-dark-800 rounded-[30px] border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{scenario.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${scenario.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {scenario.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  {scenario.description && (
                    <p className="text-sm text-gray-500 mb-3">{scenario.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MessageCircle size={14} />
                    <span>Tetikleyici: "{scenario.trigger}"</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <GitBranch size={14} />
                    <span>{scenario.steps?.length || 0} Adım</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleToggleActive(scenario)}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${scenario.active ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                >
                  {scenario.active ? 'Devre Dışı Bırak' : 'Aktif Et'}
                </button>
                <button
                  onClick={() => handleEditScenario(scenario)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteScenario(scenario.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scenario Builder */}
      {isCreating && (
        <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200 dark:border-gray-700 p-10 shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">
              {editingScenario ? 'Senaryo Düzenle' : 'Yeni Senaryo Oluştur'}
            </h3>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingScenario(null);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Basic Info */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Senaryo Adı *</label>
              <input
                type="text"
                placeholder="Örn: Hediye Seçim Asistanı"
                value={newScenario.name}
                onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Açıklama</label>
              <input
                type="text"
                placeholder="Bu senaryo ne için kullanılıyor?"
                value={newScenario.description}
                onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tetikleyici Anahtar Kelime *</label>
              <input
                type="text"
                placeholder="Örn: hediye almak, sevgilime hediye, ne alsam"
                value={newScenario.trigger}
                onChange={(e) => setNewScenario({ ...newScenario, trigger: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
              <p className="text-xs text-gray-400 mt-2">
                💡 <strong>Virgülle ayırarak</strong> birden fazla tetikleyici ekleyebilirsiniz.
                <br />
                Örn: "hediye, armağan, sürpriz" → Her üç kelime de senaryoyu başlatır
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">✨ Hedef Persona Tipi</label>
              <select
                value={newScenario.personaType || 'gifter'}
                onChange={(e) => setNewScenario({ ...newScenario, personaType: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
              >
                <option value="gifter">🎁 Hediye Veren (Gifter) - Hediye seçimi için yardım</option>
                <option value="connoisseur">🍷 Uzman (Connoisseur) - Tat profili keşfi</option>
                <option value="aspiring">📚 Öğrenen (Aspiring) - Çikolata eğitimi</option>
                <option value="archivist">📦 Koleksiyoncu (Archivist) - Nadir ürünler</option>
              </select>
              <p className="text-xs text-gray-400 mt-2">
                Bu senaryo hangi kullanıcı tipine hitap ediyor? AI yanıtlarını buna göre optimize eder.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold">Konuşma Adımları</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddStep('question')}
                  className="px-4 py-2 bg-purple-100 text-purple-600 rounded-xl text-sm font-bold hover:bg-purple-200 transition-all"
                >
                  + Soru Ekle
                </button>
                <button
                  onClick={() => handleAddStep('result')}
                  className="px-4 py-2 bg-green-100 text-green-600 rounded-xl text-sm font-bold hover:bg-green-200 transition-all"
                >
                  + Sonuç Ekle
                </button>
              </div>
            </div>

            {newScenario.steps?.map((step, stepIndex) => (
              <div key={step.id} className="bg-gray-50 dark:bg-dark-900 rounded-2xl p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {step.type === 'question' ? (
                      <MessageCircle className="text-purple-500" size={20} />
                    ) : (
                      <CheckCircle className="text-green-500" size={20} />
                    )}
                    <span className="font-bold text-sm uppercase tracking-wider text-gray-500">
                      {step.id} - {step.type === 'question' ? 'Soru' : 'Sonuç'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveStep(step.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {step.type === 'question' ? (
                  <>
                    <input
                      type="text"
                      placeholder="Soruyu buraya yazın..."
                      value={step.question}
                      onChange={(e) => handleUpdateStep(step.id, { question: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />

                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Cevap Seçenekleri</label>
                      {step.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Seçenek metni"
                            value={option.label}
                            onChange={(e) => handleUpdateOption(step.id, optIndex, { label: e.target.value })}
                            className="flex-1 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                          />
                          <select
                            value={option.nextStepId || ''}
                            onChange={(e) => handleUpdateOption(step.id, optIndex, { nextStepId: e.target.value || null })}
                            className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                          >
                            <option value="">Sonuç (Bitir)</option>
                            {newScenario.steps?.filter(s => s.id !== step.id).map(s => (
                              <option key={s.id} value={s.id}>{s.id}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddOption(step.id)}
                        className="text-xs text-purple-600 font-bold hover:underline"
                      >
                        + Seçenek Ekle
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <textarea
                      placeholder="Sonuç mesajını buraya yazın (AI müşteriye bunu gönderecek)..."
                      value={step.resultMessage}
                      onChange={(e) => handleUpdateStep(step.id, { resultMessage: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 outline-none"
                    />
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={step.metadata?.triggerGiftMode || false}
                          onChange={(e) => handleUpdateStep(step.id, {
                            metadata: { ...step.metadata, triggerGiftMode: e.target.checked }
                          })}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <span className="text-sm font-bold text-purple-700 dark:text-purple-300">✨ Hediye Modunu Otomatik Aktif Et</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bu adıma ulaşan kullanıcılara hediye paketi seçeneğini otomatik öner</p>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingScenario(null);
              }}
              className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              İptal
            </button>
            <button
              onClick={handleSaveScenario}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center gap-2"
            >
              <Save size={18} /> Senaryoyu Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
