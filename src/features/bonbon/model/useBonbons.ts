// features/bonbon/model/useBonbons.ts
// Bonbon veri yönetimi hook'u

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Product } from '../../../types';
import type { BonbonFiltersState, BonbonSortOption, TasteProfile } from './types';
import {
  getBonbons,
  getBonbonBySlug,
  getRelatedBonbons,
  getTasteProfiles,
  getBonbonConfig,
  type BonbonConfig
} from '../api';

interface UseBonbonsReturn {
  bonbons: Product[];
  filteredBonbons: Product[];
  loading: boolean;
  error: string | null;
  filters: BonbonFiltersState;
  availableTastes: string[];
  setTasteFilter: (tastes: TasteProfile[]) => void;
  toggleTaste: (taste: TasteProfile) => void;
  setSortBy: (sort: BonbonSortOption) => void;
  clearFilters: () => void;
}

/**
 * Bonbon listesi ve filtreleme hook'u
 */
export function useBonbons(): UseBonbonsReturn {
  const [bonbons, setBonbons] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTastes, setAvailableTastes] = useState<string[]>([]);
  const [filters, setFilters] = useState<BonbonFiltersState>({
    tastes: [],
    sortBy: 'default'
  });

  // Bonbonları yükle
  useEffect(() => {
    async function loadBonbons() {
      try {
        setLoading(true);
        const [data, tastes] = await Promise.all([
          getBonbons(),
          getTasteProfiles()
        ]);
        setBonbons(data);
        setAvailableTastes(tastes);
      } catch (err) {
        setError('Bonbonlar yüklenirken bir hata oluştu');
        console.error('Bonbon yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBonbons();
  }, []);

  // Filtrelenmiş ve sıralanmış bonbonlar
  const filteredBonbons = useMemo(() => {
    let result = [...bonbons];

    // Tat filtresi
    if (filters.tastes.length > 0) {
      result = result.filter(bonbon =>
        filters.tastes.some(taste =>
          bonbon.attributes?.includes(taste)
        )
      );
    }

    // Sıralama
    switch (filters.sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
        break;
      case 'name-desc':
        result.sort((a, b) => b.title.localeCompare(a.title, 'tr'));
        break;
      case 'popular':
        // sortOrder'ı popülerlik proxy'si olarak kullan
        result.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
        break;
      default:
        // Varsayılan sıralama (sortOrder)
        result.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
    }

    return result;
  }, [bonbons, filters]);

  // Tat filtresi ayarla
  const setTasteFilter = useCallback((tastes: TasteProfile[]) => {
    setFilters(prev => ({ ...prev, tastes }));
  }, []);

  // Tek tat toggle
  const toggleTaste = useCallback((taste: TasteProfile) => {
    setFilters(prev => ({
      ...prev,
      tastes: prev.tastes.includes(taste)
        ? prev.tastes.filter(t => t !== taste)
        : [...prev.tastes, taste]
    }));
  }, []);

  // Sıralama ayarla
  const setSortBy = useCallback((sortBy: BonbonSortOption) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  // Filtreleri temizle
  const clearFilters = useCallback(() => {
    setFilters({ tastes: [], sortBy: 'default' });
  }, []);

  return {
    bonbons,
    filteredBonbons,
    loading,
    error,
    filters,
    availableTastes,
    setTasteFilter,
    toggleTaste,
    setSortBy,
    clearFilters
  };
}

interface UseBonbonDetailReturn {
  bonbon: Product | null;
  relatedBonbons: Product[];
  loading: boolean;
  error: string | null;
}

/**
 * Tek bonbon detayı hook'u
 * @param slugOrId - URL parametresinden gelen slug veya ID
 */
export function useBonbonDetail(slugOrId: string | undefined): UseBonbonDetailReturn {
  const [bonbon, setBonbon] = useState<Product | null>(null);
  const [relatedBonbons, setRelatedBonbons] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugOrId) {
      setLoading(false);
      setError('Bonbon bulunamadı');
      return;
    }

    async function loadBonbon() {
      try {
        setLoading(true);
        setError(null);

        const data = await getBonbonBySlug(slugOrId);

        if (!data) {
          setError('Bonbon bulunamadı');
          setBonbon(null);
          setRelatedBonbons([]);
          return;
        }

        setBonbon(data);

        // İlgili bonbonları yükle
        const related = await getRelatedBonbons(data, 4);
        setRelatedBonbons(related);

      } catch (err) {
        setError('Bonbon yüklenirken bir hata oluştu');
        console.error('Bonbon detay yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBonbon();
  }, [slugOrId]);

  return { bonbon, relatedBonbons, loading, error };
}

interface UseBonbonCardConfigReturn {
  config: BonbonConfig;
  loading: boolean;
}

/**
 * Bonbon koleksiyon kartı config hook'u
 */
export function useBonbonCardConfig(): UseBonbonCardConfigReturn {
  const [config, setConfig] = useState<BonbonConfig>({
    cardTitle: 'Bonbon Koleksiyonu',
    cardSubtitle: 'Her biri özenle hazırlanmış eşsiz tatlar',
    ctaText: 'Koleksiyonu Keşfet'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await getBonbonConfig();
        setConfig(data);
      } catch (err) {
        console.error('Bonbon config yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  return { config, loading };
}
