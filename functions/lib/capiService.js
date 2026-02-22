"use strict";
/**
 * Meta Conversions API — Doğrudan HTTP yaklaşımı (SDK yok, sıfır bağımlılık)
 * Node 20 built-in fetch kullanır.
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
exports.sha256 = sha256;
exports.normalizePhone = normalizePhone;
exports.sendCapiEvent = sendCapiEvent;
const crypto = __importStar(require("crypto"));
const META_API_VERSION = 'v22.0';
// SHA-256 hash — normalize + hash
function sha256(value) {
    return crypto.createHash('sha256')
        .update(value.trim().toLowerCase())
        .digest('hex');
}
// Telefon numarasını normalize et: sadece rakamlar, ülke kodu dahil
function normalizePhone(phone) {
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
async function sendCapiEvent(params, accessToken, pixelId) {
    // user_data oluştur
    const userData = {};
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
    const customData = {};
    if (params.customData) {
        if (params.customData.value !== undefined)
            customData.value = params.customData.value;
        if (params.customData.currency)
            customData.currency = params.customData.currency;
        if (params.customData.contentIds)
            customData.content_ids = params.customData.contentIds;
        if (params.customData.contentType)
            customData.content_type = params.customData.contentType;
        if (params.customData.orderId)
            customData.order_id = params.customData.orderId;
        if (params.customData.numItems !== undefined)
            customData.num_items = params.customData.numItems;
        if (params.customData.contents)
            customData.contents = params.customData.contents;
    }
    // Payload
    const payload = {
        data: [Object.assign({ event_name: params.eventName, event_time: Math.floor(Date.now() / 1000), event_id: params.eventId, action_source: 'website', event_source_url: params.eventSourceUrl || 'https://sadechocolate.com', user_data: userData }, (Object.keys(customData).length > 0 && { custom_data: customData }))],
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
        const result = await response.json();
        if (!response.ok) {
            const errObj = result.error;
            console.error(`[CAPI] API Error for ${params.eventName}:`, JSON.stringify(result));
            return {
                success: false,
                error: (errObj === null || errObj === void 0 ? void 0 : errObj.message) || `HTTP ${response.status}`
            };
        }
        console.log(`[CAPI] ${params.eventName} sent — events_received: ${result.events_received}`);
        return { success: true, eventsReceived: result.events_received };
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[CAPI] Network error for ${params.eventName}:`, errMsg);
        return { success: false, error: errMsg };
    }
}
//# sourceMappingURL=capiService.js.map