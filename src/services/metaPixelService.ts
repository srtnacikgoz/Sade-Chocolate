/**
 * Meta Pixel Servisi
 *
 * Cookie consent onayı olmadan Pixel yüklenmez (KVKK).
 * Event deduplication için her event'e benzersiz event_id verilir.
 * Pixel async yüklendiğinden, tüm event'ler hazır olana kadar bekler.
 * CAPI ile aynı eventId paylaşılarak deduplication sağlanır.
 */

import { canLoadMarketing, generateEventId } from '../utils/cookieConsent';
import { CONSENT_CHANGED_EVENT } from '../components/CookieConsent';

// fbq global tipi
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

// @ts-ignore — Vite env, tsconfig types'a "vite/client" eklenmemiş (mevcut sorun)
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

let pixelReady: Promise<void> | null = null;
let resolvePixelReady: (() => void) | null = null;
let pixelScriptLoaded = false;

// Pixel hazır olduğunda resolve olacak promise
const getPixelReadyPromise = (): Promise<void> => {
  if (!pixelReady) {
    pixelReady = new Promise((resolve) => {
      resolvePixelReady = resolve;
    });
  }
  return pixelReady;
};

// Pixel SDK'yı yükle (sadece marketing consent varsa, tek seferlik)
const loadPixelScript = (): void => {
  if (!PIXEL_ID || pixelScriptLoaded) return;
  pixelScriptLoaded = true;

  // fbq fonksiyonunu hazırla (queue mekanizması)
  const f = window as Window;
  if (!f.fbq) {
    const n: any = (f.fbq = function (...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod.apply(n, args);
      } else {
        n.queue.push(args);
      }
    });

    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [] as unknown[][];
  }

  // Pixel'i başlat (queue'ya gider, script yüklenince işlenir)
  window.fbq('init', PIXEL_ID);

  // Script tag ekle
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.onload = () => {
    if (resolvePixelReady) resolvePixelReady();
  };
  script.onerror = () => {
    console.warn('Meta Pixel script yüklenemedi (ad blocker olabilir)');
    if (resolvePixelReady) resolvePixelReady();
  };

  const firstScript = document.getElementsByTagName('script')[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);
};

// Pixel hazır olana kadar bekle, sonra fbq çağır (max 5sn timeout)
const waitAndTrack = (...args: unknown[]) => {
  if (!canLoadMarketing() || !PIXEL_ID) return;

  const ready = getPixelReadyPromise();
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 5000));

  Promise.race([ready, timeout]).then(() => {
    if (!window.fbq) return;
    try {
      window.fbq(...args);
    } catch {
      // Ad blocker veya script hatası — sessizce devam et
    }
  });
};

// --- YARDIMCI FONKSİYONLAR ---

// Meta cookie'lerini oku (_fbc ve _fbp) — CAPI deduplication için
export function getMetaCookies(): { fbc: string | null; fbp: string | null } {
  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };
  return {
    fbc: getCookie('_fbc'),
    fbp: getCookie('_fbp'),
  };
}

// Re-export generateEventId (capiClient ve Checkout'tan kolay erişim için)
export { generateEventId } from '../utils/cookieConsent';

// --- PUBLIC API ---

// Pixel'i başlat (consent değişikliğini dinle)
export const initMetaPixel = () => {
  if (!PIXEL_ID) return;

  // İlk yüklemede consent varsa hemen başlat
  if (canLoadMarketing()) {
    getPixelReadyPromise();
    loadPixelScript();
  }

  // Consent değişikliğini dinle
  window.addEventListener(CONSENT_CHANGED_EVENT, ((e: CustomEvent) => {
    if (e.detail?.marketing && !pixelReady) {
      getPixelReadyPromise();
      loadPixelScript();
    }
  }) as EventListener);
};

// PageView — Route değişikliğinde
export const trackPixelPageView = () => {
  waitAndTrack('track', 'PageView');
};

// ViewContent — Ürün detay sayfası (eventId döndürür, CAPI ile paylaşım için)
export const trackPixelViewContent = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}, eventId?: string): string => {
  const id = eventId || generateEventId();
  waitAndTrack('track', 'ViewContent', {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    content_category: product.category || 'Çikolata',
    value: product.price,
    currency: 'TRY',
  }, { eventID: id });
  return id;
};

// AddToCart — Sepete ekleme (eventId döndürür)
export const trackPixelAddToCart = (product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}, eventId?: string): string => {
  const id = eventId || generateEventId();
  waitAndTrack('track', 'AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price * product.quantity,
    currency: 'TRY',
    contents: [{ id: product.id, quantity: product.quantity }],
  }, { eventID: id });
  return id;
};

// InitiateCheckout — Checkout başlangıcı (eventId döndürür)
export const trackPixelInitiateCheckout = (items: {
  id: string;
  quantity: number;
  price: number;
}[], total: number, eventId?: string): string => {
  const id = eventId || generateEventId();
  waitAndTrack('track', 'InitiateCheckout', {
    content_ids: items.map(i => i.id),
    content_type: 'product',
    value: total,
    currency: 'TRY',
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    contents: items.map(i => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
  }, { eventID: id });
  return id;
};

// Purchase — Satın alma tamamlandı (eventId döndürür)
export const trackPixelPurchase = (order: {
  orderId: string;
  items: { id: string; quantity: number; price: number }[];
  total: number;
  eventId?: string;
}): string => {
  const id = order.eventId || generateEventId();
  waitAndTrack('track', 'Purchase', {
    content_ids: order.items.map(i => i.id),
    content_type: 'product',
    value: order.total,
    currency: 'TRY',
    num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
    contents: order.items.map(i => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
    order_id: order.orderId,
  }, { eventID: id });
  return id;
};
