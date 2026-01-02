Aşağıdaki Node.js taslağı, bir müşteriyi "Tadım Yolculuğu" (Chocolate Club) planına abone etmek için gereken temel yapıyı sunar. Bu kod, belgede belirtilen "güvenli ödeme ve dijital mimari" prensiplerine dayanır.

JavaScript

```
/**
 * CLOUD FUNCTION: createSubscription
 * Kategori: Back-End (Arka Yüz)
 */
const functions = require('firebase-functions');
const Iyzipay = require('iyzipay');

// Iyzico Ayarları (Ortam değişkenlerinden çekilir)
const iyzipay = new Iyzipay({
    apiKey: 'your_api_key',
    secretKey: 'your_secret_key',
    uri: 'https://api.iyzipay.com' 
});

exports.startChocolateClubSubscription = functions.https.onCall(async (data, context) => {
    // 1. Müşteri Bilgilerini Hazırla (Belgedeki şeffaflık gereği)
    const subscriptionRequest = {
        locale: 'tr',
        pricingPlanReferenceCode: 'chocolatier_monthly_plan_code', // Önceden Iyzico'da oluşturulan plan
        subscriptionInitialStatus: 'ACTIVE',
        customer: {
            name: data.userName,
            surname: data.userSurname,
            email: data.email,
            gsmNumber: data.phone,
            billingAddress: {
                contactName: data.userName + ' ' + data.userSurname,
                city: data.city,
                country: 'Turkey',
                address: data.fullAddress
            }
        },
        paymentCard: {
            cardHolderName: data.cardHolder,
            cardNumber: data.cardNumber,
            expireMonth: data.expireMonth,
            expireYear: data.expireYear,
            cvc: data.cvc
        }
    };

    // 2. Iyzico Üzerinden Aboneliği Başlat
    return new Promise((resolve, reject) => {
        iyzipay.subscription.create(subscriptionRequest, function (err, result) {
            if (err) {
                reject(new functions.https.HttpsError('internal', 'Iyzico hatası.'));
            } else if (result.status === 'success') {
                // 3. Firestore Veri Güncelleme (Başarılı ise)
                resolve({ 
                    status: 'success', 
                    subscriptionReferenceCode: result.data.referenceCode 
                });
            } else {
                reject(new functions.https.HttpsError('aborted', result.errorMessage));
            }
        });
    });
});
```