import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';

export const NotFound: React.FC = () => {
  return (
    <>
      <SEOHead title="Sayfa Bulunamadı - 404" />
      <div className="min-h-screen flex items-center justify-center bg-cream-100 dark:bg-dark-900 px-4">
        <div className="text-center max-w-md">
          <p className="text-8xl font-bold text-mocha-200 dark:text-dark-700 mb-4">404</p>
          <h1 className="text-2xl font-semibold text-mocha-800 dark:text-cream-100 mb-3">
            Sayfa Bulunamadı
          </h1>
          <p className="text-mocha-500 dark:text-gray-400 mb-8">
            Aradığınız sayfa taşınmış veya kaldırılmış olabilir.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-6 py-3 bg-mocha-800 text-white rounded-xl text-sm font-medium hover:bg-mocha-700 transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
            <Link
              to="/catalog"
              className="px-6 py-3 bg-cream-200 text-mocha-800 rounded-xl text-sm font-medium hover:bg-cream-300 transition-colors"
            >
              Koleksiyonu Keşfet
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
