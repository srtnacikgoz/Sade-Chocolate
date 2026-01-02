# Araştırma Kayıtları - Klasör ve Dosya Şablonu

Bu belge, araştırma projelerinde tutarlı bir organizasyon sağlamak için kullanılacak standart yapıyı tanımlar.

---

## Hiyerarşik Klasör Yapısı

```
[Proje Adı]/
│
├── Genel Bilgiler/
│   ├── Pazar Analizi ve Yol Haritası.md
│   ├── Teknik Mimari Genel Bakış.md
│   └── Temel Kavramlar ve Tanımlar.md
│
├── [Ana Konu 1] (Technical Term)/
│   ├── Front-End/
│   │   └── [Kullanıcı Deneyimi].md
│   ├── Back-End/
│   │   └── [Sistem Mantığı].md
│   ├── End-To-End/
│   │   └── [Bütüncül Akış].md
│   └── Obsidian Not Özeti.md
│
├── [Ana Konu 2] (Technical Term)/
│   ├── Front-End/
│   ├── Back-End/
│   ├── End-To-End/
│   └── Obsidian Not Özeti.md
│
└── [Alt Sistem veya Modül]/
    ├── Mimari/
    │   ├── Front-End/
    │   ├── Back-End/
    │   └── End-To-End/
    └── [Özellik]/
        ├── Front-End/
        ├── Back-End/
        └── End-To-End/
```

---

## Katman Tanımları

### Front-End
**Odak:** Kullanıcının gördüğü ve etkileştiği her şey

**Sorular:**
- Kullanıcı bu özelliği nasıl deneyimliyor?
- Arayüz nasıl görünmeli?
- Hangi bilgiler gösterilmeli?
- Kullanıcı hangi aksiyonları alabiliyor?

**Örnek Dosya İsimleri:**
- `Kullanıcı Arayüzü ve Görsel Tasarım.md`
- `Etkileşim Akışı ve UX Prensipleri.md`
- `Müşteri Deneyimi ve Bilgilendirme.md`

---

### Back-End
**Odak:** Sistemin arka planda yaptığı işlemler

**Sorular:**
- Veri nasıl işleniyor ve saklanıyor?
- Hangi algoritmalar/mantık kullanılıyor?
- API'ler ve entegrasyonlar nasıl çalışıyor?
- Otomasyon ve tetikleyiciler neler?

**Örnek Dosya İsimleri:**
- `Veri Modeli ve Veritabanı Şeması.md`
- `İşleme Mantığı ve Algoritmalar.md`
- `Otomasyon Motoru ve Tetikleyiciler.md`
- `API Entegrasyonu ve Veri Akışı.md`

---

### End-To-End
**Odak:** Bütüncül süreç, strateji ve entegrasyon

**Sorular:**
- Tüm sistem birlikte nasıl çalışıyor?
- İş akışı baştan sona nasıl ilerliyor?
- Farklı sistemler nasıl entegre oluyor?
- Stratejik hedefler ve iş değeri nedir?

**Örnek Dosya İsimleri:**
- `Bütüncül İş Akışı ve Süreç Haritası.md`
- `Sistem Entegrasyonu ve Veri Döngüsü.md`
- `Stratejik Hedefler ve İş Değeri.md`
- `Operasyonel Protokol ve Standartlar.md`

---

### Birleşik Katmanlar (Gerektiğinde)

Bazı konular doğası gereği birden fazla katmanı kapsar:

- `Front-End & Back-End/` — Kullanıcı etkileşimi + sistem mantığı birlikte
- `Back-End & End-to-End/` — Teknik altyapı + bütüncül strateji birlikte

---

## Özet Not Dosyası

Her ana konu klasöründe **tek paragrafla özet** içeren bir dosya bulunmalı:

**Dosya Adı:** `Obsidian Not Özeti.md`

**Format:**
```markdown
**[Konu Adı]**, [tek cümleyle felsefe ve yaklaşım özeti].
**Front-End** kısmında [kullanıcı odaklı hedef],
**Back-End** tarafında [teknik hedef] yönetilir.
```

**Örnek:**
> **Sipariş Takibi**, müşteriye şeffaflık ve güven sağlarken operasyonel verimliliği maksimize etme sanatıdır. **Front-End** kısmında gerçek zamanlı takip ve proaktif bilgilendirme hedeflenirken, **Back-End** tarafında akıllı yönlendirme ve termal koruma mantığı yönetilir.

---

## Dosya İsimlendirme Kuralları

