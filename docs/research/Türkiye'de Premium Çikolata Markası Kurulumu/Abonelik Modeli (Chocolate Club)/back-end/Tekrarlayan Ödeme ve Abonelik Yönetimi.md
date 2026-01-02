Sistemin "motor" kısmıdır; ödemelerin düzenli alınmasını ve veri tabanı güncelliğini sağlar.

- **Iyzico Abonelik API Entegrasyonu:** Müşterinin kartından her ay otomatik olarak ödeme çeken `recurring payment` mantığı.
    
- **Abonelik Durum Mantığı:** Firestore üzerinde `subscriptionStatus` (Aktif, Askıda, İptal) takibi ve ödeme başarısız olduğunda otomatik deneme (dunning) süreçleri.
    
- **Klaviyo Otomasyonları:** "Kutunuz Hazırlanıyor", "Bu Ayın Lezzeti: [İsim]" veya "Ödemeniz Alınamadı" gibi otomatik tetiklenen e-posta/SMS akışları.
    
- **Envanter Rezervasyonu:** Sadece abonelere özel üretilen "Micro-batch" (küçük parti) ürünlerin stoklarını genel satışa açmadan aboneler için ayırma mantığı.