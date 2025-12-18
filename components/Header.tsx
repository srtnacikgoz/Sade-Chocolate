import React from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const isHome = location.pathname === '/home';
  const { cartCount, setIsCartOpen } = useCart();
  const { t } = useLanguage();

  // Home Header Style
  if (isHome) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-dark-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-md mx-auto px-5 h-16 flex items-center justify-between">
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-900 dark:text-white hover:text-brown-900 transition-colors"
          >
            <span className="material-icons-outlined text-2xl">menu</span>
          </button>
          <div className="font-display font-bold text-xl tracking-tight text-brown-900 dark:text-white">
            Sade <span className="font-medium italic text-gold">Chocolate</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2 -mr-2 text-gray-900 dark:text-white hover:text-brown-900 transition-colors relative"
          >
            <span className="material-icons-outlined text-2xl">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brown-900 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white dark:border-dark-900">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>
    );
  }

  // Catalog/Default Header Style
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-icons-outlined text-2xl text-gray-900 dark:text-white">menu</span>
        </button>
        <div className="flex-1 flex justify-center">
          <h1 className="font-display text-lg font-bold tracking-wide text-gray-900 dark:text-white">
            Sade <span className="font-medium italic text-gold">Chocolate</span>
          </h1>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2 -mr-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative"
          >
            <span className="material-icons-outlined text-2xl text-gray-900 dark:text-white">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gold text-white text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-dark-900">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};