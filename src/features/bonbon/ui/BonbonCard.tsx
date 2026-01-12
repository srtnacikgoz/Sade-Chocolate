// features/bonbon/ui/BonbonCard.tsx
// Tek bonbon kartı - liste görünümü için

import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../../types';

interface BonbonCardProps {
  bonbon: Product;
}

export function BonbonCard({ bonbon }: BonbonCardProps) {
  const { id, title, description, image, alternateImage, attributes } = bonbon;
  const [isHovered, setIsHovered] = useState(false);

  // Hover durumuna göre görseli belirle
  const currentImage = isHovered && alternateImage ? alternateImage : image;

  return (
    <Link
      to={`/bonbonlar/${id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <article className="bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg">
        {/* Görsel - 1:1 aspect ratio, üstten çekim */}
        <div className="relative aspect-square overflow-hidden bg-cream-50">
          {currentImage ? (
            <img
              src={currentImage}
              alt={title}
              className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-mocha-300">
              <svg
                className="w-16 h-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-mocha-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* İçerik */}
        <div className="p-4">
          {/* Başlık */}
          <h3 className="font-serif text-lg text-mocha-900 group-hover:text-gold-600 transition-colors line-clamp-1">
            {title}
          </h3>

          {/* Açıklama */}
          {description && (
            <p className="mt-1 text-sm text-mocha-600 line-clamp-2">
              {description}
            </p>
          )}

          {/* Tat profili badge'leri */}
          {attributes && attributes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {attributes.slice(0, 3).map((attr) => (
                <span
                  key={attr}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-cream-100 text-mocha-700 rounded"
                >
                  {attr}
                </span>
              ))}
              {attributes.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-cream-100 text-mocha-500 rounded">
                  +{attributes.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
