// features/bonbon/ui/BonbonFilters.tsx
// Tat profili filtreleme bileşeni

import { X } from 'lucide-react';
import type { TasteProfile, BonbonSortOption } from '../model/types';
import { SORT_OPTIONS } from '../model/types';

interface BonbonFiltersProps {
  selectedTastes: TasteProfile[];
  availableTastes: string[];
  sortBy: BonbonSortOption;
  onToggleTaste: (taste: TasteProfile) => void;
  onSortChange: (sort: BonbonSortOption) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export function BonbonFilters({
  selectedTastes,
  availableTastes,
  sortBy,
  onToggleTaste,
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount
}: BonbonFiltersProps) {
  const hasActiveFilters = selectedTastes.length > 0;

  return (
    <div className="space-y-4">
      {/* Tat Profilleri */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-mocha-700 mr-1">
          Tat Profili:
        </span>

        {availableTastes.map((taste) => {
          const isSelected = selectedTastes.includes(taste as TasteProfile);
          return (
            <button
              key={taste}
              onClick={() => onToggleTaste(taste as TasteProfile)}
              className={`
                inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full
                transition-all duration-200
                ${isSelected
                  ? 'bg-mocha-800 text-white'
                  : 'bg-cream-100 text-mocha-700 hover:bg-cream-200'
                }
              `}
            >
              {taste}
              {isSelected && (
                <X className="ml-1.5 w-3.5 h-3.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Alt Satır: Sıralama ve Temizle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sonuç sayısı */}
          <span className="text-sm text-mocha-600">
            {hasActiveFilters ? (
              <>
                <span className="font-medium">{filteredCount}</span> / {totalCount} bonbon
              </>
            ) : (
              <>
                <span className="font-medium">{totalCount}</span> bonbon
              </>
            )}
          </span>

          {/* Filtreleri temizle */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gold-600 hover:text-gold-700 font-medium transition-colors"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>

        {/* Sıralama */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-mocha-600">
            Sırala:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as BonbonSortOption)}
            className="text-sm border border-cream-200 rounded-md px-2 py-1.5 bg-white text-mocha-800 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
