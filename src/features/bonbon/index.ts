// features/bonbon/index.ts
// Bonbon feature public API

// UI Bileşenleri
export {
  BonbonCard,
  BonbonFilters,
  BonbonGrid,
  BonbonCollectionCard
} from './ui';

// Model (Types & Hooks)
export type {
  Bonbon,
  TasteProfile,
  BonbonFiltersState,
  BonbonSortOption
} from './model';

export {
  TASTE_PROFILES,
  SORT_OPTIONS,
  useBonbons,
  useBonbonDetail,
  useBonbonCardConfig
} from './model';

// API Fonksiyonları
export type { BonbonConfig } from './api';

export {
  getBonbons,
  getBonbonsByTaste,
  getBonbonBySlug,
  getRelatedBonbons,
  getBonbonPreviewImage,
  getTasteProfiles,
  getBonbonConfig
} from './api';
