import React from 'react';

export const Maintenance: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900 flex items-center justify-center p-6">
      {/* Minimal Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brown-900/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <img
            src="/kakaologo.png"
            alt="Sade Chocolate"
            className="w-16 h-16 opacity-80 dark:invert"
          />
          <div className="text-4xl tracking-tight">
            <span className="font-santana font-bold text-brown-900 dark:text-white">Sade</span>{' '}
            <span className="font-santana font-normal text-gold">Chocolate</span>
          </div>
        </div>

        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-8 bg-gold/10 rounded-full flex items-center justify-center">
          <span className="material-icons-outlined text-4xl text-gold">construction</span>
        </div>

        {/* Message */}
        <h1 className="font-display text-3xl md:text-4xl text-brown-900 dark:text-white italic mb-4">
          Bakımdayız
        </h1>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          Sitemizi sizin için daha iyi hale getirmek üzere kısa bir bakım çalışması yapıyoruz.
          Çok yakında tekrar burada olacağız.
        </p>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-12 h-px bg-gold/30" />
          <div className="w-2 h-2 rounded-full bg-gold/50" />
          <div className="w-12 h-px bg-gold/30" />
        </div>

        {/* Contact Info */}
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Acil durumlar için:{' '}
          <a href="mailto:bilgi@sadechocolate.com" className="text-gold hover:underline">
            bilgi@sadechocolate.com
          </a>
        </p>
      </div>
    </div>
  );
};
