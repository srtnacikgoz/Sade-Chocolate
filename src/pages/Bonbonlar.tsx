// pages/Bonbonlar.tsx
// Bonbon koleksiyonu liste sayfası

import { useBonbons, BonbonGrid, BonbonFilters } from '../features/bonbon';

export default function Bonbonlar() {
  const {
    filteredBonbons,
    bonbons,
    loading,
    error,
    filters,
    availableTastes,
    toggleTaste,
    setSortBy,
    clearFilters
  } = useBonbons();

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-mocha-900 to-mocha-800 text-white pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4">
              Bonbon Koleksiyonu
            </h1>
            <p className="text-cream-200 text-lg md:text-xl max-w-2xl mx-auto">
              Her biri ustaca hazırlanmış, benzersiz tat kombinasyonlarıyla
              özenle üretilen bonbonlarımızı keşfedin.
            </p>
          </div>
        </div>
      </section>

      {/* Ana İçerik */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hata mesajı */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Filtreler */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
          <BonbonFilters
            selectedTastes={filters.tastes}
            availableTastes={availableTastes}
            sortBy={filters.sortBy}
            onToggleTaste={toggleTaste}
            onSortChange={setSortBy}
            onClearFilters={clearFilters}
            totalCount={bonbons.length}
            filteredCount={filteredBonbons.length}
          />
        </div>

        {/* Bonbon Grid */}
        <BonbonGrid
          bonbons={filteredBonbons}
          loading={loading}
        />
      </main>
    </div>
  );
}
