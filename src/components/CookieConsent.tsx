import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Settings, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // 1 saniye bekle, sayfa yüklendikten sonra göster
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleCustomSave = (essential: boolean, analytics: boolean, marketing: boolean) => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      essential,
      analytics,
      marketing,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
    setShowSettings(false);
  };

  return (
    <>
      {/* Cookie Banner */}
      <AnimatePresence>
        {isVisible && !showSettings && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Icon + Text */}
                <div className="flex items-start gap-3 flex-1">
                  <Cookie className="text-gold mt-1 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Bu site, deneyiminizi iyileştirmek ve hizmetlerimizi geliştirmek için çerezler kullanır.{' '}
                      <Link to="/legal/privacy" className="text-gold hover:underline font-medium">
                        Gizlilik Politikası
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors"
                  >
                    <Settings size={14} />
                    Ayarlar
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-6 py-2 bg-gold text-white text-xs font-black uppercase tracking-wider rounded-lg hover:bg-brown-900 transition-all shadow-sm"
                  >
                    Kabul Et
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
              onClick={() => setShowSettings(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cookie className="text-gold" size={24} />
                    <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                      Çerez Ayarları
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Web sitemizde kullanılan çerezleri kategorilere göre yönetebilirsiniz.
                    Zorunlu çerezler sitenin çalışması için gereklidir ve devre dışı bırakılamaz.
                  </p>

                  {/* Essential Cookies */}
                  <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                          Zorunlu Çerezler
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sepet, oturum ve temel site işlevleri için gereklidir.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                        Her Zaman Aktif
                      </span>
                    </div>
                  </div>

                  {/* Analytics Cookies (Gelecek için hazır) */}
                  <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-gray-700 opacity-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                          Analitik Çerezler
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Site kullanımını analiz eder ve iyileştirmeler yapmamıza yardımcı olur.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        Yakında
                      </span>
                    </div>
                  </div>

                  {/* Marketing Cookies (Gelecek için hazır) */}
                  <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-gray-700 opacity-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                          Pazarlama Çerezleri
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Size özel teklifler ve kampanyalar sunmak için kullanılır.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        Yakında
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="sticky bottom-0 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between gap-3">
                  <button
                    onClick={handleEssentialOnly}
                    className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors"
                  >
                    Sadece Zorunlu
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-8 py-3 bg-gold text-white text-xs font-black uppercase tracking-wider rounded-lg hover:bg-brown-900 transition-all shadow-sm"
                  >
                    Tümünü Kabul Et
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
