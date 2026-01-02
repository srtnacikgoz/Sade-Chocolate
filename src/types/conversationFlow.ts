export type StepType = 'question' | 'result';

// ✨ Çoklu dil desteği için yerelleştirilmiş metin yapısı
export interface LocalizedString {
  tr: string;
  en: string;
  ru: string;
}

// ✨ Duyusal profil skoru (seçeneklere göre ürünleri daraltmak için)
export interface SensoryScore {
  intensity?: number; // 0-10
  sweetness?: number; // 0-10
  creaminess?: number; // 0-10
  fruitiness?: number; // 0-10
  acidity?: number; // 0-10
  crunch?: number; // 0-10
}

export interface StepOption {
  label: LocalizedString | string; // Yerelleştirilmiş veya basit string
  nextStepId: string | null; // null = son adım
  // ✨ Seçenek seçildiğinde duyusal filtreleri daraltmak için
  sensoryScore?: SensoryScore;
}

// ✨ Operasyonel metadata
export interface StepMetadata {
  triggerGiftMode?: boolean; // Hediye modunu otomatik aktif et
  isWeatherSensitive?: boolean; // Hava durumu uyarısı gerektirir mi?
  requiresBudgetInfo?: boolean; // Bütçe bilgisi gerekli mi?
  personaHint?: 'connoisseur' | 'gifter' | 'aspiring' | 'archivist'; // Bu adımda hangi persona tipi belirlenir
}

export interface ConversationStep {
  id: string;
  type: StepType;
  displayName?: string; // ✨ Admin panelde görünecek açıklayıcı isim (opsiyonel)
  question?: LocalizedString | string; // type=question için
  options?: StepOption[]; // type=question için
  resultMessage?: LocalizedString | string; // type=result için
  productRecommendations?: string[]; // type=result için (product ID'leri)
  metadata?: StepMetadata; // ✨ Operasyonel tetikleyiciler
}

// ✨ Persona tipleri: Kullanıcı profilleme için
export type PersonaType = 'connoisseur' | 'gifter' | 'aspiring' | 'archivist';

export interface ConversationFlow {
  id: string;
  name: string;
  description?: string;
  trigger: string; // Tetikleyici soru/anahtar kelime (virgülle ayrılmış)
  startStepId: string;
  steps: ConversationStep[];
  active: boolean;
  personaType?: PersonaType; // ✨ Bu flow hangi persona için optimize edilmiş?
  createdAt?: any;
  updatedAt?: any;
}

export interface ConversationState {
  flowId: string;
  currentStepId: string;
  history: Array<{
    stepId: string;
    question: string;
    answer: string;
  }>;
  // ✨ Kullanıcının akümüle edilmiş duyusal tercihleri
  accumulatedSensory?: SensoryScore;
  // ✨ Tespit edilen persona tipi
  detectedPersona?: PersonaType;
  // ✨ Hediye modu aktif mi?
  giftModeActive?: boolean;
}

// ✨ Yardımcı tip: LocalizedString veya string olabilir
export type LocalizableString = LocalizedString | string;

// ✨ Yardımcı fonksiyon: LocalizedString'i mevcut dile göre döndür
export function getLocalizedText(text: LocalizableString, lang: 'tr' | 'en' | 'ru' = 'tr'): string {
  if (typeof text === 'string') {
    return text;
  }
  return text[lang] || text.tr;
}
