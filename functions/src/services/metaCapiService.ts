/**
 * Meta Conversions API (CAPI) Service
 *
 * Server-side event gönderimi. Browser Pixel ile birlikte çalışır.
 * event_id ile deduplication sağlanır.
 *
 * Gereksinimler:
 * - META_PIXEL_ID: Pixel ID (Secret Manager veya env)
 * - META_ACCESS_TOKEN: System User Access Token (Secret Manager)
 *
 * Kurulum:
 * 1. Meta projesinden Access Token al
 * 2. firebase functions:secrets:set META_ACCESS_TOKEN
 * 3. firebase functions:secrets:set META_PIXEL_ID
 */

import axios from 'axios';
import * as crypto from 'crypto';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// SHA256 hash (Meta CAPI standardı)
const hashValue = (value: string): string => {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
};

type UserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
};

type EventData = {
  eventName: string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  userData: UserData;
  customData?: Record<string, unknown>;
  actionSource?: 'website' | 'app' | 'email';
};

// CAPI event'i gönder
const sendEvent = async (event: EventData): Promise<{ success: boolean; error?: string }> => {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('Meta CAPI: PIXEL_ID veya ACCESS_TOKEN tanımlı değil, event gönderilmedi');
    return { success: false, error: 'Missing credentials' };
  }

  // User data hash'le (Meta CAPI standardı)
  const userData: Record<string, string> = {};
  if (event.userData.email) userData.em = hashValue(event.userData.email);
  if (event.userData.phone) userData.ph = hashValue(event.userData.phone.replace(/\D/g, ''));
  if (event.userData.firstName) userData.fn = hashValue(event.userData.firstName);
  if (event.userData.lastName) userData.ln = hashValue(event.userData.lastName);
  if (event.userData.city) userData.ct = hashValue(event.userData.city);
  if (event.userData.clientIpAddress) userData.client_ip_address = event.userData.clientIpAddress;
  if (event.userData.clientUserAgent) userData.client_user_agent = event.userData.clientUserAgent;
  if (event.userData.fbc) userData.fbc = event.userData.fbc;
  if (event.userData.fbp) userData.fbp = event.userData.fbp;

  const payload = {
    data: [{
      event_name: event.eventName,
      event_time: event.eventTime || Math.floor(Date.now() / 1000),
      event_id: event.eventId,
      event_source_url: event.eventSourceUrl || 'https://sadechocolate.com',
      action_source: event.actionSource || 'website',
      user_data: userData,
      custom_data: event.customData || {},
    }],
  };

  try {
    await axios.post(
      `${GRAPH_API_URL}/${pixelId}/events?access_token=${accessToken}`,
      payload
    );
    console.log(`Meta CAPI: ${event.eventName} gönderildi (event_id: ${event.eventId})`);
    return { success: true };
  } catch (error: any) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error(`Meta CAPI hatası (${event.eventName}):`, errMsg);
    return { success: false, error: errMsg };
  }
};

// --- Cloud Function: Purchase event'i server-side gönder ---
export const sendCapiPurchase = async (order: {
  orderId: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  items: { id: string; quantity: number; price: number }[];
  total: number;
  eventId: string;
  sourceUrl?: string;
  fbc?: string;
  fbp?: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  return sendEvent({
    eventName: 'Purchase',
    eventId: order.eventId,
    eventSourceUrl: order.sourceUrl,
    userData: {
      email: order.email,
      phone: order.phone,
      firstName: order.firstName,
      lastName: order.lastName,
      city: order.city,
      clientIpAddress: order.ipAddress,
      clientUserAgent: order.userAgent,
      fbc: order.fbc,
      fbp: order.fbp,
    },
    customData: {
      currency: 'TRY',
      value: order.total,
      content_ids: order.items.map(i => i.id),
      content_type: 'product',
      num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
      contents: order.items.map(i => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
      order_id: order.orderId,
    },
  });
};

// --- Cloud Function: AddToCart server-side (opsiyonel, yüksek değerli event) ---
export const sendCapiAddToCart = async (data: {
  email?: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  eventId: string;
  sourceUrl?: string;
  fbc?: string;
  fbp?: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  return sendEvent({
    eventName: 'AddToCart',
    eventId: data.eventId,
    eventSourceUrl: data.sourceUrl,
    userData: {
      email: data.email,
      clientIpAddress: data.ipAddress,
      clientUserAgent: data.userAgent,
      fbc: data.fbc,
      fbp: data.fbp,
    },
    customData: {
      currency: 'TRY',
      value: data.price * data.quantity,
      content_ids: [data.productId],
      content_type: 'product',
      contents: [{ id: data.productId, quantity: data.quantity, item_price: data.price }],
    },
  });
};
