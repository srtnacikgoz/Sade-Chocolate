# Sade Chocolate - Proje Durumu ve Hedefler

> **Son Güncelleme:** 31 Aralık 2024

---

## TAMAMLANAN ÖZELLİKLER

### Sipariş & Ödeme Sistemi
- [x] Havale/EFT ödeme seçeneği (%2 indirim ile)
- [x] Ödeme süresi ayarlanabilir (varsayılan 12 saat)
- [x] Admin panelde "Ödeme Bekleniyor" filtresi
- [x] Ödeme onaylama aksiyonu (sipariş detayında)

### Admin Panel - Şirket Künyesi
- [x] Şube yönetimi (2 şube için)
- [x] Banka hesapları yönetimi (TRY/USD/EUR)
- [x] Sosyal medya ve iletişim bilgileri
- [x] Havale/EFT ayarları (indirim oranı, ödeme süresi)

### Envanter
- [x] Kritik stok eşiği ayarlanabilir

### Sadakat Sistemi
- [x] Müşteri sadakat puanları
- [x] Tier sistemi (Bronze/Silver/Gold/Platinum)

---

## BEKLEYEN HEDEFLER

### 1. Logo ve Font Entegrasyonu
- [ ] Profesyonel logo tasarımı
- [ ] Santana fontu entegrasyonu (`public/fonts/santana/`)
  - TTF dosyalarını klasöre kopyala
  - CSS'de @font-face tanımla

### 2. Kullanıcı Giriş/Kayıt Sayfaları
- [ ] Giriş sayfası UI düzenlemesi
- [ ] Kayıt sayfası UI düzenlemesi
- [ ] Form validasyonları

### 3. Ödeme Sayfası
- [ ] Checkout UI iyileştirmesi
- [ ] "Misafir olarak devam et" özelliği
- [ ] Adres yönetimi

### 4. Genel UI Gözden Geçirme
- [ ] Dandelion Chocolate tarzı ürün detay sayfası
- [ ] Çoklu görsel galerisi
- [ ] Zengin box içeriği (kakao yüzdesi, menşei, tasting notes)

---

## STRATEJİK VİZYON

**Misyon:** Sade Chocolate'ın hedefi; operasyonel süreçlerdeki kusursuzluğu, "Kasti Minimalizm" tasarım felsefesiyle birleştirerek Türkiye'nin en rafine ve güvenilir dijital çikolata deneyimini sunmaktır.

### Operasyonel Standartlar
1. **Tazelik Şeffaflığı** - Müşteri sipariş takibinde tüm aşamaları görür
2. **Hava Durumu Duyarlı Lojistik** - Sıcaklık eşiklerinde termal koruma
3. **Üretim-Satış Senkronizasyonu** - Dinamik stok ve teslimat tahmini
4. **Hediye Deneyimi** - Paketleme onayı zorunlu

### Gelecek Vizyonu
- Omnichannel sadakat (online + mağaza)
- Akıllı talep tahminleme
- Dijital tadım rehberi (QR kod)

---

## TEKNİK NOTLAR

- **Firebase:** Firestore veritabanı
- **Hosting:** Firebase + Cloudflare
- **Email:** Henüz karar verilmedi (Google Workspace / Cloudflare / Zoho önerildi)

logo düzenlenecek ve santana fontu kullanılacak
giriş yap ve kayıt ol sayafası düzenlecek
ödeme yap sayfası düzenlenecek ve misafir olarak devam et etkinleştirilecek
genel olarak ui gözden geçirilecek
acaba 300 satır limit kuralı konulsa mı? yoksa belli bir aralık mı belirlenmeli. 300-450 arası satır sayısı geçilmeyecek gibi.
refactoring yapılacak dosyalar üzerine durulmalı.