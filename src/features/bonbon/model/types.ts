// features/bonbon/model/types.ts
// Bonbon-specific type tanımlamaları

import type { Product } from '../../../types';

/**
 * Bonbon ürünü - Product'ın bonbon-specific alt tipi
 */
export type Bonbon = Product & {
  category: 'bonbon';
};

/**
 * Tat profili seçenekleri
 */
export const TASTE_PROFILES = [
  'Bitter',
  'Sütlü',
  'Beyaz',
  'Meyvemsi',
  'Fındıklı',
  'Karamelli',
  'Baharatlı',
  'Tuzlu'
] as const;

export type TasteProfile = typeof TASTE_PROFILES[number];

/**
 * Bonbon filtre state'i
 */
export interface BonbonFiltersState {
  tastes: TasteProfile[];
  sortBy: BonbonSortOption;
}

/**
 * Sıralama seçenekleri
 */
export type BonbonSortOption = 'default' | 'name-asc' | 'name-desc' | 'popular';

/**
 * Sıralama seçenekleri label'ları
 */
export const SORT_OPTIONS: { value: BonbonSortOption; label: string }[] = [
  { value: 'default', label: 'Varsayılan' },
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
  { value: 'popular', label: 'Popülerlik' }
];
