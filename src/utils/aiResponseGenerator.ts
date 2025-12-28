import { Product } from '../types';
import { ConversationFlow, ConversationState, LocalizedString } from '../types/conversationFlow';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIContext {
  aiConfig: any;
  knowledgeBase: any[];
  products: Product[];
  conversationFlows?: ConversationFlow[];
  conversationState?: ConversationState | null;
  currentLanguage?: 'tr' | 'en' | 'ru'; // ✨ Aktif dil bilgisi
}

// ✨ YARDIMCI: Mevcut dile göre metni döndürür (Default: 'tr')
const getLocaleText = (text: LocalizedString | string | undefined, lang: string = 'tr'): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[lang as keyof LocalizedString] || text['tr'];
};

// Türkçe karakterleri normalize eden yardımcı fonksiyon
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
};

// Mesajda belirli anahtar kelimeleri arama
const containsKeywords = (text: string, keywords: string[]): boolean => {
  const normalized = normalizeText(text);
  return keywords.some(keyword => normalized.includes(normalizeText(keyword)));
};

// Hediye ile ilgili sorular
const isGiftRelated = (text: string): boolean => {
  return containsKeywords(text, [
    'hediye', 'armağan', 'gift', 'sevgiliye', 'anneye', 'babaya',
    'arkadaşa', 'doğum günü', 'yıldönümü', 'valentine',
    'anneler günü', 'babalar günü', 'özel gün'
  ]);
};

// ✨ SMART ENTRY: İlk mesajı seçeneklerle otomatik eşleştir
// Stopwords: Genel sıfatlar, kullanıcı ismini kastetmiyor
// NOT: "sevgili" kaldırıldı - seçeneklerde "sevgilim" var!
const STOPWORDS = ['değerli', 'canım', 'tatlım', 'güzel', 'yakın', 'iyi', 'bir'];

// ✨ Target Label Temizleme: "için" tekrarını önle
const cleanTargetLabel = (label: string): string => {
  return label
    .replace(/\s+için\.?\s*$/i, '') // Son "için"ü kaldır (noktalı veya noktalı olmayan)
    .replace(/^değerli bir /i, '') // Başındaki "değerli bir"
    .replace(/^hayat arkadaşım veya /i, '') // "hayat arkadaşım veya" → "sevgilim"
    .replace(/\.+$/, '') // Sondaki fazla noktaları temizle
    .trim();
};

const findSmartEntry = (
  flow: ConversationFlow,
  userMessage: string,
  lang: string = 'tr'
): string | null => {
  const startStep = flow.steps.find(s => s.id === flow.startStepId);
  if (!startStep || startStep.type !== 'question' || !startStep.options) return null;

  const normalized = normalizeText(userMessage);

  // Tüm seçenekleri eşleştir
  const matches = startStep.options
    .map(opt => {
      const label = normalizeText(getLocaleText(opt.label, lang));
      const words = label.split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.includes(w));

      // Her kelimeyi kontrol et
      const matchedWords = words.filter(word => normalized.includes(word));

      return {
        option: opt,
        matchCount: matchedWords.length,
        longestMatch: matchedWords.length > 0 ? Math.max(...matchedWords.map(w => w.length)) : 0,
        label: label
      };
    })
    .filter(m => m.matchCount > 0);

  if (matches.length === 0) return null;

  // Çoklu eşleşme varsa: En spesifik kelimeye öncelik ver
  // 1. En çok kelime eşleşeni
  // 2. Eşitlik varsa, en uzun kelimeyi
  matches.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    return b.longestMatch - a.longestMatch;
  });

  return matches[0].option.nextStepId;
};

// Ürün öneri sorguları
const isProductRecommendation = (text: string): boolean => {
  return containsKeywords(text, [
    'öneri', 'öner', 'tavsiye', 'hangi', 'ne alsam', 'seçemiyorum',
    'karar veremedim', 'yardım', 'arıyorum', 'istiyorum'
  ]);
};

// Fiyat/bütçe sorguları
const isBudgetRelated = (text: string): boolean => {
  return containsKeywords(text, [
    'fiyat', 'ucuz', 'pahalı', 'bütçe', 'ekonomik', 'uygun',
    'kaç lira', 'ne kadar', 'tl'
  ]);
};

// Lezzet profili sorguları
const isTasteRelated = (text: string): boolean => {
  return containsKeywords(text, [
    'tat', 'lezzet', 'acı', 'tatlı', 'sütlü', 'bitter', 'dark',
    'beyaz', 'profil', 'kakao', '%', 'yoğun', 'hafif'
  ]);
};

