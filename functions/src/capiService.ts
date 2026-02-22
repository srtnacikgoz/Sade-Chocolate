/**
 * Meta Conversions API — Doğrudan HTTP yaklaşımı (SDK yok, sıfır bağımlılık)
 * Node 20 built-in fetch kullanır.
 */

import * as crypto from 'crypto';

const META_API_VERSION = 'v22.0';

// SHA-256 hash — normalize + hash
export function sha256(value: string): string {
  return crypto.createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

// Telefon numarasını normalize et: sadece rakamlar, ülke kodu dahil
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Türkiye: 0 ile başlıyorsa 90 ekle
  if (digits.startsWith('0') && digits.length === 11) {
    return '9' + digits; // 05xx -> 905xx
  }
  // Zaten 90 ile başlıyorsa olduğu gibi
  if (digits.startsWith('90') && digits.length === 12) {
    return digits;
  }
  return digits;
}

interface CapiUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  fbc?: string;       // _fbc cookie — HASH'LENMEZ
  fbp?: string;       // _fbp cookie — HASH'LENMEZ
  clientIp?: string;   // HASH'LENMEZ
  userAgent?: string;  // HASH'LENMEZ
  externalId?: string;
}

interface CapiCustomData {
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentType?: string;
  orderId?: string;
  numItems?: number;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
}

interface CapiEventParams {
  eventName: string;
  eventId: string;          // Pixel tarafındaki event_id ile AYNI olmalı
  eventSourceUrl?: string;
  userData: CapiUserData;
  customData?: CapiCustomData;
  testEventCode?: string;   // Test modunda kullanılır, production'da undefined
}

export async function sendCapiEvent(
  params: CapiEventParams,
  accessToken: string,
  pixelId: string
): Promise<{ success: boolean; eventsReceived?: number; error?: string }> {

  // user_data oluştur
  const userData: Record<string, unknown> = {};

  // HASH'LENECEK alanlar
  if (params.userData.email) {
    userData.em = [sha256(params.userData.email)];
  }
  if (params.userData.phone) {
    userData.ph = [sha256(normalizePhone(params.userData.phone))];
  }
  if (params.userData.firstName) {
    userData.fn = [sha256(params.userData.firstName)];
  }
  if (params.userData.lastName) {
    userData.ln = [sha256(params.userData.lastName)];
  }
  if (params.userData.city) {
    userData.ct = [sha256(params.userData.city)];
  }
  if (params.userData.externalId) {
    userData.external_id = [sha256(params.userData.externalId)];
  }

  // Sabit: Türkiye
  userData.country = [sha256('tr')];

  // HASH'LENMEyecek alanlar
  if (params.userData.clientIp) {
    userData.client_ip_address = params.userData.clientIp;
  }
  if (params.userData.userAgent) {
    userData.client_user_agent = params.userData.userAgent;
  }
  if (params.userData.fbc) {
    userData.fbc = params.userData.fbc;
  }
  if (params.userData.fbp) {
    userData.fbp = params.userData.fbp;
  }

  // custom_data oluştur
  const customData: Record<string, unknown> = {};
  if (params.customData) {
    if (params.customData.value !== undefined) customData.value = params.customData.value;
    if (params.customData.currency) customData.currency = params.customData.currency;
    if (params.customData.contentIds) customData.content_ids = params.customData.contentIds;
    if (params.customData.contentType) customData.content_type = params.customData.contentType;
    if (params.customData.orderId) customData.order_id = params.customData.orderId;
    if (params.customData.numItems !== undefined) customData.num_items = params.customData.numItems;
    if (params.customData.contents) customData.contents = params.customData.contents;
  }

  // Payload
  const payload: Record<string, unknown> = {
    data: [{
      event_name: params.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: params.eventId,
      action_source: 'website',
      event_source_url: params.eventSourceUrl || 'https://sadechocolate.com',
      user_data: userData,
      ...(Object.keys(customData).length > 0 && { custom_data: customData }),
    }],
  };

  // Test modu
  if (params.testEventCode) {
    payload.test_event_code = params.testEventCode;
  }

  // Meta Graph API'ye gönder
  const url = `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events?access_token=${accessToken}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      const errObj = result.error as Record<string, unknown> | undefined;
      console.error(`[CAPI] API Error for ${params.eventName}:`, JSON.stringify(result));
      return {
        success: false,
        error: (errObj?.message as string) || `HTTP ${response.status}`
      };
    }

    console.log(`[CAPI] ${params.eventName} sent — events_received: ${result.events_received}`);
    return { success: true, eventsReceived: result.events_received as number };

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[CAPI] Network error for ${params.eventName}:`, errMsg);
    return { success: false, error: errMsg };
  }
}
