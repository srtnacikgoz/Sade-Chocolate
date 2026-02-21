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
exports.sitemap = exports.initVisitorSession = exports.updateTrackingConfig = exports.calculateDailyStats = exports.onSessionStageChange = exports.onVisitorSessionCreated = exports.sendAbandonedCartEmails = exports.detectAbandonedCarts = exports.cleanupAbandonedCardPayments = exports.getGeliverDistricts = exports.getGeliverCities = exports.trackGeliverShipment = exports.acceptGeliverOffer = exports.getGeliverOffers = exports.createGeliverShipment = exports.checkShipmentStatus = exports.checkAllShipmentStatus = exports.checkSingleShipmentStatus = exports.onNewOrder = exports.listAdmins = exports.checkAdminStatus = exports.removeAdminClaim = exports.setAdminClaim = exports.retryPayment = exports.handleIyzicoCallback = exports.initializeIyzicoPayment = exports.sendCustomPasswordResetEmail = exports.findDistrictCode = exports.getNeighborhoods = exports.getDistricts = exports.getCities = exports.healthCheck = exports.createShipment = exports.calculateShipping = exports.getShipmentStatus = exports.trackShipment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
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
    // JWT token al (Query API de token gerektirebilir)
    let jwtToken = '';
    try {
        jwtToken = await getMNGJwtToken();
    }
    catch (tokenErr) {
        functions.logger.warn('JWT token alınamadı, token olmadan devam ediliyor:', tokenErr);
    }
    const headers = {
        'X-IBM-Client-Id': config.clientId,
        'X-IBM-Client-Secret': config.clientSecret,
        'Content-Type': 'application/json'
    };
    // JWT token varsa ekle
    if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
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
    // DEBUG: Gelen verileri logla
    functions.logger.info('DEBUG - Received request data:', {
        orderId,
        customerName,
        customerPhone,
        customerPhoneType: typeof customerPhone,
        customerPhoneLength: customerPhone === null || customerPhone === void 0 ? void 0 : customerPhone.length,
        hasCustomerPhone: !!customerPhone,
        shippingCity,
        shippingDistrict
    });
    // Validation
    if (!orderId || !customerName || !customerPhone || !shippingAddress) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId, customerName, customerPhone ve shippingAddress gerekli');
    }
    // Alıcı şehir/ilçe kodlarını hesapla
    const receiverCityCode = getCityCode(shippingCity || '');
    // CBS API'den dinamik ilçe kodu al
    let receiverDistrictCode;
    try {
        const districts = await cbsRequest(`/getdistricts/${receiverCityCode}`);
        const normalizedSearch = (shippingDistrict || '').toLowerCase()
            .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
            .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
        const found = districts.find((d) => {
            const dName = d.name.toLowerCase()
                .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
            return dName === normalizedSearch || dName.includes(normalizedSearch) || normalizedSearch.includes(dName);
        });
        if (found) {
            receiverDistrictCode = parseInt(found.code);
            functions.logger.info('CBS API ilçe kodu bulundu:', { district: shippingDistrict, code: receiverDistrictCode });
        }
        else {
            receiverDistrictCode = getDistrictCode(shippingDistrict || '', receiverCityCode);
            functions.logger.warn('CBS API ilçe bulunamadı, fallback kullanıldı:', { district: shippingDistrict, code: receiverDistrictCode });
        }
    }
    catch (cbsError) {
        functions.logger.warn('CBS API hatası, fallback kullanılıyor:', cbsError.message);
        receiverDistrictCode = getDistrictCode(shippingDistrict || '', receiverCityCode);
    }
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
            smsPreference3: 0, // Gönderici SMS (Kapalı)
            marketPlaceShortCode: '' // Kendi site satışları için boş
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
            cityName: shippingCity,
            districtCode: receiverDistrictCode,
            districtName: shippingDistrict,
            address: shippingAddress,
            mobilePhoneNumber: customerPhone.replace(/\D/g, ''), // Sadece rakamlar
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
            url: 'https://sadechocolate.com/account',
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
              <a href="https://sadechocolate.com/account" style="color: ${EMAIL_COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Hesabım</a>
              <a href="https://sadechocolate.com/catalog" style="color: ${EMAIL_COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Koleksiyonlar</a>
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
    var _a, _b, _c, _d, _e, _f, _g;
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
        // Order validation - pending veya failed (retry) kabul et, paid ise reddet
        if (((_a = orderData.payment) === null || _a === void 0 ? void 0 : _a.status) === 'paid') {
            throw new functions.https.HttpsError('failed-precondition', 'Sipariş zaten ödenmiş');
        }
        if (((_b = orderData.payment) === null || _b === void 0 ? void 0 : _b.method) !== 'card') {
            throw new functions.https.HttpsError('failed-precondition', 'Bu sipariş kart ödemesi için oluşturulmamış');
        }
        // Client IP'yi al (request context'ten)
        const clientIp = ((_c = request.rawRequest) === null || _c === void 0 ? void 0 : _c.ip)
            || ((_g = (_f = (_e = (_d = request.rawRequest) === null || _d === void 0 ? void 0 : _d.headers) === null || _e === void 0 ? void 0 : _e['x-forwarded-for']) === null || _f === void 0 ? void 0 : _f.split(',')[0]) === null || _g === void 0 ? void 0 : _g.trim())
            || '127.0.0.1';
        orderData.clientIp = clientIp;
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
    var _a, _b, _c;
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
        // Sipariş zaten ödenmiş veya işleme alınmışsa skip et
        if (((_b = orderData.payment) === null || _b === void 0 ? void 0 : _b.status) === 'paid' || orderData.status === 'processing') {
            functions.logger.warn('İyzico callback: sipariş zaten işlenmiş', {
                orderId,
                firestoreOrderId,
                currentStatus: orderData.status,
                paymentStatus: (_c = orderData.payment) === null || _c === void 0 ? void 0 : _c.status
            });
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
            // Failed payment - sipariş durumunu da cancelled yap
            updateData.status = 'cancelled';
            updateData['payment.retryCount'] = admin.firestore.FieldValue.increment(1);
            updateData['payment.lastRetryAt'] = admin.firestore.FieldValue.serverTimestamp();
            updateData.timeline = admin.firestore.FieldValue.arrayUnion({
                action: 'Ödeme başarısız',
                time: new Date().toISOString(),
                note: paymentDetails.failureReason || 'Ödeme reddedildi'
            });
        }
        await orderDoc.ref.update(updateData);
        functions.logger.info('İyzico payment processed:', {
            orderId,
            status: isSuccess ? 'success' : 'failed',
            paymentId: paymentDetails.iyzicoPaymentId
        });
        // Kart odemesi basarili ise Telegram bildirimi gonder
        if (isSuccess) {
            try {
                // orderData'ya guncel bilgileri ekle
                const enrichedOrder = Object.assign(Object.assign({}, orderData), { payment: Object.assign(Object.assign({}, orderData.payment), { status: 'paid', cardFamily: paymentDetails.cardFamily, lastFourDigits: paymentDetails.lastFourDigits }) });
                await sendOrderTelegramNotification(enrichedOrder, orderId);
            }
            catch (telegramError) {
                functions.logger.error('Telegram bildirim hatasi (iyzico callback):', telegramError.message);
            }
        }
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
                <a href="https://sadechocolate.com/account" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Hesabım</a>
                <a href="https://sadechocolate.com/catalog" style="color: ${COLORS.text}; text-decoration: none; margin: 0 10px; font-weight: bold;">Koleksiyonlar</a>
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
                  <a href="https://sadechocolate.com/account?view=orders" style="display: inline-block; border: 1px solid ${COLORS.gold}; color: ${COLORS.text}; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
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
// Telegram siparis bildirimi helper - hem onCreate hem callback'den cagrilir
const sendOrderTelegramNotification = async (order, orderId) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
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