// İçerik/alerjen sorguları
const isIngredientRelated = (text: string): boolean => {
  return containsKeywords(text, [
    'içerik', 'malzeme', 'alerjen', 'fındık', 'badem', 'süt',
    'gluten', 'vegan', 'şeker', 'katkı'
  ]);
};

// Kapsam kontrolü (çikolata ile ilgili mi?)
const isRelevantToChocolate = (text: string): boolean => {
  const relevantKeywords = [
    // Çikolata ile doğrudan ilgili
    'çikolata', 'chocolate', 'kakao', 'cocoa',
    // Ürün tipleri
    'tablet', 'truffle', 'praline', 'bonbon', 'bar',
    // Hediye/Alışveriş
    'hediye', 'armağan', 'gift', 'almak', 'satın', 'sipariş', 'ürün',
    // Tat profili
    'bitter', 'dark', 'milk', 'sütlü', 'white', 'beyaz', 'tat', 'lezzet',
    // Fiyat/Alışveriş
    'fiyat', 'bütçe', 'tl', 'lira', 'ucuz', 'pahalı', 'kampanya',
    // Genel sorular
    'öneri', 'tavsiye', 'hangi', 'ne', 'öner'
  ];

  return containsKeywords(text, relevantKeywords);
};

// Ürünleri filtrele ve öner
const recommendProducts = (
  products: Product[],
  criteria: {
    isGift?: boolean;
    maxPrice?: number;
    category?: string;
    taste?: string;
  }
): Product[] => {
  let filtered = [...products];

  // Stokta olmayanları filtrele
  filtered = filtered.filter(p => !p.isOutOfStock);

  // Fiyat filtresi
  if (criteria.maxPrice) {
    filtered = filtered.filter(p => p.price <= criteria.maxPrice);
  }

  // Kategori filtresi
  if (criteria.category) {
    filtered = filtered.filter(p =>
      normalizeText(p.category || '').includes(normalizeText(criteria.category || ''))
    );
  }

  // En fazla 3 ürün döndür, fiyata göre sırala
  return filtered
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);
};

// Bilgi bankasından ilgili kuralları bul
const findRelevantKnowledge = (text: string, knowledgeBase: any[]): any[] => {
  return knowledgeBase.filter(item =>
    normalizeText(text).includes(normalizeText(item.key))
  );
};

// Soru-Cevap çiftlerini bul (daha esnek eşleşme)
const findQuestionAnswer = (text: string, knowledgeBase: any[]): any | null => {
  const normalized = normalizeText(text);

  // Önce tam eşleşme ara
  const exactMatch = knowledgeBase.find(item =>
    item.type === 'Soru-Cevap' && normalizeText(item.key) === normalized
  );
  if (exactMatch) return exactMatch;

  // Sonra kısmi eşleşme ara (soru içinde geçen anahtar kelimeler)
  const partialMatch = knowledgeBase.find(item => {
    if (item.type !== 'Soru-Cevap') return false;
    const questionKeywords = normalizeText(item.key).split(' ').filter(w => w.length > 3);
    return questionKeywords.some(keyword => normalized.includes(keyword));
  });

  return partialMatch || null;
};

// ✨ SENSORY SCORING: Ürünün kullanıcının duyusal profiliyle ne kadar eşleştiğini hesapla
const calculateSensoryMatch = (product: Product, accumulatedSensory: any): number => {
  // Basit eşleştirme mantığı: Ürün başlığı ve açıklamasından anahtar kelimelere göre puan ver
  // Gerçek uygulamada, Product tipine sensoryProfile alanı eklenebilir

  const text = `${product.title} ${product.detailedDescription || ''}`.toLowerCase();
  let score = 0;

  // Yoğunluk (intensity)
  if (accumulatedSensory.intensity > 0) {
    if (text.includes('dark') || text.includes('bitter') || text.includes('%70') || text.includes('%80') || text.includes('%85')) {
      score += accumulatedSensory.intensity * 10;
    }
  }

  // Tatlılık (sweetness)
  if (accumulatedSensory.sweetness > 0) {
    if (text.includes('milk') || text.includes('sütlü') || text.includes('sweet') || text.includes('tatlı')) {
      score += accumulatedSensory.sweetness * 10;
    }
  }

  // Kremalılık (creaminess)
  if (accumulatedSensory.creaminess > 0) {
    if (text.includes('cremeux') || text.includes('kremalı') || text.includes('smooth') || text.includes('yumuşak')) {
      score += accumulatedSensory.creaminess * 10;
    }
  }

  // Meyvemsilik (fruitiness)
  if (accumulatedSensory.fruitiness > 0) {
    if (text.includes('fruity') || text.includes('meyveli') || text.includes('berry') || text.includes('citrus')) {
      score += accumulatedSensory.fruitiness * 10;
    }
  }

  // Ekşilik (acidity)
  if (accumulatedSensory.acidity > 0) {
    if (text.includes('tangy') || text.includes('citrus') || text.includes('ekşi')) {
      score += accumulatedSensory.acidity * 10;
    }
  }

  // Çıtırlık (crunch)
  if (accumulatedSensory.crunch > 0) {
    if (text.includes('crunchy') || text.includes('fındık') || text.includes('badem') || text.includes('hazelnut') || text.includes('almond')) {
      score += accumulatedSensory.crunch * 10;
    }
  }

  return score;
};

