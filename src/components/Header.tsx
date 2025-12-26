import React from 'react';
import { useLocation, Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void; // Yeni prop
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onSearchClick }) => {  const location = useLocation();
  const { cartCount, setIsCartOpen } = useCart();
  const { t } = useLanguage();

  const navLinks = [
    { path: '/catalog', label: t('menu_collections') },
    { path: '/about', label: t('menu_about') },
    { path: '/favorites', label: t('menu_wishlist') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-dark-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
      <div className="w-full px-8 lg:px-12 h-16 lg:h-20 flex items-center justify-between">

        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-900 dark:text-white hover:text-brown-900 transition-colors"
        >
          <span className="material-icons-outlined text-2xl">menu</span>
        </button>

        {/* Desktop Navigation (Center) - Logo as First Item */}
        <nav className="hidden lg:flex items-center space-x-10 absolute left-1/2 transform -translate-x-1/2">
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="font-display font-bold text-xl lg:text-2xl tracking-tight">
              <span className="text-brown-900 dark:text-white group-hover:text-gold transition-colors">Sade</span> <span className="font-medium italic text-gold group-hover:text-brown-900 dark:group-hover:text-white transition-colors">Chocolate</span>
            </div>
          </Link>
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({isActive}) => `text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:text-gold ${isActive ? 'text-brown-900 dark:text-gold' : 'text-gray-400'}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Logo (Center) */}
        <Link to="/home" className="lg:hidden flex items-center gap-2 group absolute left-1/2 transform -translate-x-1/2">
          <div className="font-display font-bold text-xl tracking-tight">
            <span className="text-brown-900 dark:text-white group-hover:text-gold transition-colors">Sade</span> <span className="font-medium italic text-gold group-hover:text-brown-900 dark:group-hover:text-white transition-colors">Chocolate</span>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center space-x-1 lg:space-x-4 ml-auto">
          {/* 🔍 Search Trigger */}
          <button 
            onClick={onSearchClick}
            className="p-2 text-gray-900 dark:text-white hover:text-gold transition-all group"
          >
            <span className="material-icons-outlined text-2xl group-hover:scale-110 transition-transform">search</span>
          </button>
          <Link to="/account" className="hidden lg:flex items-center gap-2 text-gray-400 hover:text-brown-900 dark:hover:text-white transition-colors">
            <span className="material-icons-outlined text-2xl">person_outline</span>
          </Link>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2 -mr-2 text-gray-900 dark:text-white hover:text-brown-900 transition-colors relative group"
          >
            <span className="material-icons-outlined text-2xl group-hover:scale-110 transition-transform">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 lg:top-1.5 lg:right-1.5 w-4 h-4 bg-brown-900 dark:bg-gold text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white dark:border-dark-900 shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};