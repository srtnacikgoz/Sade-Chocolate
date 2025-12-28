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
  lang: string = 'tr'
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
      recommendations: step.productRecommendations,
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
    const currentFlow = conversationFlows.find(f => f.id === conversationState.flowId);

    if (currentFlow) {
      const nextStepId = findNextStep(currentFlow, conversationState.currentStepId, userMessage, lang);

      if (nextStepId) {
        const step = currentFlow.steps.find(s => s.id === nextStepId);
        if (step) {
          if (step.type === 'question') {
            const result = processFlowStep(currentFlow, nextStepId, lang);
            return Object.assign(result.message, {
              flowState: {
                flowId: currentFlow.id,
                nextStepId: result.nextStepId,
                detectedPersona: currentFlow.personaType
              }
            });
          } else if (step.type === 'result') {
            const result = processFlowStep(currentFlow, nextStepId, lang);
            return Object.assign(result.message, {
              flowState: {
                flowId: currentFlow.id,
                nextStepId: null, // Flow sona erdi
                giftModeActive: result.giftModeActive,
                detectedPersona: currentFlow.personaType
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
    const result = processFlowStep(matchingFlow, matchingFlow.startStepId, lang);
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
