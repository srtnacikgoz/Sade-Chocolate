import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// ✨ Session ID yönetimi (Browser localStorage)
export const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('ai-session-id');

  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('ai-session-id', sessionId);
  }

  return sessionId;
};

// ✨ Yeni konuşma başlat (ilk mesajda çağrılır)
export const startConversationLog = async (
  sessionId: string,
  language: 'tr' | 'en' | 'ru' = 'tr'
): Promise<string> => {
  try {
    const logRef = await addDoc(collection(db, 'conversation_logs'), {
      sessionId,
      userId: null, // Anonim (Auth eklenirse buraya UID gelir)
      language,
      startedAt: serverTimestamp(),
      messages: [],
      metadata: {
        totalMessages: 0,
        fallbackCount: 0,
        completedFlow: false
      },
      insights: {
        unrecognizedQuestions: []
      }
    });

    return logRef.id;
  } catch (error) {
    console.error('Error starting conversation log:', error);
    return '';
  }
};

// ✨ Mesaj ekle
export const logMessage = async (
  logId: string,
  message: {
    role: 'user' | 'assistant';
    content: string;
    wasUnderstood?: boolean; // Sadece user mesajları için
    triggeredFlow?: string;
    flowState?: any;
    type?: 'flow-response' | 'fallback' | 'knowledge-base'; // Sadece assistant için
  }
) => {
  if (!logId) return;

  try {
    const logRef = doc(db, 'conversation_logs', logId);

    // Firestore'dan mevcut log'u al
    const logDoc = await getDocs(query(collection(db, 'conversation_logs'), where('__name__', '==', logId)));

    if (logDoc.empty) return;

    const currentData = logDoc.docs[0].data();
    const currentMessages = currentData.messages || [];

    const newMessage = {
      role: message.role,
      content: message.content,
      timestamp: Timestamp.now(),
      ...(message.role === 'user' && {
        wasUnderstood: message.wasUnderstood ?? true,
        triggeredFlow: message.triggeredFlow
      }),
      ...(message.role === 'assistant' && {
        type: message.type || 'flow-response'
      })
    };

    // Metadata güncelleme
    const isFallback = message.type === 'fallback';
    const newMetadata = {
      ...currentData.metadata,
      totalMessages: (currentData.metadata?.totalMessages || 0) + 1,
      fallbackCount: (currentData.metadata?.fallbackCount || 0) + (isFallback ? 1 : 0)
    };

    // Anlaşılmayan soruları topla
    const newInsights = { ...currentData.insights };
    if (message.role === 'user' && message.wasUnderstood === false) {
      const unrecognized = newInsights.unrecognizedQuestions || [];
      if (!unrecognized.includes(message.content)) {
        unrecognized.push(message.content);
        newInsights.unrecognizedQuestions = unrecognized;
      }
    }

    await updateDoc(logRef, {
      messages: [...currentMessages, newMessage],
      metadata: newMetadata,
      insights: newInsights,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging message:', error);
  }
};

// ✨ Konuşmayı tamamla
export const completeConversationLog = async (
  logId: string,
  completionData: {
    completedFlow?: boolean;
    flowId?: string;
    detectedPersona?: string;
    accumulatedSensory?: any;
    recommendedProducts?: string[];
    droppedAtStep?: string;
  }
) => {
  if (!logId) return;

  try {
    const logRef = doc(db, 'conversation_logs', logId);

    // Süreyi hesapla
    const logDoc = await getDocs(query(collection(db, 'conversation_logs'), where('__name__', '==', logId)));
    if (logDoc.empty) return;

    const currentData = logDoc.docs[0].data();
    const startTime = currentData.startedAt?.toDate?.() || new Date();
    const duration = Math.floor((Date.now() - startTime.getTime()) / 1000); // saniye

    await updateDoc(logRef, {
      flowId: completionData.flowId,
      detectedPersona: completionData.detectedPersona,
      endedAt: serverTimestamp(),
      'metadata.duration': duration,
      'metadata.completedFlow': completionData.completedFlow || false,
      'metadata.droppedAtStep': completionData.droppedAtStep,
      'metadata.accumulatedSensory': completionData.accumulatedSensory,
      'metadata.recommendedProducts': completionData.recommendedProducts || []
    });
  } catch (error) {
    console.error('Error completing conversation log:', error);
  }
};

// ✨ Analytics: Metrikleri hesapla
export const getAnalytics = async (
  dateRange?: { start: Date; end: Date }
): Promise<{
  totalConversations: number;
  averageDuration: number;
  understandingRate: number;
  completionRate: number;
  topUnrecognizedQuestions: Array<{ question: string; count: number }>;
  personaDistribution: { [key: string]: number };
  flowDropOffPoints: Array<{ flowId: string; stepId: string; count: number }>;
}> => {
  try {
    let q = query(collection(db, 'conversation_logs'));

    // Tarih filtresi
    if (dateRange) {
      q = query(
        collection(db, 'conversation_logs'),
        where('startedAt', '>=', Timestamp.fromDate(dateRange.start)),
        where('startedAt', '<=', Timestamp.fromDate(dateRange.end))
      );
    }

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => doc.data());

    // Temel metrikler
    const totalConversations = logs.length;
    const totalDuration = logs.reduce((sum, log) => sum + (log.metadata?.duration || 0), 0);
    const averageDuration = totalConversations > 0 ? Math.floor(totalDuration / totalConversations) : 0;

    // Anlama oranı (wasUnderstood=true mesaj sayısı / toplam user mesajı)
    let totalUserMessages = 0;
    let understoodMessages = 0;
    logs.forEach(log => {
      log.messages?.forEach((msg: any) => {
        if (msg.role === 'user') {
          totalUserMessages++;
          if (msg.wasUnderstood !== false) understoodMessages++;
        }
      });
    });
    const understandingRate = totalUserMessages > 0 ? Math.floor((understoodMessages / totalUserMessages) * 100) : 0;

    // Tamamlanma oranı
    const completedFlows = logs.filter(log => log.metadata?.completedFlow).length;
    const completionRate = totalConversations > 0 ? Math.floor((completedFlows / totalConversations) * 100) : 0;

    // En çok sorulan anlaşılmayan sorular
    const unrecognizedMap: { [key: string]: number } = {};
    logs.forEach(log => {
      log.insights?.unrecognizedQuestions?.forEach((q: string) => {
        unrecognizedMap[q] = (unrecognizedMap[q] || 0) + 1;
      });
    });
    const topUnrecognizedQuestions = Object.entries(unrecognizedMap)
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Persona dağılımı
    const personaDistribution: { [key: string]: number } = {};
    logs.forEach(log => {
      const persona = log.detectedPersona || 'unknown';
      personaDistribution[persona] = (personaDistribution[persona] || 0) + 1;
    });

    // Drop-off noktaları
    const dropOffMap: { [key: string]: number } = {};
    logs.forEach(log => {
      if (log.metadata?.droppedAtStep && log.flowId) {
        const key = `${log.flowId}:${log.metadata.droppedAtStep}`;
        dropOffMap[key] = (dropOffMap[key] || 0) + 1;
      }
    });
    const flowDropOffPoints = Object.entries(dropOffMap)
      .map(([key, count]) => {
        const [flowId, stepId] = key.split(':');
        return { flowId, stepId, count };
      })
      .sort((a, b) => b.count - a.count);

    return {
      totalConversations,
      averageDuration,
      understandingRate,
      completionRate,
      topUnrecognizedQuestions,
      personaDistribution,
      flowDropOffPoints
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return {
      totalConversations: 0,
      averageDuration: 0,
      understandingRate: 0,
      completionRate: 0,
      topUnrecognizedQuestions: [],
      personaDistribution: {},
      flowDropOffPoints: []
    };
  }
};