// Conversation Flow Helpers
const findMatchingFlow = (text: string, flows: ConversationFlow[] = []): ConversationFlow | null => {
  const normalized = normalizeText(text);

  return flows.find(flow => {
    if (!flow.active) return false;

    // Virgüllerle ayrılmış tetikleyici kelimeleri/cümleleri ayır ve temizle
    const triggers = flow.trigger
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Her bir tetikleyiciyi kontrol et
    return triggers.some(trigger => {
      const normalizedTrigger = normalizeText(trigger);

      // Eğer trigger birden fazla kelimeden oluşuyorsa, hepsinin geçmesi gerekli
      const triggerWords = normalizedTrigger.split(/\s+/).filter(w => w.length > 2);

      if (triggerWords.length === 1) {
        // Tek kelime: direkt eşleşme ara
        return normalized.includes(triggerWords[0]);
      } else {
        // Çok kelimeli: tüm kelimelerin geçmesi gerekli
        return triggerWords.every(word => normalized.includes(word));
      }
    });
  }) || null;
};

// ✨ GÜNCEL: Akış Adımını İşleme (Çok Dilli ve Metadata Destekli)
const processFlowStep = (
  flow: ConversationFlow,
  currentStepId: string,
  lang: string = 'tr',
  accumulatedSensory?: any,
  products?: Product[]
): {
  message: string;
  nextStepId: string | null;
  isComplete: boolean;
  metadata?: any;
  recommendations?: string[];
  giftModeActive?: boolean;
} => {
  const step = flow.steps.find(s => s.id === currentStepId);

  if (!step) {
    const errorMessages = {
      tr: 'Bir hata oluştu, lütfen tekrar deneyin.',
      en: 'An error occurred, please try again.',
      ru: 'Произошла ошибка, попробуйте снова.'
    };
    return { message: errorMessages[lang as keyof typeof errorMessages] || errorMessages.tr, nextStepId: null, isComplete: true };
  }

  if (step.type === 'question') {
    // Soru tipinde: soruyu sor ve seçenekleri göster
    let message = getLocaleText(step.question, lang);

    if (step.options && step.options.length > 0) {
      // Seçenekleri şık bir listeye dönüştür
      message += '\n\n' + step.options.map((opt, idx) =>
        `${idx + 1}. ${getLocaleText(opt.label, lang)}`
      ).join('\n');

      const resetHints = {
        tr: '\n\n💡 "Başa dön" yazarak yeniden başlayabilirsiniz.',
        en: '\n\n💡 Type "reset" to start over.',
        ru: '\n\n💡 Напишите "сброс" для перезапуска.'
      };
      message += resetHints[lang as keyof typeof resetHints] || resetHints.tr;
    }

    return {
      message,
      nextStepId: currentStepId,
      isComplete: false,
      metadata: step.metadata
    };
  } else if (step.type === 'result') {
    // Sonuç tipinde: sonucu göster ve bitir
    let resultMessage = getLocaleText(step.resultMessage, lang) || (lang === 'tr' ? 'İşlem tamamlandı.' : 'Completed.');

    // ✨ DUYUSAL SKORA DAYALI ÜRÜN FİLTRELEME
    let finalRecommendations = step.productRecommendations;

    if (accumulatedSensory && products && step.productRecommendations && step.productRecommendations.length > 0) {
      // Duyusal profil varsa, ürünleri akıllı sırala
      const scoredProducts = step.productRecommendations
        .map(productId => {
          const product = products.find(p => p.id === productId);
          if (!product) return null;

          // Basit sensory matching: Her ürünün sensory özelliklerini varsayılan değerlerle eşleştir
          // (Gerçek uygulamada, Product tipine sensoryProfile eklenmeli)
          const matchScore = calculateSensoryMatch(product, accumulatedSensory);

          return { productId, matchScore };
        })
        .filter(item => item !== null)
        .sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0))
        .map(item => item!.productId);

      finalRecommendations = scoredProducts.slice(0, 3);

      // ✨ INVISIBLE INTELLIGENCE: Duyusal profil açıklaması
      const topSensory = Object.entries(accumulatedSensory)
        .filter(([_, value]) => (value as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 2);

      if (topSensory.length > 0) {
        const sensoryLabels: { [key: string]: { tr: string; en: string; ru: string } } = {
          intensity: { tr: 'yoğun', en: 'intense', ru: 'интенсивный' },
          sweetness: { tr: 'tatlı', en: 'sweet', ru: 'сладкий' },
          creaminess: { tr: 'kremsi', en: 'creamy', ru: 'кремовый' },
          fruitiness: { tr: 'meyveli', en: 'fruity', ru: 'фруктовый' },
          acidity: { tr: 'ekşimsi', en: 'acidic', ru: 'кислый' },
          crunch: { tr: 'çıtır', en: 'crunchy', ru: 'хрустящий' }
        };

        const trait1 = sensoryLabels[topSensory[0][0]]?.[lang] || topSensory[0][0];
        const trait2 = topSensory[1] ? (sensoryLabels[topSensory[1][0]]?.[lang] || topSensory[1][0]) : '';

        const sensoryExplanations = {
          tr: `\n\n✨ Seçimleriniz ${trait1}${trait2 ? ' ve ' + trait2 : ''} profil gösteriyor. Size en uygun ürünleri özenle seçtim.`,
          en: `\n\n✨ Your choices show ${trait1}${trait2 ? ' and ' + trait2 : ''} profile. I've carefully selected the most suitable products for you.`,
          ru: `\n\n✨ Ваш выбор показывает ${trait1}${trait2 ? ' и ' + trait2 : ''} профиль. Я тщательно подобрал для вас наиболее подходящие продукты.`
        };

        resultMessage += sensoryExplanations[lang as keyof typeof sensoryExplanations] || sensoryExplanations.tr;
      }
    }

    // ✨ OPERASYONEL TETİKLEYİCİLER

    // 1. Hediye Modu Aktivasyonu
    let giftModeActive = false;
    if (step.metadata?.triggerGiftMode) {
      const giftMessages = {
        tr: '\n\n🎁 Hediye modu aktif: Lüks hediye paketi ve özel not kartı eklenebilir. Ürün sayfasında "Bu bir hediye mi?" seçeneğini kullanabilirsiniz.',
        en: '\n\n🎁 Gift mode active: Luxury gift packaging and personalized note card available. Use "Is this a gift?" option on product page.',
        ru: '\n\n🎁 Режим подарка активен: Доступна роскошная подарочная упаковка и персонализированная открытка.'
      };
      resultMessage += giftMessages[lang as keyof typeof giftMessages] || giftMessages.tr;
      giftModeActive = true;
    }

    // 2. Hava Durumu Hassasiyeti (İklim Uyarısı)
    if (step.metadata?.isWeatherSensitive) {
      const weatherMessages = {
        tr: '\n\n🌡️ İklim Korumalı Paketleme: Sıcak havalarda erimeme garantisi için özel ambalaj kullanıyoruz.',
        en: '\n\n🌡️ Climate-Protected Packaging: Special packaging to prevent melting in hot weather.',
        ru: '\n\n🌡️ Климат-защищенная упаковка: Специальная упаковка предотвращает таяние в жаркую погоду.'
      };
      resultMessage += weatherMessages[lang as keyof typeof weatherMessages] || weatherMessages.tr;
    }

    const helpMessages = {
      tr: '\n\n💡 Başka bir konuda yardım almak için "başa dön" yazabilirsiniz.',
      en: '\n\n💡 Type "reset" for another recommendation.',
      ru: '\n\n💡 Напишите "сброс" для другой рекомендации.'
    };
    resultMessage += helpMessages[lang as keyof typeof helpMessages] || helpMessages.tr;

    return {
      message: resultMessage,
      nextStepId: null,
      isComplete: true,
      metadata: step.metadata,
      recommendations: finalRecommendations,
      giftModeActive
    };
  }

  return { message: lang === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.', nextStepId: null, isComplete: true };
};

