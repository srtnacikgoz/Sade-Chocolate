import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Type, Package, BrainCircuit, MessageSquare, BookOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BrandIcon } from '../../ui/BrandIcon';

interface SommelierTabProps {
  aiConfig: any;
  setAiConfig: (config: any) => void;
}

type SommelierSubTab = 'persona' | 'knowledgeBase' | 'questions';

export const SommelierTab: React.FC<SommelierTabProps> = ({ aiConfig, setAiConfig }) => {
  const [activeSubTab, setActiveSubTab] = useState<SommelierSubTab>('persona');
  
  const [knowledgeBaseItems, setKnowledgeBaseItems] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({ type: 'Soru-Cevap', key: '', value: '' });

  const [guidingQuestions, setGuidingQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');

  // Fetch Knowledge Base items from Firestore
  useEffect(() => {
    const q = query(collection(db, 'ai_knowledge_base'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setKnowledgeBaseItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching knowledge base:", error);
      toast.error("Bilgi bankası yüklenemedi.");
    });
    return () => unsubscribe();
  }, []);

  // Fetch Guiding Questions from Firestore
  useEffect(() => {
    const q = query(collection(db, 'ai_guiding_questions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGuidingQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching guiding questions:", error);
      toast.error("Yönlendirici sorular yüklenemedi.");
    });
    return () => unsubscribe();
  }, []);

  const handleAddRule = async () => {
    if (!newRule.key || !newRule.value) {
      toast.error('Anahtar ve Değer alanları boş bırakılamaz.');
      return;
    }
    try {
      await addDoc(collection(db, 'ai_knowledge_base'), {
        ...newRule,
        createdAt: serverTimestamp(),
      });
      toast.success('Yeni kural bilgi bankasına eklendi.');
      setNewRule({ type: 'Soru-Cevap', key: '', value: '' });
    } catch (error) {
      toast.error('Kural eklenirken bir hata oluştu.');
      console.error("Error adding rule: ", error);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ai_knowledge_base', id));
      toast.success('Kural silindi.');
    } catch (error) {
      toast.error('Kural silinirken bir hata oluştu.');
      console.error("Error deleting rule: ", error);
    }
  };
  
  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      toast.error('Soru alanı boş bırakılamaz.');
      return;
    }
    try {
      await addDoc(collection(db, 'ai_guiding_questions'), {
        text: newQuestion,
        createdAt: serverTimestamp(),
      });
      toast.success('Yeni soru eklendi.');
      setNewQuestion('');
    } catch (error) {
      toast.error('Soru eklenirken bir hata oluştu.');
      console.error("Error adding question: ", error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ai_guiding_questions', id));
      toast.success('Soru silindi.');
    } catch (error) {
      toast.error('Soru silinirken bir hata oluştu.');
      console.error("Error deleting question: ", error);
    }
  };

  const renderContent = () => {
    switch (activeSubTab) {
      case 'persona':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200/60 p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl"><Type size={26} /></div>
                <span className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">AI Kişiliği (Persona)</span>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Selamlama Mesajı</label>
                  <textarea 
                    value={aiConfig.persona?.greeting || ''} 
                    onChange={(e) => setAiConfig({...aiConfig, persona: {...aiConfig.persona, greeting: e.target.value}})}
                    className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-2xl p-5 text-sm italic focus:ring-2 focus:ring-purple-500/20 outline-none text-gray-900 dark:text-white" 
                    rows={3} 
                    placeholder="Merhaba! Ben Sade'nin çikolata sommelieriyim..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Uzmanlık & Davranış Talimatı</label>
                  <textarea 
                    value={aiConfig.persona?.expertise || ''} 
                    onChange={(e) => setAiConfig({...aiConfig, persona: {...aiConfig.persona, expertise: e.target.value}})}
                    className="w-full bg-slate-50 dark:bg-dark-900 border-none rounded-2xl p-5 text-sm leading-relaxed focus:ring-2 focus:ring-purple-500/20 outline-none text-gray-900 dark:text-white" 
                    rows={20} 
                    placeholder="Sen dünyanın en iyi artisan çikolata uzmanısın..."
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12"><Package size={120} /></div>
              <div>
                <h3 className="text-2xl font-display font-bold italic mb-8">AI Sommelier Önizlemesi</h3>
                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl rounded-tl-none border border-white/10">
                    <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest mb-2">Asistan Karşılaması:</p>
                    <p className="text-sm italic opacity-90">"{aiConfig.persona?.greeting || '...'}"</p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 max-h-[400px] overflow-y-auto">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-3">Aktif Zeka Modeli</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono opacity-80 whitespace-pre-wrap">{aiConfig.persona?.expertise || '...'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">İpucu: Bu bilgiler AI'ya "System Instruction" olarak gönderilir.</p>
              </div>
            </div>
          </div>
        );
      case 'knowledgeBase':
        return (
          <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200/60 p-10 shadow-sm animate-in fade-in duration-500">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><BookOpen className="text-purple-500" /> Bilgi Bankası</h3>
            <div className="mb-8 p-6 bg-slate-50 dark:bg-dark-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kural Tipi</label>
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule({...newRule, type: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                  >
                    <option>Soru-Cevap</option>
                    <option>Eşleştirme</option>
                    <option>Yasaklı Kelime</option>
                    <option>Marka Hikayesi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    {newRule.type === 'Soru-Cevap' ? 'Soru' : 'Anahtar'}
                  </label>
                  <input
                    type="text"
                    placeholder={newRule.type === 'Soru-Cevap' ? 'Örn: Sevgilime ne alsam?' : 'Örn: %85 Ecuador'}
                    value={newRule.key}
                    onChange={(e) => setNewRule({...newRule, key: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    {newRule.type === 'Soru-Cevap' ? 'Cevap' : 'Değer'}
                  </label>
                  <input
                    type="text"
                    placeholder={newRule.type === 'Soru-Cevap' ? 'Örn: Sevgiliniz için özel kutularımızı öneriyorum...' : 'Örn: Cabernet Sauvignon'}
                    value={newRule.value}
                    onChange={(e) => setNewRule({...newRule, value: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>
              </div>
              <button 
                onClick={handleAddRule}
                className="mt-4 w-full px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all"
              >
                Yeni Kural Ekle
              </button>
            </div>
            <div className="space-y-3">
              {knowledgeBaseItems.map(item => (
                <div key={item.id} className="p-4 bg-gray-50 dark:bg-dark-900/50 rounded-xl flex items-center justify-between group">
                  <div>
                    <span className="text-xs font-bold text-purple-500 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md">{item.type}</span>
                    <p className="mt-2 text-sm font-mono text-gray-800 dark:text-gray-200">
                      <strong className="text-black dark:text-white">{item.key}:</strong> {item.value}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteRule(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'questions':
        return (
          <div className="bg-white dark:bg-dark-800 rounded-[48px] border border-gray-200/60 p-10 shadow-sm animate-in fade-in duration-500">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><MessageSquare className="text-purple-500" /> Yönlendirici Sorular</h3>
            <div className="mb-8 p-6 bg-slate-50 dark:bg-dark-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Yeni Soru Ekle</label>
              <div className="flex gap-4">
                <input 
                  type="text"
                  placeholder="AI'nın soracağı soruyu buraya girin..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="flex-1 w-full px-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                />
                <button 
                  onClick={handleAddQuestion}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all"
                >
                  Soru Ekle
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {guidingQuestions.map(item => (
                <div key={item.id} className="p-4 bg-gray-50 dark:bg-dark-900/50 rounded-xl flex items-center justify-between group">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {item.text}
                  </p>
                  <button 
                    onClick={() => handleDeleteQuestion(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Sommelier Aktif/Deaktif Toggle */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl border-2 border-purple-200 dark:border-purple-700/50">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${aiConfig.enabled ? 'bg-purple-600' : 'bg-gray-400'} transition-colors`}>
            <BrandIcon className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">AI Sommelier Durumu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {aiConfig.enabled
                ? '✅ Aktif - Müşteriler AI asistanı görebilir'
                : '⛔ Deaktif - AI asistan gizli (geliştirme modu)'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setAiConfig({...aiConfig, enabled: !aiConfig.enabled})}
          className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
            aiConfig.enabled ? 'bg-purple-600' : 'bg-gray-400'
          }`}
        >
          <span
            className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform ${
              aiConfig.enabled ? 'translate-x-11' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex justify-center gap-2 bg-slate-100 dark:bg-dark-900/50 p-2 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('persona')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeSubTab === 'persona' ? 'bg-white dark:bg-dark-800 shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BrainCircuit size={16} /> Persona
        </button>
        <button
          onClick={() => setActiveSubTab('knowledgeBase')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeSubTab === 'knowledgeBase' ? 'bg-white dark:bg-dark-800 shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BookOpen size={16} /> Bilgi Bankası
        </button>
        <button
          onClick={() => setActiveSubTab('questions')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all ${activeSubTab === 'questions' ? 'bg-white dark:bg-dark-800 shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <MessageSquare size={16} /> Sorular
        </button>
      </div>

      {/* Content */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
};