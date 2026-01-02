### 1. Veri Tabanı Şeması (Database Schema)

Bu şema, belgede vurgulanan "şeffaflık", "duyusal veriler" ve "lojistik kontrol" ihtiyaçlarını karşılamak üzere tasarlanmıştır.

#### **A. Ürünler (Products) Tablosu**

- **Temel Bilgiler:** Ad, açıklama, fiyat, stok.
    
- **Duyusal Veriler:** Radar grafiği için değerler (Tatlılık, Acılık, Asitlik, Meyvemsilik, Kavrulma).
    
- **Şeffaflık Verileri:** Kakao genetiği, coğrafi köken (örn: Tanzanya Kokoa Kamili %74), fermantasyon protokolü.
    
- **İçerik Detayları:** Hammadde menşei listesi (örn: Giresun fındığı, Pancar şekeri).
    
- **Yasal Zorunluluklar:** Alerjen uyarıları, TETT (En iyi tüketim tarihi), İşletme Kayıt Numarası.
    

#### **B. Siparişler (Orders) Tablosu**

- **Durum Yönetimi:** Ödeme bekliyor, Onaylandı, Hazırlanıyor, "Isı Beklemesinde" (Heat Hold), Kargoda, Teslim Edildi.
    
- **Hediye Özellikleri:** Hediye modu aktif mi?, Hediye mesajı (metin veya video linki), Paket fişinde fiyat gizleme durumu.
    
- **Lojistik Verileri:** Kargo takip numarası, kullanılan soğutucu (jel paket) miktarı, teslimat ili hava durumu tahmini.
    

#### **C. Müşteriler & Sadakat (Customers & Loyalty)**

- **Profil:** İletişim bilgileri, dijital cüzdan entegrasyonu.
    
- **Çikolata Kulübü:** Abonelik tipi (Tadım Yolculuğu), yenileme tarihi.
    
- **Puan Sistemi:** Harcanan her Lira için kazanılan puanlar ve referans kodu.
    

---

### 2. Sipariş İşleme Mantığı (`order_processing_logic`)

Sisteminiz bir sipariş aldığında, belgedeki "Melt Strategy" (Erime Stratejisi) uyarınca şu algoritmayı çalıştırmalıdır:

JavaScript

```
// Sipariş İşleme Akışı (Özet Mantık)

async function processOrder(orderData) {
  // 1. Ödeme Kontrolü (Iyzico Entegrasyonu)
  const paymentStatus = await checkIyzicoPayment(orderData.paymentToken);
  if (!paymentStatus.success) return triggerFailure(paymentStatus.error); [cite: 126, 127]

  // 2. "Blackout Days" (Gönderim Yasaklı Günler) Kontrolü
  const today = new Date().getDay(); // 0: Pazar, 5: Cuma, 6: Cumartesi
  let shippingDate = calculateEarliestShippingDate(today);
  // Cuma, Cumartesi veya Pazar ise sevkiyatı Pazartesiye kaydır [cite: 158, 160]

  // 3. Hava Durumu ve Soğuk Zincir Analizi
  const destinationWeather = await weatherAPI.getForecast(orderData.shippingAddress.zipCode);
  let orderStatus = "Confirmed";
  let coolantAmount = calculateCoolant(orderData.totalWeight); // Standart: 2kg/1kg jel akü [cite: 146]

  if (destinationWeather.temp > 30) {
    orderStatus = "Heat Hold"; // 30 derece üstü ise otomatik beklemeye al [cite: 162]
    notifyCustomer("Hava sıcaklığı nedeniyle siparişiniz bekletiliyor."); [cite: 166]
  }

  // 4. Lojistik ve CRM Entegrasyonu
  if (orderStatus !== "Heat Hold" && isShippingDay(today)) {
    const kargoLabel = await kargoAPI.createLabel(orderData); [cite: 130]
    await klaviyo.sendUpdate(orderData.customerEmail, "Siparişiniz Hazırlanıyor"); [cite: 128]
  }

  // 5. Veri Tabanı Güncelleme
  return db.orders.update({ id: orderData.id, status: orderStatus, shippingDate });
}
```

### 3. Kritik Uygulama Notları

- **Soğutucu Hesaplaması:** Yaz aylarında (Mayıs-Eylül) algoritma soğutucu miktarını ve yalıtım katmanını (thermal liner) otomatik olarak iki katına çıkarmalıdır.
    
- **Hediye Modu:** Eğer `gift_mode === true` ise, sistem depodaki paketleme ekranına "Fiyat Gizle" ve "Hediye Notu Ekle" talimatını göndermelidir.
    
- **Şeffaflık:** Ürün sayfasında her ürünün "Batch Roast Date" (Parti Kavurma Tarihi) veritabanından dinamik olarak çekilip kullanıcıya gösterilmelidir.