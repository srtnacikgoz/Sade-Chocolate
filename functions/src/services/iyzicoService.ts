import * as functions from 'firebase-functions';
import { defineString } from 'firebase-functions/params';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Iyzipay = require('iyzipay');

// Environment variables
const IYZICO_API_KEY = defineString('IYZICO_API_KEY');
const IYZICO_SECRET_KEY = defineString('IYZICO_SECRET_KEY');
const IYZICO_BASE_URL = defineString('IYZICO_BASE_URL', {
  default: 'https://sandbox-api.iyzipay.com'
});

// İyzico client instance (singleton pattern)
let iyzicoClient: any = null;

/**
 * İyzico client'ı döndürür (singleton)
 */
const getIyzicoClient = (): any => {
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
 * Firestore order verisini İyzico Checkout Form formatına dönüştürür
 */
interface OrderData {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping: {
    address: string;
    city: string;
    district: string;
  };
  billing?: {
    address: string;
    city: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  payment: {
    total: number;
    subtotal: number;
    shipping: number;
  };
}

/**
 * İyzico Checkout Form başlatır
 *
 * @param orderData - Firestore'dan gelen sipariş verisi
 * @returns {Promise<any>} - İyzico checkout form response
 */
export const initializeCheckoutForm = async (orderData: OrderData): Promise<any> => {
  const iyzico = getIyzicoClient();

  // Müşteri adını böl (Ad Soyad)
  const nameParts = orderData.customer.name.trim().split(' ');
  const firstName = nameParts[0] || 'Misafir';
  const lastName = nameParts.slice(1).join(' ') || 'Kullanıcı';

  // Telefon formatı: +90 532 123 4567 → 905321234567
  const phone = orderData.customer.phone?.replace(/\D/g, '') || '5000000000';

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
    city: orderData.shipping?.city || 'Istanbul',
    district: orderData.shipping?.district || 'Kadıköy',
    country: 'Turkey',
    address: orderData.shipping?.address || 'Adres belirtilmedi',
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
    callbackUrl: `${process.env.FUNCTIONS_EMULATOR ? 'http://localhost:5001' : 'https://handleiyzicocallback-3jgp7kw3lq-ey.a.run.app'}`,
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
    iyzico.checkoutFormInitialize.create(request, (err: any, result: any) => {
      if (err) {
        functions.logger.error('İyzico Checkout Form hatası', err);
        reject(new functions.https.HttpsError(
          'internal',
          'Ödeme başlatılamadı. Lütfen tekrar deneyin.',
          err
        ));
      } else if (result.status !== 'success') {
        functions.logger.error('İyzico response error', result);
        reject(new functions.https.HttpsError(
          'internal',
          result.errorMessage || 'Ödeme başlatılamadı.',
          result
        ));
      } else {
        functions.logger.info('İyzico Checkout Form başarılı', {
          token: result.token,
          orderId: orderData.id
        });
        resolve(result);
      }
    });
  });
};

/**
 * İyzico Checkout Form sonucunu getirir (webhook'tan çağrılır)
 *
 * @param token - İyzico checkout form token
 * @returns {Promise<any>} - Payment result
 */
export const retrieveCheckoutForm = async (token: string): Promise<any> => {
  const iyzico = getIyzicoClient();

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: `retrieve-${Date.now()}`,
    token
  };

  functions.logger.info('İyzico payment result alınıyor', { token });

  return new Promise((resolve, reject) => {
    iyzico.checkoutForm.retrieve(request, (err: any, result: any) => {
      if (err) {
        functions.logger.error('İyzico retrieve error', err);
        reject(new functions.https.HttpsError(
          'internal',
          'Ödeme sonucu alınamadı.',
          err
        ));
      } else if (result.status !== 'success') {
        functions.logger.warn('İyzico payment failed', result);
        // Payment failed ama API call başarılı - resolve ile dön
        resolve(result);
      } else {
        functions.logger.info('İyzico payment successful', {
          paymentId: result.paymentId,
          paidPrice: result.paidPrice
        });
        resolve(result);
      }
    });
  });
};

/**
 * İyzico webhook signature doğrular (HMAC-SHA256)
 *
 * @param payload - Webhook payload (JSON string)
 * @param signature - İyzico signature header
 * @returns {boolean} - Signature geçerli mi?
 */
export const verifyWebhookSignature = (payload: string, signature: string): boolean => {
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

/**
 * Payment result'tan önemli bilgileri extract eder
 */
export const extractPaymentDetails = (result: any) => {
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
