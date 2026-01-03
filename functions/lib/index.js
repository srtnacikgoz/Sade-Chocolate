"use strict";
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
exports.healthCheck = exports.calculateShipping = exports.getShipmentStatus = exports.trackShipment = void 0;
const functions = __importStar(require("firebase-functions"));
const params_1 = require("firebase-functions/params");
const axios_1 = __importDefault(require("axios"));
// MNG Kargo API Base URL
const MNG_API_BASE = 'https://testapi.mngkargo.com.tr/mngapi/api/standardqueryapi';
// Environment variables (Params API kullanarak)
const MNG_CLIENT_ID = (0, params_1.defineString)('MNG_CLIENT_ID');
const MNG_CLIENT_SECRET = (0, params_1.defineString)('MNG_CLIENT_SECRET');
const MNG_JWT_TOKEN = (0, params_1.defineString)('MNG_JWT_TOKEN', { default: '' }); // Opsiyonel
const getMNGConfig = () => {
    const clientId = MNG_CLIENT_ID.value();
    const clientSecret = MNG_CLIENT_SECRET.value();
    const jwtToken = MNG_JWT_TOKEN.value();
    if (!clientId || !clientSecret) {
        throw new Error('MNG API credentials not configured');
    }
    return {
        clientId,
        clientSecret,
        jwtToken
    };
};
// Helper function to make authenticated requests
const mngRequest = async (endpoint, method = 'GET', data) => {
    var _a, _b, _c, _d;
    const config = getMNGConfig();
    // Build headers - JWT token opsiyonel
    const headers = {
        'X-IBM-Client-Id': config.clientId,
        'X-IBM-Client-Secret': config.clientSecret,
        'Content-Type': 'application/json'
    };
    // Eğer JWT token varsa ekle
    if (config.jwtToken) {
        headers['Authorization'] = `Bearer ${config.jwtToken}`;
    }
    try {
        const response = await (0, axios_1.default)({
            method,
            url: `${MNG_API_BASE}${endpoint}`,
            headers,
            data
        });
        return response.data;
    }
    catch (error) {
        console.error('MNG API Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError('internal', ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.detail) || 'MNG Kargo API hatası', (_d = error.response) === null || _d === void 0 ? void 0 : _d.data);
    }
};
/**
 * Kargo Takibi - Gönderi Hareketlerini Getirir
 *
 * @param {string} referenceId - Sipariş numarası (SADE-123456)
 * @returns {Array} Gönderi hareketleri timeline
 */
exports.trackShipment = functions.https.onCall(async (request) => {
    const { referenceId } = request.data;
    // Validation
    if (!referenceId) {
        throw new functions.https.HttpsError('invalid-argument', 'referenceId parametresi gerekli');
    }
    functions.logger.info('Tracking shipment:', { referenceId });
    const trackingData = await mngRequest(`/trackshipment/${referenceId}`);
    return {
        success: true,
        data: trackingData,
        timestamp: new Date().toISOString()
    };
});
/**
 * Gönderi Durumu - Özet bilgi
 *
 * @param {string} referenceId - Sipariş numarası
 * @returns {Object} Gönderi durum özeti
 */
exports.getShipmentStatus = functions.https.onCall(async (request) => {
    const { referenceId } = request.data;
    if (!referenceId) {
        throw new functions.https.HttpsError('invalid-argument', 'referenceId parametresi gerekli');
    }
    functions.logger.info('Getting shipment status:', { referenceId });
    const statusData = await mngRequest(`/getshipmentstatus/${referenceId}`);
    return {
        success: true,
        data: statusData,
        timestamp: new Date().toISOString()
    };
});
/**
 * Kargo Ücreti Hesaplama
 *
 * @param {Object} params - Hesaplama parametreleri
 * @returns {Object} Ücret detayları
 */
exports.calculateShipping = functions.https.onCall(async (request) => {
    const { cityCode, districtCode, address, weight, // kg
    desi } = request.data;
    // Validation
    if (!cityCode || !districtCode || !address) {
        throw new functions.https.HttpsError('invalid-argument', 'cityCode, districtCode ve address gerekli');
    }
    const requestBody = {
        shipmentServiceType: 1, // STANDART_TESLİMAT
        packagingType: 3, // PAKET
        paymentType: 1, // GONDERICI_ODER
        pickUpType: 1, // ADRESTEN ALIM
        deliveryType: 1, // ADRESE_TESLIM
        cityCode: parseInt(cityCode),
        districtCode: parseInt(districtCode),
        address,
        smsPreference1: 1, // Varış SMS
        smsPreference2: 1, // Hazırlandı SMS
        smsPreference3: 0, // Gönderici SMS
        orderPieceList: [
            {
                barcode: `TEMP_${Date.now()}`,
                desi: desi || 2,
                kg: weight || 1,
                content: 'Çikolata Ürünleri'
            }
        ]
    };
    functions.logger.info('Calculating shipping cost:', requestBody);
    const calculationData = await mngRequest('/calculate', 'POST', requestBody);
    return {
        success: true,
        data: calculationData,
        timestamp: new Date().toISOString()
    };
});
/**
 * Health Check - API bağlantısını test eder
 */
exports.healthCheck = functions.https.onRequest(async (req, res) => {
    try {
        const config = getMNGConfig();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            configured: !!config.clientId
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});
//# sourceMappingURL=index.js.map