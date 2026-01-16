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
exports.onNewOrder = exports.listAdmins = exports.checkAdminStatus = exports.removeAdminClaim = exports.setAdminClaim = exports.retryPayment = exports.handleIyzicoCallback = exports.initializeIyzicoPayment = exports.sendCustomPasswordResetEmail = exports.findDistrictCode = exports.getNeighborhoods = exports.getDistricts = exports.getCities = exports.healthCheck = exports.createShipment = exports.calculateShipping = exports.getShipmentStatus = exports.trackShipment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-functions/v2/firestore");
const axios_1 = __importDefault(require("axios"));
const iyzicoService = __importStar(require("./services/iyzicoService"));
// Set global region for all functions
(0, v2_1.setGlobalOptions)({ region: 'europe-west3' });
// Firebase Admin SDK initialization
admin.initializeApp();
// MNG Kargo API Base URLs
const MNG_API_BASE = 'https://api.mngkargo.com.tr/mngapi/api/standardqueryapi';
const MNG_COMMAND_API_BASE = 'https://api.mngkargo.com.tr/mngapi/api/standardcmdapi';
const MNG_TOKEN_API = 'https://api.mngkargo.com.tr/mngapi/api/token';
const MNG_CBS_API_BASE = 'https://api.mngkargo.com.tr/mngapi/api/cbsinfoapi';
// MNG Standard Query API credentials (kargo hesaplama, takip)
const getMNGConfig = () => {
    const clientId = process.env.MNG_CLIENT_ID || '';
    const clientSecret = process.env.MNG_CLIENT_SECRET || '';
    functions.logger.info('MNG Query Config check:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdLength: clientId.length
    });
    if (!clientId || !clientSecret) {
        throw new functions.https.HttpsError('failed-precondition', 'MNG Query API credentials not configured in .env file');
    }
    return { clientId, clientSecret };
};
// MNG Standard Command API credentials (kargo oluşturma)
const getMNGCommandConfig = () => {
    const clientId = process.env.MNG_COMMAND_CLIENT_ID || '';
    const clientSecret = process.env.MNG_COMMAND_CLIENT_SECRET || '';
    const customerNumber = process.env.MNG_CUSTOMER_NUMBER || '';
    const password = process.env.MNG_PASSWORD || '';
    functions.logger.info('MNG Command Config check:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasCustomerNumber: !!customerNumber,
        hasPassword: !!password
    });
    if (!clientId || !customerNumber || !password) {
        throw new functions.https.HttpsError('failed-precondition', 'MNG Command API credentials not configured. Need: MNG_COMMAND_CLIENT_ID, MNG_CUSTOMER_NUMBER, MNG_PASSWORD');
    }
    return { clientId, clientSecret, customerNumber, password };
};
// MNG Identity API credentials (JWT token için)
const getMNGIdentityConfig = () => {
    const clientId = process.env.MNG_IDENTITY_CLIENT_ID || '';
    const clientSecret = process.env.MNG_IDENTITY_CLIENT_SECRET || '';
    const customerNumber = process.env.MNG_CUSTOMER_NUMBER || '';
    const password = process.env.MNG_PASSWORD || '';
    if (!clientId || !clientSecret || !customerNumber || !password) {
        throw new functions.https.HttpsError('failed-precondition', 'MNG Identity API credentials not configured');
    }
    return { clientId, clientSecret, customerNumber, password };
};
// JWT Token cache
let cachedJwtToken = null;
let tokenExpireTime = 0;
// MNG JWT Token almak için
const getMNGJwtToken = async () => {
    var _a, _b, _c, _d;
    // Token cache'te ve geçerliyse kullan
    if (cachedJwtToken && Date.now() < tokenExpireTime - 60000) {
        return cachedJwtToken;
    }
    const config = getMNGIdentityConfig();
    const headers = {
        'X-IBM-Client-Id': config.clientId,
        'Content-Type': 'application/json'
    };
    if (config.clientSecret) {
        headers['X-IBM-Client-Secret'] = config.clientSecret;
    }
    functions.logger.info('Getting MNG JWT Token...');
    try {
        const response = await (0, axios_1.default)({
            method: 'POST',
            url: MNG_TOKEN_API,
            headers,
            data: {
                customerNumber: config.customerNumber,
                password: config.password,
                identityType: 1
            }
        });
        const tokenData = response.data;
        cachedJwtToken = tokenData.jwt;
        // Token expire time'ı parse et (MNG formatı: "DD.MM.YYYY HH:mm:ss")
        if (tokenData.jwtExpireDate) {
            // "16.01.2026 23:10:56" formatını parse et
            const parts = tokenData.jwtExpireDate.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
            if (parts) {
                const [, day, month, year, hour, minute, second] = parts;
                tokenExpireTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second)).getTime();
            }
            else {
                // Parse edilemezse default 1 saat
                tokenExpireTime = Date.now() + 3600000;
            }
        }
        else {
            // Default: 1 saat
            tokenExpireTime = Date.now() + 3600000;
        }
        functions.logger.info('MNG JWT Token alındı, expire:', new Date(tokenExpireTime).toISOString());
        return cachedJwtToken;
    }
    catch (error) {
        functions.logger.error('MNG Token hatası:', {
            status: (_a = error.response) === null || _a === void 0 ? void 0 : _a.status,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: error.message
        });
        throw new functions.https.HttpsError('internal', 'MNG Kargo token alınamadı: ' + (((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || error.message));
    }
};
// MNG CBS Info API credentials (şehir/ilçe bilgileri)
const getCBSConfig = () => {
    const clientId = process.env.MNG_CBS_CLIENT_ID || '';
    const clientSecret = process.env.MNG_CBS_CLIENT_SECRET || '';
    functions.logger.info('CBS Config check:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdLength: clientId.length
    });
    if (!clientId || !clientSecret) {
        throw new functions.https.HttpsError('failed-precondition', 'MNG CBS API credentials not configured in .env file');
    }
    return { clientId, clientSecret };
};
// Helper function to make authenticated requests to Query API
const mngRequest = async (endpoint, method = 'GET', data) => {
    var _a, _b, _c, _d;
    const config = getMNGConfig();
    const headers = {
        'X-IBM-Client-Id': config.clientId,
        'X-IBM-Client-Secret': config.clientSecret,
        'Content-Type': 'application/json'
    };
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
// Helper function to make authenticated requests to Command API (for creating orders)
const mngCommandRequest = async (endpoint, data) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const config = getMNGCommandConfig();
    // Önce JWT token al
    const jwtToken = await getMNGJwtToken();
    const headers = {
        'X-IBM-Client-Id': config.clientId,
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
    };
    // Secret varsa ekle
    if (config.clientSecret) {
        headers['X-IBM-Client-Secret'] = config.clientSecret;
    }
    functions.logger.info('MNG Command API Request:', {
        url: `${MNG_COMMAND_API_BASE}${endpoint}`,
        hasSecret: !!config.clientSecret,
        hasToken: !!jwtToken,
        dataKeys: Object.keys(data)
    });
    try {
        const response = await (0, axios_1.default)({
            method: 'POST',
            url: `${MNG_COMMAND_API_BASE}${endpoint}`,
            headers,
            data
        });
        functions.logger.info('MNG Command API Response:', {
            status: response.status,
            data: response.data
        });
        return response.data;
    }
    catch (error) {
        functions.logger.error('MNG Command API Error:', {
            status: (_a = error.response) === null || _a === void 0 ? void 0 : _a.status,
            statusText: (_b = error.response) === null || _b === void 0 ? void 0 : _b.statusText,
            data: (_c = error.response) === null || _c === void 0 ? void 0 : _c.data,
            message: error.message,
            url: `${MNG_COMMAND_API_BASE}${endpoint}`
        });
        throw new functions.https.HttpsError('internal', ((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.detail) || ((_g = (_f = error.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.message) || ((_j = (_h = error.response) === null || _h === void 0 ? void 0 : _h.data) === null || _j === void 0 ? void 0 : _j.moreInformation) || 'MNG Kargo sipariş oluşturma hatası', (_k = error.response) === null || _k === void 0 ? void 0 : _k.data);
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
 * Gönderi Oluşturma - MNG Kargo'da yeni gönderi oluşturur
 *
 * @param {Object} params - Gönderi parametreleri
 * @returns {Object} Takip numarası ve barkod bilgileri
 */
exports.createShipment = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const { orderId, customerName, customerPhone, customerEmail, shippingAddress, shippingCity, shippingDistrict, weight = 1, // kg
    desi = 2, contentDescription = 'Çikolata Ürünleri', coldPackage = false } = request.data;
    // Validation
    if (!orderId || !customerName || !customerPhone || !shippingAddress) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId, customerName, customerPhone ve shippingAddress gerekli');
    }
    // Alıcı şehir/ilçe kodlarını hesapla
    const receiverCityCode = getCityCode(shippingCity || '');
    const receiverDistrictCode = getDistrictCode(shippingDistrict || '', receiverCityCode);
    // Barkod oluştur - benzersiz olmalı, BÜYÜK HARF
    const barcode = `SADE${Date.now().toString(36).toUpperCase()}`;
    const referenceId = orderId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // MNG Standard Command API için request body
    // Format: https://apizone.mngkargo.com.tr/en/api/1745
    const requestBody = {
        // Sipariş bilgileri
        order: {
            referenceId: referenceId,
            shipmentServiceType: 1, // 1: Standart Teslimat
            packagingType: 3, // 3: Paket
            paymentType: 1, // 1: Gönderici Öder
            deliveryType: 1, // 1: Adrese Teslim
            description: coldPackage ? 'SOĞUK PAKET - ISI HASSAS ÜRÜN' : 'Çikolata ürünleri',
            content: contentDescription,
            smsPreference1: 1, // Varış SMS (Alıcıya)
            smsPreference2: 1, // Hazırlandı SMS (Alıcıya)
            smsPreference3: 0 // Gönderici SMS (Kapalı)
        },
        // Paket Bilgileri
        orderPieceList: [
            {
                barcode: barcode,
                desi: desi,
                kg: weight,
                content: contentDescription
            }
        ],
        // Alıcı Bilgileri
        recipient: {
            fullName: customerName,
            cityCode: receiverCityCode,
            districtCode: receiverDistrictCode,
            address: shippingAddress,
            mobilePhone: customerPhone.replace(/\D/g, ''), // Sadece rakamlar
            email: customerEmail || ''
        }
    };
    functions.logger.info('Creating shipment:', {
        orderId,
        receiverCity: shippingCity,
        receiverCityCode,
        receiverDistrict: shippingDistrict,
        receiverDistrictCode,
        barcode
    });
    try {
        // Standard Command API ile sipariş oluştur
        const shipmentData = await mngCommandRequest('/createOrder', requestBody);
        functions.logger.info('MNG Shipment created successfully:', shipmentData);
        // API yanıtından tracking bilgilerini al
        const trackingNumber = shipmentData.orderNo || shipmentData.trackingNumber || referenceId;
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                barcode: barcode,
                carrier: 'MNG Kargo',
                estimatedDelivery: shipmentData.estimatedDeliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                shipmentId: shipmentData.orderId || shipmentData.id
            },
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        functions.logger.error('MNG Shipment creation failed:', error);
        // Hata detaylarını çıkar
        const errorDetail = ((_a = error.details) === null || _a === void 0 ? void 0 : _a.message) || ((_b = error.details) === null || _b === void 0 ? void 0 : _b.detail) || ((_c = error.details) === null || _c === void 0 ? void 0 : _c.moreInformation) || error.message || 'Bilinmeyen hata';
        // Manuel mod yok - hata fırlat
        throw new functions.https.HttpsError('internal', `MNG Kargo hatası: ${errorDetail}`, error.details);
    }
});
/**
 * Türkiye 81 il listesi - MNG şehir kodları (plaka kodları ile aynı)
 */
const CITY_CODE_MAP = {
    'Adana': 1, 'Adıyaman': 2, 'Afyonkarahisar': 3, 'Ağrı': 4, 'Amasya': 5,
    'Ankara': 6, 'Antalya': 7, 'Artvin': 8, 'Aydın': 9, 'Balıkesir': 10,
    'Bilecik': 11, 'Bingöl': 12, 'Bitlis': 13, 'Bolu': 14, 'Burdur': 15,
    'Bursa': 16, 'Çanakkale': 17, 'Çankırı': 18, 'Çorum': 19, 'Denizli': 20,
    'Diyarbakır': 21, 'Edirne': 22, 'Elazığ': 23, 'Erzincan': 24, 'Erzurum': 25,
    'Eskişehir': 26, 'Gaziantep': 27, 'Giresun': 28, 'Gümüşhane': 29, 'Hakkari': 30,
    'Hatay': 31, 'Isparta': 32, 'Mersin': 33, 'İstanbul': 34, 'İzmir': 35,
    'Kars': 36, 'Kastamonu': 37, 'Kayseri': 38, 'Kırklareli': 39, 'Kırşehir': 40,
    'Kocaeli': 41, 'Konya': 42, 'Kütahya': 43, 'Malatya': 44, 'Manisa': 45,
    'Kahramanmaraş': 46, 'Mardin': 47, 'Muğla': 48, 'Muş': 49, 'Nevşehir': 50,
    'Niğde': 51, 'Ordu': 52, 'Rize': 53, 'Sakarya': 54, 'Samsun': 55,
    'Siirt': 56, 'Sinop': 57, 'Sivas': 58, 'Tekirdağ': 59, 'Tokat': 60,
    'Trabzon': 61, 'Tunceli': 62, 'Şanlıurfa': 63, 'Uşak': 64, 'Van': 65,
    'Yozgat': 66, 'Zonguldak': 67, 'Aksaray': 68, 'Bayburt': 69, 'Karaman': 70,
    'Kırıkkale': 71, 'Batman': 72, 'Şırnak': 73, 'Bartın': 74, 'Ardahan': 75,
    'Iğdır': 76, 'Yalova': 77, 'Karabük': 78, 'Kilis': 79, 'Osmaniye': 80, 'Düzce': 81
};
/**
 * Antalya ilçe kodları - MNG Kargo sistemi için
 * Not: Bu kodlar CBS Info API'den alınmalı, şimdilik tahmin edilen değerler
 */
const ANTALYA_DISTRICT_CODES = {
    'Akseki': 701, 'Aksu': 702, 'Alanya': 703, 'Demre': 704, 'Döşemealtı': 705,
    'Elmalı': 706, 'Finike': 707, 'Gazipaşa': 708, 'Gündoğmuş': 709, 'İbradı': 710,
    'Kaş': 711, 'Kemer': 712, 'Kepez': 713, 'Konyaaltı': 714, 'Korkuteli': 715,
    'Kumluca': 716, 'Manavgat': 717, 'Muratpaşa': 718, 'Serik': 719
};
/**
 * Helper: Şehir kodunu döndürür - Türkçe karakter normalizasyonu ile
 */
function getCityCode(cityName) {
    if (!cityName)
        return 7; // Default: Antalya
    // Direkt eşleşme dene
    if (CITY_CODE_MAP[cityName]) {
        return CITY_CODE_MAP[cityName];
    }
    // Normalize et ve tekrar dene
    const normalized = cityName.trim()
        .replace(/i/g, 'İ').replace(/ı/g, 'I')
        .replace(/İ/g, 'İ').replace(/I/g, 'ı')
        .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    // Yaygın varyasyonları kontrol et
    const variations = {
        'Istanbul': 'İstanbul',
        'Izmir': 'İzmir',
        'Afyon': 'Afyonkarahisar',
        'Antep': 'Gaziantep',
        'Urfa': 'Şanlıurfa',
        'Maras': 'Kahramanmaraş',
        'Içel': 'Mersin',
        'Icel': 'Mersin'
    };
    const mappedName = variations[cityName] || variations[normalized] || normalized;
    for (const [name, code] of Object.entries(CITY_CODE_MAP)) {
        if (name.toLowerCase() === mappedName.toLowerCase()) {
            return code;
        }
    }
    return 7; // Default: Antalya
}
/**
 * Helper: İlçe kodunu döndürür
 * CBS Info API'den alınan kodlar kullanılmalı
 */
function getDistrictCode(districtName, cityCode) {
    if (!districtName)
        return 718; // Default: Muratpaşa
    // Antalya ilçeleri için özel eşleşme
    if (cityCode === 7 || !cityCode) {
        const normalized = districtName.trim().toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c');
        for (const [name, code] of Object.entries(ANTALYA_DISTRICT_CODES)) {
            const normalizedName = name.toLowerCase()
                .replace(/ı/g, 'i')
                .replace(/ğ/g, 'g')
                .replace(/ü/g, 'u')
                .replace(/ş/g, 's')
                .replace(/ö/g, 'o')
                .replace(/ç/g, 'c');
            if (normalizedName === normalized || normalizedName.includes(normalized) || normalized.includes(normalizedName)) {
                return code;
            }
        }
    }
    // Genel fallback: Şehir kodu + 100 (tahmini)
    return (cityCode || 7) * 100 + 18; // Örn: Antalya için 718 (Muratpaşa)
}
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
// ==========================================
// CBS INFO API - Şehir/İlçe Bilgileri
// ==========================================
// CBS API için helper (şehir/ilçe bilgileri - ayrı credentials kullanır)
const cbsRequest = async (endpoint) => {
    var _a, _b, _c, _d;
    const config = getCBSConfig();
    try {
        const response = await (0, axios_1.default)({
            method: 'GET',
            url: `${MNG_CBS_API_BASE}${endpoint}`,
            headers: {
                'X-IBM-Client-Id': config.clientId,
                'X-IBM-Client-Secret': config.clientSecret,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }
    catch (error) {
        functions.logger.error('CBS API Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new functions.https.HttpsError('internal', ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.detail) || 'CBS Info API hatası', (_d = error.response) === null || _d === void 0 ? void 0 : _d.data);
    }
};
/**
 * Şehir Listesi - MNG Kargo şehir kodlarını getirir
 * Response: [{ code: "01", name: "Adana" }, ...]
 */
exports.getCities = functions.https.onCall(async () => {
    functions.logger.info('Fetching cities from CBS API');
    const cities = await cbsRequest('/getcities');
    return {
        success: true,
        data: cities,
        timestamp: new Date().toISOString()
    };
});
/**
 * İlçe Listesi - Şehir koduna göre ilçeleri getirir
 * @param cityCode - Şehir kodu (örn: "34" İstanbul)
 * Response: [{ cityCode: "34", cityName: "İstanbul", code: "1809", name: "Kadıköy" }, ...]
 */
exports.getDistricts = functions.https.onCall(async (request) => {
    const { cityCode } = request.data;
    if (!cityCode) {
        throw new functions.https.HttpsError('invalid-argument', 'cityCode parametresi gerekli');
    }
    functions.logger.info('Fetching districts for city:', { cityCode });
    const districts = await cbsRequest(`/getdistricts/${cityCode}`);
    return {
        success: true,
        data: districts,
        timestamp: new Date().toISOString()
    };
});
/**
 * Mahalle Listesi - Şehir ve ilçe koduna göre mahalleleri getirir
 */
exports.getNeighborhoods = functions.https.onCall(async (request) => {
    const { cityCode, districtCode } = request.data;
    if (!cityCode || !districtCode) {
        throw new functions.https.HttpsError('invalid-argument', 'cityCode ve districtCode parametreleri gerekli');
    }
    functions.logger.info('Fetching neighborhoods:', { cityCode, districtCode });
    const neighborhoods = await cbsRequest(`/getneighborhoods/${cityCode}/${districtCode}`);
    return {
        success: true,
        data: neighborhoods,
        timestamp: new Date().toISOString()
    };
});
/**
 * İlçe Kodu Bul - İlçe adına göre kod bulur
 * Checkout'ta kullanmak için
 */
exports.findDistrictCode = functions.https.onCall(async (request) => {
    const { cityCode, districtName } = request.data;
    if (!cityCode || !districtName) {
        throw new functions.https.HttpsError('invalid-argument', 'cityCode ve districtName parametreleri gerekli');
    }
    functions.logger.info('Finding district code:', { cityCode, districtName });
    const districts = await cbsRequest(`/getdistricts/${cityCode}`);
    // İlçe adını normalize et (büyük/küçük harf, Türkçe karakterler)
    const normalizedName = districtName.toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    const found = districts.find((d) => {
        const dName = d.name.toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c');
        return dName === normalizedName || dName.includes(normalizedName) || normalizedName.includes(dName);
    });
    if (found) {
        return {
            success: true,
            data: {
                cityCode: found.cityCode,
                cityName: found.cityName,
                districtCode: found.code,
                districtName: found.name
            },
            timestamp: new Date().toISOString()
        };
    }
    return {
        success: false,
        error: 'İlçe bulunamadı',
        availableDistricts: districts.map((d) => d.name),
        timestamp: new Date().toISOString()
    };
});
// ==========================================
// SENDGRID EMAIL FUNCTIONS
// ==========================================
// Email template renkleri - Yeni Premium Tasarım
const EMAIL_COLORS = {
    bg: '#F3F0EB', // Dış arka plan (Sıcak gri/bej)
    card: '#FFFEFA', // Kart arka planı (Sıcak beyaz)
    text: '#2C1810', // Ana metin (Derin kahve)
    gold: '#D4AF37', // Altın vurgu
    gray: '#8A817C', // Açık gri metin
    divider: '#EBE5D9', // Ayırıcı çizgi
    footerBg: '#2C1810', // Footer arka planı (Koyu kahve)
    footerText: '#EBE5D9', // Footer metin
};
/**
 * Şifre Sıfırlama Emaili - SendGrid ile gönderir
 * Firebase Auth'un generatePasswordResetLink'ini kullanır
 */
exports.sendCustomPasswordResetEmail = functions.https.onCall(async (request) => {
    const { email } = request.data;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email adresi gerekli');
    }
    try {
        // Firebase Admin SDK ile şifre sıfırlama linki oluştur
        // Firebase Hosting domain'i kullan (authorized domains'de zaten var)
        const actionCodeSettings = {
            url: 'https://sade-chocolate-prod.web.app/#/account',
            handleCodeInApp: false
        };
        const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
        // Email HTML template - Yeni Premium Tasarım
        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifre Sıfırlama</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${EMAIL_COLORS.bg}; padding: 60px 0; color: ${EMAIL_COLORS.text}; min-height: 100vh;">
        <!-- Main Card Container -->
        <div style="max-width: 640px; margin: 0 auto; background-color: ${EMAIL_COLORS.card}; box-shadow: 0 20px 40px rgba(0,0,0,0.06); border-radius: 0;">

          <!-- Top Border Accent -->
          <div style="height: 4px; background-color: ${EMAIL_COLORS.text}; width: 100%;"></div>

          <!-- Branding Header -->
          <div style="padding: 50px 0 30px; text-align: center;">
            <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 48px; color: ${EMAIL_COLORS.text}; margin: 0; font-style: italic; letter-spacing: -1px;">Sade</h1>
            <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 4px; color: ${EMAIL_COLORS.gold}; margin-top: 5px; font-weight: 600;">Artisan Chocolate</p>
          </div>

          <!-- Divider -->
          <div style="width: 40px; height: 1px; background-color: ${EMAIL_COLORS.gold}; margin: 0 auto 40px;"></div>

          <!-- Content -->
          <div style="padding: 0 50px 50px; text-align: center;">
            <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 20px 0; color: ${EMAIL_COLORS.text}; font-style: italic;">
              Şifre Sıfırlama
            </h2>

            <p style="font-size: 15px; line-height: 1.8; color: ${EMAIL_COLORS.gray}; margin: 0 0 40px 0; font-weight: 300;">
              Hesabınız için bir şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
            </p>

            <!-- CTA Button -->
            <a href="${resetLink}" style="display: inline-block; background: ${EMAIL_COLORS.text}; color: white; padding: 16px 48px; text-decoration: none; border-radius: 50px; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
              Şifremi Sıfırla
            </a>

            <p style="font-size: 13px; color: ${EMAIL_COLORS.gray}; margin: 32px 0 0; line-height: 1.6;">
              Bu link <strong style="color: ${EMAIL_COLORS.text};">1 saat</strong> içinde geçerliliğini yitirecektir.<br>
              Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
            </p>

            <!-- Link fallback -->
            <div style="margin-top: 32px; padding: 20px; background: ${EMAIL_COLORS.bg}; border-radius: 8px;">
              <p style="font-size: 11px; color: ${EMAIL_COLORS.gray}; margin: 0 0 8px;">
                Buton çalışmıyorsa aşağıdaki linki tarayıcınıza kopyalayın:
              </p>
              <p style="font-family: 'Courier New', monospace; font-size: 10px; color: ${EMAIL_COLORS.text}; margin: 0; word-break: break-all;">
                ${resetLink}
              </p>
            </div>
          </div>

          <!-- Atmospheric Footer -->
          <div style="background-color: ${EMAIL_COLORS.footerBg}; color: #fff; padding: 50px; text-align: center;">
            <h4 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-style: italic; margin: 0 0 15px 0; color: ${EMAIL_COLORS.gold};">Sade Deneyimi</h4>
            <p style="font-size: 13px; line-height: 1.7; color: ${EMAIL_COLORS.footerText}; max-width: 400px; margin: 0 auto; font-weight: 300;">
              El yapımı artisan çikolatalarımızla eşsiz bir lezzet yolculuğuna hazır olun.
            </p>
          </div>

          <!-- Minimal Footer Links -->
          <div style="background-color: ${EMAIL_COLORS.bg}; padding: 30px; text-align: center;">
            <p style="font-size: 10px; color: #A09890; margin: 0 0 15px 0; letter-spacing: 1px; text-transform: uppercase;">
              Yeşilbahçe Mah. Çınarlı Cad. No:47, Antalya
            </p>
            <div style="font-size: 11px;">
              <a href="https://sadechocolate.com/#/account" style="color: ${EMAIL_COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Hesabım</a>
              <a href="https://sadechocolate.com/#/catalog" style="color: ${EMAIL_COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Koleksiyonlar</a>
              <a href="mailto:bilgi@sadechocolate.com" style="color: ${EMAIL_COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">İletişim</a>
            </div>
            <p style="font-size: 10px; color: #BDB6B0; margin-top: 20px;">© 2026 Sade Chocolate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        // Firestore mail collection'a yaz (Trigger Email extension gönderecek)
        const db = admin.firestore();
        await db.collection('mail').add({
            to: email,
            message: {
                subject: 'Şifre Sıfırlama - Sade Chocolate',
                html: emailHtml,
                text: `Şifrenizi sıfırlamak için bu linke tıklayın: ${resetLink}`
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        functions.logger.info('Password reset email queued:', { email });
        return {
            success: true,
            message: 'Şifre sıfırlama emaili gönderildi'
        };
    }
    catch (error) {
        functions.logger.error('Password reset error:', error);
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError('not-found', 'Bu email adresi ile kayıtlı bir hesap bulunamadı');
        }
        throw new functions.https.HttpsError('internal', 'Şifre sıfırlama emaili gönderilemedi');
    }
});
// ============================================================
// İYZİCO PAYMENT GATEWAY FUNCTIONS
// ============================================================
/**
 * İyzico Checkout Form Başlatma
 *
 * @param {Object} data - {orderId: string}
 * @param {Object} context - Firebase auth context
 * @returns {Object} {token, checkoutFormContent, tokenExpireTime}
 */
exports.initializeIyzicoPayment = functions.https.onCall(async (request) => {
    var _a, _b;
    const { orderId } = request.data;
    // Validation
    if (!orderId) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId parametresi gerekli');
    }
    functions.logger.info('İyzico payment initialize request:', { orderId });
    try {
        // Firestore'dan order bilgisini al
        const db = admin.firestore();
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Sipariş bulunamadı');
        }
        const orderData = orderDoc.data();
        // Order validation
        if (((_a = orderData.payment) === null || _a === void 0 ? void 0 : _a.status) !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Sipariş zaten ödenmiş veya işlem sırasında');
        }
        if (((_b = orderData.payment) === null || _b === void 0 ? void 0 : _b.method) !== 'card') {
            throw new functions.https.HttpsError('failed-precondition', 'Bu sipariş kart ödemesi için oluşturulmamış');
        }
        // İyzico Checkout Form başlat
        const result = await iyzicoService.initializeCheckoutForm(orderData);
        // Order'a token bilgisini ekle (tracking için)
        await orderDoc.ref.update({
            'payment.iyzicoToken': result.token,
            'payment.tokenExpireTime': result.tokenExpireTime,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        functions.logger.info('İyzico payment initialized:', {
            orderId,
            token: result.token
        });
        return {
            success: true,
            token: result.token,
            checkoutFormContent: result.checkoutFormContent,
            tokenExpireTime: result.tokenExpireTime,
            paymentPageUrl: result.paymentPageUrl
        };
    }
    catch (error) {
        functions.logger.error('İyzico payment initialize error:', error);
        // İyzico HttpsError zaten fırlatılıyorsa, olduğu gibi fırlat
        if (error.code && error.code.startsWith('functions/')) {
            throw error;
        }
        // Diğer hatalar için generic error
        throw new functions.https.HttpsError('internal', 'Ödeme başlatılamadı. Lütfen tekrar deneyin.', error.message);
    }
});
/**
 * İyzico Webhook Callback Handler
 *
 * @param {Request} req - HTTP request (POST from İyzico)
 * @param {Response} res - HTTP response
 */
exports.handleIyzicoCallback = functions.https.onRequest(async (req, res) => {
    var _a;
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        const { token } = req.body;
        if (!token) {
            functions.logger.error('İyzico callback: token eksik');
            res.status(400).send('Token gerekli');
            return;
        }
        functions.logger.info('İyzico callback alındı:', { token });
        // İyzico'dan payment result al
        const paymentResult = await iyzicoService.retrieveCheckoutForm(token);
        const orderId = paymentResult.basketId; // conversationId olarak göndermiştik
        if (!orderId) {
            functions.logger.error('İyzico callback: orderId bulunamadı', paymentResult);
            res.status(400).send('Order ID bulunamadı');
            return;
        }
        // Firestore'dan order al (sipariş numarasına göre query)
        const db = admin.firestore();
        const ordersQuery = await db.collection('orders')
            .where('id', '==', orderId)
            .limit(1)
            .get();
        if (ordersQuery.empty) {
            functions.logger.error('İyzico callback: order bulunamadı', { orderId });
            res.status(404).send('Sipariş bulunamadı');
            return;
        }
        const orderDoc = ordersQuery.docs[0];
        const firestoreOrderId = orderDoc.id; // Firestore document ID
        // Duplicate payment check (aynı token 2x işlenmesin)
        const orderData = orderDoc.data();
        if (((_a = orderData.payment) === null || _a === void 0 ? void 0 : _a.iyzicoPaymentId) === paymentResult.paymentId) {
            functions.logger.warn('İyzico callback: duplicate payment', {
                orderId,
                firestoreOrderId,
                paymentId: paymentResult.paymentId
            });
            // Zaten işlenmiş, success redirect
            res.redirect(`https://sadechocolate.com/?payment=success&orderId=${firestoreOrderId}`);
            return;
        }
        // Payment details extract et
        const paymentDetails = iyzicoService.extractPaymentDetails(paymentResult);
        // Payment başarılı mı?
        const isSuccess = paymentResult.status === 'success' && paymentResult.paymentStatus === 'SUCCESS';
        // Firestore update
        const updateData = {
            'payment.status': isSuccess ? 'paid' : 'failed',
            'payment.iyzicoPaymentId': paymentDetails.iyzicoPaymentId,
            'payment.iyzicoToken': paymentDetails.iyzicoToken,
            'payment.cardFamily': paymentDetails.cardFamily,
            'payment.cardAssociation': paymentDetails.cardAssociation,
            'payment.lastFourDigits': paymentDetails.lastFourDigits,
            'payment.installment': paymentDetails.installment,
            'payment.paidPrice': paymentDetails.paidPrice,
            'payment.merchantCommissionRate': paymentDetails.merchantCommissionRate,
            'payment.iyzicoCommissionFee': paymentDetails.iyzicoCommissionFee,
            'payment.failureReason': paymentDetails.failureReason,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (isSuccess) {
            updateData.status = 'processing'; // Sipariş durumu: hazırlanmaya başladı
            updateData.paymentConfirmedAt = admin.firestore.FieldValue.serverTimestamp();
            // Timeline ekle
            updateData.timeline = admin.firestore.FieldValue.arrayUnion({
                action: 'Ödeme alındı',
                time: new Date().toISOString(),
                note: `${paymentDetails.cardAssociation} **** ${paymentDetails.lastFourDigits}`
            });
        }
        else {
            // Failed payment
            updateData['payment.retryCount'] = admin.firestore.FieldValue.increment(1);
            updateData['payment.lastRetryAt'] = admin.firestore.FieldValue.serverTimestamp();
        }
        await orderDoc.ref.update(updateData);
        functions.logger.info('İyzico payment processed:', {
            orderId,
            status: isSuccess ? 'success' : 'failed',
            paymentId: paymentDetails.iyzicoPaymentId
        });
        // Email gönder (arka planda, hata tolere edilir)
        const sendPaymentEmail = async () => {
            var _a, _b, _c, _d, _e, _f;
            try {
                const customerEmail = (_a = orderData.customer) === null || _a === void 0 ? void 0 : _a.email;
                const customerName = ((_b = orderData.customer) === null || _b === void 0 ? void 0 : _b.name) || 'Değerli Müşterimiz';
                if (!customerEmail) {
                    functions.logger.warn('Email gönderilemedi: customer email yok', { orderId });
                    return;
                }
                // Yeni Premium Marka Renkleri
                const COLORS = {
                    bg: '#F3F0EB',
                    card: '#FFFEFA',
                    text: '#2C1810',
                    gold: '#D4AF37',
                    gray: '#8A817C',
                    divider: '#EBE5D9',
                    footerBg: '#2C1810',
                    footerText: '#EBE5D9'
                };
                // Email header - Yeni Premium Tasarım
                const emailHeader = () => `
            <!-- Top Border Accent -->
            <div style="height: 4px; background-color: ${COLORS.text}; width: 100%;"></div>
            <!-- Branding Header -->
            <div style="padding: 50px 0 30px; text-align: center;">
              <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 48px; color: ${COLORS.text}; margin: 0; font-style: italic; letter-spacing: -1px;">Sade</h1>
              <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 4px; color: ${COLORS.gold}; margin-top: 5px; font-weight: 600;">Artisan Chocolate</p>
            </div>
            <!-- Divider -->
            <div style="width: 40px; height: 1px; background-color: ${COLORS.gold}; margin: 0 auto 40px;"></div>
          `;
                // Email footer - Yeni Premium Tasarım
                const emailFooter = `
            <!-- Atmospheric Footer -->
            <div style="background-color: ${COLORS.footerBg}; color: #fff; padding: 50px; text-align: center;">
              <h4 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-style: italic; margin: 0 0 15px 0; color: ${COLORS.gold};">Sade Deneyimi</h4>
              <p style="font-size: 13px; line-height: 1.7; color: ${COLORS.footerText}; max-width: 400px; margin: 0 auto; font-weight: 300;">
                Ürünleriniz, Antalya'daki atölyemizden özel ısı yalıtımlı "Sade" kutularında, soğuk zincir bozulmadan tarafınıza ulaştırılacaktır.
              </p>
            </div>
            <!-- Minimal Footer Links -->
            <div style="background-color: ${COLORS.bg}; padding: 30px; text-align: center;">
              <p style="font-size: 10px; color: #A09890; margin: 0 0 15px 0; letter-spacing: 1px; text-transform: uppercase;">
                Yeşilbahçe Mah. Çınarlı Cad. No:47, Antalya
              </p>
              <div style="font-size: 11px;">
                <a href="https://sadechocolate.com/#/account" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Hesabım</a>
                <a href="https://sadechocolate.com/#/catalog" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Koleksiyonlar</a>
                <a href="mailto:bilgi@sadechocolate.com" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">İletişim</a>
              </div>
              <p style="font-size: 10px; color: #BDB6B0; margin-top: 20px;">© 2026 Sade Chocolate. All rights reserved.</p>
            </div>
          `;
                // Email wrapper - Yeni Premium Tasarım
                const wrapEmail = (content) => `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Sade Chocolate</title>
              <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${COLORS.bg}; padding: 60px 0; color: ${COLORS.text}; min-height: 100vh;">
              <div style="max-width: 640px; margin: 0 auto; background-color: ${COLORS.card}; box-shadow: 0 20px 40px rgba(0,0,0,0.06); border-radius: 0;">
                ${content}
              </div>
            </body>
            </html>
          `;
                let emailHtml;
                let emailSubject;
                if (isSuccess) {
                    // Payment Success Email - Yeni Premium Tasarım
                    const cardDisplayText = paymentDetails.cardAssociation && paymentDetails.lastFourDigits
                        ? `${paymentDetails.cardAssociation} **** ${paymentDetails.lastFourDigits}`
                        : 'Kredi Kartı';
                    const itemsHtml = (orderData.items || []).map((item) => `
              <tr>
                <td style="padding: 15px 20px 15px 0; vertical-align: middle;">
                  <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 600; color: ${COLORS.text}; font-family: 'Playfair Display', Georgia, serif;">${item.name}</p>
                  <p style="margin: 0; font-size: 12px; color: ${COLORS.gray}; letter-spacing: 0.5px;">${item.quantity} ADET</p>
                </td>
                <td style="padding: 15px 0; text-align: right; vertical-align: middle;">
                  <p style="margin: 0; font-size: 15px; font-weight: 500; color: ${COLORS.text};">₺${(item.price || 0).toFixed(2)}</p>
                </td>
              </tr>
            `).join('');
                    const total = ((_c = orderData.payment) === null || _c === void 0 ? void 0 : _c.total) || 0;
                    const subtotal = ((_d = orderData.payment) === null || _d === void 0 ? void 0 : _d.subtotal) || 0;
                    const shipping = ((_e = orderData.payment) === null || _e === void 0 ? void 0 : _e.shipping) || 0;
                    emailSubject = `Ödeme Onaylandı - Sipariş #${orderId}`;
                    emailHtml = wrapEmail(`
              ${emailHeader()}
              <!-- Greeting & Message -->
              <div style="padding: 0 50px; text-align: center;">
                <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 20px 0; color: ${COLORS.text}; font-style: italic;">
                  Ödemeniz Başarılı!
                </h2>
                <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 20px 0; font-weight: 300;">
                  ${cardDisplayText} ile ödeme tamamlandı
                </p>
                <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 40px 0; font-weight: 300;">
                  Merhaba ${customerName}, <strong style="color: ${COLORS.gold};">#${orderId}</strong> numaralı siparişinizin ödemesi başarıyla tamamlandı. Siparişiniz en kısa sürede hazırlanıp kargoya verilecektir.
                </p>
                <!-- Order Number Badge -->
                <div style="border: 1px solid ${COLORS.gold}; display: inline-block; padding: 12px 30px; border-radius: 50px;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: ${COLORS.gold}; display: block; margin-bottom: 2px;">Sipariş Referansı</span>
                  <span style="font-size: 16px; font-weight: bold; color: ${COLORS.text}; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 1px;">#${orderId}</span>
                </div>
              </div>
              <!-- Product List Section -->
              <div style="padding: 50px;">
                <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: ${COLORS.gray}; border-bottom: 1px solid ${COLORS.divider}; padding-bottom: 15px; margin-bottom: 25px; text-align: left;">
                  Sipariş Özeti
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tbody>${itemsHtml}</tbody>
                </table>
                <!-- Financials -->
                <div style="margin-top: 30px; border-top: 1px solid ${COLORS.divider}; padding-top: 25px;">
                  <table style="width: 100%;" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size: 13px; color: ${COLORS.gray}; padding: 6px 0;">Ara Toplam</td>
                      <td style="font-size: 14px; font-weight: 500; color: ${COLORS.text}; text-align: right; padding: 6px 0;">₺${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 13px; color: ${COLORS.gray}; padding: 6px 0;">Kargo & Paketleme</td>
                      <td style="font-size: 14px; font-weight: 500; color: ${COLORS.text}; text-align: right; padding: 6px 0;">${shipping === 0 ? 'Ücretsiz' : '₺' + shipping.toFixed(2)}</td>
                    </tr>
                  </table>
                  <div style="width: 100%; height: 1px; background-color: ${COLORS.divider}; margin: 15px 0;"></div>
                  <table style="width: 100%;" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size: 18px; font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: ${COLORS.text};">Ödenen Tutar</td>
                      <td style="font-size: 24px; font-weight: bold; color: ${COLORS.gold}; font-family: 'Playfair Display', Georgia, serif; text-align: right;">₺${total.toFixed(2)}</td>
                    </tr>
                  </table>
                </div>
                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0 0;">
                  <a href="https://sadechocolate.com/#/account?view=orders" style="display: inline-block; border: 1px solid ${COLORS.gold}; color: ${COLORS.text}; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
                    Siparişi Takip Et
                  </a>
                </div>
              </div>
              ${emailFooter}
            `);
                }
                else {
                    // Payment Failed Email - Yeni Premium Tasarım
                    const total = ((_f = orderData.payment) === null || _f === void 0 ? void 0 : _f.total) || 0;
                    const retryUrl = `https://sadechocolate.com/checkout?orderId=${orderId}&retry=true`;
                    const errorMessage = paymentDetails.failureReason || 'Kart bilgilerinizi kontrol ediniz veya farklı bir kart deneyiniz.';
                    emailSubject = `Ödeme Tamamlanamadı - Sipariş #${orderId}`;
                    emailHtml = wrapEmail(`
              ${emailHeader()}
              <!-- Greeting & Message -->
              <div style="padding: 0 50px; text-align: center;">
                <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 20px 0; color: ${COLORS.text}; font-style: italic;">
                  Ödeme Tamamlanamadı
                </h2>
                <p style="font-size: 15px; line-height: 1.8; color: ${COLORS.gray}; margin: 0 0 40px 0; font-weight: 300;">
                  Merhaba ${customerName}, <strong style="color: ${COLORS.gold};">₺${total.toFixed(2)}</strong> tutarındaki ödemeniz tamamlanamadı. Siparişiniz beklemede olup, ödemeyi tekrar deneyebilirsiniz.
                </p>
                <!-- Order Number Badge -->
                <div style="border: 1px solid #EF5350; display: inline-block; padding: 12px 30px; border-radius: 50px;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #EF5350; display: block; margin-bottom: 2px;">Sipariş Referansı</span>
                  <span style="font-size: 16px; font-weight: bold; color: ${COLORS.text}; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 1px;">#${orderId}</span>
                </div>
              </div>
              <!-- Error Section -->
              <div style="padding: 50px;">
                <div style="background: #FFF5F5; border-left: 4px solid #EF5350; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                  <h4 style="font-size: 12px; color: #C62828; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">
                    Hata Detayı
                  </h4>
                  <p style="font-size: 14px; color: #B71C1C; margin: 0; line-height: 1.6;">
                    ${errorMessage}
                  </p>
                </div>
                <div style="background: ${COLORS.bg}; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                  <h3 style="font-size: 12px; color: ${COLORS.text}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">
                    Öneriler
                  </h3>
                  <ul style="font-size: 14px; color: ${COLORS.gray}; margin: 0; padding-left: 20px; line-height: 2;">
                    <li>Kart bilgilerinizi kontrol edin</li>
                    <li>Kartınızda yeterli bakiye olduğundan emin olun</li>
                    <li>Farklı bir kart deneyebilirsiniz</li>
                  </ul>
                </div>
                <!-- CTA Button -->
                <div style="text-align: center; margin: 20px 0 0;">
                  <a href="${retryUrl}" style="display: inline-block; background: ${COLORS.text}; color: white; padding: 16px 48px; text-decoration: none; border-radius: 50px; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
                    Ödemeyi Tekrar Dene
                  </a>
                </div>
              </div>
              ${emailFooter}
            `);
                }
                // Firestore mail collection'a ekle (Firebase Trigger Email extension)
                await db.collection('mail').add({
                    to: customerEmail,
                    from: 'Sade Chocolate <bilgi@sadechocolate.com>',
                    message: {
                        subject: emailSubject,
                        html: emailHtml
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                functions.logger.info('Payment email kuyruğa eklendi:', { orderId, isSuccess });
            }
            catch (emailError) {
                // Email hatası ana akışı engellememeli
                functions.logger.error('Payment email hatası:', emailError);
            }
        };
        // Email'i arka planda gönder (await yok, hata tolere edilir)
        sendPaymentEmail().catch(err => functions.logger.error('Email background error:', err));
        // Redirect (Firestore document ID kullan)
        if (isSuccess) {
            res.redirect(`https://sadechocolate.com/?payment=success&orderId=${firestoreOrderId}`);
        }
        else {
            res.redirect(`https://sadechocolate.com/?payment=failed&orderId=${firestoreOrderId}&error=${encodeURIComponent(paymentDetails.failureReason || 'Ödeme başarısız')}`);
        }
    }
    catch (error) {
        functions.logger.error('İyzico callback error:', error);
        res.status(500).send('Internal Server Error');
    }
});
/**
 * Retry Payment (Opsiyonel)
 *
 * @param {Object} data - {orderId: string}
 * @returns {Object} - New checkout form
 */
exports.retryPayment = functions.https.onCall(async (request) => {
    var _a;
    const { orderId } = request.data;
    if (!orderId) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId parametresi gerekli');
    }
    try {
        const db = admin.firestore();
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Sipariş bulunamadı');
        }
        const orderData = orderDoc.data();
        // Sadece failed veya pending siparişler için retry
        if (((_a = orderData.payment) === null || _a === void 0 ? void 0 : _a.status) === 'paid') {
            throw new functions.https.HttpsError('failed-precondition', 'Bu sipariş zaten ödenmiş');
        }
        // Payment status'u pending yap
        await orderDoc.ref.update({
            'payment.status': 'pending',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Yeni checkout form oluştur (initializeIyzicoPayment ile aynı)
        const result = await iyzicoService.initializeCheckoutForm(orderData);
        await orderDoc.ref.update({
            'payment.iyzicoToken': result.token,
            'payment.tokenExpireTime': result.tokenExpireTime
        });
        functions.logger.info('Payment retry başlatıldı:', { orderId });
        return {
            success: true,
            token: result.token,
            checkoutFormContent: result.checkoutFormContent,
            tokenExpireTime: result.tokenExpireTime
        };
    }
    catch (error) {
        functions.logger.error('Retry payment error:', error);
        if (error.code && error.code.startsWith('functions/')) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Ödeme yeniden başlatılamadı', error.message);
    }
});
// ============================================================
// ADMIN AUTHENTICATION - Firebase Custom Claims
// ============================================================
// Admin master key - Environment variable'dan alınır (ilk kurulum için)
const getAdminMasterKey = () => process.env.ADMIN_MASTER_KEY || '';
/**
 * Admin Claim Ekleme
 * Yeni bir kullanıcıya admin yetkisi verir
 *
 * @param {string} targetEmail - Admin yapılacak kullanıcının emaili
 * @param {string} masterKey - Güvenlik anahtarı (ilk kurulum için)
 * @returns {Object} - İşlem sonucu
 */
exports.setAdminClaim = functions.https.onCall(async (request) => {
    var _a, _b;
    const { targetEmail, masterKey } = request.data;
    const callerUid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    // Validation
    if (!targetEmail) {
        throw new functions.https.HttpsError('invalid-argument', 'targetEmail parametresi gerekli');
    }
    // Authorization check - ya mevcut admin ya da master key
    let isAuthorized = false;
    // 1. Master key ile yetkilendirme (ilk kurulum için)
    const configuredMasterKey = getAdminMasterKey();
    if (masterKey && configuredMasterKey && masterKey === configuredMasterKey) {
        isAuthorized = true;
        functions.logger.info('Admin claim: Master key ile yetkilendirme', { targetEmail });
    }
    // 2. Mevcut admin ile yetkilendirme
    if (!isAuthorized && callerUid) {
        try {
            const callerUser = await admin.auth().getUser(callerUid);
            if (((_b = callerUser.customClaims) === null || _b === void 0 ? void 0 : _b.admin) === true) {
                isAuthorized = true;
                functions.logger.info('Admin claim: Mevcut admin ile yetkilendirme', {
                    callerEmail: callerUser.email,
                    targetEmail
                });
            }
        }
        catch (error) {
            functions.logger.error('Caller user fetch error:', error);
        }
    }
    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'Bu işlem için yetkiniz yok');
    }
    try {
        // Target user'ı email ile bul
        const targetUser = await admin.auth().getUserByEmail(targetEmail);
        // Custom claim ekle
        await admin.auth().setCustomUserClaims(targetUser.uid, Object.assign(Object.assign({}, targetUser.customClaims), { admin: true, adminGrantedAt: new Date().toISOString() }));
        // Firestore'da admin kaydı oluştur (audit log)
        const db = admin.firestore();
        await db.collection('admin_users').doc(targetUser.uid).set({
            email: targetEmail,
            uid: targetUser.uid,
            grantedAt: admin.firestore.FieldValue.serverTimestamp(),
            grantedBy: callerUid || 'master_key',
            active: true
        });
        functions.logger.info('Admin claim başarıyla eklendi:', { targetEmail, targetUid: targetUser.uid });
        return {
            success: true,
            message: `${targetEmail} artık admin`,
            uid: targetUser.uid
        };
    }
    catch (error) {
        functions.logger.error('setAdminClaim error:', error);
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError('not-found', 'Bu email ile kayıtlı kullanıcı bulunamadı');
        }
        throw new functions.https.HttpsError('internal', 'Admin yetkisi eklenemedi', error.message);
    }
});
/**
 * Admin Claim Kaldırma
 * Bir kullanıcının admin yetkisini kaldırır
 *
 * @param {string} targetEmail - Admin yetkisi kaldırılacak kullanıcı
 * @returns {Object} - İşlem sonucu
 */
exports.removeAdminClaim = functions.https.onCall(async (request) => {
    var _a, _b;
    const { targetEmail } = request.data;
    const callerUid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!targetEmail) {
        throw new functions.https.HttpsError('invalid-argument', 'targetEmail parametresi gerekli');
    }
    // Sadece mevcut admin kaldırabilir
    if (!callerUid) {
        throw new functions.https.HttpsError('unauthenticated', 'Giriş yapmalısınız');
    }
    const callerUser = await admin.auth().getUser(callerUid);
    if (((_b = callerUser.customClaims) === null || _b === void 0 ? void 0 : _b.admin) !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Bu işlem için admin yetkisi gerekli');
    }
    try {
        const targetUser = await admin.auth().getUserByEmail(targetEmail);
        // Kendi yetkisini kaldıramaz (güvenlik)
        if (targetUser.uid === callerUid) {
            throw new functions.https.HttpsError('failed-precondition', 'Kendi admin yetkinizi kaldıramazsınız');
        }
        // Admin claim'i kaldır
        const currentClaims = targetUser.customClaims || {};
        delete currentClaims.admin;
        delete currentClaims.adminGrantedAt;
        await admin.auth().setCustomUserClaims(targetUser.uid, currentClaims);
        // Firestore kaydını güncelle
        const db = admin.firestore();
        await db.collection('admin_users').doc(targetUser.uid).update({
            active: false,
            revokedAt: admin.firestore.FieldValue.serverTimestamp(),
            revokedBy: callerUid
        });
        functions.logger.info('Admin claim kaldırıldı:', { targetEmail, targetUid: targetUser.uid });
        return {
            success: true,
            message: `${targetEmail} artık admin değil`
        };
    }
    catch (error) {
        functions.logger.error('removeAdminClaim error:', error);
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError('not-found', 'Kullanıcı bulunamadı');
        }
        throw new functions.https.HttpsError('internal', 'Admin yetkisi kaldırılamadı', error.message);
    }
});
/**
 * Admin Durumu Kontrolü
 * Kullanıcının admin olup olmadığını kontrol eder
 *
 * @returns {Object} - Admin durumu
 */
exports.checkAdminStatus = functions.https.onCall(async (request) => {
    var _a, _b, _c;
    const callerUid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!callerUid) {
        return {
            isAdmin: false,
            reason: 'not_authenticated'
        };
    }
    try {
        const user = await admin.auth().getUser(callerUid);
        const isAdmin = ((_b = user.customClaims) === null || _b === void 0 ? void 0 : _b.admin) === true;
        return {
            isAdmin,
            email: user.email,
            adminGrantedAt: ((_c = user.customClaims) === null || _c === void 0 ? void 0 : _c.adminGrantedAt) || null
        };
    }
    catch (error) {
        functions.logger.error('checkAdminStatus error:', error);
        return {
            isAdmin: false,
            reason: 'error'
        };
    }
});
/**
 * Admin Listesi
 * Tüm admin kullanıcılarını listeler (sadece adminler görebilir)
 *
 * @returns {Array} - Admin listesi
 */
exports.listAdmins = functions.https.onCall(async (request) => {
    var _a, _b;
    const callerUid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!callerUid) {
        throw new functions.https.HttpsError('unauthenticated', 'Giriş yapmalısınız');
    }
    const callerUser = await admin.auth().getUser(callerUid);
    if (((_b = callerUser.customClaims) === null || _b === void 0 ? void 0 : _b.admin) !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Bu işlem için admin yetkisi gerekli');
    }
    try {
        const db = admin.firestore();
        const adminsSnapshot = await db.collection('admin_users')
            .where('active', '==', true)
            .get();
        const admins = adminsSnapshot.docs.map(doc => (Object.assign({ uid: doc.id }, doc.data())));
        return {
            success: true,
            admins
        };
    }
    catch (error) {
        functions.logger.error('listAdmins error:', error);
        throw new functions.https.HttpsError('internal', 'Admin listesi alınamadı');
    }
});
// ==========================================
// TELEGRAM BILDIRIM
// ==========================================
const getTelegramConfig = () => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = process.env.TELEGRAM_CHAT_ID || '';
    if (!botToken || !chatId) {
        throw new Error('Telegram credentials not configured');
    }
    return { botToken, chatId };
};
// Telegram mesaj gonderme helper
const sendTelegramMessage = async (message) => {
    const config = getTelegramConfig();
    try {
        await axios_1.default.post(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
            chat_id: config.chatId,
            text: message,
            parse_mode: 'HTML'
        });
        functions.logger.info('Telegram bildirimi gonderildi');
    }
    catch (error) {
        functions.logger.error('Telegram bildirim hatasi:', error.message);
    }
};
// Yeni siparis bildirimi - Firestore trigger (v2)
exports.onNewOrder = (0, firestore_1.onDocumentCreated)('orders/{orderId}', async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const snapshot = event.data;
    if (!snapshot) {
        functions.logger.error('No data in snapshot');
        return;
    }
    const order = snapshot.data();
    const orderId = event.params.orderId;
    functions.logger.info('Yeni siparis:', orderId);
    if (!order) {
        functions.logger.error('Order data is undefined');
        return;
    }
    // Siparis bilgilerini formatla
    const customerName = ((_a = order.customer) === null || _a === void 0 ? void 0 : _a.name) || ((_b = order.shipping) === null || _b === void 0 ? void 0 : _b.fullName) || 'Belirtilmemis';
    const customerEmail = ((_c = order.customer) === null || _c === void 0 ? void 0 : _c.email) || '';
    const customerPhone = ((_d = order.customer) === null || _d === void 0 ? void 0 : _d.phone) || ((_e = order.shipping) === null || _e === void 0 ? void 0 : _e.phone) || 'Belirtilmemis';
    const totalAmount = ((_f = order.payment) === null || _f === void 0 ? void 0 : _f.total) || order.totalAmount || 0;
    const subtotal = ((_g = order.payment) === null || _g === void 0 ? void 0 : _g.subtotal) || 0;
    const shippingCost = ((_h = order.payment) === null || _h === void 0 ? void 0 : _h.shipping) || 0;
    const itemCount = ((_j = order.items) === null || _j === void 0 ? void 0 : _j.length) || 0;
    // Adres bilgileri
    const address = ((_k = order.shipping) === null || _k === void 0 ? void 0 : _k.address) || '';
    const city = ((_l = order.shipping) === null || _l === void 0 ? void 0 : _l.city) || '';
    const district = ((_m = order.shipping) === null || _m === void 0 ? void 0 : _m.district) || '';
    const fullAddress = `${address}\n${district} / ${city}`.trim();
    // Odeme yontemi
    const paymentMethodMap = {
        'card': 'Kredi Karti',
        'transfer': 'Havale/EFT',
        'eft': 'Havale/EFT',
        'cash': 'Kapida Odeme'
    };
    const paymentMethod = paymentMethodMap[(_o = order.payment) === null || _o === void 0 ? void 0 : _o.method] || ((_p = order.payment) === null || _p === void 0 ? void 0 : _p.method) || 'Belirtilmemis';
    // Urun listesi - tum urunler
    const itemsList = (order.items || [])
        .map((item) => {
        const name = item.name || item.productName || item.title || 'Urun';
        const qty = item.quantity || 1;
        const price = item.price || 0;
        return `  • ${name} x${qty} (${price} TL)`;
    })
        .join('\n');
    // Ekstra bilgiler
    const extras = [];
    if (order.hasGiftBag)
        extras.push('Hediye Paketi');
    if (order.isGift)
        extras.push('Hediye Siparis');
    if (order.giftMessage)
        extras.push(`Not: "${order.giftMessage}"`);
    if (order.orderNote)
        extras.push(`Siparis Notu: "${order.orderNote}"`);
    const extrasText = extras.length > 0 ? `\n<b>Ekstralar:</b>\n${extras.map(e => `  • ${e}`).join('\n')}` : '';
    const message = `
📦 <b>YENI SIPARIS!</b>

<b>Siparis No:</b> ${order.orderNumber || order.id || orderId}
<b>Odeme:</b> ${paymentMethod}

━━━━━━━━━━━━━━━━━━
👤 <b>MUSTERI BILGILERI</b>
━━━━━━━━━━━━━━━━━━
<b>Ad Soyad:</b> ${customerName}
<b>Telefon:</b> ${customerPhone}
<b>E-posta:</b> ${customerEmail || 'Belirtilmemis'}

━━━━━━━━━━━━━━━━━━
📍 <b>TESLIMAT ADRESI</b>
━━━━━━━━━━━━━━━━━━
${fullAddress}

━━━━━━━━━━━━━━━━━━
🛒 <b>URUNLER (${itemCount} adet)</b>
━━━━━━━━━━━━━━━━━━
${itemsList}
${extrasText}

━━━━━━━━━━━━━━━━━━
💰 <b>ODEME DETAYI</b>
━━━━━━━━━━━━━━━━━━
Ara Toplam: ${subtotal.toLocaleString('tr-TR')} TL
Kargo: ${shippingCost.toLocaleString('tr-TR')} TL
<b>TOPLAM: ${totalAmount.toLocaleString('tr-TR')} TL</b>

🕐 ${new Date().toLocaleString('tr-TR')}
  `.trim();
    await sendTelegramMessage(message);
});
//# sourceMappingURL=index.js.map