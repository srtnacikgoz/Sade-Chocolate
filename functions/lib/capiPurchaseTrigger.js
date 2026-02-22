"use strict";
/**
 * Meta CAPI Purchase Trigger
 * Sipariş Firestore'a yazıldığında otomatik Purchase event gönderir.
 * Browser Pixel ile aynı event_id kullanılarak deduplication sağlanır.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onOrderCreatedCapiPurchase = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const capiService_1 = require("./capiService");
exports.onOrderCreatedCapiPurchase = (0, firestore_1.onDocumentCreated)({
    document: 'orders/{orderId}',
    region: 'europe-west3',
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const snapshot = event.data;
    if (!snapshot)
        return;
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
    const customerName = ((_a = order.customer) === null || _a === void 0 ? void 0 : _a.name) || '';
    const nameParts = customerName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const result = await (0, capiService_1.sendCapiEvent)({
        eventName: 'Purchase',
        eventId: eventId,
        eventSourceUrl: order.sourceUrl || 'https://sadechocolate.com/checkout',
        userData: {
            email: (_b = order.customer) === null || _b === void 0 ? void 0 : _b.email,
            phone: (_c = order.customer) === null || _c === void 0 ? void 0 : _c.phone,
            firstName: firstName,
            lastName: lastName,
            city: (_d = order.shipping) === null || _d === void 0 ? void 0 : _d.city,
            fbc: order.fbc,
            fbp: order.fbp,
            clientIp: order.clientIp,
            userAgent: order.userAgent,
            externalId: order.userId || ((_e = order.customer) === null || _e === void 0 ? void 0 : _e.email),
        },
        customData: {
            value: ((_f = order.payment) === null || _f === void 0 ? void 0 : _f.total) || 0,
            currency: 'TRY',
            contentIds: ((_g = order.items) === null || _g === void 0 ? void 0 : _g.map((i) => (i.productId || i.id))) || [],
            contentType: 'product',
            orderId: order.orderNumber || order.id || orderId,
            numItems: ((_h = order.items) === null || _h === void 0 ? void 0 : _h.reduce((sum, i) => sum + (i.quantity || 1), 0)) || 0,
            contents: ((_j = order.items) === null || _j === void 0 ? void 0 : _j.map((i) => ({
                id: (i.productId || i.id),
                quantity: i.quantity || 1,
                item_price: i.price || 0,
            }))) || [],
        },
    }, accessToken, pixelId);
    // meta_events koleksiyonuna logla
    try {
        const customerEmail = ((_k = order.customer) === null || _k === void 0 ? void 0 : _k.email) || '';
        const maskedEmail = customerEmail
            ? customerEmail.replace(/^(.{2})(.*)(@.*)$/, '$1***$3')
            : null;
        await admin.firestore().collection('meta_events').add({
            eventName: 'Purchase',
            eventId: eventId,
            source: 'capi_trigger',
            status: result.success ? 'success' : 'failed',
            orderId: order.orderNumber || orderId,
            value: ((_l = order.payment) === null || _l === void 0 ? void 0 : _l.total) || 0,
            currency: 'TRY',
            customerEmail: maskedEmail,
            errorMessage: result.error || null,
            metaResponse: result.success ? { eventsReceived: result.eventsReceived } : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (logError) {
        console.error('[CAPI Log] meta_events yazılamadı:', logError);
    }
    if (result.success) {
        console.log(`[CAPI] Purchase for order ${orderId} — sent successfully`);
    }
    else {
        console.error(`[CAPI] Purchase for order ${orderId} — FAILED:`, result.error);
    }
});
//# sourceMappingURL=capiPurchaseTrigger.js.map