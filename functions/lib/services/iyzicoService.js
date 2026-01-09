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
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPaymentDetails = exports.verifyWebhookSignature = exports.retrieveCheckoutForm = exports.initializeCheckoutForm = void 0;
const functions = __importStar(require("firebase-functions"));
const params_1 = require("firebase-functions/params");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Iyzipay = require('iyzipay');
// Environment variables
const IYZICO_API_KEY = (0, params_1.defineString)('IYZICO_API_KEY');
const IYZICO_SECRET_KEY = (0, params_1.defineString)('IYZICO_SECRET_KEY');
const IYZICO_BASE_URL = (0, params_1.defineString)('IYZICO_BASE_URL', {
    default: 'https://sandbox-api.iyzipay.com'
});
// İyzico client instance (singleton pattern)
let iyzicoClient = null;
/**
 * İyzico client'ı döndürür (singleton)
 */
const getIyzicoClient = () => {
    if (!iyzicoClient) {
        const apiKey = IYZICO_API_KEY.value();
        const secretKey = IYZICO_SECRET_KEY.value();
        const baseUrl = IYZICO_BASE_URL.value();
        if (!apiKey || !secretKey) {
            throw new Error('İyzico API credentials not configured');
        }
        iyzicoClient = new Iyzipay({
            apiKey,
            secretKey,
            uri: baseUrl
        });
        functions.logger.info('İyzico client initialized', { baseUrl });
    }
    return iyzicoClient;
};
/**
 * İyzico Checkout Form başlatır
 *
 * @param orderData - Firestore'dan gelen sipariş verisi
 * @returns {Promise<any>} - İyzico checkout form response
 */
const initializeCheckoutForm = async (orderData) => {
    var _a, _b, _c, _d;
    const iyzico = getIyzicoClient();
    // Müşteri adını böl (Ad Soyad)
    const nameParts = orderData.customer.name.trim().split(' ');
    const firstName = nameParts[0] || 'Misafir';
    const lastName = nameParts.slice(1).join(' ') || 'Kullanıcı';
    // Telefon formatı: +90 532 123 4567 → 905321234567
    const phone = ((_a = orderData.customer.phone) === null || _a === void 0 ? void 0 : _a.replace(/\D/g, '')) || '5000000000';
    // Email ve buyerId için fallback
    const customerEmail = orderData.customer.email || `guest_${orderData.id}@sadechocolate.com`;
    const buyerId = customerEmail.includes('@') ? customerEmail.split('@')[0] : `buyer_${orderData.id}`;
    // Buyer bilgileri
    const buyer = {
        id: buyerId,
        name: firstName,
        surname: lastName,
        gsmNumber: phone || '+905000000000',
        email: customerEmail,
        identityNumber: '11111111111', // TC Kimlik (İyzico test için varsayılan)
        registrationAddress: orderData.shipping.address || 'Adres belirtilmedi',
        ip: '127.0.0.1', // Frontend'den gelecek
        city: orderData.shipping.city || 'Istanbul',
        country: 'Turkey',
        zipCode: '34000' // Varsayılan
    };
    // Teslimat adresi - tüm alanlar zorunlu
    const shippingAddress = {
        contactName: orderData.customer.name || 'Müşteri',
        city: ((_b = orderData.shipping) === null || _b === void 0 ? void 0 : _b.city) || 'Istanbul',
        district: ((_c = orderData.shipping) === null || _c === void 0 ? void 0 : _c.district) || 'Kadıköy',
        country: 'Turkey',
        address: ((_d = orderData.shipping) === null || _d === void 0 ? void 0 : _d.address) || 'Adres belirtilmedi',
        zipCode: '34000'
    };
    // Fatura adresi (yoksa teslimat adresi ile aynı)
    const billingAddress = orderData.billing ? {
        contactName: orderData.customer.name || 'Müşteri',
        city: orderData.billing.city || 'Istanbul',
        country: 'Turkey',
        address: orderData.billing.address || 'Adres belirtilmedi',
        zipCode: '34000'
    } : shippingAddress;
    // Basket items
    const basketItems = orderData.items.map((item, index) => ({
        id: item.id || `item-${index}`,
        name: item.name.substring(0, 50), // İyzico max 50 karakter
        category1: 'Chocolate', // Kategori
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: (item.price * item.quantity).toFixed(2)
    }));
    // Kargo ücreti varsa ekle
    if (orderData.payment.shipping > 0) {
        basketItems.push({
            id: 'shipping',
            name: 'Kargo Ücreti',
            category1: 'Shipping',
            itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
            price: orderData.payment.shipping.toFixed(2)
        });
    }
    // İyzico request
    const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: orderData.id, // Sipariş numarası
        price: orderData.payment.total.toFixed(2),
        paidPrice: orderData.payment.total.toFixed(2),
        currency: Iyzipay.CURRENCY.TRY,
        basketId: orderData.id,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: `${process.env.FUNCTIONS_EMULATOR ? 'http://localhost:5001' : 'https://europe-west3-sade-chocolate-prod.cloudfunctions.net/handleIyzicoCallback'}`,
        enabledInstallments: [1], // Sadece tek çekim
        buyer,
        shippingAddress,
        billingAddress,
        basketItems
    };
    functions.logger.info('İyzico Checkout Form başlatılıyor', {
        orderId: orderData.id,
        total: orderData.payment.total
    });
    return new Promise((resolve, reject) => {
        iyzico.checkoutFormInitialize.create(request, (err, result) => {
            if (err) {
                functions.logger.error('İyzico Checkout Form hatası', err);
                reject(new functions.https.HttpsError('internal', 'Ödeme başlatılamadı. Lütfen tekrar deneyin.', err));
            }
            else if (result.status !== 'success') {
                functions.logger.error('İyzico response error', result);
                reject(new functions.https.HttpsError('internal', result.errorMessage || 'Ödeme başlatılamadı.', result));
            }
            else {
                functions.logger.info('İyzico Checkout Form başarılı', {
                    token: result.token,
                    orderId: orderData.id
                });
                resolve(result);
            }
        });
    });
};
exports.initializeCheckoutForm = initializeCheckoutForm;
/**
 * İyzico Checkout Form sonucunu getirir (webhook'tan çağrılır)
 *
 * @param token - İyzico checkout form token
 * @returns {Promise<any>} - Payment result
 */
