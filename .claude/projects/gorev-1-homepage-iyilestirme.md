---
name: Görev 1 - Homepage İyileştirme & İçerik Stratejisi
description: Dandelion Chocolate analizinden çıkan 4 aksiyon — kurumsal hediye, tarif/blog, homepage storytelling akışı
type: project
---

# Görev 1: Homepage İyileştirme & İçerik Stratejisi

**Kaynak:** Dandelion Chocolate analizi (7 Nisan 2026)
**Durum:** Beklemede

---

## Roadmap

### Faz 1: Homepage Storytelling Akışı (Öncelik: YÜKSEK)
Mevcut homepage section sıralamasını Dandelion benzeri storytelling akışına dönüştür.

**Mevcut sıra:**
1. Hero
2. Marquee (trust badges — zaten var)
3. Philosophy
4. Collections (3 kart)
5. Featured Product
6. Review Carousel
7. Footer

**Hedef sıra:**
1. Hero + değer önerisi (mevcut)
2. Trust badges marquee (mevcut — gerekirse güncelle)
3. Ürün hikayesi / "Neden Sade?" (philosophy'yi genişlet)
4. Premium Selection / Koleksiyonlar (mevcut)
5. Hediye çözümleri section (YENİ — Faz 2 ile bağlantılı)
6. "Sade ile Tarifler" önizleme (YENİ — Faz 3 ile bağlantılı)
7. Müşteri yorumları (mevcut)
8. Footer

**Yapılacaklar:**
- [ ] Homepage section sırasını yeniden düzenle
- [ ] Philosophy section'ı "Neden Sade?" olarak genişlet — malzeme kalitesi, el yapımı süreç vurgusu
- [ ] Hediye section placeholder ekle (Faz 2 tamamlanınca bağla)
- [ ] Tarif section placeholder ekle (Faz 3 tamamlanınca bağla)
- [ ] Geçiş animasyonları ve görsel tutarlılık kontrolü

---

### Faz 2: Kurumsal Hediye / Çoklu Adres Sipariş (Öncelik: ORTA)
Toplu hediye siparişi için özel sayfa ve akış.

**Yapılacaklar:**
- [ ] `/kurumsal` veya `/toplu-hediye` sayfası oluştur
- [ ] Çoklu adres girişi formu (CSV upload veya manuel ekleme)
- [ ] Kurumsal fiyatlandırma / indirim mantığı (opsiyonel)
- [ ] Özel hediye notu ve paketleme seçenekleri
- [ ] Homepage'de "Kurumsal Hediye" section'ı ile bağla
- [ ] Footer'a link ekle

---

### Faz 3: Tarif / Blog Sayfası (Öncelik: ORTA)
Sade Chocolate ürünleriyle yapılabilecek tarifleri gösteren SEO-dostu içerik sayfası.

**Yapılacaklar:**
- [ ] `/tarifler` sayfası oluştur
- [ ] Firestore'da `recipes` koleksiyonu tasarla (title, image, duration, ingredients, steps, relatedProducts)
- [ ] Tarif kartları grid layout (görsel + süre + zorluk)
- [ ] Tarif detay sayfası (`/tarifler/:slug`)
- [ ] Homepage'de "Sade ile Tarifler" preview section'ı (2-3 tarif kartı + "Tüm Tarifler" linki)
- [ ] SEO meta tags ve structured data (Recipe schema)
- [ ] Admin panelde tarif CRUD (opsiyonel, önce Firestore'dan manuel eklenebilir)

---

### Faz 4: Trust Badges Güncelleme (Öncelik: DÜŞÜK)
Mevcut marquee zaten çalışıyor. Gerekirse içerik ve görsel güncelleme.

**Yapılacaklar:**
- [ ] Mevcut badge'leri gözden geçir (Firestore CMS'den yönetiliyor)
- [ ] İkon ekle (her badge yanına küçük ikon)
- [ ] Mobil görünümü optimize et

---

## Notlar
- Sade Chocolate bean-to-bar DEĞİLDİR — "El Yapımı", "Artisan", "Butik Çikolata" ifadeleri kullanılmalı
- Dandelion'un "Direct Trade" ve "Bean-to-Bar" vurguları Sade'ye uygulanmamalı
- Tüm UI metinleri Türkçe olacak
