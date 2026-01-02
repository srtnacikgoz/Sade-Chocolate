Iyzico her ay otomatik çekim yaptığında, sonucun sisteme yansıması için bir `Webhook` ucu (endpoint) yazılmalıdır.

- **Başarılı Ödeme:** Kullanıcının sadakat puanlarını artırır ve yeni ayın "Tadım Kutusu" için lojistik birimine (Arka Yüz veritabanı üzerinden) "Hazırlanıyor" talimatı gönderir.
    
- **Başarısız Ödeme:** Kullanıcının aboneliğini "Askıya Alındı" durumuna çeker ve Klaviyo üzerinden "Ödemeniz Alınamadı" e-postası tetikler.