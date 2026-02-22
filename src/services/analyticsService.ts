import { logEvent } from 'firebase/analytics';
import { analytics } from '../lib/firebase';
import { canLoadAnalytics } from '../utils/cookieConsent';

// GA4 E-commerce event'leri
// https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
// KVKK uyumu: Tüm event'ler cookie onayı kontrolünden geçer

type ProductItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
};

// Analytics izni kontrolü
const canTrack = (): boolean => {
  return !!analytics && canLoadAnalytics();
};

// Ürün görüntüleme
export function trackViewItem(product: ProductItem) {
  if (!canTrack()) return;
  logEvent(analytics!, 'view_item', {
    currency: 'TRY',
    value: product.price,
    items: [product]
  });
}

// Ürün listesi görüntüleme
export function trackViewItemList(items: ProductItem[], listName: string) {
  if (!canTrack()) return;
  logEvent(analytics!, 'view_item_list', {
    item_list_name: listName,
    items: items.slice(0, 10) // GA4 max 10 item
  });
}

// Sepete ekleme
export function trackAddToCart(product: ProductItem) {
  if (!canTrack()) return;
  logEvent(analytics!, 'add_to_cart', {
    currency: 'TRY',
    value: product.price * (product.quantity || 1),
    items: [product]
  });
}

// Sepetten çıkarma
export function trackRemoveFromCart(product: ProductItem) {
  if (!canTrack()) return;
  logEvent(analytics!, 'remove_from_cart', {
    currency: 'TRY',
    value: product.price * (product.quantity || 1),
    items: [product]
  });
}

// Checkout başlama
export function trackBeginCheckout(items: ProductItem[], total: number) {
  if (!canTrack()) return;
  logEvent(analytics!, 'begin_checkout', {
    currency: 'TRY',
    value: total,
    items
  });
}

// Satın alma tamamlandı
export function trackPurchase(transactionId: string, items: ProductItem[], total: number, shipping: number) {
  if (!canTrack()) return;
  logEvent(analytics!, 'purchase', {
    transaction_id: transactionId,
    currency: 'TRY',
    value: total,
    shipping,
    items
  });
}

// Arama
export function trackSearch(searchTerm: string) {
  if (!canTrack()) return;
  logEvent(analytics!, 'search', {
    search_term: searchTerm
  });
}

// Sayfa görüntüleme
export function trackPageView(pageName: string) {
  if (!canTrack()) return;
  logEvent(analytics!, 'page_view', {
    page_title: pageName
  });
}
