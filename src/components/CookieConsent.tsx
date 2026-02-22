import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Settings, Cookie, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CookiePreferences } from '../utils/cookieConsent';

// Consent değişikliğini dinlemek için custom event
export const CONSENT_CHANGED_EVENT = 'cookie_consent_changed';

export const dispatchConsentChange = (preferences: CookiePreferences) => {
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: preferences }));
};

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const savePreferences = useCallback((analytics: boolean, marketing: boolean) => {
    const preferences: CookiePreferences = {
      essential: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie_consent', JSON.stringify(preferences));
    setIsVisible(false);
    setShowSettings(false);
    // Tracking servislerini bilgilendir
    dispatchConsentChange(preferences);
  }, []);

  const handleAcceptAll = () => savePreferences(true, true);
  const handleRejectAll = () => savePreferences(false, false);
  const handleSaveCustom = () => savePreferences(analyticsEnabled, marketingEnabled);

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
            className="fixed bottom-0 left-0 right-0 z-[2000] bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col gap-3">
                {/* Icon + Text */}
                <div className="flex items-start gap-3">
                  <Shield className="text-gold mt-0.5 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Zorunlu çerezler sitenin çalışması için gereklidir.
                      Analitik ve pazarlama çerezleri yalnızca onayınızla etkinleşir.{' '}
                      <Link to="/legal/privacy" className="text-gold hover:underline font-medium">
                        Gizlilik Politikası
                      </Link>
                      {' '}ve{' '}
                      <Link to="/legal/cookies" className="text-gold hover:underline font-medium">
                        Çerez Politikası
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 justify-end flex-wrap">
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors"
                  >
                    Reddet
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors"
                  >
                    <Settings size={14} />
                    Tercihler
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-6 py-2 bg-gold text-white text-xs font-black uppercase tracking-wider rounded-lg hover:bg-brown-900 transition-all shadow-sm"
                  >
                    Tümünü Kabul Et
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2010]"
              onClick={() => setShowSettings(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[2020] flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cookie className="text-gold" size={24} />
                    <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                      Çerez Tercihleri
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
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    6698 sayılı KVKK kapsamında çerez tercihlerinizi aşağıdan yönetebilirsiniz.
                    Zorunlu çerezler devre dışı bırakılamaz.
                  </p>

                  {/* Zorunlu */}
                  <CookieCategory
                    title="Zorunlu Çerezler"
                    description="Sepet, oturum yönetimi ve temel site işlevleri için gereklidir. Bu çerezler olmadan site düzgün çalışamaz."
                    alwaysOn
                  />

                  {/* Analitik */}
                  <CookieCategory
                    title="Analitik Çerezler"
                    description="Ziyaretçi istatistikleri ve site kullanım analizleri için kullanılır (Google Analytics). Kişisel bilgileriniz anonim olarak işlenir."
                    enabled={analyticsEnabled}
                    onToggle={setAnalyticsEnabled}
                  />

                  {/* Pazarlama */}
                  <CookieCategory
                    title="Pazarlama Çerezleri"
                    description="Size özel teklifler sunmak ve reklam performansını ölçmek için kullanılır (Meta Pixel). Verileriniz üçüncü taraflarla paylaşılabilir."
                    enabled={marketingEnabled}
                    onToggle={setMarketingEnabled}
                  />
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between gap-3">
                  <button
                    onClick={handleRejectAll}
                    className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-brown-900 dark:hover:text-gold transition-colors"
                  >
                    Tümünü Reddet
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveCustom}
                      className="px-6 py-3 border border-gold text-gold text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gold hover:text-white transition-all"
                    >
                      Seçimi Kaydet
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="px-6 py-3 bg-gold text-white text-xs font-black uppercase tracking-wider rounded-lg hover:bg-brown-900 transition-all shadow-sm"
                    >
                      Tümünü Kabul Et
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Toggle switch bileşeni
type CookieCategoryProps = {
  title: string;
  description: string;
  alwaysOn?: boolean;
  enabled?: boolean;
  onToggle?: (value: boolean) => void;
};

const CookieCategory: React.FC<CookieCategoryProps> = ({
  title, description, alwaysOn, enabled, onToggle
}) => (
  <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>
      {alwaysOn ? (
        <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full whitespace-nowrap">
          Her Zaman Aktif
        </span>
      ) : (
        <button
          onClick={() => onToggle?.(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
            enabled ? 'bg-gold' : 'bg-gray-300 dark:bg-gray-600'
          }`}
          role="switch"
          aria-checked={enabled}
          aria-label={title}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      )}
    </div>
  </div>
);
