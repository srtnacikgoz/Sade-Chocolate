// features/bonbon/api/bonbonApi.ts
// Bonbon Firebase API fonksiyonları

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Product } from '../../../types';

// Bonbon koleksiyon kartı ayarları tipi
export interface BonbonConfig {
  cardImage?: string;
  cardTitle: string;
  cardSubtitle: string;
  ctaText: string;
}

const DEFAULT_BONBON_CONFIG: BonbonConfig = {
  cardTitle: 'Bonbon Koleksiyonu',
  cardSubtitle: 'Her biri özenle hazırlanmış eşsiz tatlar',
  ctaText: 'Koleksiyonu Keşfet'
};

/**
 * Bonbon kartı ayarlarını getirir
 */
export async function getBonbonConfig(): Promise<BonbonConfig> {
  try {
    const docRef = doc(db, 'site_settings', 'bonbon');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_BONBON_CONFIG, ...docSnap.data() } as BonbonConfig;
    }
  } catch (error) {
    console.error('Bonbon config yüklenemedi:', error);
  }
  return DEFAULT_BONBON_CONFIG;
}

/**
 * Tüm görünür bonbonları getirir
 */
export async function getBonbons(): Promise<Product[]> {
  try {
    // Basit sorgu - sadece category filtresi
    const q = query(
      collection(db, 'products'),
      where('category', '==', 'bonbon')
    );

    const snapshot = await getDocs(q);
    const bonbons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    // Client-side filtreleme ve sıralama
    return bonbons
      .filter(b => b.isVisibleInCatalog !== false)
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  } catch (error) {
    console.error('Bonbonlar yüklenemedi:', error);
    return [];
  }
}

/**
 * Tat profiline göre bonbonları filtreler
 * @param taste - Tat profili (örn: 'Bitter', 'Sütlü')
 */
export async function getBonbonsByTaste(taste: string): Promise<Product[]> {
  const allBonbons = await getBonbons();
  return allBonbons.filter(b => b.attributes?.includes(taste));
}

/**
 * Slug veya ID ile tek bonbon getirir
 * @param slugOrId - URL slug veya Firestore document ID
 */
export async function getBonbonBySlug(slugOrId: string): Promise<Product | null> {
  // Önce ID ile dene
  try {
    const docRef = doc(db, 'products', slugOrId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.category === 'bonbon') {
        return { id: docSnap.id, ...data } as Product;
      }
    }
  } catch (error) {
    // ID format hatası olabilir, devam et
  }

  // ID bulunamazsa slug ile ara
  const allBonbons = await getBonbons();
  return allBonbons.find(b => (b as any).slug === slugOrId) || null;
}

/**
 * Benzer tat profiline sahip ilgili bonbonları getirir
 * @param currentBonbon - Mevcut bonbon
 * @param limit - Maksimum sonuç sayısı
 */
export async function getRelatedBonbons(
  currentBonbon: Product,
  limit: number = 4
): Promise<Product[]> {
  const allBonbons = await getBonbons();
  const firstAttribute = currentBonbon.attributes?.[0];

  let related: Product[];

  if (firstAttribute) {
    // Aynı tat profilinden olanları önce al
    related = allBonbons
      .filter(b => b.id !== currentBonbon.id && b.attributes?.includes(firstAttribute));
  } else {
    related = allBonbons.filter(b => b.id !== currentBonbon.id);
  }

  // Yeterli değilse diğerlerinden tamamla
  if (related.length < limit) {
    const others = allBonbons
      .filter(b => b.id !== currentBonbon.id && !related.find(r => r.id === b.id));
    related = [...related, ...others];
  }

  return related.slice(0, limit);
}

/**
 * Koleksiyon kartı için bonbon görseli getirir (config'den veya ilk bonbon)
 */
export async function getBonbonPreviewImage(): Promise<string | null> {
  // Önce config'den kontrol et
  const config = await getBonbonConfig();
  if (config.cardImage) {
    return config.cardImage;
  }

  // Config'de yoksa ilk bonbonun görselini kullan
  const bonbons = await getBonbons();
  const withImage = bonbons.find(b => b.image);
  return withImage?.image || null;
}

/**
 * Tüm benzersiz tat profillerini getirir (filtreler için)
 */
export async function getTasteProfiles(): Promise<string[]> {
  const bonbons = await getBonbons();
  const allAttributes = bonbons.flatMap(b => b.attributes || []);
  const unique = [...new Set(allAttributes)].sort();
  return unique;
}
