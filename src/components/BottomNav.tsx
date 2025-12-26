import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const BottomNav: React.FC = () => {
  const { t } = useLanguage();
  
  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
      isActive ? 'text-brown-900 dark:text-gold' : 'text-gray-400 hover:text-brown-900 dark:hover:text-white'
    }`;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-gray-800 pb-safe z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center h-16 px-2">
        <NavLink to="/home" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
          isActive ? 'text-brown-900 dark:text-white' : 'text-gray-400 hover:text-brown-900 dark:hover:text-white'
        }`}>
          <div className="font-display font-bold text-sm tracking-tight">
            Sade <span className="font-medium italic text-gold">Chocolate</span>
          </div>
        </NavLink>
        <NavLink to="/catalog" className={getLinkClass}>
          <span className="material-icons-outlined text-2xl">grid_view</span>
          <span className="text-[10px] mt-1 font-bold uppercase tracking-widest">{t('catalog')}</span>
        </NavLink>
        <NavLink to="/favorites" className={getLinkClass}>
          <span className="material-icons-outlined text-2xl">favorite_border</span>
          <span className="text-[10px] mt-1 font-bold uppercase tracking-widest">{t('wishlist')}</span>
        </NavLink>
        <NavLink to="/account" className={getLinkClass}>
          <span className="material-icons-outlined text-2xl">person_outline</span>
          <span className="text-[10px] mt-1 font-bold uppercase tracking-widest">{t('account')}</span>
        </NavLink>
      </div>
    </nav>
  );
};