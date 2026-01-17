"use strict";
/**
 * Geliver Kargo API Service
 * https://docs.geliver.io
 *
 * Tek API ile 10+ kargo firmasına erişim:
 * Aras, Yurtiçi, PTT, Sürat, HepsiJet, MNG, Kolay Gelsin...
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
exports.registerWebhook = exports.getGeliverDistricts = exports.getGeliverCities = exports.trackGeliverShipment = exports.autoAcceptBestOffer = exports.acceptOffer = exports.getShipmentOffers = exports.getGeliverShipment = exports.createGeliverShipment = exports.getOrCreateSenderAddress = void 0;
const axios_1 = __importDefault(require("axios"));
const functions = __importStar(require("firebase-functions"));
// Geliver API Base URL
const GELIVER_API_BASE = 'https://api.geliver.io/api/v1';
// Geliver Client singleton
let geliverClient = null;
// Sender Address cache
let cachedSenderAddressId = null;
/**
 * Geliver API Client oluştur
 */
const getGeliverClient = () => {
    if (geliverClient)
        return geliverClient;
    const token = process.env.GELIVER_API_TOKEN;
    if (!token) {
        throw new functions.https.HttpsError('failed-precondition', 'GELIVER_API_TOKEN not configured in .env');
    }
    geliverClient = axios_1.default.create({
        baseURL: GELIVER_API_BASE,
        timeout: 30000,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return geliverClient;
};
/**
 * Geliver API Request Helper
 */
const geliverRequest = async (method, endpoint, data) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const client = getGeliverClient();
    try {
        const response = await client.request({
            method,
            url: endpoint,
            data
        });
        // Geliver API returns { result: boolean, data: ... }
        if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.result) === false) {
            throw new Error(((_b = response.data) === null || _b === void 0 ? void 0 : _b.message) || 'Geliver API error');
        }
        return ((_c = response.data) === null || _c === void 0 ? void 0 : _c.data) || response.data;
    }
    catch (error) {
        functions.logger.error('Geliver API Error:', {
            endpoint,
            status: (_d = error.response) === null || _d === void 0 ? void 0 : _d.status,
            data: (_e = error.response) === null || _e === void 0 ? void 0 : _e.data,
            message: error.message
        });
        throw new functions.https.HttpsError('internal', ((_g = (_f = error.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.message) || error.message || 'Geliver API hatası', (_h = error.response) === null || _h === void 0 ? void 0 : _h.data);
    }
};
// ==========================================
// SENDER ADDRESS
// ==========================================
/**
 * Sade Chocolate gönderici adresini oluştur veya mevcut olanı getir
 */
const getOrCreateSenderAddress = async () => {
    // Cache'te varsa kullan
    if (cachedSenderAddressId) {
        return cachedSenderAddressId;
    }
    // Mevcut adresleri kontrol et
    try {
        const addresses = await geliverRequest('GET', '/addresses/sender');
        // "Sade Chocolate" adresini bul
        const existing = addresses === null || addresses === void 0 ? void 0 : addresses.find((a) => {
            var _a, _b;
            return ((_a = a.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('sade')) ||
                ((_b = a.email) === null || _b === void 0 ? void 0 : _b.includes('sadechocolate'));
        });
        if (existing === null || existing === void 0 ? void 0 : existing.id) {
            cachedSenderAddressId = existing.id;
            functions.logger.info('Existing sender address found:', existing.id);
            return existing.id;
        }
    }
    catch (err) {
        functions.logger.warn('Could not fetch existing addresses, creating new one');
    }
    // Yeni adres oluştur
    const senderAddress = {
        name: 'Sade Chocolate',
        email: 'bilgi@sadechocolate.com',
        phone: '05333420493',
        address1: 'Yeşilbahçe mah. Çınarlı cd 47/A',
        countryCode: 'TR',
        cityName: 'Antalya',
        cityCode: '07',
        districtName: 'Muratpaşa',
        zip: '07100'
    };
    const result = await geliverRequest('POST', '/addresses/sender', senderAddress);
    cachedSenderAddressId = result.id;
    functions.logger.info('New sender address created:', result.id);
    return result.id;
};
exports.getOrCreateSenderAddress = getOrCreateSenderAddress;
// ==========================================
// SHIPMENT OPERATIONS
// ==========================================
/**
 * Yeni gönderi oluştur
 */
const createGeliverShipment = async (params) => {
    const { orderId, customerName, customerPhone, customerEmail, shippingAddress, shippingCity, shippingDistrict, weight = 1, desi = 2, contentDescription = 'Çikolata Ürünleri' } = params;
    // Gönderici adresini al
    const senderAddressId = await (0, exports.getOrCreateSenderAddress)();
    // Desi'den boyut hesapla (yaklaşık)
    const sideLength = Math.cbrt(desi * 3000); // cm
    // Gönderi oluştur
    const shipmentData = {
        senderAddressID: senderAddressId,
        recipientAddress: {
            name: customerName,
            email: customerEmail || '',
            phone: customerPhone.replace(/\D/g, ''),
            address1: shippingAddress,
            countryCode: 'TR',
            cityName: shippingCity,
            districtName: shippingDistrict
        },
        // Boyutlar string olmalı (Geliver API requirement)
        length: String(Math.round(sideLength)),
        width: String(Math.round(sideLength)),
        height: String(Math.round(sideLength)),
        distanceUnit: 'cm',
        weight: String(weight),
        massUnit: 'kg',
        // Ek bilgiler
        orderNumber: orderId,
        description: contentDescription
    };
    functions.logger.info('Creating Geliver shipment:', {
        orderId,
        senderAddressId,
        city: shippingCity,
        district: shippingDistrict
    });
    // Test ortamında createTest, production'da create kullan
    const isProduction = process.env.NODE_ENV === 'production' ||
        process.env.FUNCTIONS_EMULATOR !== 'true';
    const endpoint = isProduction ? '/shipments' : '/shipments/test';
    const shipment = await geliverRequest('POST', endpoint, shipmentData);
    functions.logger.info('Geliver shipment created:', {
        id: shipment.id,
        status: shipment.status
    });
    return shipment;
};
exports.createGeliverShipment = createGeliverShipment;
/**
 * Gönderi detaylarını getir
 */
const getGeliverShipment = async (shipmentId) => {
    return await geliverRequest('GET', `/shipments/${shipmentId}`);
};
exports.getGeliverShipment = getGeliverShipment;
/**
 * Gönderi tekliflerini getir
 */
const getShipmentOffers = async (shipmentId) => {
    const shipment = await (0, exports.getGeliverShipment)(shipmentId);
    return shipment.offers || [];
};
exports.getShipmentOffers = getShipmentOffers;
/**
 * Teklifi kabul et ve etiket al
 */
const acceptOffer = async (shipmentId, offerId) => {
    const result = await geliverRequest('POST', `/transactions/accept`, {
        shipmentId,
        offerId
    });
    // Güncel shipment bilgisini al
    const shipment = await (0, exports.getGeliverShipment)(shipmentId);
    return {
        trackingNumber: shipment.trackingNumber || result.trackingNumber || '',
        labelUrl: shipment.labelUrl || result.labelUrl || '',
        carrier: shipment.carrier || result.providerName || 'Geliver'
    };
};
exports.acceptOffer = acceptOffer;
/**
 * En uygun teklifi otomatik seç ve kabul et
 */
const autoAcceptBestOffer = async (shipmentId) => {
    // Teklifleri bekle (async olabilir)
    let offers = [];
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
        offers = await (0, exports.getShipmentOffers)(shipmentId);
        if (offers && offers.length > 0)
            break;
        // 2 saniye bekle
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
    }
    if (!offers || offers.length === 0) {
        throw new functions.https.HttpsError('not-found', 'Kargo firmasından teklif alınamadı. Lütfen daha sonra tekrar deneyin.');
    }
    // En ucuz teklifi seç
    const bestOffer = offers.reduce((best, current) => current.totalPrice < best.totalPrice ? current : best);
    functions.logger.info('Auto-accepting best offer:', {
        shipmentId,
        offerId: bestOffer.id,
        carrier: bestOffer.providerName,
        price: bestOffer.totalPrice
    });
    const result = await (0, exports.acceptOffer)(shipmentId, bestOffer.id);
    return Object.assign(Object.assign({}, result), { price: bestOffer.totalPrice });
};
exports.autoAcceptBestOffer = autoAcceptBestOffer;
// ==========================================
// TRACKING
// ==========================================
/**
 * Kargo takip bilgilerini getir
 */
const trackGeliverShipment = async (shipmentId) => {
    const shipment = await geliverRequest('GET', `/shipments/${shipmentId}/tracking`);
    return {
        status: shipment.status || 'unknown',
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        events: shipment.events || shipment.trackingHistory || []
    };
};
exports.trackGeliverShipment = trackGeliverShipment;
// ==========================================
// GEO (Şehir/İlçe)
// ==========================================
/**
 * Türkiye şehirlerini getir
 */
const getGeliverCities = async () => {
    return await geliverRequest('GET', '/geo/cities?countryCode=TR');
};
exports.getGeliverCities = getGeliverCities;
/**
 * Şehrin ilçelerini getir
 */
const getGeliverDistricts = async (cityCode) => {
    return await geliverRequest('GET', `/geo/districts?cityCode=${cityCode}`);
};
exports.getGeliverDistricts = getGeliverDistricts;
// ==========================================
// WEBHOOKS
// ==========================================
/**
 * Webhook kaydet (durum değişikliği bildirimi için)
 */
const registerWebhook = async (callbackUrl) => {
    const result = await geliverRequest('POST', '/webhooks', {
        url: callbackUrl,
        events: ['shipment.status_changed', 'shipment.delivered', 'shipment.returned']
    });
    return result.id;
};
exports.registerWebhook = registerWebhook;
//# sourceMappingURL=geliverService.js.map