🕐 ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
  `.trim();
    await sendTelegramMessage(message);
};
// Yeni siparis bildirimi - Firestore trigger (v2)
// Kart odemelerinde bildirim GONDERME - odeme onaylaninca callback'den gonderilir
exports.onNewOrder = (0, firestore_1.onDocumentCreated)('orders/{orderId}', async (event) => {
    var _a;
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
    // Kredi karti odemelerinde bildirim gonderme
    // Odeme onaylaninca iyzicoCallback icinden gonderilecek
    if (((_a = order.payment) === null || _a === void 0 ? void 0 : _a.method) === 'card') {
        functions.logger.info('Kart odemesi - Telegram bildirimi odeme onayina kadar bekletiliyor', { orderId });
        return;
    }
    // EFT/Havale siparisleri icin hemen bildirim gonder
    await sendOrderTelegramNotification(order, orderId);
});
// ==========================================
// SHIPMENT STATUS CHECK FUNCTIONS
// ==========================================
/**
 * Tek Kargo Durum Kontrolü - Manuel tetikleme
 * Admin panelinden tek bir siparişin durumunu kontrol eder
 */
exports.checkSingleShipmentStatus = functions.https.onCall(async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { orderId } = request.data;
    if (!orderId) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId gerekli');
    }
    functions.logger.info('Tek kargo kontrolü:', { orderId });
    const db = admin.firestore();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Sipariş bulunamadı');
    }
    const order = orderDoc.data();
    // Debug: Tüm tracking bilgilerini logla
    functions.logger.info('Order tracking data:', {
        'tracking.referenceId': (_a = order.tracking) === null || _a === void 0 ? void 0 : _a.referenceId,
        'tracking.shipmentId': (_b = order.tracking) === null || _b === void 0 ? void 0 : _b.shipmentId,
        'tracking.trackingNumber': (_c = order.tracking) === null || _c === void 0 ? void 0 : _c.trackingNumber,
        'tracking.barcode': (_d = order.tracking) === null || _d === void 0 ? void 0 : _d.barcode,
        'orderNumber': order.orderNumber,
        'shipping.trackingNumber': (_e = order.shipping) === null || _e === void 0 ? void 0 : _e.trackingNumber
    });
    // Tüm olası değerleri al
    const shipmentId = (_f = order.tracking) === null || _f === void 0 ? void 0 : _f.shipmentId;
    const referenceId = ((_g = order.tracking) === null || _g === void 0 ? void 0 : _g.referenceId) || order.orderNumber;
    const barcode = (_h = order.tracking) === null || _h === void 0 ? void 0 : _h.barcode;
    // referenceId'den tire kaldırılmış versiyonu da dene (SADE-158621 -> SADE158621)
    const referenceIdNoHyphen = referenceId === null || referenceId === void 0 ? void 0 : referenceId.replace(/-/g, '');
    if (!shipmentId && !referenceId && !barcode) {
        return { success: false, message: 'Takip numarası bulunamadı' };
    }
    try {
        let trackingData;
        let usedEndpoint = '';
        // 1. Önce shipmentId ile dene (en güvenilir)
        if (shipmentId) {
            try {
                usedEndpoint = `/trackshipmentByShipmentId/${shipmentId}`;
                functions.logger.info('Trying shipmentId:', { shipmentId, endpoint: usedEndpoint });
                trackingData = await mngRequest(usedEndpoint);
            }
            catch (err) {
                functions.logger.warn('shipmentId başarısız:', err.message);
            }
        }
        // 2. referenceId ile dene (tire ile)
        if (!trackingData && referenceId) {
            try {
                usedEndpoint = `/trackshipment/${referenceId}`;
                functions.logger.info('Trying referenceId:', { referenceId, endpoint: usedEndpoint });
                trackingData = await mngRequest(usedEndpoint);
            }
            catch (err) {
                functions.logger.warn('referenceId başarısız:', err.message);
            }
        }
        // 3. referenceId tiresiz dene
        if (!trackingData && referenceIdNoHyphen && referenceIdNoHyphen !== referenceId) {
            try {
                usedEndpoint = `/trackshipment/${referenceIdNoHyphen}`;
                functions.logger.info('Trying referenceId (no hyphen):', { referenceIdNoHyphen, endpoint: usedEndpoint });
                trackingData = await mngRequest(usedEndpoint);
            }
            catch (err) {
                functions.logger.warn('referenceId (no hyphen) başarısız:', err.message);
            }
        }
        // 4. Barcode ile dene
        if (!trackingData && barcode) {
            try {
                usedEndpoint = `/trackshipment/${barcode}`;
                functions.logger.info('Trying barcode:', { barcode, endpoint: usedEndpoint });
                trackingData = await mngRequest(usedEndpoint);
            }
            catch (err) {
                functions.logger.warn('barcode başarısız:', err.message);
            }
        }
        // Hiçbiri çalışmadıysa
        if (!trackingData) {
            return {
                success: false,
                message: 'MNG API ile bağlantı kurulamadı. Gönderi henüz sisteme kaydedilmemiş olabilir.',
                triedValues: { shipmentId, referenceId, referenceIdNoHyphen, barcode }
            };
        }
        const hasMovement = trackingData && Array.isArray(trackingData) && trackingData.length > 0;
        const displayTrackingNumber = referenceId || shipmentId;
        if (hasMovement && order.status === 'shipped') {
            // Durumu güncelle
            await orderDoc.ref.update({
                status: 'in_transit',
                'tracking.firstMovementAt': new Date(),
                'tracking.lastCheckedAt': new Date()
            });
            // Email gönder
            if ((_j = order.customer) === null || _j === void 0 ? void 0 : _j.email) {
                await db.collection('mail').add({
                    to: order.customer.email,
                    template: {
                        name: 'shipping_notification',
                        data: {
                            customerName: order.customer.name || 'Değerli Müşterimiz',
                            orderId: order.orderNumber || orderId,
                            trackingNumber: displayTrackingNumber,
                            carrierName: 'MNG Kargo',
                            trackingUrl: `https://www.mngkargo.com.tr/gonderi-takip/?q=${displayTrackingNumber}`
                        }
                    }
                });
            }
            return {
                success: true,
                status: 'in_transit',
                message: 'Kargo harekete geçti, müşteriye bildirim gönderildi',
                trackingData
            };
        }
        await orderDoc.ref.update({ 'tracking.lastCheckedAt': new Date() });
        return {
            success: true,
            status: order.status,
            message: hasMovement ? 'Kargo zaten hareket halinde' : 'Henüz hareket yok',
            trackingData
        };
    }
    catch (error) {
        functions.logger.error('Tracking hatası:', error);
        return { success: false, message: error.message || 'Takip bilgisi alınamadı' };
    }
});
/**
 * Toplu Kargo Durum Kontrolü - Manuel tetikleme
 * Tüm "shipped" durumundaki siparişleri kontrol eder
 */
