import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { GitBranch, Plus, Trash2, Edit3, Save, X, MessageCircle, CheckCircle, AlertCircle, GripVertical, Package, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { ConversationFlow, ConversationStep } from '../../../types/conversationFlow';
import { useProducts } from '../../../context/ProductContext';

export const ScenariosTab: React.FC = () => {
  const { products } = useProducts();
  const [scenarios, setScenarios] = useState<ConversationFlow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingScenario, setEditingScenario] = useState<ConversationFlow | null>(null);
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);

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

  const handleAddStepFloating = (type: 'question' | 'result') => {
    handleAddStep(type);
    setIsFloatingMenuOpen(false);

    // Scroll to new step after it's added
    setTimeout(() => {
      const steps = document.querySelectorAll('[data-step-card]');
      const lastStep = steps[steps.length - 1];
      lastStep?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    toast.success(`✓ Yeni ${type === 'question' ? 'soru' : 'sonuç'} adımı eklendi!`);
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

  const handleDuplicateScenario = async (scenario: ConversationFlow) => {
    try {
      // Senaryoyu kopyala (ID hariç)
      const { id, createdAt, updatedAt, ...scenarioData } = scenario;

      // Kopyalanan senaryoyu yeni bir isimle kaydet
      await addDoc(collection(db, 'conversation_flows'), {
        ...scenarioData,
        name: `${scenario.name} (Kopya)`,
        active: false, // Güvenlik için kopyalar pasif başlar
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('✓ Senaryo çoğaltıldı! Tetikleyicileri düzenlemeyi unutmayın.');
    } catch (error) {
      console.error("Error duplicating scenario:", error);
      toast.error('Senaryo çoğaltılamadı.');
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
                  onClick={() => handleDuplicateScenario(scenario)}
                  className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all"
                  title="Senaryo Çoğalt"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleEditScenario(scenario)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                  title="Düzenle"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteScenario(scenario.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                  title="Sil"
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
              <div key={step.id} data-step-card className="bg-gray-50 dark:bg-dark-900 rounded-2xl p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {step.type === 'question' ? (
                      <MessageCircle className="text-purple-500" size={20} />
                    ) : (
                      <CheckCircle className="text-green-500" size={20} />
                    )}
                    <span className="font-bold text-sm uppercase tracking-wider text-gray-500">
                      {step.displayName || `${step.id} - ${step.type === 'question' ? 'Soru' : 'Sonuç'}`}
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
                      placeholder="Bu adıma özel isim verin (örn: 'Romantik Partner Seçimi', 'Hediye Alıcısı Sorusu')"
                      value={step.displayName || ''}
                      onChange={(e) => handleUpdateStep(step.id, { displayName: e.target.value })}
                      className="w-full px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 mb-3 focus:ring-2 focus:ring-purple-500/20 outline-none placeholder:text-purple-400 placeholder:font-normal"
                    />
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
                            {newScenario.steps?.filter(s => s.id !== step.id).map(s => {
                              const emoji = s.type === 'question' ? '🟣' : '🟢';
                              const label = s.displayName || `${s.id} - ${s.type === 'question' ? 'Soru' : 'Sonuç'}`;
                              return (
                                <option key={s.id} value={s.id}>
                                  {emoji} {label} ({s.id})
                                </option>
                              );
                            })}
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
                    <input
                      type="text"
                      placeholder="Bu sonuç adımına özel isim verin (örn: 'Romantik Partner Önerisi', 'Öğretmen İçin Truffle Sonucu')"
                      value={step.displayName || ''}
                      onChange={(e) => handleUpdateStep(step.id, { displayName: e.target.value })}
                      className="w-full px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-xs font-bold text-green-700 dark:text-green-300 mb-3 focus:ring-2 focus:ring-green-500/20 outline-none placeholder:text-green-400 placeholder:font-normal"
                    />
                    <textarea
                      placeholder="Sonuç mesajını buraya yazın (AI müşteriye bunu gönderecek)..."
                      value={step.resultMessage}
                      onChange={(e) => handleUpdateStep(step.id, { resultMessage: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 outline-none"
                    />

                    {/* Görsel Ürün Seçici */}
                    <div className="mt-4 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="text-amber-600" size={20} />
                        <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">🎁 ÖNERİLEN ÜRÜNLER SEÇİN</h4>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mb-4">
                        AI bu adıma ulaşan müşterilere aşağıdaki ürünleri interaktif kartlar olarak gösterecek. Sürükleyerek sıralayabilirsiniz.
                      </p>

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {products.map((product, index) => {
                          const isSelected = step.productRecommendations?.includes(product.id);
                          const selectedIndex = step.productRecommendations?.indexOf(product.id) ?? -1;

                          return (
                            <div
                              key={product.id}
                              draggable={isSelected}
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('productId', product.id);
                              }}
                              onDragOver={(e) => {
                                if (isSelected) {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'move';
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const draggedId = e.dataTransfer.getData('productId');
                                const currentRecs = step.productRecommendations || [];
                                const draggedIndex = currentRecs.indexOf(draggedId);
                                const dropIndex = currentRecs.indexOf(product.id);

                                if (draggedIndex !== -1 && dropIndex !== -1) {
                                  const newRecs = [...currentRecs];
                                  newRecs.splice(draggedIndex, 1);
                                  newRecs.splice(dropIndex, 0, draggedId);
                                  handleUpdateStep(step.id, { productRecommendations: newRecs });
                                }
                              }}
                              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/30 shadow-md'
                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 hover:border-amber-300'
                              }`}
                              onClick={() => {
                                const currentRecs = step.productRecommendations || [];
                                const newRecs = isSelected
                                  ? currentRecs.filter(id => id !== product.id)
                                  : [...currentRecs, product.id];
                                handleUpdateStep(step.id, { productRecommendations: newRecs });
                              }}
                            >
                              {/* Drag Handle */}
                              {isSelected && (
                                <div className="cursor-grab active:cursor-grabbing text-amber-400">
                                  <GripVertical size={20} />
                                </div>
                              )}

                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // onClick handles it
                                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />

                              {/* Product Image */}
                              <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package size={24} className="text-gray-300" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                  {product.title}
                                </h5>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {product.description}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-sm font-bold text-amber-600">
                                    {product.currency || '₺'}{product.price.toFixed(2)}
                                  </span>
                                  {isSelected && (
                                    <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                                      #{selectedIndex + 1}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {step.productRecommendations && step.productRecommendations.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl border border-amber-300 dark:border-amber-700">
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                            ✓ {step.productRecommendations.length} ürün seçildi
                          </p>
                        </div>
                      )}
                    </div>

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

          {/* Floating Add Button */}
          <div className="fixed bottom-8 right-8 z-50">
            {/* Mini Menu */}
            {isFloatingMenuOpen && (
              <div className="absolute bottom-20 right-0 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 w-48 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <button
                  onClick={() => handleAddStepFloating('question')}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all flex items-center gap-2"
                >
                  <MessageCircle size={16} />
                  🟣 Soru Adımı Ekle
                </button>
                <button
                  onClick={() => handleAddStepFloating('result')}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all flex items-center gap-2 mt-1"
                >
                  <CheckCircle size={16} />
                  🟢 Sonuç Adımı Ekle
                </button>
              </div>
            )}

            {/* Main Floating Button */}
            <button
              onClick={() => setIsFloatingMenuOpen(!isFloatingMenuOpen)}
              className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center group"
            >
              <Plus
                size={28}
                className={`transition-transform duration-300 ${isFloatingMenuOpen ? 'rotate-45' : 'rotate-0'}`}
              />
            </button>
          </div>

        </div>
      )}

      {/* Floating Action Buttons (Scenario Builder) - Right Side */}
      {isCreating && (
        <div className="fixed bottom-8 right-24 z-40 flex flex-col gap-2">
          {/* Save Button */}
          <button
            onClick={handleSaveScenario}
            className="group w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center"
            title="Senaryoyu Kaydet"
          >
            <Save size={18} className="group-hover:rotate-12 transition-transform" />
          </button>

          {/* Cancel Button */}
          <button
            onClick={() => {
              setIsCreating(false);
              setEditingScenario(null);
            }}
            className="group w-10 h-10 bg-gray-600 text-white rounded-full shadow-lg hover:shadow-gray-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center"
            title="İptal"
          >
            <X size={16} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      )}

    </div>
  );
};
