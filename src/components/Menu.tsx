import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Menu: React.FC<MenuProps> = ({ isOpen, onClose }) => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-dark-900 z-[70] shadow-2xl transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-8 relative overflow-hidden">
          <div className="flex justify-between items-center mb-12 relative z-10">
            <div className="font-display font-bold text-2xl tracking-tight text-brown-900 dark:text-white">Sade</div>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-brown-900 transition-colors">
              <span className="material-icons-outlined text-2xl">close</span>
            </button>
          </div>

          <nav className="flex flex-col space-y-5 relative z-10">
             <NavLink to="/catalog" onClick={onClose} className={({isActive}) => `font-display text-3xl transition-all ${isActive ? 'text-brown-900 dark:text-white translate-x-2' : 'text-gray-300 hover:text-brown-900'}`}>{t('menu_collections')}</NavLink>
             <NavLink to="/tasting-quiz" onClick={onClose} className={({isActive}) => `font-display text-3xl transition-all flex items-center gap-2 ${isActive ? 'text-brown-900 dark:text-white translate-x-2' : 'text-gray-300 hover:text-brown-900'}`}>
               <span>Damak Tadı</span>
               <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">Yeni</span>
             </NavLink>
             <NavLink to="/favorites" onClick={onClose} className={({isActive}) => `font-display text-3xl transition-all ${isActive ? 'text-brown-900 dark:text-white translate-x-2' : 'text-gray-300 hover:text-brown-900'}`}>{t('menu_wishlist')}</NavLink>
             <NavLink to="/account" onClick={onClose} className={({isActive}) => `font-display text-3xl transition-all ${isActive ? 'text-brown-900 dark:text-white translate-x-2' : 'text-gray-300 hover:text-brown-900'}`}>{t('menu_account')}</NavLink>
          </nav>

          <div className="mt-8 mb-4 relative z-10">
             <div className="flex space-x-4">
                 {['tr', 'en', 'ru'].map(l => (
                     <button key={l} onClick={() => setLanguage(l as any)} className={`text-sm font-bold ${language === l ? 'text-brown-900 dark:text-white underline underline-offset-4' : 'text-gray-300'}`}>{l.toUpperCase()}</button>
                 ))}
             </div>
          </div>

          {/* Safe Area Optimasyonu: Alt kısım pb-safe benzeri padding ile korundu */}
          <div className="mt-auto relative z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
            <div className="flex flex-col space-y-3 font-sans text-sm text-gray-500 mb-8">
                <NavLink to="/about" onClick={onClose} className="hover:text-brown-900 transition-colors">{t('menu_about')}</NavLink>
                <a href="mailto:bilgi@sadepatisserie.com" className="hover:text-brown-900 transition-colors">{t('menu_contact')}</a>
            </div>
            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full mb-6"></div>
            <div className="flex justify-between items-center">
                 <div className="flex space-x-4 text-gray-400">
                    <span className="material-icons-outlined text-xl">place</span>
                    <span className="material-icons-outlined text-xl">camera_alt</span>
                 </div>
                 <span className="text-[10px] text-gray-300 tracking-widest">v1.2.0</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};