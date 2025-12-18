import React from 'react';
import { useLocation, Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const { cartCount, setIsCartOpen } = useCart();
  const { t } = useLanguage();

  const navLinks = [
    { path: '/home', label: t('menu_home') },
    { path: '/catalog', label: t('menu_collections') },
    { path: '/about', label: t('menu_about') },
    { path: '/favorites', label: t('menu_wishlist') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-dark-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
        
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-900 dark:text-white hover:text-brown-900 transition-colors"
        >
          <span className="material-icons-outlined text-2xl">menu</span>
        </button>

        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 group">
          <div className="font-display font-bold text-xl lg:text-2xl tracking-tight text-brown-900 dark:text-white transition-transform group-hover:scale-105">
            Sade <span className="font-medium italic text-gold">Chocolate</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-10">
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

        {/* Right Actions */}
        <div className="flex items-center space-x-1 lg:space-x-4">
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