| Kural | Açıklama | Örnek |
|-------|----------|-------|
| Türkçe + Parantezde İngilizce | Ana terim Türkçe, teknik terim parantezde | `Abonelik Modeli (Subscription)` |
| Eylem Odaklı | Ne yapıldığını anlatan | `Veri Toplama ve İşleme.md` |
| Spesifik ve Açıklayıcı | Genel terimlerden kaçın | `Termal Koruma Algoritması.md` |
| Kısa ama Anlamlı | Gereksiz kelimelerden kaçın | `Ödeme Güvenliği.md` |

---

## Yeni Konu Ekleme Adımları

1. **Klasör oluştur:** `[Konu Adı] (Technical Term)/`
2. **Alt klasörleri ekle:** `Front-End/`, `Back-End/`, `End-To-End/`
3. **Özet dosyası yaz:** `Obsidian Not Özeti.md`
4. **İlgili dosyaları kategorize et:** Her perspektif kendi klasörüne

---

## Obsidian İpuçları

- **Graph View:** Konular arası ilişkileri görselleştir
- **Tags:** `#front-end`, `#back-end`, `#end-to-end` etiketleri kullan
- **Links:** `[[Dosya Adı]]` ile çapraz referans oluştur
- **Templates:** Bu şablonu Obsidian template olarak kaydet

---

## Örnek Uygulama: Basit Yapı

```
E-Ticaret Platformu Araştırması/
│
├── Genel Bilgiler/
│   ├── Pazar Analizi 2024.md
│   └── Teknoloji Stack Karşılaştırması.md
│
├── Ödeme Sistemi (Payment Gateway)/
│   ├── Front-End/
│   │   └── Checkout Deneyimi ve Güven Unsurları.md
│   ├── Back-End/
│   │   └── Ödeme İşleme ve Güvenlik Protokolü.md
│   ├── End-To-End/
│   │   └── Ödeme Akışı ve Hata Yönetimi.md
│   └── Obsidian Not Özeti.md
│
├── Lojistik ve Kargo (Shipping)/
│   ├── Front-End/
│   │   └── Takip Arayüzü ve Bildirimler.md
│   ├── Back-End/
│   │   └── Kargo API Entegrasyonu.md
│   ├── End-To-End/
│   │   └── Teslimat Süreci ve İstisna Yönetimi.md
│   └── Obsidian Not Özeti.md
│
└── Müşteri İlişkileri (CRM)/
    ├── Mimari/
    ├── Otomasyon/
    └── Analitik/
```

---

## Örnek Uygulama: Kapsamlı Teknik Sistem (OMS)

Daha karmaşık ve teknik derinlikli araştırmalar için **numaralı kategori sistemi** kullanılabilir:

```
Sade Chocolate/
└── Detaylı Araştırma/
    └── Sipariş Yönetimi ve Operasyon (OMS)/
        │
        ├── 1. Mimari Temeller (Architectural Foundations)/
        │   ├── Front-End/
        │   │   └── Headless ve API-First Arayüz Esnekliği.md
        │   ├── Back-End/
        │   │   └── Mikroservis, Olay Güdümlü Mimari ve CQRS.md
        │   ├── End-To-End/
        │   │   └── Modern Ticaretin Operasyonel İşletim Sistemi.md
        │   └── Obsidian Not Özeti.md
        │
        ├── 2. Envanter ve Satış Vaadi (Inventory & ATP)/
        │   ├── Front-End/
        │   │   └── Gerçek Zamanlı Stok Sorgulama ve Müşteri Vaadi.md
        │   ├── Back-End/
        │   │   └── ATP Hesaplama Matematiği ve Rezervasyon Stratejileri.md
        │   ├── End-To-End/
        │   │   └── Global Envanter Sanallaştırması ve Senkronizasyon.md
        │   └── Obsidian Not Özeti.md
        │
        ├── 3. Kaynak Bulma ve Yönlendirme (Sourcing & Routing)/
        │   ├── Back-End/
        │   │   └── Hevristik ve Matematiksel Optimizasyon Algoritmaları.md
        │   ├── End-To-End/
        │   │   └── Dağıtık Sipariş Yönetimi DOM Stratejisi.md
        │   └── Obsidian Not Özeti.md
        │
        ├── 4. Sipariş Yaşam Döngüsü (Order Life Cycle)/
        │   ├── Back-End/
        │   │   └── Durum Makinesi FSM ve Koruma Koşulları Guards.md
        │   ├── End-To-End/
        │   │   └── İstisna Yönetimi ve Proaktif Operasyon.md
        │   └── Obsidian Not Özeti.md
        │
        ├── 5. İade Yönetimi (Reverse Logistics & RMA)/
        │   ├── Front-End/
        │   │   └── İade Talebi RMA ve Müşteri Sadakati.md
        │   ├── Back-End/
        │   │   └── Muayene, Yenileme ve Otomatik Sonuçlandırma.md
        │   ├── End-To-End/
        │   │   └── Uçtan Uca Tersine Lojistik Yaşam Döngüsü.md
        │   └── Obsidian Not Özeti.md
        │
        └── 6. Entegrasyon ve Veri Modeli (Integration & Data Model)/
            ├── Back-End/
            │   └── WMS, ERP ve Kargo Entegrasyon Ekosistemi.md
            ├── End-To-End/
            │   └── JSON Tabanlı NoSQL Veri Modeli ve Performans Metrikleri.md
            └── Obsidian Not Özeti.md
```

