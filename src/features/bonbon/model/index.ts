// features/bonbon/model/index.ts
export type {
  Bonbon,
  TasteProfile,
  BonbonFiltersState,
  BonbonSortOption
} from './types';

export {
  TASTE_PROFILES,
  SORT_OPTIONS
} from './types';

export {
  useBonbons,
  useBonbonDetail,
  useBonbonCardConfig
} from './useBonbons';
