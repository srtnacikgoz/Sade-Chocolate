"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCapiAddToCart = exports.sendCapiPurchase = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
// SHA256 hash (Meta CAPI standardı)
const hashValue = (value) => {
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
};
// CAPI event'i gönder
const sendEvent = async (event) => {
    var _a, _b, _c;
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!pixelId || !accessToken) {
        console.warn('Meta CAPI: PIXEL_ID veya ACCESS_TOKEN tanımlı değil, event gönderilmedi');
        return { success: false, error: 'Missing credentials' };
    }
    // User data hash'le (Meta CAPI standardı)
    const userData = {};
    if (event.userData.email)
        userData.em = hashValue(event.userData.email);
    if (event.userData.phone)
        userData.ph = hashValue(event.userData.phone.replace(/\D/g, ''));
    if (event.userData.firstName)
        userData.fn = hashValue(event.userData.firstName);
    if (event.userData.lastName)
        userData.ln = hashValue(event.userData.lastName);
    if (event.userData.city)
        userData.ct = hashValue(event.userData.city);
    if (event.userData.clientIpAddress)
        userData.client_ip_address = event.userData.clientIpAddress;
    if (event.userData.clientUserAgent)
        userData.client_user_agent = event.userData.clientUserAgent;
    if (event.userData.fbc)
        userData.fbc = event.userData.fbc;
    if (event.userData.fbp)
        userData.fbp = event.userData.fbp;
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
        await axios_1.default.post(`${GRAPH_API_URL}/${pixelId}/events?access_token=${accessToken}`, payload);
        console.log(`Meta CAPI: ${event.eventName} gönderildi (event_id: ${event.eventId})`);
        return { success: true };
    }
    catch (error) {
        const errMsg = ((_c = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.message) || error.message;
        console.error(`Meta CAPI hatası (${event.eventName}):`, errMsg);
        return { success: false, error: errMsg };
    }
};
// --- Cloud Function: Purchase event'i server-side gönder ---
const sendCapiPurchase = async (order) => {
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
exports.sendCapiPurchase = sendCapiPurchase;
// --- Cloud Function: AddToCart server-side (opsiyonel, yüksek değerli event) ---
const sendCapiAddToCart = async (data) => {
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
exports.sendCapiAddToCart = sendCapiAddToCart;
//# sourceMappingURL=metaCapiService.js.map