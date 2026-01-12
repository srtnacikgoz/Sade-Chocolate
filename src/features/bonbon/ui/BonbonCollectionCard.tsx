// features/bonbon/ui/BonbonCollectionCard.tsx
// Katalog sayfasında gösterilen bonbon koleksiyon kartı - ProductCard tarzı

import { Link } from 'react-router-dom';
import { Candy } from 'lucide-react';
import { useBonbonCardConfig } from '../model/useBonbons';
import { BrandIcon } from '../../../components/ui/BrandIcon';

interface BonbonCollectionCardProps {
  className?: string;
}

export function BonbonCollectionCard({ className = '' }: BonbonCollectionCardProps) {
  const { config, loading } = useBonbonCardConfig();

  return (
    <Link
      to="/bonbonlar"
      className={`group block ${className}`}
    >
      <article className="bg-cream-50 dark:bg-dark-800 rounded-xl shadow-luxurious hover:shadow-hover transition-all duration-500 overflow-hidden flex flex-col h-full border border-gold/15 relative">
        {/* Görsel Alanı - ProductCard ile aynı */}
        <div className="relative aspect-[4/5] bg-[#F9F9F9] dark:bg-gray-800 overflow-hidden">
          {/* Rozet */}
          <span className="absolute top-0 left-0 text-[10px] font-bold px-3 py-1 uppercase tracking-widest z-20 bg-mocha-800 text-white">
            Koleksiyon
          </span>

          {/* Görsel veya Varsayılan İkon */}
          {loading ? (
            <div className="w-full h-full bg-cream-100 animate-pulse" />
          ) : config.cardImage ? (
            <img
              src={config.cardImage}
              alt={config.cardTitle}
              className="w-full h-full object-cover object-center group-hover:scale-110 transition-all duration-300 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mocha-100 to-mocha-200 dark:from-mocha-900/20 dark:to-mocha-800/30">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-mocha-600 to-mocha-800 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Candy className="text-white" size={48} />
                </div>
                <BrandIcon className="absolute -top-2 -right-2 text-gold drop-shadow-md" size={20} />
              </div>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-mocha-900/0 group-hover:bg-mocha-900/5 transition-colors duration-700" />
        </div>

        {/* Alt Bilgiler - ProductCard ile aynı */}
        <div className="p-4 flex flex-col flex-grow relative z-20 bg-cream-50 dark:bg-dark-800">
          <h3 className="font-display text-lg font-semibold leading-tight mb-1 text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[3rem]">
            {config.cardTitle}
          </h3>
          <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
            {config.cardSubtitle}
          </p>

          <div className="mt-auto flex items-center justify-between">
            {/* Alt bilgi */}
            <div className="flex items-center gap-1 text-[9px] font-bold text-gold uppercase tracking-wider">
              <span>Keşfet</span>
              <span className="text-gold/40">•</span>
              <span>Tümünü Gör</span>
            </div>
            {/* Ok butonu */}
            <div className="bg-gold text-white w-9 h-9 flex items-center justify-center rounded-full group-hover:bg-gray-900 dark:group-hover:bg-gray-900 transition-colors duration-300 shadow-sm">
              <span className="material-icons-outlined text-lg">arrow_forward</span>
            </div>
          </div>

          {/* Geniş buton */}
          <button className="w-full mt-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-mocha-900 dark:text-gray-100 border border-gold/20 bg-cream-50 dark:bg-transparent rounded-lg hover:bg-gold hover:text-white hover:border-gold dark:hover:bg-gold transition-all duration-300 shadow-sm">
            {config.ctaText}
          </button>
        </div>
      </article>
    </Link>
  );
}
