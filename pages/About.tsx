import React from 'react';
import { HERO_IMAGE } from '../constants';
import { useLanguage } from '../context/LanguageContext';

export const About: React.FC = () => {
  const { t } = useLanguage();

  return (
    <main className="pt-24 max-w-md mx-auto pb-24 bg-white dark:bg-dark-900 min-h-screen px-5">
      <div className="animate-fade-in">
        <span className="font-sans text-xs font-bold tracking-[0.2em] text-brown-900 dark:text-brown-400 uppercase mb-3 block">{t('about_us')}</span>
        <h1 className="font-display text-4xl text-gray-900 dark:text-white mb-8 leading-tight whitespace-pre-line">
            {t('minimalism_passion')}
        </h1>
        
        <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-dark-800 mb-10 overflow-hidden relative group">
          <img 
              src={HERO_IMAGE} 
              alt="Artisan chocolate making"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="prose dark:prose-invert font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          <p className="mb-6 drop-cap first-letter:float-left first-letter:text-4xl first-letter:pr-2 first-letter:font-display first-letter:text-brown-900 dark:first-letter:text-white">
              {t('about_text_1')}
          </p>
          <p className="mb-6">
              {t('about_text_2')}
          </p>
          <div className="my-8 border-l-2 border-gold pl-4 py-1">
            <p className="italic font-display text-lg text-gray-800 dark:text-gray-200">
                {t('about_quote')}
            </p>
          </div>
          <p className="mb-6">
              {t('about_text_3')}
          </p>
          <p>
              {t('about_text_4')}
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
            <h3 className="font-display text-xl text-gray-900 dark:text-white mb-4">{t('workshop')}</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-dark-800 p-4 text-center">
                    <span className="block text-2xl font-display text-brown-900 dark:text-gold mb-1">2</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">{t('ingredients')}</span>
                </div>
                <div className="bg-gray-50 dark:bg-dark-800 p-4 text-center">
                    <span className="block text-2xl font-display text-brown-900 dark:text-gold mb-1">%100</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">{t('natural')}</span>
                </div>
                <div className="bg-gray-50 dark:bg-dark-800 p-4 text-center">
                    <span className="block text-2xl font-display text-brown-900 dark:text-gold mb-1">72</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">{t('conching')}</span>
                </div>
                <div className="bg-gray-50 dark:bg-dark-800 p-4 text-center">
                    <span className="block text-2xl font-display text-brown-900 dark:text-gold mb-1">El</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">{t('handmade')}</span>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
};