### Numaralı Kategori Sistemi Kuralları

| Kural | Açıklama |
|-------|----------|
| **Sıralama** | Mantıksal akış sırasına göre numaralandır (mimari → veri → süreç → istisna) |
| **İsimlendirme** | `N. Türkçe Başlık (English Term)/` formatı |
| **Esnek Katmanlar** | Her kategoride tüm katmanlar zorunlu değil — konunun doğasına göre |
| **Özet Zorunlu** | Her kategoride `Obsidian Not Özeti.md` mutlaka olmalı |

### Katman Esnekliği Örnekleri

| Kategori | Front-End | Back-End | End-To-End | Neden? |
|----------|-----------|----------|------------|--------|
| Mimari Temeller | ✓ | ✓ | ✓ | Tüm katmanları etkiler |
| Kaynak Bulma | ✗ | ✓ | ✓ | Kullanıcı görmez, tamamen arka plan |
| İade Yönetimi | ✓ | ✓ | ✓ | Müşteri deneyimi + operasyon |
| Entegrasyon | ✗ | ✓ | ✓ | Teknik altyapı odaklı |

### OMS Örneği: Özet Not Formatları

**1. Mimari Temeller:**
> **Mimari Temeller**, modern ticaretin karmaşıklığını ölçeklenebilir ve hataya dayanıklı bir teknolojik zemine oturtma felsefesidir. **Front-End** kısmında Headless yapı ile her kanalda tutarlı deneyim hedeflenirken, **Back-End** tarafında mikroservisler ve olay güdümlü mimari ile sistemin esnekliği yönetilir.

**2. Envanter ve Satış Vaadi:**
> **Envanter ve Satış Vaadi**, "ne satabilirim?" sorusuna gerçek zamanlı ve hatasız yanıt verme disiplinidir. **Front-End** kısmında müşteri güvenini sağlayan doğru stok bilgisi sunulurken, **Back-End** tarafında ATP matematiği ve kademeli rezervasyon algoritmaları yönetilir.

**3. Kaynak Bulma ve Yönlendirme:**
> **Kaynak Bulma ve Yönlendirme**, envanterin dağıtık yapısını müşteri için pürüzsüz bir teslimat planına dönüştürme sanatıdır. **Back-End** tarafında karmaşık optimizasyon algoritmaları çalışırken, **End-To-End** seviyesinde toplam lojistik maliyeti ve hızı optimize edilir.

**4. Sipariş Yaşam Döngüsü:**
> **Sipariş Yaşam Döngüsü**, her siparişin "mutlu yol" veya "istisna" fark etmeksizin katı iş kurallarıyla yönetilmesidir. **Back-End** kısmında FSM ve koruma koşulları ile hatasız akış sağlanırken, **End-To-End** seviyesinde operasyonel mükemmellik korunur.

**5. İade Yönetimi:**
> **İade Yönetimi**, fiziksel geri dönüşü müşteri sadakatine ve yeniden kazanılan stoğa dönüştürme sürecidir. **Front-End** kısmında sürtünmesiz bir iade talebi hedeflenirken, **Back-End** tarafında muayene ve otomatik finansal sonuçlandırma yönetilir.

**6. Entegrasyon ve Veri Modeli:**
> **Entegrasyon ve Veri Modeli**, OMS'in ekosistemin merkezi "beyni" olarak diğer sistemlerle pürüzsüz konuşmasını sağlayan teknik altyapıdır. **Back-End** tarafında API entegrasyonları yönetilirken, **End-To-End** seviyesinde veri tutarlılığı ve sistem performansı garanti altına alınır.

---

*Bu şablon, tutarlı ve ölçeklenebilir araştırma kayıtları için temel çerçeveyi sağlar.*
