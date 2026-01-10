# Proje Geri Bildirimleri ve Hatalar

Bu dosya proje ile ilgili hataları, geri bildirimleri, iyileştirme önerilerini ve yapılacakları içerir.

---

---

## [REFACTOR-002] Frontend: FSD mimarisine geçiş tamamlanmalı
- **Kategori:** refactor
- **Öncelik:** medium
- **Durum:** open
- **Tarih:** 2026-01-08
- **Açıklama:** PROJECT-RULES'da Feature-Sliced Design planlanmış ama uygulanmamış. Sayfalar hem UI hem business logic içeriyor.
- **Öneri:** Kademeli geçiş:
  1. `shared/` - Ortak UI bileşenleri, utils
  2. `entities/` - Product, User, Order modelleri
  3. `features/` - Özellik bazlı modüller
  4. `widgets/` - Kompozit bileşenler

---

## [REFACTOR-003] TypeScript geçişi
- **Kategori:** refactor
- **Öncelik:** low
- **Durum:** open
- **Tarih:** 2026-01-08
- **Açıklama:** Proje JavaScript ile yazılmış. Type safety yok, refactor ve büyük değişiklikler riskli.
- **Öneri:** Yeni dosyalar `.tsx` olarak oluşturulsun, mevcut dosyalar kademeli olarak migrate edilsin.

---

## [REFACTOR-004] Test altyapısı kurulmalı
- **Kategori:** refactor
- **Öncelik:** medium
- **Durum:** open
- **Tarih:** 2026-01-08
- **Açıklama:** PROJECT-RULES'da Vitest + Storybook planlanmış ama aktif değil. Kritik iş mantığı test edilmiyor.
- **Öneri:**
  1. Vitest kurulumu + kritik hooks için unit testler
  2. Storybook kurulumu + UI bileşen izolasyonu
  3. CI/CD'de test zorunluluğu



kullancı(hesapbım) sayfası içeriği mevcut şekildeki gibi kartlardan oluşmasın. başka bir düzene geçilim. daha ziyade linkler olsun, tıklandıkça gerekli sayfa açılsın. dandeleon, laderach ve marcolini araştırılabilir.