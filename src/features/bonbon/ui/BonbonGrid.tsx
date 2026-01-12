// features/bonbon/ui/BonbonGrid.tsx
// Bonbon grid container bileşeni

import type { Product } from '../../../types';
import { BonbonCard } from './BonbonCard';

interface BonbonGridProps {
  bonbons: Product[];
  loading?: boolean;
}

export function BonbonGrid({ bonbons, loading }: BonbonGridProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-cream-200 rounded-lg" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-cream-200 rounded w-3/4" />
              <div className="h-4 bg-cream-100 rounded w-full" />
              <div className="flex gap-1.5">
                <div className="h-5 bg-cream-100 rounded w-16" />
                <div className="h-5 bg-cream-100 rounded w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Boş state
  if (bonbons.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-mocha-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-mocha-800">
          Bonbon bulunamadı
        </h3>
        <p className="mt-1 text-mocha-600">
          Farklı filtreler deneyebilirsiniz
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {bonbons.map((bonbon) => (
        <BonbonCard key={bonbon.id} bonbon={bonbon} />
      ))}
    </div>
  );
}