exports.checkAllShipmentStatus = functions.https.onCall(async () => {
    var _a, _b, _c, _d;
    functions.logger.info('Toplu kargo kontrolü başladı');
    const db = admin.firestore();
    const results = { checked: 0, updated: 0, errors: 0 };
    try {
        const shippedOrders = await db.collection('orders')
            .where('status', '==', 'shipped')
            .get();
        if (shippedOrders.empty) {
            return { success: true, message: 'Kontrol edilecek kargo yok', results };
        }
        for (const orderDoc of shippedOrders.docs) {
            const order = orderDoc.data();
            // MNG API referenceId bekliyor (bizim sipariş numaramız), barcode değil
            const trackingNumber = ((_a = order.tracking) === null || _a === void 0 ? void 0 : _a.referenceId) || order.orderNumber || ((_b = order.tracking) === null || _b === void 0 ? void 0 : _b.trackingNumber) || ((_c = order.shipping) === null || _c === void 0 ? void 0 : _c.trackingNumber);
            results.checked++;
            if (!trackingNumber)
                continue;
            try {
                const trackingData = await mngRequest(`/trackshipment/${trackingNumber}`);
                const hasMovement = trackingData && Array.isArray(trackingData) && trackingData.length > 0;
                if (hasMovement) {
                    await orderDoc.ref.update({
                        status: 'in_transit',
                        'tracking.firstMovementAt': new Date(),
                        'tracking.lastCheckedAt': new Date()
                    });
                    if ((_d = order.customer) === null || _d === void 0 ? void 0 : _d.email) {
                        await db.collection('mail').add({
                            to: order.customer.email,
                            template: {
                                name: 'shipping_notification',
                                data: {
                                    customerName: order.customer.name || 'Değerli Müşterimiz',
                                    orderId: order.orderNumber || orderDoc.id,
                                    trackingNumber,
                                    carrierName: 'MNG Kargo',
                                    trackingUrl: `https://www.mngkargo.com.tr/gonderi-takip/?q=${trackingNumber}`
                                }
                            }
                        });
                    }
                    results.updated++;
                }
                else {
                    await orderDoc.ref.update({ 'tracking.lastCheckedAt': new Date() });
                }
            }
            catch (err) {
                results.errors++;
            }
        }
        return {
            success: true,
            message: `${results.checked} kargo kontrol edildi, ${results.updated} güncellendi`,
            results
        };
    }
    catch (error) {
        functions.logger.error('Toplu kontrol hatası:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Kargo Durum Kontrolü - 30 dakikada bir çalışır (Otomatik)
 * "shipped" durumundaki siparişleri kontrol eder
 * Kargo harekete geçtiyse email gönderir ve durumu günceller
 */
exports.checkShipmentStatus = (0, scheduler_1.onSchedule)({
    schedule: 'every 30 minutes',
    region: 'europe-west3',
    timeoutSeconds: 300,
}, async () => {
    var _a, _b, _c, _d;
    functions.logger.info('Kargo durum kontrolü başladı');
    const db = admin.firestore();
    try {
        // "shipped" durumundaki siparişleri al
        const shippedOrders = await db.collection('orders')
            .where('status', '==', 'shipped')
            .get();
        if (shippedOrders.empty) {
            functions.logger.info('Kontrol edilecek kargo yok');
            return;
        }
        functions.logger.info(`${shippedOrders.size} adet kargo kontrol edilecek`);
        for (const orderDoc of shippedOrders.docs) {
            const order = orderDoc.data();
            const orderId = order.orderNumber || orderDoc.id;
            // MNG API referenceId bekliyor (bizim sipariş numaramız), barcode değil
            const trackingNumber = ((_a = order.tracking) === null || _a === void 0 ? void 0 : _a.referenceId) || order.orderNumber || ((_b = order.tracking) === null || _b === void 0 ? void 0 : _b.trackingNumber) || ((_c = order.shipping) === null || _c === void 0 ? void 0 : _c.trackingNumber);
            if (!trackingNumber) {
                functions.logger.warn(`Sipariş ${orderId} için takip numarası yok`);
                continue;
            }
            try {
                // MNG Tracking API ile durumu kontrol et
                const trackingData = await mngRequest(`/trackshipment/${trackingNumber}`);
                // Hareket var mı kontrol et (en az bir hareket kaydı varsa)
                const hasMovement = trackingData &&
                    Array.isArray(trackingData) &&
                    trackingData.length > 0;
                if (hasMovement) {
                    functions.logger.info(`Kargo harekete geçti: ${orderId}`, { trackingNumber });
                    // Durumu "in_transit" olarak güncelle
                    await orderDoc.ref.update({
                        status: 'in_transit',
                        'tracking.firstMovementAt': new Date(),
                        'tracking.lastCheckedAt': new Date()
                    });
                    // Email gönder
                    if ((_d = order.customer) === null || _d === void 0 ? void 0 : _d.email) {
                        const customerName = order.customer.name || 'Değerli Müşterimiz';
                        const trackingUrl = `https://www.mngkargo.com.tr/gonderi-takip/?q=${trackingNumber}`;
                        // SendGrid ile email gönder
                        await db.collection('mail').add({
                            to: order.customer.email,
                            template: {
                                name: 'shipping_notification',
                                data: {
                                    customerName,
                                    orderId,
                                    trackingNumber,
                                    carrierName: 'MNG Kargo',
                                    trackingUrl
                                }
                            }
                        });
                        functions.logger.info(`Kargo emaili kuyruğa eklendi: ${order.customer.email}`);
                    }
                }
                else {
                    // Henüz hareket yok, sadece son kontrol zamanını güncelle
                    await orderDoc.ref.update({
                        'tracking.lastCheckedAt': new Date()
                    });
                }
            }
            catch (trackingError) {
                functions.logger.warn(`Takip hatası (${orderId}):`, trackingError.message);
                // Hata olsa bile diğer siparişlere devam et
            }
        }
        functions.logger.info('Kargo durum kontrolü tamamlandı');
    }
    catch (error) {
        functions.logger.error('Kargo durum kontrolü hatası:', error);
    }
});
// ==========================================
// GELIVER KARGO API FUNCTIONS
// ==========================================
const geliverService = __importStar(require("./services/geliverService"));
/**
 * Geliver ile Kargo Oluştur
 * MNG yerine Geliver API kullanır - 10+ kargo firması desteği
 */
exports.createGeliverShipment = functions.https.onCall(async (request) => {
    const { orderId, customerName, customerPhone, customerEmail, shippingAddress, shippingCity, shippingDistrict, weight = 1, desi = 2, contentDescription = 'Çikolata Ürünleri', autoAccept = true // Otomatik en ucuz teklifi kabul et
     } = request.data;
    // Validation
    if (!orderId || !customerName || !customerPhone || !shippingAddress) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId, customerName, customerPhone ve shippingAddress gerekli');
    }
    functions.logger.info('Creating Geliver shipment:', {
        orderId,
        customerName,
        city: shippingCity,
        district: shippingDistrict,
        autoAccept
    });
    try {
        // 1. Gönderi oluştur
        const shipment = await geliverService.createGeliverShipment({
            orderId,
            customerName,
            customerPhone,
            customerEmail,
            shippingAddress,
            shippingCity: shippingCity || 'İstanbul',
            shippingDistrict: shippingDistrict || '',
            weight,
            desi,
            contentDescription
        });
        let result = {
            success: true,
            shipmentId: shipment.id,
            status: shipment.status
        };
        // 2. Otomatik kabul aktifse en iyi teklifi kabul et
        if (autoAccept) {
            try {
                const accepted = await geliverService.autoAcceptBestOffer(shipment.id);
                result = Object.assign(Object.assign({}, result), { trackingNumber: accepted.trackingNumber, labelUrl: accepted.labelUrl, carrier: accepted.carrier, price: accepted.price });
            }
            catch (offerError) {
                functions.logger.warn('Auto-accept failed, returning shipment for manual selection:', offerError.message);
                // Teklifler henüz hazır değilse shipment'ı döndür
                result.offers = shipment.offers;
                result.message = 'Gönderi oluşturuldu. Teklifler hazır olunca manuel seçim yapabilirsiniz.';
            }
        }
        return Object.assign(Object.assign({}, result), { timestamp: new Date().toISOString() });
    }
    catch (error) {
        functions.logger.error('Geliver shipment creation failed:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Kargo oluşturulamadı', error.details);
    }
});
/**
 * Geliver Tekliflerini Getir
 */
exports.getGeliverOffers = functions.https.onCall(async (request) => {
    const { shipmentId } = request.data;
    if (!shipmentId) {
        throw new functions.https.HttpsError('invalid-argument', 'shipmentId gerekli');
    }
    const offers = await geliverService.getShipmentOffers(shipmentId);
    return {
        success: true,
        offers,
        timestamp: new Date().toISOString()
    };
});
/**
 * Geliver Teklif Kabul Et
 */
exports.acceptGeliverOffer = functions.https.onCall(async (request) => {
    const { shipmentId, offerId } = request.data;
    if (!shipmentId || !offerId) {
        throw new functions.https.HttpsError('invalid-argument', 'shipmentId ve offerId gerekli');
    }
    const result = await geliverService.acceptOffer(shipmentId, offerId);
    return Object.assign(Object.assign({ success: true }, result), { timestamp: new Date().toISOString() });
});
/**
 * Geliver Kargo Takip
 */
exports.trackGeliverShipment = functions.https.onCall(async (request) => {
    const { shipmentId } = request.data;
    if (!shipmentId) {
        throw new functions.https.HttpsError('invalid-argument', 'shipmentId gerekli');
    }
    const tracking = await geliverService.trackGeliverShipment(shipmentId);
    return Object.assign(Object.assign({ success: true }, tracking), { timestamp: new Date().toISOString() });
});
/**
 * Geliver Şehir Listesi
 */
exports.getGeliverCities = functions.https.onCall(async () => {
    const cities = await geliverService.getGeliverCities();
    return {
        success: true,
        data: cities,
        timestamp: new Date().toISOString()
    };
});
/**
 * Geliver İlçe Listesi
 */
exports.getGeliverDistricts = functions.https.onCall(async (request) => {
    const { cityCode } = request.data;
    if (!cityCode) {
        throw new functions.https.HttpsError('invalid-argument', 'cityCode gerekli');
    }
    const districts = await geliverService.getGeliverDistricts(cityCode);
    return {
        success: true,
        data: districts,
        timestamp: new Date().toISOString()
    };
});
const DEFAULT_TRACKING_CONFIG = {
    abandonedCartTimeoutMinutes: 30,
    telegramMinCartValue: 200,
    checkoutAlertMinCartValue: 300,
    vipCustomerAlertEnabled: true
};
const getTrackingConfig = async () => {
    var _a, _b, _c, _d;
    const db = admin.firestore();
    try {
        const configDoc = await db.collection('settings').doc('tracking').get();
        if (configDoc.exists) {
            const data = configDoc.data();
            return {
                abandonedCartTimeoutMinutes: (_a = data === null || data === void 0 ? void 0 : data.abandonedCartTimeoutMinutes) !== null && _a !== void 0 ? _a : DEFAULT_TRACKING_CONFIG.abandonedCartTimeoutMinutes,
                telegramMinCartValue: (_b = data === null || data === void 0 ? void 0 : data.telegramMinCartValue) !== null && _b !== void 0 ? _b : DEFAULT_TRACKING_CONFIG.telegramMinCartValue,
                checkoutAlertMinCartValue: (_c = data === null || data === void 0 ? void 0 : data.checkoutAlertMinCartValue) !== null && _c !== void 0 ? _c : DEFAULT_TRACKING_CONFIG.checkoutAlertMinCartValue,
                vipCustomerAlertEnabled: (_d = data === null || data === void 0 ? void 0 : data.vipCustomerAlertEnabled) !== null && _d !== void 0 ? _d : DEFAULT_TRACKING_CONFIG.vipCustomerAlertEnabled
            };
        }
    }
    catch (error) {
        functions.logger.warn('Tracking config alinamadi, default kullaniliyor');
    }
    return DEFAULT_TRACKING_CONFIG;
};
/**
 * Tamamlanmamis Kart Odemesi Temizleme - Her 15 dakikada calisir
 * 30 dakikadan eski pending kart odemelerini otomatik iptal eder
 */
exports.cleanupAbandonedCardPayments = (0, scheduler_1.onSchedule)({
    schedule: 'every 15 minutes',
    region: 'europe-west3',
    timeoutSeconds: 120,
}, async () => {
    const db = admin.firestore();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    try {
        // Pending durumundaki kart odemelerini bul
        const pendingOrders = await db.collection('orders')
            .where('payment.method', '==', 'card')
            .where('payment.status', '==', 'pending')
            .where('status', '==', 'pending')
            .get();
        if (pendingOrders.empty) {
            functions.logger.info('Temizlenecek tamamlanmamis kart odemesi yok');
            return;
        }
        const batch = db.batch();
        let cancelledCount = 0;
        for (const orderDoc of pendingOrders.docs) {
            const order = orderDoc.data();
            const createdAt = order.createdAt;
            // 30 dakikadan eski mi kontrol et
            if (createdAt && createdAt < thirtyMinutesAgo) {
                batch.update(orderDoc.ref, {
                    status: 'cancelled',
                    'payment.status': 'expired',
                    'payment.failureReason': 'Odeme suresi doldu (30 dakika)',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    timeline: admin.firestore.FieldValue.arrayUnion({
                        status: 'cancelled',
                        time: new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
                        note: 'Kart odemesi tamamlanmadi - otomatik iptal'
                    })
                });
                cancelledCount++;
            }
        }
        if (cancelledCount > 0) {
            await batch.commit();
            functions.logger.info(`${cancelledCount} tamamlanmamis kart odemesi iptal edildi`);
        }
    }
    catch (error) {
        functions.logger.error('Kart odemesi temizleme hatasi:', error.message);
    }
});
/**
 * Terk Edilmis Sepet Algilama - Her 5 dakikada calisir
 * Belirli sure hareketsiz cart/checkout session'lari tespit eder
 */
exports.detectAbandonedCarts = (0, scheduler_1.onSchedule)({
    schedule: 'every 5 minutes',
    region: 'europe-west3',
    timeoutSeconds: 120,
}, async () => {
    var _a;
    const db = admin.firestore();
    const config = await getTrackingConfig();
    const timeoutMs = (config.abandonedCartTimeoutMinutes || 30) * 60 * 1000;
    const cutoffTime = new Date(Date.now() - timeoutMs);
    try {
        // Aktif cart/checkout session'lari bul
        const sessionsSnap = await db.collection('sessions')
            .where('isActive', '==', true)
            .where('currentStage', 'in', ['cart', 'checkout'])
            .where('lastActivityAt', '<', admin.firestore.Timestamp.fromDate(cutoffTime))
            .get();
        if (sessionsSnap.empty) {
            functions.logger.info('Terk edilmis sepet bulunamadi');
            return;
        }
        const batch = db.batch();
        const abandonedCarts = [];
        const minCartValue = config.telegramMinCartValue || 200;
        for (const sessionDoc of sessionsSnap.docs) {
            const session = sessionDoc.data();
            // Session'i abandoned olarak isaretle
            batch.update(sessionDoc.ref, {
                currentStage: 'abandoned',
                isActive: false,
                abandonedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Abandoned cart kaydi olustur
            const abandonedCartRef = db.collection('abandoned_carts').doc();
            batch.set(abandonedCartRef, {
                sessionId: sessionDoc.id,
                visitorId: session.visitorId,
                customerEmail: session.customerEmail || null,
                customerName: session.customerName || null,
                cartValue: session.cartValue || 0,
                cartItems: session.cartItemsDetail || [],
                abandonedAt: admin.firestore.FieldValue.serverTimestamp(),
                stage: session.currentStage,
                notificationSent: false,
                recoveryEmailSent: false,
                geo: session.geo || null
            });
            // Telegram bildirimi icin listeye ekle (min deger ustu)
            if ((session.cartValue || 0) >= minCartValue) {
                const geoStr = ((_a = session.geo) === null || _a === void 0 ? void 0 : _a.city)
                    ? `${session.geo.city}, ${session.geo.country}`
                    : 'Bilinmiyor';
                abandonedCarts.push({
                    name: session.customerName || 'Anonim',
                    email: session.customerEmail || '-',
                    value: session.cartValue || 0,
                    items: session.cartItems || 0,
                    stage: session.currentStage === 'checkout' ? 'Odeme' : 'Sepet',
                    location: geoStr,
                    device: session.device || '-'
                });
            }
        }
        await batch.commit();
        // Telegram bildirimi gonder (toplu)
        if (abandonedCarts.length > 0) {
            const cartList = abandonedCarts
                .map(c => `  • ${c.name}: ${c.value} TL (${c.items} urun)\n    ${c.location} | ${c.device} | ${c.stage}`)
                .join('\n\n');
            const message = `
🛒 <b>TERK EDILEN SEPETLER</b>

${abandonedCarts.length} adet yuksek degerli sepet terk edildi:

${cartList}

🕐 ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
      `.trim();
            await sendTelegramMessage(message);
        }
        functions.logger.info(`${sessionsSnap.size} terk edilmis sepet algilandi`);
    }
    catch (error) {
        functions.logger.error('Abandoned cart detection error:', error.message);
    }
});
/**
 * Terk Edilmis Sepet Kurtarma E-postasi - 1 saat sonra gonderir
 * abandoned_carts collection'daki recoveryEmailSent: false olan kayitlari kontrol eder
 */
exports.sendAbandonedCartEmails = (0, scheduler_1.onSchedule)({
    schedule: 'every 15 minutes',
    region: 'europe-west3',
    timeoutSeconds: 120,
}, async () => {
    const db = admin.firestore();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    try {
        // E-posta gonderilmemis ve en az 1 saat once terk edilmis sepetler
        const snap = await db.collection('abandoned_carts')
            .where('recoveryEmailSent', '==', false)
            .where('abandonedAt', '<', admin.firestore.Timestamp.fromDate(oneHourAgo))
            .limit(20)
            .get();
        if (snap.empty) {
            functions.logger.info('Gonderilecek kurtarma emaili yok');
            return;
        }
        let sentCount = 0;
        for (const doc of snap.docs) {
            const cart = doc.data();
            // E-posta adresi yoksa atla
            if (!cart.customerEmail) {
                await doc.ref.update({ recoveryEmailSent: true, skipReason: 'no_email' });
                continue;
            }
            const customerName = cart.customerName || 'Degerli Musterimiz';
            const cartValue = cart.cartValue || 0;
            const cartItems = cart.cartItems || [];
            // Urun listesi HTML
            const itemsHtml = Array.isArray(cartItems) && cartItems.length > 0
                ? cartItems.map((item) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #f3f0eb;">
              ${item.image ? `<img src="${item.image}" alt="${item.name || item.title || ''}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 12px;" />` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #f3f0eb; font-family: Georgia, serif;">
              ${item.name || item.title || 'Urun'}
              ${item.quantity ? ` x ${item.quantity}` : ''}
            </td>
          </tr>
        `).join('')
                : '';
            const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #faf8f5; font-family: Georgia, 'Times New Roman', serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; color: #3d2b1f; margin: 0; font-style: italic;">Sade Chocolate</h1>
          </div>
          <div style="background: white; border-radius: 24px; padding: 40px; border: 1px solid #f3f0eb;">
            <h2 style="font-size: 20px; color: #3d2b1f; margin: 0 0 16px; font-style: italic;">
              Sepetiniz sizi bekliyor
            </h2>
            <p style="color: #6b5e54; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Merhaba ${customerName},<br/><br/>
              Sectiginiz urunler hala sepetinizde. Siparişinizi tamamlamak icin asagidaki butona tiklayabilirsiniz.
            </p>
            ${itemsHtml ? `
            <table style="width: 100%; margin-bottom: 24px;">
              ${itemsHtml}
            </table>
            ` : ''}
            ${cartValue > 0 ? `
            <p style="font-size: 18px; color: #3d2b1f; font-weight: bold; text-align: center; margin: 24px 0;">
              Sepet Toplami: ${cartValue.toFixed(2)} TL
            </p>
            ` : ''}
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://sadechocolate.com/cart" style="display: inline-block; background: #3d2b1f; color: white; text-decoration: none; padding: 16px 48px; border-radius: 16px; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
                SEPETE DON
              </a>
            </div>
            <p style="color: #a09890; font-size: 12px; text-align: center; margin: 24px 0 0;">
              Yardima mi ihtiyaciniz var? info@sadechocolate.com adresinden bize ulasabilirsiniz.
            </p>
          </div>
        </div>
      </body>
      </html>
      `;
            // SendGrid mail collection'a yaz
            await db.collection('mail').add({
                to: cart.customerEmail,
                message: {
                    subject: 'Sepetiniz sizi bekliyor - Sade Chocolate',
                    html: emailHtml,
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                type: 'abandoned_cart_recovery',
            });
            // Kaydi guncelle
            await doc.ref.update({
                recoveryEmailSent: true,
                recoveryEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            sentCount++;
        }
        if (sentCount > 0) {
            functions.logger.info(`${sentCount} terk edilmis sepet kurtarma emaili gonderildi`);
        }
    }
    catch (error) {
        functions.logger.error('Abandoned cart email error:', error.message);
    }
});
/**
 * VIP Musteri Bildirimi - Geri donen musteri sitede
 * Session olusturulunca tetiklenir
 */
exports.onVisitorSessionCreated = (0, firestore_1.onDocumentCreated)('sessions/{sessionId}', async (event) => {
    var _a;
    const snapshot = event.data;
    if (!snapshot)
        return;
    const session = snapshot.data();
    const config = await getTrackingConfig();
    // VIP bildirim kapali ise cik
    if (!config.vipCustomerAlertEnabled)
        return;
    // Sadece geri donen musteriler icin bildirim
    if (!session.isReturningCustomer)
        return;
    const geoStr = ((_a = session.geo) === null || _a === void 0 ? void 0 : _a.city)
        ? `${session.geo.city}, ${session.geo.country}`
        : 'Bilinmiyor';
    const message = `
👋 <b>VIP MUSTERI SITEDE!</b>

<b>Musteri:</b> ${session.customerName || 'Bilinmiyor'}
<b>Email:</b> ${session.customerEmail || '-'}
<b>Cihaz:</b> ${session.device} (${session.browser || '-'})
<b>Konum:</b> ${geoStr}
<b>Kaynak:</b> ${session.referrer || 'Direkt'}

🕐 ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
  `.trim();
    await sendTelegramMessage(message);
});
/**
 * Checkout Takip - Yuksek degerli sepet checkout'a gectiginde bildir
 */
exports.onSessionStageChange = (0, firestore_1.onDocumentUpdated)('sessions/{sessionId}', async (event) => {
    var _a, _b, _c, _d, _e;
    const before = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
    const after = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
    if (!before || !after)
        return;
    // Checkout'a gecis kontrolu
    if (before.currentStage !== 'checkout' && after.currentStage === 'checkout') {
        const config = await getTrackingConfig();
        const minValue = config.checkoutAlertMinCartValue || 300;
        // Minimum deger kontrolu
        if ((after.cartValue || 0) < minValue)
            return;
        const geoStr = ((_e = after.geo) === null || _e === void 0 ? void 0 : _e.city)
            ? `${after.geo.city}, ${after.geo.country}`
            : 'Bilinmiyor';
        const message = `
💳 <b>CHECKOUT BASLADI!</b>

<b>Musteri:</b> ${after.customerName || 'Anonim'}
<b>Sepet:</b> ${after.cartValue || 0} TL (${after.cartItems || 0} urun)
<b>Cihaz:</b> ${after.device} (${after.browser || '-'})
<b>Konum:</b> ${geoStr}

⏰ Siparis bekleniyor...

🕐 ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
    `.trim();
        await sendTelegramMessage(message);
    }
});
/**
 * Gunluk Istatistik Hesaplama ve Rapor - Her gun 00:05'te calisir
 */
exports.calculateDailyStats = (0, scheduler_1.onSchedule)({
    schedule: '5 0 * * *',
    region: 'europe-west3',
    timeoutSeconds: 300,
    timeZone: 'Europe/Istanbul',
}, async () => {
    const db = admin.firestore();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfDay = new Date(dateStr + 'T00:00:00');
    const endOfDay = new Date(dateStr + 'T23:59:59');
    try {
        // Session'lari al
        const sessionsSnap = await db.collection('sessions')
            .where('startedAt', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
            .where('startedAt', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
            .get();
        const sessions = sessionsSnap.docs.map(d => d.data());
        // Unique visitor sayisi
        const uniqueVisitors = new Set(sessions.map(s => s.visitorId)).size;
        // Stage sayilari
        const cartAdditions = sessions.filter(s => ['cart', 'checkout', 'completed', 'abandoned'].includes(s.currentStage)).length;
        const checkoutStarts = sessions.filter(s => ['checkout', 'completed'].includes(s.currentStage)).length;
        const completedOrders = sessions.filter(s => s.currentStage === 'completed').length;
        const abandonedCarts = sessions.filter(s => s.currentStage === 'abandoned').length;
        // Ortalama sepet degeri
        const cartsWithValue = sessions.filter(s => (s.cartValue || 0) > 0);
        const avgCartValue = cartsWithValue.length > 0
            ? cartsWithValue.reduce((sum, s) => sum + (s.cartValue || 0), 0) / cartsWithValue.length
            : 0;
        // Donusum orani
        const conversionRate = sessions.length > 0
            ? (completedOrders / sessions.length) * 100
            : 0;
        // Ulke dagilimi
        const countryStats = {};
        sessions.forEach(s => {
            var _a;
            const country = ((_a = s.geo) === null || _a === void 0 ? void 0 : _a.country) || 'Bilinmiyor';
            countryStats[country] = (countryStats[country] || 0) + 1;
        });
        // En cok ziyaretci gelen 3 ulke
        const topCountries = Object.entries(countryStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([country, count]) => `${country}: ${count}`)
            .join(', ');
        // Kaydet
        await db.collection('daily_stats').doc(dateStr).set({
            date: dateStr,
            totalVisitors: sessions.length,
            uniqueVisitors,
            cartAdditions,
            checkoutStarts,
            completedOrders,
            abandonedCarts,
            conversionRate: Math.round(conversionRate * 100) / 100,
            avgCartValue: Math.round(avgCartValue),
            countryStats,
            calculatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Telegram ozet raporu
        const message = `
📊 <b>GUNLUK RAPOR - ${dateStr}</b>

<b>Ziyaretci:</b> ${sessions.length} (${uniqueVisitors} tekil)
<b>Sepete Ekleme:</b> ${cartAdditions}
<b>Checkout:</b> ${checkoutStarts}
<b>Siparis:</b> ${completedOrders}
<b>Terk:</b> ${abandonedCarts}

<b>Donusum:</b> %${conversionRate.toFixed(1)}
<b>Ort. Sepet:</b> ${Math.round(avgCartValue)} TL

<b>Ulkeler:</b> ${topCountries || 'Veri yok'}
    `.trim();
        await sendTelegramMessage(message);
        functions.logger.info('Daily stats calculated:', dateStr);
    }
    catch (error) {
        functions.logger.error('Daily stats error:', error.message);
    }
});
/**
 * Tracking Config Guncelle - Admin panelden ayar degisikligi
 */
exports.updateTrackingConfig = functions.https.onCall(async (request) => {
    // Admin kontrolu
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Giris yapmaniz gerekiyor');
    }
    const { config } = request.data;
    if (!config) {
        throw new functions.https.HttpsError('invalid-argument', 'Config gerekli');
    }
    const db = admin.firestore();
    await db.collection('settings').doc('tracking').set(Object.assign(Object.assign({}, config), { updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: request.auth.uid }), { merge: true });
    return { success: true };
});
/**
 * Server-side IP Geolocation - Birden fazla API fallback
 * Client-side'da ad blocker/VPN engelleyebilir, server-side her zaman calisir
 */
const fetchGeoFromIP = async (ip) => {
    // Localhost/private IP kontrolu
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        functions.logger.info('Private/localhost IP, geo atilanıyor:', ip);
        return null;
    }
    // API 1: ip-api.com (Server-side icin HTTP, guvenli - gunluk 45 istek/dakika)
    try {
        const response = await axios_1.default.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`, {
            timeout: 5000
        });
        if (response.data && response.data.status === 'success') {
            functions.logger.info('Geo alindi (ip-api.com):', response.data.city, response.data.regionName, response.data.country);
            return {
                country: response.data.country || null,
                countryCode: response.data.countryCode || null,
                city: response.data.city || null,
                region: response.data.regionName || null
            };
        }
    }
    catch (e) {
        functions.logger.warn('ip-api.com failed:', e.message);
    }
    // API 2: ipwho.is fallback (HTTPS)
    try {
        const response = await axios_1.default.get(`https://ipwho.is/${ip}`, {
            timeout: 5000
        });
        if (response.data && response.data.success !== false) {
            functions.logger.info('Geo alindi (ipwho.is):', response.data.city, response.data.region, response.data.country);
            return {
                country: response.data.country || null,
                countryCode: response.data.country_code || null,
                city: response.data.city || null,
                region: response.data.region || null
            };
        }
    }
    catch (e) {
        functions.logger.warn('ipwho.is failed:', e.message);
    }
    // API 3: ipapi.co fallback (HTTPS - gunluk 1000 istek)
    try {
        const response = await axios_1.default.get(`https://ipapi.co/${ip}/json/`, {
            timeout: 5000
        });
        if (response.data && !response.data.error) {
            functions.logger.info('Geo alindi (ipapi.co):', response.data.city, response.data.region, response.data.country_name);
            return {
                country: response.data.country_name || null,
                countryCode: response.data.country_code || null,
                city: response.data.city || null,
                region: response.data.region || null
            };
        }
    }
    catch (e) {
        functions.logger.warn('ipapi.co failed:', e.message);
    }
    functions.logger.warn('Tum geo API\'ler basarisiz, IP:', ip);
    return null;
};
/**
 * Session Baslat - Server-side geo detection ile
 * Client IP'den lokasyon bilgisi alinir (Wix gibi her zaman calisir)
 */
exports.initVisitorSession = functions.https.onCall(async (request) => {
    var _a, _b;
    const { sessionId, visitorId, sessionData } = request.data;
    if (!sessionId || !visitorId || !sessionData) {
        throw new functions.https.HttpsError('invalid-argument', 'sessionId, visitorId ve sessionData gerekli');
    }
    const db = admin.firestore();
    // Client IP'yi al - Firebase Functions rawRequest'ten
    let clientIP = null;
    if (request.rawRequest) {
        // x-forwarded-for header (load balancer/proxy arkasinda)
        const forwarded = request.rawRequest.headers['x-forwarded-for'];
        if (forwarded) {
            clientIP = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
        }
        // Direkt IP
        if (!clientIP && request.rawRequest.ip) {
            clientIP = request.rawRequest.ip;
        }
        // Connection remote address
        if (!clientIP && ((_a = request.rawRequest.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress)) {
            clientIP = request.rawRequest.connection.remoteAddress;
        }
    }
    functions.logger.info('Client IP:', clientIP);
    // Server-side geo lookup
    let geo = null;
    if (clientIP) {
        geo = await fetchGeoFromIP(clientIP);
    }
    // Session data'yi geo ile birlestir
    const finalSessionData = Object.assign(Object.assign({}, sessionData), { geo: geo || sessionData.geo || null, clientIP: clientIP || null, startedAt: admin.firestore.FieldValue.serverTimestamp(), lastActivityAt: admin.firestore.FieldValue.serverTimestamp() });
    // Session olustur veya guncelle
    const sessionRef = db.collection('sessions').doc(sessionId);
    const existingSession = await sessionRef.get();
    if (!existingSession.exists) {
        await sessionRef.set(finalSessionData);
        functions.logger.info('Yeni session olusturuldu:', sessionId, 'IP:', clientIP, 'Geo:', geo === null || geo === void 0 ? void 0 : geo.city);
    }
    else {
        // Mevcut session varsa sadece bazi alanlari guncelle
        const updates = {
            lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true
        };
        // Geo yoksa ekle
        if (!((_b = existingSession.data()) === null || _b === void 0 ? void 0 : _b.geo) && geo) {
            updates.geo = geo;
            updates.clientIP = clientIP;
        }
        // Customer bilgileri varsa guncelle
        if (sessionData.customerEmail)
            updates.customerEmail = sessionData.customerEmail;
        if (sessionData.customerName)
            updates.customerName = sessionData.customerName;
        await sessionRef.update(updates);
    }
    return {
        success: true,
        sessionId,
        geo: geo || null
    };
});
/**
 * Dinamik Sitemap - Firestore'dan ürünleri çekerek XML sitemap oluşturur
 * Google Search Console ve diğer arama motorları için
 */
exports.sitemap = functions.https.onRequest(async (req, res) => {
    try {
        const db = admin.firestore();
        const BASE_URL = 'https://sadechocolate.com';
        // Firestore'dan aktif ürünleri çek
        const productsSnap = await db.collection('products').get();
        const products = productsSnap.docs.map(doc => {
            var _a, _b, _c, _d;
            return ({
                id: doc.id,
                updatedAt: ((_b = (_a = doc.data().updatedAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || ((_d = (_c = doc.data().createdAt) === null || _c === void 0 ? void 0 : _c.toDate) === null || _d === void 0 ? void 0 : _d.call(_c)) || new Date(),
                name: doc.data().name || doc.data().title || ''
            });
        });
        // Statik sayfalar
        const staticPages = [
            { loc: '/', changefreq: 'weekly', priority: '1.0' },
            { loc: '/catalog', changefreq: 'daily', priority: '0.9' },
            { loc: '/bonbonlar', changefreq: 'weekly', priority: '0.8' },
            { loc: '/about', changefreq: 'monthly', priority: '0.7' },
            { loc: '/hikaye', changefreq: 'monthly', priority: '0.6' },
            { loc: '/tasting-quiz', changefreq: 'monthly', priority: '0.5' },
            { loc: '/campaigns', changefreq: 'weekly', priority: '0.5' },
            { loc: '/legal/terms', changefreq: 'yearly', priority: '0.3' },
            { loc: '/legal/privacy', changefreq: 'yearly', priority: '0.3' },
            { loc: '/legal/return', changefreq: 'yearly', priority: '0.3' },
            { loc: '/legal/shipping', changefreq: 'yearly', priority: '0.3' },
        ];
        // XML oluştur
        const today = new Date().toISOString().split('T')[0];
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        // Statik sayfalar
        for (const page of staticPages) {
            xml += '  <url>\n';
            xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        }
        // Dinamik ürün sayfaları
        for (const product of products) {
            const lastmod = product.updatedAt instanceof Date
                ? product.updatedAt.toISOString().split('T')[0]
                : today;
            xml += '  <url>\n';
            xml += `    <loc>${BASE_URL}/product/${product.id}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.8</priority>\n';
            xml += '  </url>\n';
        }
        xml += '</urlset>';
        // XML olarak gönder, 1 saat cache
        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.status(200).send(xml);
    }
    catch (error) {
        functions.logger.error('Sitemap oluşturma hatası:', error);
        res.status(500).send('Sitemap oluşturulamadı');
    }
});
// ==========================================
// META CONVERSIONS API (CAPI)
// ==========================================
// TODO: CAPI modülleri henüz oluşturulmadı
// export { sendMetaCapiEvent } from './capiCallable';
// export { onOrderCreatedCapiPurchase } from './capiPurchaseTrigger';
//# sourceMappingURL=index.js.map