"use strict";
/**
 * Meta CAPI Callable Cloud Function
 * Browser'dan çağrılır: ViewContent, AddToCart, InitiateCheckout, Purchase
 * IP ve User-Agent sunucu tarafında otomatik alınır.
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
exports.sendMetaCapiEvent = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const capiService_1 = require("./capiService");
exports.sendMetaCapiEvent = (0, https_1.onCall)({
    minInstances: 0,
    maxInstances: 10,
    concurrency: 80,
    region: 'europe-west3',
    cors: ['https://sadechocolate.com', 'https://www.sadechocolate.com'],
}, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    const data = request.data;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const pixelId = process.env.META_PIXEL_ID;
    if (!accessToken || !pixelId) {
        throw new https_1.HttpsError('failed-precondition', 'CAPI yapılandırması eksik');
    }
    if (!data.eventName || !data.eventId) {
        throw new https_1.HttpsError('invalid-argument', 'eventName ve eventId zorunlu');
    }
    // İzin verilen event'ler
    const allowedEvents = ['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'];
    if (!allowedEvents.includes(data.eventName)) {
        throw new https_1.HttpsError('invalid-argument', `Geçersiz event: ${data.eventName}`);
    }
    // IP ve User-Agent sunucu tarafında otomatik al
    const clientIp = ((_b = (_a = request.rawRequest) === null || _a === void 0 ? void 0 : _a.headers['x-forwarded-for']) === null || _b === void 0 ? void 0 : _b.toString().split(',')[0].trim())
        || ((_c = request.rawRequest) === null || _c === void 0 ? void 0 : _c.ip)
        || '';
    const clientUserAgent = ((_d = request.rawRequest) === null || _d === void 0 ? void 0 : _d.headers['user-agent']) || '';
    const result = await (0, capiService_1.sendCapiEvent)({
        eventName: data.eventName,
        eventId: data.eventId,
        eventSourceUrl: data.eventSourceUrl,
        userData: Object.assign(Object.assign({}, data.userData), { clientIp, userAgent: clientUserAgent }),
        customData: data.customData,
        testEventCode: data.testEventCode,
    }, accessToken, pixelId);
    // meta_events koleksiyonuna logla
    try {
        await admin.firestore().collection('meta_events').add({
            eventName: data.eventName,
            eventId: data.eventId,
            source: 'capi_browser',
            status: result.success ? 'success' : 'failed',
            value: ((_e = data.customData) === null || _e === void 0 ? void 0 : _e.value) || null,
            currency: ((_f = data.customData) === null || _f === void 0 ? void 0 : _f.currency) || 'TRY',
            errorMessage: result.error || null,
            metaResponse: result.success ? { eventsReceived: result.eventsReceived } : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (logError) {
        console.error('[CAPI Log] meta_events yazılamadı:', logError);
    }
    if (!result.success) {
        throw new https_1.HttpsError('internal', `CAPI hatası: ${result.error}`);
    }
    return result;
});
//# sourceMappingURL=capiCallable.js.map