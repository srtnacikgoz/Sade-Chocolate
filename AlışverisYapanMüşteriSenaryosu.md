# Alışveriş Yapan Müşteri Test Senaryosu

Bir müşteri siteyi ziyaret eder ve baştan sona her sayfayı geçer, yapılabilecek her türlü aktiviteyi yapar. Önce çalışan her şeye bakar, ardından hata arayarak hataları bulmaya çalışır.

---

## 1. Ana Sayfa (Home)

### Kontrol Edilecekler
- [ ] Sayfa yükleme hızı
- [ ] Hero banner görüntülenmesi
- [ ] Öne çıkan ürünler carousel'i
- [ ] Navigasyon menüsü çalışıyor mu
- [ ] Footer linkleri
- [ ] Dil değiştirme (TR/EN)
- [ ] Dark mode toggle
- [ ] Responsive tasarım (mobil/tablet/desktop)

### Aktiviteler
- [ ] Logo'ya tıkla → Ana sayfaya dön
- [ ] Menü öğelerine hover
- [ ] Ürün kartlarına tıkla
- [ ] "Tümünü Gör" butonları

---

## 2. Ürünler Sayfası

### Kontrol Edilecekler
- [ ] Tüm ürünler listeleniyor mu
- [ ] Ürün görselleri yükleniyor mu
- [ ] Fiyatlar doğru görünüyor mu
- [ ] Stok durumu gösteriliyor mu

### Aktiviteler
- [ ] Kategori filtreleme
- [ ] Fiyat sıralaması
- [ ] Arama fonksiyonu
- [ ] Ürün kartına tıkla → Detay sayfası

---

## 3. Ürün Detay Sayfası

### Kontrol Edilecekler
- [ ] Ürün görselleri (galeri)
- [ ] Ürün açıklaması
- [ ] Fiyat bilgisi
- [ ] Stok durumu
- [ ] Ürün özellikleri (gramaj, içerik vb.)

### Aktiviteler
- [ ] Adet seçimi (+ / -)
- [ ] "Sepete Ekle" butonu
- [ ] Görsel büyütme/galeri gezinme
- [ ] Benzer ürünler

---

## 4. Sepet İşlemleri

### Kontrol Edilecekler
- [ ] Sepet ikonu badge sayısı
- [ ] Sepet özeti doğru mu
- [ ] Ara toplam hesaplaması
- [ ] Kargo ücreti hesabı

### Aktiviteler
- [ ] Sepeti aç (mini cart)
- [ ] Ürün adedi değiştir
- [ ] Ürün sil
- [ ] Sepeti temizle
- [ ] "Alışverişe Devam Et"
- [ ] "Ödemeye Geç"

---

## 5. Checkout (Ödeme) Sayfası

### Kontrol Edilecekler
- [ ] Sipariş özeti
- [ ] Adres formu
- [ ] Kargo seçenekleri
- [ ] Ödeme yöntemleri
- [ ] Kupon kodu alanı
- [ ] **Blackout Days banner** (Cuma-Pazar)
- [ ] **Heat Hold banner** (30°C+ sıcaklık)

### Aktiviteler
- [ ] Yeni adres ekle
- [ ] Kayıtlı adres seç
- [ ] Fatura tipi değiştir (Bireysel/Kurumsal)
- [ ] Hediye paketi seçimi
- [ ] Hediye mesajı yazma
- [ ] Kupon kodu uygula
- [ ] Ödeme yöntemi seç
- [ ] Siparişi tamamla

---

## 6. Kullanıcı Hesabı

### Giriş/Kayıt
- [ ] Kayıt formu validasyonu
- [ ] Giriş işlemi
- [ ] Şifremi unuttum
- [ ] Google ile giriş (varsa)

### Profil Sayfası
- [ ] Profil bilgileri görüntüleme
- [ ] Bilgileri güncelleme
- [ ] Şifre değiştirme
- [ ] Adres yönetimi

### Siparişlerim
- [ ] Sipariş geçmişi
- [ ] Sipariş detayı
- [ ] Sipariş durumu takibi
- [ ] Fatura indirme

---

## 7. AI Sommelier

### Kontrol Edilecekler
- [ ] Chat arayüzü açılıyor mu
- [ ] Mesaj gönderme çalışıyor mu
- [ ] AI yanıt veriyor mu
- [ ] Ürün önerileri

### Aktiviteler
- [ ] Sohbet başlat
- [ ] Farklı sorular sor
- [ ] Önerilen ürüne tıkla
- [ ] Sohbeti temizle

---

## 8. Sadakat Programı

### Kontrol Edilecekler
- [ ] Puan bakiyesi
- [ ] Puan kazanım geçmişi
- [ ] Kullanılabilir ödüller

### Aktiviteler
- [ ] Puanları görüntüle
- [ ] Ödül seç
- [ ] Puan kullan (checkout'ta)

---

## 9. Admin Panel (Yönetici)

### Sipariş Yönetimi
- [ ] Sipariş listesi
- [ ] Sipariş detayı
- [ ] Durum güncelleme
- [ ] Heat Hold siparişler
- [ ] İptal/İade işlemleri

### Ürün Yönetimi
- [ ] Ürün listesi
- [ ] Ürün ekleme
- [ ] Ürün düzenleme
- [ ] Stok güncelleme

### Müşteri Yönetimi
- [ ] Müşteri listesi
- [ ] Müşteri detayı
- [ ] Sadakat puanları

---

## 10. Hata Senaryoları

### Form Validasyonları
- [ ] Boş alan gönderme
- [ ] Geçersiz email formatı
- [ ] Kısa şifre
- [ ] Geçersiz telefon numarası

### Edge Cases
- [ ] Stokta olmayan ürünü sepete ekleme
- [ ] Çok yüksek adet girme
- [ ] Boş sepet ile checkout
- [ ] Geçersiz kupon kodu
- [ ] Ağ bağlantısı kesilmesi

### Güvenlik
- [ ] SQL injection denemeleri
- [ ] XSS denemeleri
- [ ] Yetkisiz sayfa erişimi

---

## Test Notları

| Tarih | Test Eden | Bulunan Hatalar | Durum |
|-------|-----------|-----------------|-------|
|       |           |                 |       |
