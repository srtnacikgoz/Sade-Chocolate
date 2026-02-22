/**
 * Cookie Consent Utility
 *
 * Kullanıcının cookie tercihlerini yönetir.
 * Gelecekte analytics/marketing cookie'leri eklendiğinde bu fonksiyonları kullanabilirsiniz.
 */

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

/**
 * Kullanıcının cookie tercihlerini döndürür
 */
export const getCookieConsent = (): CookiePreferences | null => {
  try {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) return null;
    return JSON.parse(consent) as CookiePreferences;
  } catch (error) {
    console.error('Cookie consent parse error:', error);
    return null;
  }
};

/**
 * Belirli bir cookie kategorisinin onaylı olup olmadığını kontrol eder
 */
export const hasConsent = (category: 'essential' | 'analytics' | 'marketing'): boolean => {
  const consent = getCookieConsent();

  // Onay verilmemişse, sadece essential'a izin ver
  if (!consent) {
    return category === 'essential';
  }

  return consent[category] === true;
};

/**
 * Analytics script'lerini yüklemek için kullan
 *
 * @example
 * ```ts
 * if (canLoadAnalytics()) {
 *   // Google Analytics script'ini yükle
 *   loadGoogleAnalytics();
 * }
 * ```
 */
export const canLoadAnalytics = (): boolean => {
  return hasConsent('analytics');
};

/**
 * Marketing/tracking script'lerini yüklemek için kullan
 *
 * @example
 * ```ts
 * if (canLoadMarketing()) {
 *   // Facebook Pixel script'ini yükle
 *   loadFacebookPixel();
 * }
 * ```
 */
export const canLoadMarketing = (): boolean => {
  return hasConsent('marketing');
};

/**
 * Cookie tercihlerini temizle (test için)
 */
export const clearCookieConsent = (): void => {
  localStorage.removeItem('cookie_consent');
};

/**
 * Cookie onayı verilmiş mi kontrol et
 */
export const hasGivenConsent = (): boolean => {
  return getCookieConsent() !== null;
};

/**
 * Benzersiz event ID üret (Pixel + CAPI deduplication için)
 * Aynı event_id ile gelen browser ve server event'ler Meta tarafından tekilleştirilir.
 */
export const generateEventId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};
