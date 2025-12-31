Claude Code ile React tabanlı sisteminizi inşa ederken kullanacağınız veri yapısı ve ödeme mantığı, markanızın "operasyonel mükemmellik" iddiasını teknik olarak desteklemelidir.

### 1. `products` Koleksiyonu İçin Örnek JSON Yapısı

Bu yapı, belgedeki "Duyusal Tasarım" ve "Radikal Şeffaflık" gereksinimlerini karşılamak üzere tasarlanmıştır.

JSON

```
{
  "id": "tanzania-kokoa-74",
  "name": "Tanzania Kokoa Kamili %74", // Belirli köken ve genetik kimlik [cite: 44]
  "description": "Narenciye notaları içeren, 6 gün ahşap kutularda fermente edilmiş özel seri.", // Anlatı bütünlüğü [cite: 45]
  "price": 450,
  "currency": "TRY",
  "stock": 120,
  "images": {
    "hero_video": "url_to_4k_snap_video.mp4", // Duyusal boşluğu kapatan makro video [cite: 89]
    "texture_shot": "url_to_high_res_texture.webp" // Doku fotoğrafçılığı [cite: 91]
  },
  "sensoryProfile": { // Radar grafiği verileri [cite: 92]
    "sweetness": 30,
    "bitterness": 70,
    "acidity": 50,
    "fruitiness": 80,
    "roastiness": 60
  },
  "provenance": { // Şeffaflık ve izlenebilirlik [cite: 43, 98]
    "cacao_origin": "Tanzania, Kokoa Kamili",
    "fermentation": "6 gün ahşap kutu", // Teknik yetkinlik sinyali [cite: 45]
    "roast_profile": "Orta-Hafif",
    "ingredients": [
      {"item": "Organik Kakao Çekirdeği", "origin": "Tanzanya"},
      {"item": "Pancar Şekeri", "origin": "Türkiye"} // Temiz etiket, sadece iki bileşen [cite: 22]
    ]
  },
  "healthAndLegal": {
    "isVegan": true, // Büyüyen vegan pazar segmenti [cite: 82]
    "allergens": ["Süt izi içerebilir"], // Yasal zorunluluk [cite: 192]
    "registration_no": "TR-34-K-123456", // İşletme kayıt belgesi [cite: 191]
    "tett": "2026-12-30" // Tazelik vurgusu [cite: 96]
  }
}
```

---

### 2. Iyzico Entegrasyonu ve "Melt Strategy" Cloud Function

Bu fonksiyon, Iyzico'dan gelen ödeme onayını alır ve belgedeki "Cold Chain Mastery" (Soğuk Zincir Ustalığı) protokollerini tetikler.

JavaScript

```
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios'); // Hava durumu ve Iyzico API için

exports.processIyzicoPayment = functions.https.onCall(async (data, context) => {
    // 1. Iyzico Ödeme Onayı (Örnek Akış) [cite: 110, 126]
    const paymentResponse = await checkIyzicoStatus(data.paymentId);
    
    if (paymentResponse.status === 'success') {
        const orderRef = admin.firestore().collection('orders').doc(data.orderId);
        const orderDoc = await orderRef.get();
        const orderData = orderDoc.data();

        // 2. Isı Kontrolü ve Lojistik Planlama (Melt Strategy) [cite: 134, 161]
        const cityForecast = await weatherAPI.getTemp(orderData.shippingAddress.city);
        let shippingStatus = "Confirmed";
        let coolantRatio = "Standard";

        // Mayıs-Eylül arası veya 30°C üstü hava durumu protokolü [cite: 162, 163]
        if (cityForecast.temp > 30 || isSummerMonth()) {
            shippingStatus = "Heat Hold"; // Isı beklemesi [cite: 162]
            coolantRatio = "Double (1kg Gel : 2kg Choco)"; // Yaz protokolü oranı [cite: 146, 165]
            
            // Müşteriye şeffaf bilgilendirme gönder [cite: 166]
            await sendCustomerNotification(orderData.email, "Isı koruması nedeniyle ürününüz Pazartesi sevk edilecektir.");
        }

        // 3. Siparişi Güncelle ve Lojistik Çıktısı Oluştur [cite: 130, 133]
        return orderRef.update({
            status: shippingStatus,
            coolantRequired: coolantRatio,
            paymentStatus: "Paid",
            estimatedShipping: calculateShippingDate() // Cuma-Pazar sevkiyat yasağı dahil [cite: 158, 160]
        });
    }
});
```

---

### 3. Operasyonel Mimari: Hub-and-Spoke Veri Akışı

Claude Code ile kuracağınız sistemin "merkezi sinir sistemi" (Shopify yerine React Dashboard) şu şekilde çalışmalıdır:

- **Hub (React/Firebase):** Ürün kataloğunu, müşteri kimliklerini ve sipariş işleme süreçlerini yönetir.
    
- **CRM Spoke (Klaviyo/Email):** Sepeti terk edenleri yakalar ve "Tadım Yolculuğu" abonelerine özel içerik gönderir.
    
- **Logistics Spoke (API):** Taşıyıcı sisteme kargo verilerini iter ve takip numaralarını müşteriye SMS ile iletir.
    
- **Support Spoke (WhatsApp):** Satın alma öncesi tereddütleri gidermek için doğrudan storefront'a entegre edilir.