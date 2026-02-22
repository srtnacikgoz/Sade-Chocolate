import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { MessageCircle, TrendingUp, CheckCircle, Clock, AlertCircle, ChevronDown, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getAnalytics } from '../../../utils/conversationLogger';
import { useNavigate } from 'react-router-dom';

interface ConversationLog {
  id: string;
  sessionId: string;
  language: string;
  flowId?: string;
  detectedPersona?: string;
  startedAt: any;
  endedAt?: any;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: any;
    wasUnderstood?: boolean;
    type?: string;
  }>;
  metadata: {
    totalMessages: number;
    fallbackCount: number;
    completedFlow: boolean;
    duration?: number;
    recommendedProducts?: string[];
  };
  insights?: {
    unrecognizedQuestions: string[];
  };
}

export const ConversationAnalyticsTab: React.FC = () => {
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filterLanguage, setFilterLanguage] = useState<'all' | 'tr' | 'en' | 'ru'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'incomplete'>('all');
  const navigate = useNavigate();

  // Fetch conversation logs
  useEffect(() => {
    const q = query(
      collection(db, 'conversation_logs'),
      orderBy('startedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ConversationLog));
      setLogs(logsData);
    }, (error) => {
      console.error('Error fetching conversation logs:', error);
    });

    return () => unsubscribe();
  }, []);

  // Load analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await getAnalytics();
      setAnalytics(data);
    };

    loadAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesLanguage = filterLanguage === 'all' || log.language === filterLanguage;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'completed' && log.metadata?.completedFlow) ||
      (filterStatus === 'incomplete' && !log.metadata?.completedFlow);
    return matchesLanguage && matchesStatus;
  });

  const handleAddToKnowledgeBase = (question: string) => {
    // Navigate to Knowledge Base tab with pre-filled question
    navigate('/admin?tab=ai-sommelier&subtab=knowledge', {
      state: { prefillQuestion: question }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <MessageCircle className="text-blue-500" /> Konuşma Analizi
        </h2>
        <p className="text-sm text-mocha-500 mt-2">
          Müşteri diyaloglarını analiz edin ve AI'ı geliştirin
        </p>
      </div>

      {/* KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl border border-cream-200 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5">
              <MessageCircle size={24} />
            </div>
            <div className="text-3xl font-semibold leading-none text-mocha-900">
              {analytics.totalConversations}
            </div>
            <div className="text-xs text-mocha-400 font-bold uppercase tracking-wider mt-3">
              Toplam Konuşma
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-cream-200 shadow-sm">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-5">
              <CheckCircle size={24} />
            </div>
            <div className="text-3xl font-semibold leading-none text-mocha-900">
              %{analytics.understandingRate}
            </div>
            <div className="text-xs text-mocha-400 font-bold uppercase tracking-wider mt-3">
              Anlama Oranı
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-cream-200 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-5">
              <TrendingUp size={24} />
            </div>
            <div className="text-3xl font-semibold leading-none text-mocha-900">
              %{analytics.completionRate}
            </div>
            <div className="text-xs text-mocha-400 font-bold uppercase tracking-wider mt-3">
              Tamamlanma Oranı
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-cream-200 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5">
              <Clock size={24} />
            </div>
            <div className="text-3xl font-semibold leading-none text-mocha-900">
              {Math.floor(analytics.averageDuration / 60)}dk
            </div>
            <div className="text-xs text-mocha-400 font-bold uppercase tracking-wider mt-3">
              Ortalama Süre
            </div>
          </div>
        </div>
      )}

      {/* AI Training Insights */}
      {analytics && analytics.topUnrecognizedQuestions.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-amber-900 mb-2">
                🧠 AI Eğitim Önerileri
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                Müşteriler bu soruları soruyor ama AI cevap veremiyor. Bilgi bankasına ekleyerek AI'ı geliştirebilirsiniz.
              </p>
              <div className="space-y-2">
                {analytics.topUnrecognizedQuestions.slice(0, 5).map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-mocha-900">"{item.question}"</p>
                      <p className="text-xs text-mocha-500 mt-1">
                        {item.count} kez soruldu
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddToKnowledgeBase(item.question)}
                      className="ml-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all flex items-center gap-2"
                    >
                      <Plus size={14} /> Bilgi Bankasına Ekle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-cream-200 p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-xs font-bold text-mocha-500 uppercase tracking-wider mb-2 block">
              Dil
            </label>
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value as any)}
              className="px-4 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Tümü</option>
              <option value="tr">🇹🇷 Türkçe</option>
              <option value="en">🇬🇧 English</option>
              <option value="ru">🇷🇺 Русский</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-mocha-500 uppercase tracking-wider mb-2 block">
              Durum
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Tümü</option>
              <option value="completed">✅ Tamamlandı</option>
              <option value="incomplete">⏸️ Yarıda Bırakıldı</option>
            </select>
          </div>

          <div className="ml-auto">
            <div className="text-xs font-bold text-mocha-500 uppercase tracking-wider mb-2">
              Filtrelenmiş
            </div>
            <div className="text-2xl font-semibold text-mocha-900">
              {filteredLogs.length} konuşma
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Feed */}
      <div className="bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-cream-50/30">
          <h3 className="font-bold text-lg">📋 Canlı Konuşma Akışı</h3>
          <p className="text-sm text-mocha-500 mt-1">Son 50 konuşma (anonim)</p>
        </div>

        <div className="divide-y divide-cream-100">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-mocha-400 font-medium">Henüz konuşma kaydı yok</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const isExpanded = expandedLogId === log.id;
              const startDate = log.startedAt?.toDate?.() || new Date();
              const languageFlag = log.language === 'tr' ? '🇹🇷' : log.language === 'en' ? '🇬🇧' : '🇷🇺';
              const statusIcon = log.metadata?.completedFlow ? '✅' : '⏸️';
              const statusColor = log.metadata?.completedFlow ? 'text-green-600' : 'text-mocha-400';

              return (
                <div key={log.id} className="transition-all">
                  <div
                    className="p-6 hover:bg-cream-50/50 cursor-pointer transition-all"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`text-2xl ${statusColor}`}>{statusIcon}</div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-mono text-mocha-400">
                              {format(startDate, 'dd MMM HH:mm', { locale: tr })}
                            </span>
                            <span className="text-lg">{languageFlag}</span>
                            <span className="text-xs font-bold text-mocha-500">
                              {log.metadata?.totalMessages || 0} mesaj
                            </span>
                            {log.metadata?.duration && (
                              <span className="text-xs text-mocha-400">
                                {Math.floor(log.metadata.duration / 60)}dk {log.metadata.duration % 60}s
                              </span>
                            )}
                          </div>
                          {log.detectedPersona && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-bold">
                              {log.detectedPersona}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronDown
                        size={20}
                        className={`text-mocha-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-cream-50/30 border-t border-cream-200 animate-in slide-in-from-top-2 duration-300">
                      <div className="mt-4 space-y-3">
                        {log.messages?.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl ${
                              msg.role === 'user'
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-cream-50 border border-cream-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-mocha-500">
                                {msg.role === 'user' ? '👤 Müşteri' : '🤖 AI'}
                              </span>
                              {msg.role === 'user' && msg.wasUnderstood === false && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                  Anlaşılmadı
                                </span>
                              )}
                              {msg.role === 'assistant' && msg.type === 'fallback' && (
                                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-bold">
                                  Fallback
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">
                              {msg.content}
                            </p>
                          </div>
                        ))}
                      </div>

                      {log.metadata?.recommendedProducts && log.metadata.recommendedProducts.length > 0 && (
                        <div className="mt-4 p-4 bg-green-50 rounded-2xl border border-green-200">
                          <p className="text-xs font-bold text-green-700 mb-2">
                            🎁 Önerilen Ürünler: {log.metadata.recommendedProducts.length} adet
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