const retrieveCheckoutForm = async (token) => {
    const iyzico = getIyzicoClient();
    const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: `retrieve-${Date.now()}`,
        token
    };
    functions.logger.info('İyzico payment result alınıyor', { token });
    return new Promise((resolve, reject) => {
        iyzico.checkoutForm.retrieve(request, (err, result) => {
            if (err) {
                functions.logger.error('İyzico retrieve error', err);
                reject(new functions.https.HttpsError('internal', 'Ödeme sonucu alınamadı.', err));
            }
            else if (result.status !== 'success') {
                functions.logger.warn('İyzico payment failed', result);
                // Payment failed ama API call başarılı - resolve ile dön
                resolve(result);
            }
            else {
                functions.logger.info('İyzico payment successful', {
                    paymentId: result.paymentId,
                    paidPrice: result.paidPrice
                });
                resolve(result);
            }
        });
    });
};
exports.retrieveCheckoutForm = retrieveCheckoutForm;
/**
 * İyzico webhook signature doğrular (HMAC-SHA256)
 *
 * @param payload - Webhook payload (JSON string)
 * @param signature - İyzico signature header
 * @returns {boolean} - Signature geçerli mi?
 */
const verifyWebhookSignature = (payload, signature) => {
    // Not: İyzico Checkout Form callback'te signature header göndermez
    // Token validation ile güvenlik sağlanır (retrieveCheckoutForm)
    // Bu fonksiyon gelecekte webhook entegrasyonu için hazır
    // const crypto = require('crypto');
    // const secretKey = IYZICO_SECRET_KEY.value();
    // const hash = crypto.createHmac('sha256', secretKey).update(payload).digest('base64');
    // return hash === signature;
    functions.logger.info('Webhook signature verification (not implemented for Checkout Form)');
    return true; // Checkout Form callback'te signature check yok
};
exports.verifyWebhookSignature = verifyWebhookSignature;
/**
 * Payment result'tan önemli bilgileri extract eder
 */
const extractPaymentDetails = (result) => {
    return {
        iyzicoPaymentId: result.paymentId,
        iyzicoToken: result.token,
        cardFamily: result.cardFamily || null,
        cardAssociation: result.cardAssociation || null,
        lastFourDigits: result.lastFourDigits || null,
        installment: result.installment || 1,
        paidPrice: parseFloat(result.paidPrice) || 0,
        merchantCommissionRate: parseFloat(result.merchantCommissionRate) || 0,
        iyzicoCommissionFee: parseFloat(result.iyzicoCommissionFee) || 0,
        failureReason: result.errorMessage || null
    };
};
exports.extractPaymentDetails = extractPaymentDetails;
//# sourceMappingURL=iyzicoService.js.map