/**
 * Meta CAPI Purchase Trigger
 * Sipariş Firestore'a yazıldığında otomatik Purchase event gönderir.
 * Browser Pixel ile aynı event_id kullanılarak deduplication sağlanır.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { sendCapiEvent } from './capiService';

export const onOrderCreatedCapiPurchase = onDocumentCreated(
  {
    document: 'orders/{orderId}',
    region: 'europe-west3',
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const order = snapshot.data();
    const orderId = event.params.orderId;

    const accessToken = process.env.META_ACCESS_TOKEN;
    const pixelId = process.env.META_PIXEL_ID;

    if (!accessToken || !pixelId) {
      console.error('[CAPI Purchase Trigger] META_ACCESS_TOKEN veya META_PIXEL_ID eksik');
      return;
    }

    // event_id: client tarafından order document'a kaydedilmiş olmalı
    // Yoksa orderId bazlı üret
    const eventId = order.pixelEventId || `purchase_${orderId}`;

    // Gerçek order document yapısı:
    // customer: { name, email, phone }
    // shipping: { address, city, district }
    // payment: { total, subtotal, shipping, method }
    // items: [{ productId, name, price, quantity, image }]
    const customerName = order.customer?.name || '';
    const nameParts = customerName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const result = await sendCapiEvent(
      {
        eventName: 'Purchase',
        eventId: eventId,
        eventSourceUrl: order.sourceUrl || 'https://sadechocolate.com/checkout',
        userData: {
          email: order.customer?.email,
          phone: order.customer?.phone,
          firstName: firstName,
          lastName: lastName,
          city: order.shipping?.city,
          fbc: order.fbc,
          fbp: order.fbp,
          clientIp: order.clientIp,
          userAgent: order.userAgent,
          externalId: order.userId || order.customer?.email,
        },
        customData: {
          value: order.payment?.total || 0,
          currency: 'TRY',
          contentIds: order.items?.map((i: Record<string, unknown>) =>
            (i.productId || i.id) as string
          ) || [],
          contentType: 'product',
          orderId: order.orderNumber || order.id || orderId,
          numItems: order.items?.reduce((sum: number, i: Record<string, unknown>) =>
            sum + ((i.quantity as number) || 1), 0
          ) || 0,
          contents: order.items?.map((i: Record<string, unknown>) => ({
            id: ((i.productId || i.id) as string),
            quantity: (i.quantity as number) || 1,
            item_price: (i.price as number) || 0,
          })) || [],
        },
      },
      accessToken,
      pixelId
    );

    // meta_events koleksiyonuna logla
    try {
      const customerEmail = order.customer?.email || '';
      const maskedEmail = customerEmail
        ? customerEmail.replace(/^(.{2})(.*)(@.*)$/, '$1***$3')
        : null;

      await admin.firestore().collection('meta_events').add({
        eventName: 'Purchase',
        eventId: eventId,
        source: 'capi_trigger',
        status: result.success ? 'success' : 'failed',
        orderId: order.orderNumber || orderId,
        value: order.payment?.total || 0,
        currency: 'TRY',
        customerEmail: maskedEmail,
        errorMessage: result.error || null,
        metaResponse: result.success ? { eventsReceived: result.eventsReceived } : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[CAPI Log] meta_events yazılamadı:', logError);
    }

    if (result.success) {
      console.log(`[CAPI] Purchase for order ${orderId} — sent successfully`);
    } else {
      console.error(`[CAPI] Purchase for order ${orderId} — FAILED:`, result.error);
    }
  }
);
