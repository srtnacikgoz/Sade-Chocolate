# Gunluk

Bu dosya her oturumda yapilan isleri kayit eder.

---

## 2026-01-08 (Oturum 2)

### Yapilan Isler

#### Hediye Cantasi Sistemi
- Admin Panel > Kargo Ayarlari'na hediye cantasi bolumu eklendi
  - Aktif/Pasif toggle
  - Fiyat ayari (0 = ucretsiz)
  - Aciklama metni
  - 6'ya kadar gorsel yukleme
  - Canli onizleme
- Sepet sayfasinda hediye cantasi secenegi
  - Secildiginde buton gizleniyor, kaldirilinca geri geliyor
  - Dinamik gorsel, aciklama ve fiyat
  - Siparis ozetinde hediye cantasi satiri
- Checkout'ta hediye cantasi fiyati toplama dahil edildi
- Siparis kaydinda `hasGiftBag`, `isGift`, `giftMessage` alanlari eklendi

#### Hediye Mesaji Alani
- "Bu bir hediyedir" alani yeniden tasarlandi
  - Gradient arka plan (gold/amber tonlari)
  - Dekoratif blur efektleri
  - Sik checkbox tasarimi
  - "Hediye Mesajiniz" etiketi

#### Admin Siparis Yonetimi
- Siparis listesinde yanip sonen badge'ler eklendi:
  - 🛍️ Canta (pembe) - Hediye cantasi istendiginde
  - 🎁 Hediye (gold) - Hediye siparisi ise
- Siparis detay modalinda buyuk uyari kutulari
- Sidebar'da siparis sayaci (kirmizi badge, yanip sonen)

#### Bakim Modu
- Maintenance.tsx sayfasi olusturuldu
- Admin panelde bakim modu toggle butonu
- Bakim modunda admin haric tum sayfalar Maintenance gosteriyor

#### Stok Durumu (Tukendi)
- Urunlere `isOutOfStock` ozelligi eklendi
- ProductCard'da "Tukendi" badge'i ve overlay
- InventoryTab'da "Satis" toggle kolonu
- ProductForm'da stok durumu toggle

#### TopBar Ucretsiz Kargo Limiti
- TopBar artik `settings/shipping`'den limit cekiyor
- Admin panelden degistirilen limit aninda yansiyor
- InventoryTab'daki gereksiz input kaldirildi

#### EFT Siparis Duzeltmeleri
- Success ekraninda `successOrderData` state'i eklendi
- `clearCart()` sonrasi bile dogru tutar gosteriliyor
- Siparis ozeti detayli gosteriliyor (Ara Toplam, Hediye Cantasi, Kargo, Toplam)

#### Email Sistemi
- Gonderen adi "Sade Chocolate <bilgi@sadechocolate.com>" olarak ayarlandi

#### Diger
- Sepet sayfasi padding duzeltildi (pt-32 -> pt-44)
- Premium Selection urunleri artik urun sayfasina yonlendiriyor
- Footer'daki Mesafeli Satis Sozlesmesi CMS'den cekilecek sekilde duzenlendi

---

## 2026-01-08 (Oturum 1)

### Yapilan Isler
- Proje dosya yapisi duzenlendi
  - `.claude/` klasoru olusturuldu (FEEDBACK.md, KISISELBAGLAM.md, PROJECT-RULES.md)
  - `docs/` klasoru olusturuldu (ROADMAP.md, CHANGELOG.md, SECURITY_TODO.md, ADMIN_DASHBOARD_PLAN.md, KURALLAR.md)
  - CLAUDE.md icindeki yollar guncellendi
- GUNLUK.md dosyasi olusturuldu

---

