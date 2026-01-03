import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, query, orderBy, serverTimestamp, where, limit } from 'firebase/firestore';
import { Sparkles, X, Send, Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { generateAIResponse } from '../utils/aiResponseGenerator';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import { useTasteProfileStore } from '../stores/tasteProfileStore';
import { useUser } from '../context/UserContext';
import { ConversationFlow, ConversationState } from '../types/conversationFlow';
import { getOrCreateSessionId, startConversationLog, logMessage, completeConversationLog } from '../utils/conversationLogger';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: any;
  recommendations?: string[]; // Product IDs for recommendations
}

interface AIConfig {
  persona: {
    greeting: string;
    expertise: string;
  };
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [guidingQuestions, setGuidingQuestions] = useState<any[]>([]);
  const [conversationFlows, setConversationFlows] = useState<ConversationFlow[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [sessionId] = useState(() => getOrCreateSessionId()); // ✨ localStorage'dan session ID
  const [conversationLogId, setConversationLogId] = useState<string | null>(null); // ✨ Analytics log ID
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { products } = useProducts();
  const { language } = useLanguage();
  const { user } = useUser();
  const { profile: tasteProfile, loadProfile } = useTasteProfileStore();
  const navigate = useNavigate();

  // ✨ Tadım profili yükle (kullanıcı giriş yapmışsa)
  useEffect(() => {
    if (user?.uid && !tasteProfile) {
      loadProfile(user.uid);
    }
  }, [user?.uid, tasteProfile, loadProfile]);

  // Fetch AI Config
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'settings'), (snapshot) => {
      const settings = snapshot.docs.find(doc => doc.id === 'ai');
      if (settings?.exists()) {
        setAiConfig(settings.data() as AIConfig);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Knowledge Base
  useEffect(() => {
    const q = query(collection(db, 'ai_knowledge_base'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setKnowledgeBase(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Fetch Guiding Questions
  useEffect(() => {
    const q = query(collection(db, 'ai_guiding_questions'), orderBy('createdAt', 'desc'), limit(6));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGuidingQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Fetch Conversation Flows
  useEffect(() => {
    const q = query(collection(db, 'conversation_flows'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConversationFlows(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConversationFlow)));
    });
    return () => unsubscribe();
  }, []);

  // Load conversation history for this session
  useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, 'ai_conversations'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);

      // İlk açılışta greeting mesajı yoksa ekle
      if (msgs.length === 0 && aiConfig?.persona?.greeting) {
        handleSendMessage(aiConfig.persona.greeting, 'assistant', true);
      }
    });

    return () => unsubscribe();
  }, [isOpen, sessionId, aiConfig]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string, role: 'user' | 'assistant' = 'user', skipResponse = false) => {
    if (!content.trim()) return;

    try {
      // ✨ İlk mesajda conversation log başlat
      let currentLogId = conversationLogId;
      if (!currentLogId && role === 'user') {
        currentLogId = await startConversationLog(sessionId, language);
        setConversationLogId(currentLogId);
      }

      // Mesajı Firestore'a kaydet
      await addDoc(collection(db, 'ai_conversations'), {
        sessionId,
        role,
        content: content.trim(),
        timestamp: serverTimestamp(),
      });

      if (role === 'user' && !skipResponse) {
        setIsLoading(true);

        // AI yanıtı üret (tadım profili ile kişiselleştirilmiş)
        const response: any = await generateAIResponse(
          content.trim(),
          messages,
          { aiConfig, knowledgeBase, products, conversationFlows, conversationState, currentLanguage: language, tasteProfile }
        );

        // ✨ User mesajını logla
        const isFallback = typeof response === 'string' && response.includes('yardımcı olmak isterim');
        if (currentLogId) {
          await logMessage(currentLogId, {
            role: 'user',
            content: content.trim(),
            wasUnderstood: !isFallback,
            triggeredFlow: response.flowState?.flowId,
            flowState: response.flowState
          });
        }

        // Flow state'i güncelle (eğer varsa)
        let flowCompleted = false;
        if (response.flowState) {
          if (response.flowState.nextStepId) {
            setConversationState({
              flowId: response.flowState.flowId,
              currentStepId: response.flowState.nextStepId,
              history: [
                ...(conversationState?.history || []),
                {
                  stepId: conversationState?.currentStepId || '',
                  question: conversationState?.currentStepId ? messages[messages.length - 1]?.content || '' : '',
                  answer: content.trim()
                }
              ],
              // ✨ Metadata tetikleyicileri
              giftModeActive: response.flowState.giftModeActive || conversationState?.giftModeActive,
              detectedPersona: response.flowState.detectedPersona || conversationState?.detectedPersona,
              accumulatedSensory: response.flowState.accumulatedSensory
            });
          } else {
            // Flow sona erdi, state'i temizle
            flowCompleted = true;
            setConversationState(null);

            // ✨ Flow tamamlandı, log'u güncelle
            if (currentLogId) {
              await completeConversationLog(currentLogId, {
                completedFlow: true,
                flowId: response.flowState.flowId,
                detectedPersona: response.flowState.detectedPersona,
                accumulatedSensory: response.flowState.accumulatedSensory,
                recommendedProducts: response.recommendations || []
              });
            }
          }
        }

        // AI yanıtını kaydet (string kısmını al)
        const responseText = typeof response === 'string' ? response : response.toString();
        const messageData: any = {
          sessionId,
          role: 'assistant',
          content: responseText,
          timestamp: serverTimestamp(),
        };

        // Ürün önerileri varsa ekle
        if (response.recommendations && Array.isArray(response.recommendations)) {
          messageData.recommendations = response.recommendations;
        }

        await addDoc(collection(db, 'ai_conversations'), messageData);

        // ✨ Assistant mesajını logla
        if (currentLogId) {
          await logMessage(currentLogId, {
            role: 'assistant',
            content: responseText,
            type: isFallback ? 'fallback' : (response.flowState ? 'flow-response' : 'knowledge-base')
          });
        }

        setIsLoading(false);
      }

      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('AI yanıt veremiyor', {
        description: 'İnternet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.',
        action: {
          label: 'Tekrar Dene',
          onClick: handleRetry
        }
      });
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
  };

  // Keyboard navigation: ESC tuşu ile kapat
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        handleSendMessage(lastUserMessage.content);
      }
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setConversationState(null); // Chat açılınca state'i temizle
          }}
          aria-label="AI Sommelier çikolata danışmanını aç"
          aria-haspopup="dialog"
          className="fixed bottom-24 right-6 z-50 w-16 h-16 bg-gradient-to-br from-gold to-amber-600 text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-gold/50 transition-all duration-500 flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-gold/30"
        >
          <Sparkles className="w-7 h-7 group-hover:rotate-180 transition-transform duration-700" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-end p-4 pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-sommelier-title"
          aria-describedby="ai-sommelier-description"
        >
          <div className="w-full max-w-md h-[600px] bg-white dark:bg-dark-800 rounded-[40px] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col pointer-events-auto animate-in slide-in-from-bottom-8 duration-500">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gold to-amber-600 rounded-full flex items-center justify-center" aria-hidden="true">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 id="ai-sommelier-title" className="font-display text-xl font-bold text-brown-900 dark:text-white">AI Sommelier</h3>
                  <p id="ai-sommelier-description" className="text-xs text-gray-400">Çikolata Danışmanınız</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="AI Sommelier'i kapat (ESC tuşu ile de kapatabilirsiniz)"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-6 space-y-4"
              role="log"
              aria-live="polite"
              aria-label="Konuşma geçmişi"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  role="article"
                  aria-label={`${msg.role === 'user' ? 'Siz' : 'AI Sommelier'} tarafından gönderilen mesaj`}
                >
                  <div
                    className={`max-w-[80%] px-5 py-3 rounded-[20px] ${
                      msg.role === 'user'
                        ? 'bg-gold text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-dark-900 text-gray-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Product Recommendations */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-3 space-y-2 max-w-[90%]" role="list" aria-label="Önerilen ürünler">
                      {msg.recommendations.map((productId) => {
                        const product = products.find(p => p.id === productId);
                        if (!product) return null;

                        return (
                          <button
                            key={productId}
                            onClick={() => {
                              setIsOpen(false);
                              navigate(`/product/${productId}`);
                            }}
                            aria-label={`${product.title} ürününü görüntüle - ${product.currency || '₺'}${product.price.toFixed(2)}`}
                            className="w-full flex items-center gap-3 bg-white dark:bg-dark-800 border border-gold/20 rounded-xl p-3 cursor-pointer hover:shadow-lg hover:border-gold/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30"
                            role="listitem"
                          >
                            <img
                              src={product.image}
                              alt=""
                              className="w-16 h-16 object-cover rounded-lg"
                              aria-hidden="true"
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="font-display text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {product.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {product.description}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-sm font-bold text-gold">
                                  {product.currency || '₺'}{product.price.toFixed(2)}
                                </span>
                                <ShoppingBag size={14} className="text-gold" aria-hidden="true" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-dark-900 px-5 py-3 rounded-[20px] rounded-bl-none">
                    <Loader2 className="w-5 h-5 animate-spin text-gold" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Guiding Questions */}
            {messages.length <= 2 && guidingQuestions.length > 0 && (
              <div className="px-6 pb-4" role="complementary" aria-label="Örnek sorular">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Örnek Sorular:</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Hızlı soru seçenekleri">
                  {guidingQuestions.slice(0, 3).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQuestionClick(q.text)}
                      aria-label={`"${q.text}" sorusunu sor`}
                      className="px-4 py-2 bg-gray-50 dark:bg-dark-900/50 text-xs text-gray-600 dark:text-gray-300 rounded-full hover:bg-gold/10 hover:text-gold transition-all focus:outline-none focus:ring-2 focus:ring-gold/30"
                    >
                      {q.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-700">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isLoading && input.trim()) {
                    handleSendMessage(input);
                  }
                }}
                className="flex gap-3"
              >
                <label htmlFor="ai-message-input" className="sr-only">
                  AI Sommelier'e mesajınızı yazın
                </label>
                <input
                  id="ai-message-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  disabled={isLoading}
                  aria-label="Mesaj yazın"
                  aria-describedby="ai-input-help"
                  className="flex-1 px-5 py-3 bg-gray-50 dark:bg-dark-900 border-none rounded-full text-sm focus:ring-2 focus:ring-gold/20 outline-none disabled:opacity-50"
                />
                <span id="ai-input-help" className="sr-only">
                  Enter tuşuna basarak veya gönder butonuna tıklayarak mesajınızı gönderebilirsiniz
                </span>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  aria-label={isLoading ? 'Mesaj gönderiliyor' : 'Mesajı gönder'}
                  className="w-12 h-12 bg-gold text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
