import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type {
  TasteProfile,
  TastingQuizAnswers,
  CustomerSegment,
  SensoryEvaluation,
  SegmentCalculationInput,
  FlavorNote
} from '../types/tasteProfile';

const COLLECTION = 'taste_profiles';

/**
 * Kullanıcının tadım profilini kaydet
 */
export async function saveTasteProfile(userId: string, profile: TasteProfile): Promise<void> {
  const docRef = doc(db, COLLECTION, userId);
  await setDoc(docRef, profile);
}

/**
 * Kullanıcının tadım profilini getir
 */
export async function getTasteProfile(userId: string): Promise<TasteProfile | null> {
  const docRef = doc(db, COLLECTION, userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as TasteProfile;
  }
  return null;
}

/**
 * Duyusal değerlendirme ekle
 */
export async function addSensoryEvaluation(
  userId: string,
  evaluation: SensoryEvaluation
): Promise<void> {
  const docRef = doc(db, COLLECTION, userId);
  await updateDoc(docRef, {
    evaluations: arrayUnion(evaluation),
    updatedAt: new Date().toISOString()
  });
}

/**
 * Anket yanıtlarından müşteri segmentlerini hesapla
 */
export function calculateSegments(input: SegmentCalculationInput): CustomerSegment[] {
  const segments: CustomerSegment[] = [];
  const { cacaoIntensity, sweetnessLevel, flavorNotes, adventurousness } = input;

  // Yüksek Kakao Sever (kakao yoğunluğu 4-5 ve tatlılık 1-2)
  if (cacaoIntensity >= 4 && sweetnessLevel <= 2) {
    segments.push('high_cacao_lover');
  }

  // Bitter Puristi (kakao 5, tatlılık 1)
  if (cacaoIntensity === 5 && sweetnessLevel === 1) {
    segments.push('dark_purist');
  }

  // Meyvemsi Aroma Arayıcısı
  if (flavorNotes.includes('fruity') || flavorNotes.includes('citrus')) {
    segments.push('fruity_aroma_seeker');
  }

  // Pralin Tutkunu
  if (flavorNotes.includes('nutty') || flavorNotes.includes('caramel')) {
    segments.push('praline_enthusiast');
  }

  // Klasik Sütlü Sever (düşük kakao, yüksek tatlılık)
  if (cacaoIntensity <= 2 && sweetnessLevel >= 4) {
    segments.push('classic_milk_fan');
  }

  // Tatlı Seven
  if (sweetnessLevel >= 4) {
    segments.push('sweet_tooth');
  }

  // Maceracı Tadımcı
  if (adventurousness >= 4) {
    segments.push('adventurous_taster');
  }

  // En az bir segment olsun
  if (segments.length === 0) {
    segments.push('classic_milk_fan');
  }

  return segments;
}

/**
 * AI Sommelier için özet metin oluştur
 */
export function generateAISummary(
  answers: TastingQuizAnswers,
  segments: CustomerSegment[]
): string {
  const parts: string[] = [];

  // Kakao tercihi
  if (answers.cacaoIntensity) {
    const intensity = answers.cacaoIntensity;
    if (intensity >= 4) {
      parts.push('yüksek kakaolu bitter çikolataları tercih ediyorsunuz');
    } else if (intensity <= 2) {
      parts.push('hafif ve sütlü çikolataları seviyorsunuz');
    } else {
      parts.push('dengeli kakao oranını tercih ediyorsunuz');
    }
  }

  // Tatlılık
  if (answers.sweetnessLevel) {
    const sweet = answers.sweetnessLevel;
    if (sweet >= 4) {
      parts.push('tatlı lezzetlere yatkınsınız');
    } else if (sweet <= 2) {
      parts.push('az şekerli seçenekleri tercih ediyorsunuz');
    }
  }

  // Lezzet notaları
  if (answers.flavorNotes && answers.flavorNotes.length > 0) {
    const noteLabels: Record<FlavorNote, string> = {
      fruity: 'meyvemsi',
      nutty: 'fındıksı',
      floral: 'çiçeksi',
      spicy: 'baharatlı',
      earthy: 'topraksı',
      caramel: 'karamelli',
      vanilla: 'vanilyalı',
      coffee: 'kahvemsi',
      citrus: 'narenciye'
    };

    const notes = answers.flavorNotes.map((n) => noteLabels[n]).join(', ');
    parts.push(`${notes} aromalara ilgi duyuyorsunuz`);
  }

  // Maceracılık
  if (answers.adventurousness && answers.adventurousness >= 4) {
    parts.push('yeni tatlar keşfetmeye açıksınız');
  }

  // Orijin tercihi
  if (answers.preferredOrigins && answers.preferredOrigins.length > 0) {
    const originLabels: Record<string, string> = {
      tanzania: 'Tanzanya',
      ecuador: 'Ekvador',
      madagascar: 'Madagaskar',
      peru: 'Peru',
      venezuela: 'Venezuela',
      ghana: 'Gana',
      vietnam: 'Vietnam'
    };

    const origins = answers.preferredOrigins.map((o) => originLabels[o]).join(', ');
    parts.push(`${origins} orijinli çekirdekleri tercih ediyorsunuz`);
  }

  if (parts.length === 0) {
    return 'Damak tadı profiliniz henüz oluşturulmadı.';
  }

  // İlk harfi büyük yap
  const firstPart = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  parts[0] = firstPart;

  return `${parts.join('. ')}.`;
}

/**
 * Profil bazlı ürün önerileri getir
 */
export function getProductRecommendations(profile: TasteProfile): {
  primaryMatches: string[];
  secondaryMatches: string[];
  avoidProducts: string[];
} {
  const primaryMatches: string[] = [];
  const secondaryMatches: string[] = [];
  const avoidProducts: string[] = [];

  const { preferences, segments } = profile;

  // Segmente göre ana öneriler
  if (segments.includes('high_cacao_lover') || segments.includes('dark_purist')) {
    primaryMatches.push('dark-85', 'dark-100', 'single-origin-dark');
    avoidProducts.push('milk-chocolate', 'white-chocolate');
  }

  if (segments.includes('fruity_aroma_seeker')) {
    primaryMatches.push('madagascar-66', 'berry-infused', 'citrus-orange');
  }

  if (segments.includes('praline_enthusiast')) {
    primaryMatches.push('hazelnut-praline', 'almond-gianduja', 'pistachio-crunch');
  }

  if (segments.includes('classic_milk_fan') || segments.includes('sweet_tooth')) {
    primaryMatches.push('milk-classic', 'caramel-sea-salt', 'vanilla-cream');
  }

  if (segments.includes('adventurous_taster')) {
    secondaryMatches.push('chili-dark', 'lavender-honey', 'matcha-white');
  }

  // Kaçınılacak içerikler
  profile.avoidIngredients.forEach((ingredient) => {
    if (ingredient.toLowerCase().includes('fındık') || ingredient.toLowerCase().includes('nut')) {
      avoidProducts.push('hazelnut-praline', 'almond-gianduja');
    }
    if (ingredient.toLowerCase().includes('süt') || ingredient.toLowerCase().includes('milk')) {
      avoidProducts.push('milk-classic', 'white-chocolate');
    }
  });

  return { primaryMatches, secondaryMatches, avoidProducts };
}