// ✨ GÜNCEL: Kullanıcı Yanıtına Göre Sonraki Adımı Bulma (Çok Dilli)
const findNextStep = (
  flow: ConversationFlow,
  currentStepId: string,
  userAnswer: string,
  lang: string = 'tr'
): string | null => {
  const step = flow.steps.find(s => s.id === currentStepId);

  if (!step || step.type !== 'question' || !step.options) return null;

  const normalized = normalizeText(userAnswer);

  // 1. Rakamla seçim (1, 2, 3...)
  const numberMatch = userAnswer.match(/^(\d+)/);
  if (numberMatch) {
    const idx = parseInt(numberMatch[1]) - 1;
    if (step.options[idx]) return step.options[idx].nextStepId;
  }

  // 2. Metin eşleşmesi (Seçenek etiketine göre - çok dilli)
  const matchedOption = step.options.find(opt => {
    const label = normalizeText(getLocaleText(opt.label, lang));
    return label.includes(normalized) || normalized.includes(label);
  });

  return matchedOption?.nextStepId || null;
};

export const generateAIResponse = async (
  userMessage: string,
  conversationHistory: Message[],
  context: AIContext
): Promise<string> & { flowState?: { flowId: string; nextStepId: string | null; giftModeActive?: boolean; detectedPersona?: string } } => {
  const { aiConfig, knowledgeBase, products, conversationFlows = [], conversationState, currentLanguage = 'tr' } = context;
  const lang = currentLanguage; // Aktif dil

  // 🔄 BAŞA DÖN / YENİDEN BAŞLA kontrolü
  if (containsKeywords(userMessage, ['başa dön', 'yeniden başla', 'reset', 'iptal', 'baştan'])) {
    if (conversationState) {
      // Kullanıcı bir flow içindeyse, flow'u sıfırla
      return Object.assign('Tamam, başa dönüyoruz. Size nasıl yardımcı olabilirim?', {
        flowState: { flowId: '', nextStepId: null }
      });
    } else {
      return 'Size nasıl yardımcı olabilirim?';
    }
  }

  // 🎯 ÖNCELİK 0: Conversation Flow kontrolü
  // Eğer kullanıcı bir flow içindeyse, flow'u devam ettir
  if (conversationState) {
    // ✨ YENİ FLOW TETİKLEME KONTROLÜ: Kullanıcı başka bir konuya mı geçiyor?
    const newFlowMatch = findMatchingFlow(userMessage, conversationFlows);

    // 🐛 DEBUG: Flow geçişi kontrolü
    if (import.meta.env.DEV) {
      console.log('🔍 Flow Switch Check:', {
        currentFlow: conversationState.flowId,
        newFlowMatched: newFlowMatch?.id || 'none',
        willSwitch: newFlowMatch && newFlowMatch.id !== conversationState.flowId
      });
    }

    if (newFlowMatch && newFlowMatch.id !== conversationState.flowId) {
      // Kullanıcı yeni bir flow başlatıyor, mevcut flow'u sıfırla
      const smartEntryStepId = findSmartEntry(newFlowMatch, userMessage, lang);

      if (smartEntryStepId) {
        // Smart Entry ile yeni flow'u başlat
        const result = processFlowStep(newFlowMatch, smartEntryStepId, lang, {}, products);
        const startStep = newFlowMatch.steps.find(s => s.id === newFlowMatch.startStepId);
        const matchedOption = startStep?.options?.find(opt => opt.nextStepId === smartEntryStepId);
        const targetLabel = matchedOption ? cleanTargetLabel(getLocaleText(matchedOption.label, lang)) : '';

        const switchFlowMessages = {
          tr: `Anladım, başka bir hediye arıyorsunuz! ${targetLabel} için en zarif seçimi yapmanıza yardımcı olacağım.\n\n${result.message}`,
          en: `I understand, you're looking for another gift! I'll help you find the most elegant choice for ${targetLabel}.\n\n${result.message}`,
          ru: `Понимаю, вы ищете другой подарок! Я помогу вам найти самый элегантный выбор для ${targetLabel}.\n\n${result.message}`
        };

        return Object.assign(switchFlowMessages[lang as keyof typeof switchFlowMessages] || switchFlowMessages['tr'], {
          flowState: {
            flowId: newFlowMatch.id,
            nextStepId: result.nextStepId,
            detectedPersona: newFlowMatch.personaType
          },
          recommendations: result.recommendations || []
        });
      } else {
        // Normal başlangıç (Smart Entry yok)
        const result = processFlowStep(newFlowMatch, newFlowMatch.startStepId, lang, {}, products);
        const switchFlowMessages = {
          tr: `Anladım, başka bir şey arıyorsunuz! Hemen yardımcı olayım.\n\n${result.message}`,
          en: `I understand, you're looking for something else! Let me help you right away.\n\n${result.message}`,
          ru: `Понимаю, вы ищете что-то другое! Давайте я вам помогу.\n\n${result.message}`
        };

        return Object.assign(switchFlowMessages[lang as keyof typeof switchFlowMessages] || switchFlowMessages['tr'], {
          flowState: {
            flowId: newFlowMatch.id,
            nextStepId: result.nextStepId,
            detectedPersona: newFlowMatch.personaType
          }
        });
      }
    }

    const currentFlow = conversationFlows.find(f => f.id === conversationState.flowId);

    if (currentFlow) {
      const nextStepId = findNextStep(currentFlow, conversationState.currentStepId, userMessage, lang);

      if (nextStepId) {
        // ✨ SENSORY SCORING: Seçilen seçeneğin duyusal skorunu akümüle et
        const currentStep = currentFlow.steps.find(s => s.id === conversationState.currentStepId);
        const matchedOption = currentStep?.options?.find(opt => opt.nextStepId === nextStepId);

        let accumulatedSensory = conversationState.accumulatedSensory || {};
        if (matchedOption?.sensoryScore) {
          accumulatedSensory = {
            intensity: (accumulatedSensory.intensity || 0) + (matchedOption.sensoryScore.intensity || 0),
            sweetness: (accumulatedSensory.sweetness || 0) + (matchedOption.sensoryScore.sweetness || 0),
            creaminess: (accumulatedSensory.creaminess || 0) + (matchedOption.sensoryScore.creaminess || 0),
            fruitiness: (accumulatedSensory.fruitiness || 0) + (matchedOption.sensoryScore.fruitiness || 0),
            acidity: (accumulatedSensory.acidity || 0) + (matchedOption.sensoryScore.acidity || 0),
            crunch: (accumulatedSensory.crunch || 0) + (matchedOption.sensoryScore.crunch || 0)
          };
        }

        const step = currentFlow.steps.find(s => s.id === nextStepId);
        if (step) {
          if (step.type === 'question') {
            const result = processFlowStep(currentFlow, nextStepId, lang, accumulatedSensory, products);
            return Object.assign(result.message, {
              flowState: {
                flowId: currentFlow.id,
                nextStepId: result.nextStepId,
                detectedPersona: currentFlow.personaType,
                accumulatedSensory
              }
            });
          } else if (step.type === 'result') {
            const result = processFlowStep(currentFlow, nextStepId, lang, accumulatedSensory, products);
            return Object.assign(result.message, {
              flowState: {
                flowId: currentFlow.id,
                nextStepId: null, // Flow sona erdi
                giftModeActive: result.giftModeActive,
                detectedPersona: currentFlow.personaType,
                accumulatedSensory
              },
              recommendations: result.recommendations || []
            });
          }
        }
      } else {
        // Geçersiz cevap, aynı soruyu tekrar sor
        const step = currentFlow.steps.find(s => s.id === conversationState.currentStepId);
        if (step && step.type === 'question') {
          const retryMessages = {
            tr: `Üzgünüm, seçiminizi anlayamadım. Lütfen seçeneklerden birini seçin:\n\n${step.options?.map((opt, idx) => `${idx + 1}. ${getLocaleText(opt.label, lang)}`).join('\n')}`,
            en: `Sorry, I didn't understand. Please choose one of the options:\n\n${step.options?.map((opt, idx) => `${idx + 1}. ${getLocaleText(opt.label, lang)}`).join('\n')}`,
            ru: `Извините, я не понял. Пожалуйста, выберите один из вариантов:\n\n${step.options?.map((opt, idx) => `${idx + 1}. ${getLocaleText(opt.label, lang)}`).join('\n')}`
          };
          return Object.assign(retryMessages[lang as keyof typeof retryMessages] || retryMessages.tr, {
            flowState: { flowId: currentFlow.id, nextStepId: conversationState.currentStepId }
          });
        }
      }
    }
  }

  // Yeni flow başlatma kontrolü
  const matchingFlow = findMatchingFlow(userMessage, conversationFlows);
  if (matchingFlow) {
    // ✨ SMART ENTRY: İlk mesajda cevap var mı kontrol et
    const smartEntryStepId = findSmartEntry(matchingFlow, userMessage, lang);

    if (smartEntryStepId) {
      // Kullanıcı zaten cevabı vermiş (örn: "öğretmenime hediye")
      // İlk soruyu atla, direkt nextStepId'ye git
      const result = processFlowStep(matchingFlow, smartEntryStepId, lang, {}, products);

      // Zarif karşılama mesajı ekle
      const startStep = matchingFlow.steps.find(s => s.id === matchingFlow.startStepId);
      const matchedOption = startStep?.options?.find(opt => opt.nextStepId === smartEntryStepId);
      const targetLabel = matchedOption ? cleanTargetLabel(getLocaleText(matchedOption.label, lang)) : '';

      const greetingMessages = {
        tr: `Harika! ${targetLabel} için en zarif seçimi yapmanıza yardımcı olacağım.\n\n${result.message}`,
        en: `Perfect! I'll help you find the most elegant choice for ${targetLabel}.\n\n${result.message}`,
        ru: `Отлично! Я помогу вам найти самый элегантный выбор для ${targetLabel}.\n\n${result.message}`
      };

      return Object.assign(greetingMessages[lang as keyof typeof greetingMessages] || greetingMessages['tr'], {
        flowState: {
          flowId: matchingFlow.id,
          nextStepId: result.nextStepId,
          detectedPersona: matchingFlow.personaType
        },
        recommendations: result.recommendations || []
      });
    }

    // Normal başlangıç (ilk mesajda cevap yok)
    const result = processFlowStep(matchingFlow, matchingFlow.startStepId, lang, {}, products);
    return Object.assign(result.message, {
      flowState: {
        flowId: matchingFlow.id,
        nextStepId: result.nextStepId,
        detectedPersona: matchingFlow.personaType
      }
    });
  }

  // 🎯 ÖNCELİK 1: Soru-Cevap çiftlerini kontrol et
  const qaMatch = findQuestionAnswer(userMessage, knowledgeBase);
  if (qaMatch) {
    return qaMatch.value;
  }

  // Bilgi bankasından ilgili kuralları bul
  const relevantKnowledge = findRelevantKnowledge(userMessage, knowledgeBase);

  // Selamlama kontrolleri
  if (containsKeywords(userMessage, ['merhaba', 'selam', 'hello', 'hi', 'hey'])) {
    return aiConfig?.persona?.greeting ||
      'Merhaba! Ben Sade Chocolate\'ın AI Sommelier\'iyim. Size nasıl yardımcı olabilirim?';
  }

  // Hediye önerileri
  if (isGiftRelated(userMessage)) {
    let response = 'Harika bir hediye seçimi yapmak istiyorsunuz! ';

    // Bütçe belirleme
    const budgetMatch = userMessage.match(/(\d+)\s*(tl|lira)?/i);
    let maxPrice = budgetMatch ? parseInt(budgetMatch[1]) : undefined;

    // Kişi belirleme
    let giftTarget = '';
    if (containsKeywords(userMessage, ['sevgili', 'eş', 'partner'])) {
      giftTarget = 'sevgiliniz';
      response += 'Sevgiliniz için özel hediye paketlerimiz var. ';
    } else if (containsKeywords(userMessage, ['anne', 'anneye'])) {
      giftTarget = 'anneniz';
      response += 'Anneniz için zarif bir seçim yapabilirsiniz. ';
    } else if (containsKeywords(userMessage, ['arkadaş', 'dost'])) {
      giftTarget = 'arkadaşınız';
      response += 'Arkadaşınız için özel bir şey arıyorsunuz. ';
    }

    // Ürün öner
    const recommended = recommendProducts(products, {
      isGift: true,
      maxPrice
    });

    if (recommended.length > 0) {
      response += '\n\nSize şunları önerebilirim:\n\n';
      recommended.forEach((product, idx) => {
        response += `${idx + 1}. **${product.title}** - ₺${product.price.toFixed(2)}\n`;
        if (product.detailedDescription) {
          response += `   ${product.detailedDescription.substring(0, 80)}...\n`;
        }
        response += '\n';
      });

      response += '\nHediye notu eklemek isterseniz, ürün detay sayfasında "Bu bir hediye mi?" seçeneğini kullanabilirsiniz!';
    }

    return response;
  }

  // Ürün önerisi
  if (isProductRecommendation(userMessage)) {
    let response = 'Size en uygun çikolataları bulmama yardımcı olayım! ';

    // Tat tercihi kontrolü
    if (containsKeywords(userMessage, ['bitter', 'dark', 'acı', 'yoğun'])) {
      response += '\n\nYoğun ve bitter çikolata seviyorsunuz demek. ';
      const darkProducts = products.filter(p =>
        containsKeywords(p.title + ' ' + (p.detailedDescription || ''), ['dark', 'bitter', '%70', '%80', '%85'])
      ).slice(0, 3);

      if (darkProducts.length > 0) {
        response += 'İşte size özel önerilerim:\n\n';
        darkProducts.forEach((p, idx) => {
          response += `${idx + 1}. **${p.title}** - ₺${p.price.toFixed(2)}\n`;
        });
      }
    } else if (containsKeywords(userMessage, ['sütlü', 'milk', 'tatlı', 'hafif'])) {
      response += '\n\nKremsi ve yumuşak tatları tercih ediyorsunuz. ';
      const milkProducts = products.filter(p =>
        containsKeywords(p.title + ' ' + (p.detailedDescription || ''), ['sütlü', 'milk', 'cremeux'])
      ).slice(0, 3);

      if (milkProducts.length > 0) {
        response += 'Size şunları önerebilirim:\n\n';
        milkProducts.forEach((p, idx) => {
          response += `${idx + 1}. **${p.title}** - ₺${p.price.toFixed(2)}\n`;
        });
      }
    } else {
      // Genel öneri
      const recommended = recommendProducts(products, {});
      if (recommended.length > 0) {
        response += '\n\nPopüler ürünlerimizden başlayabilirsiniz:\n\n';
        recommended.forEach((p, idx) => {
          response += `${idx + 1}. **${p.title}** - ₺${p.price.toFixed(2)}\n`;
        });
      }
    }

    return response;
  }

  // Fiyat/Bütçe sorguları
  if (isBudgetRelated(userMessage)) {
    const budgetMatch = userMessage.match(/(\d+)\s*(tl|lira)?/i);
    const maxPrice = budgetMatch ? parseInt(budgetMatch[1]) : 500;

    const affordable = recommendProducts(products, { maxPrice });

    let response = `${maxPrice} TL bütçeniz için uygun seçenekler:\n\n`;

    if (affordable.length > 0) {
      affordable.forEach((p, idx) => {
        response += `${idx + 1}. **${p.title}** - ₺${p.price.toFixed(2)}\n`;
      });
    } else {
      response = 'Bu bütçede stokta ürünümüz bulunmuyor. Bütçenizi artırabilir misiniz?';
    }

    return response;
  }

  // İçerik/Alerjen sorguları
  if (isIngredientRelated(userMessage)) {
    return 'Ürünlerimizin içerik ve alerjen bilgileri her ürünün detay sayfasında "İçindekiler & Alerjen" bölümünde yer almaktadır. Hangi ürün hakkında bilgi almak istersiniz?';
  }

  // Bilgi bankasında eşleşme varsa
  if (relevantKnowledge.length > 0) {
    let response = '';
    relevantKnowledge.forEach(item => {
      if (item.type === 'Eşleştirme') {
        response += `${item.key} için ${item.value} önerebilirim.\n\n`;
      } else if (item.type === 'Marka Hikayesi') {
        response += `${item.value}\n\n`;
      }
    });

    if (response) return response.trim();
  }

  // Kapsam dışı soru kontrolü (çikolata ile ilgili değilse)
  if (!isRelevantToChocolate(userMessage) && conversationHistory.length > 1) {
    return 'Üzgünüm, ben Sade Chocolate\'ın çikolata uzmanıyım ve sadece çikolata, hediye seçimi ve ürünlerimiz hakkında yardımcı olabilirim. Size çikolata konusunda nasıl yardımcı olabilirim?';
  }

  // Genel yanıt
  const fallbackResponses = [
    'Bu konuda size yardımcı olmak isterim. Biraz daha detay verebilir misiniz? Örneğin, hangi tada merak ediyorsunuz?',
    'Çok güzel bir soru! Size daha iyi yardımcı olabilmem için biraz daha bilgi verebilir misiniz? Hediye mi arıyorsunuz yoksa kendiniz için mi?',
    'Mükemmel! Size özel bir öneri hazırlamak için birkaç şey sormam gerekebilir. Bitter mi, sütlü mü tercih edersiniz?',
    'Elbette yardımcı olabilirim! Bütçeniz nedir ve kime hediye almayı düşünüyorsunuz?'
  ];

  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
};
