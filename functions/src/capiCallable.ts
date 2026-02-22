/**
 * Meta CAPI Callable Cloud Function
 * Browser'dan çağrılır: ViewContent, AddToCart, InitiateCheckout, Purchase
 * IP ve User-Agent sunucu tarafında otomatik alınır.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { sendCapiEvent } from './capiService';

export const sendMetaCapiEvent = onCall(
  {
    minInstances: 0,
    maxInstances: 10,
    concurrency: 80,
    region: 'europe-west3',
    cors: ['https://sadechocolate.com', 'https://www.sadechocolate.com'],
  },
  async (request) => {
    const data = request.data;

    const accessToken = process.env.META_ACCESS_TOKEN;
    const pixelId = process.env.META_PIXEL_ID;

    if (!accessToken || !pixelId) {
      throw new HttpsError('failed-precondition', 'CAPI yapılandırması eksik');
    }

    if (!data.eventName || !data.eventId) {
      throw new HttpsError('invalid-argument', 'eventName ve eventId zorunlu');
    }

    // İzin verilen event'ler
    const allowedEvents = ['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'];
    if (!allowedEvents.includes(data.eventName)) {
      throw new HttpsError('invalid-argument', `Geçersiz event: ${data.eventName}`);
    }

    // IP ve User-Agent sunucu tarafında otomatik al
    const clientIp = request.rawRequest?.headers['x-forwarded-for']
      ?.toString().split(',')[0].trim()
      || request.rawRequest?.ip
      || '';
    const clientUserAgent = request.rawRequest?.headers['user-agent'] || '';

    const result = await sendCapiEvent(
      {
        eventName: data.eventName,
        eventId: data.eventId,
        eventSourceUrl: data.eventSourceUrl,
        userData: {
          ...data.userData,
          clientIp,
          userAgent: clientUserAgent,
        },
        customData: data.customData,
        testEventCode: data.testEventCode,
      },
      accessToken,
      pixelId
    );

    // meta_events koleksiyonuna logla
    try {
      await admin.firestore().collection('meta_events').add({
        eventName: data.eventName,
        eventId: data.eventId,
        source: 'capi_browser',
        status: result.success ? 'success' : 'failed',
        value: data.customData?.value || null,
        currency: data.customData?.currency || 'TRY',
        errorMessage: result.error || null,
        metaResponse: result.success ? { eventsReceived: result.eventsReceived } : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[CAPI Log] meta_events yazılamadı:', logError);
    }

    if (!result.success) {
      throw new HttpsError('internal', `CAPI hatası: ${result.error}`);
    }

    return result;
  }
);
