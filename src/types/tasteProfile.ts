// Dijital Tadım Anketi - Damak Tadı Profili Tipleri

// Lezzet notaları - Flavor Wheel kategorileri
export type FlavorNote =
  | 'fruity'      // Meyvemsi (kırmızı meyveler, narenciye, tropikal)
  | 'nutty'       // Fındıksı (badem, fındık, ceviz)
  | 'floral'      // Çiçeksi (yasemin, gül, lavanta)
  | 'spicy'       // Baharatlı (tarçın, karanfil, biber)
  | 'earthy'      // Topraksı (mantar, tütün, deri)
  | 'caramel'     // Karamelli (karamel, bal, toffee)
  | 'vanilla'     // Vanilyalı
  | 'coffee'      // Kahvemsi
  | 'citrus';     // Narenciye

// Kakao orijinleri ve karakterleri
export type CacaoOrigin =
  | 'tanzania'    // Meyvemsi asidite
  | 'ecuador'     // Çiçeksi, aromatik
  | 'madagascar'  // Kırmızı meyve notaları
  | 'peru'        // Fındıksı, dengeli
  | 'venezuela'   // Kompleks, yoğun
  | 'ghana'       // Klasik, dengeli
  | 'vietnam';    // Baharatlı

// Doku tercihi
export type TexturePreference =
  | 'smooth'      // Pürüzsüz, kremsi
  | 'crunchy'     // Çıtır (fındıklı, karamelli)
  | 'mixed';      // Karışık doku

// Yoğunluk seviyesi
export type IntensityLevel = 1 | 2 | 3 | 4 | 5;

// Müşteri segmentleri - CRM için otomatik etiketleme
export type CustomerSegment =
  | 'high_cacao_lover'      // Yüksek Kakao Severler (70%+)
  | 'fruity_aroma_seeker'   // Meyvemsi Aroma Arayanlar
  | 'praline_enthusiast'    // Pralin Tutkunları
  | 'classic_milk_fan'      // Klasik Sütlü Seven
  | 'adventurous_taster'    // Maceracı Tadımcı
  | 'sweet_tooth'           // Tatlı Seven
  | 'dark_purist';          // Bitter Puristi

// Anket sorusu tipi
export interface TastingQuestion {
  id: string;
  type: 'single' | 'multiple' | 'slider' | 'rating';
  question: string;
  questionEn: string;
  description?: string;
  options?: {
    value: string;
    label: string;
    labelEn: string;
    icon?: string;
  }[];
  min?: number;
  max?: number;
}

// Duyusal değerlendirme (sipariş sonrası)
export interface SensoryEvaluation {
  productId: string;
  productName: string;
  date: string;
  ratings: {
    snap: IntensityLevel;        // Kırılma sesi
    aroma: IntensityLevel;       // Koku yoğunluğu
    melt: IntensityLevel;        // Erime hızı
    smoothness: IntensityLevel;  // Pürüzsüzlük
    aftertaste: IntensityLevel;  // Ağızda kalan tat
  };
  flavorNotes: FlavorNote[];     // Algılanan lezzet notaları
  overallScore: IntensityLevel;  // Genel puan
  notes?: string;                // Serbest yorum
  wouldBuyAgain: boolean;
}

// Ana damak tadı profili
export interface TasteProfile {
  id: string;
  oderId: string;
  createdAt: string;
  updatedAt: string;

  // Temel tercihler
  preferences: {
    cacaoIntensity: IntensityLevel;     // Kakao yoğunluğu (1=hafif, 5=çok bitter)
    sweetnessLevel: IntensityLevel;     // Tatlılık seviyesi
    flavorNotes: FlavorNote[];          // Tercih edilen lezzet notaları
    texturePreference: TexturePreference;
    adventurousness: IntensityLevel;    // Yeni tatlar deneme isteği
  };

  // Tercih edilen orijinler
  preferredOrigins: CacaoOrigin[];

  // Kaçınılan içerikler (alerji veya tercih)
  avoidIngredients: string[];

  // Otomatik hesaplanan segment
  segments: CustomerSegment[];

  // Ürün değerlendirme geçmişi
  evaluations: SensoryEvaluation[];

  // AI Sommelier için özet
  aiSummary?: string;
}

// Anket yanıtları (geçici, profil oluşturmadan önce)
export interface TastingQuizAnswers {
  cacaoIntensity?: IntensityLevel;
  sweetnessLevel?: IntensityLevel;
  flavorNotes?: FlavorNote[];
  texturePreference?: TexturePreference;
  adventurousness?: IntensityLevel;
  preferredOrigins?: CacaoOrigin[];
  avoidIngredients?: string[];
}

// Segment hesaplama fonksiyonu için input
export interface SegmentCalculationInput {
  cacaoIntensity: IntensityLevel;
  sweetnessLevel: IntensityLevel;
  flavorNotes: FlavorNote[];
  adventurousness: IntensityLevel;
}
