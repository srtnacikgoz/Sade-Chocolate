# Araştırma Kayıtları Organizasyon Sistemi

Bu proje, araştırma kayıtlarını tutarlı ve ölçeklenebilir bir yapıda organize etmek için standart bir sistem kullanır.

---

## Temel Prensipler

### 1. Hiyerarşik Klasör Yapısı (4 Seviye)

```
Proje Kökü/
└── Araştırma Alanı/           # Seviye 1: Geniş kapsam
    └── Alt Alan/              # Seviye 2: Spesifik domain
        └── Konu Başlığı/      # Seviye 3: Belirli özellik/sistem
            └── Katman/        # Seviye 4: Teknik perspektif
```

### 2. Üç Katmanlı Perspektif Ayrımı

Her konu üç perspektiften incelenir:

| Katman | Klasör Adı | Odak | Temel Soru |
|--------|------------|------|------------|
| **Front-End** | `Front-End/` | Kullanıcı deneyimi, arayüz, görsel | "Kullanıcı ne görüyor/yapıyor?" |
| **Back-End** | `Back-End/` | Sistem mantığı, veri işleme, API | "Sistem arka planda ne yapıyor?" |
| **End-To-End** | `End-To-End/` | Bütüncül akış, entegrasyon, strateji | "Tüm süreç nasıl bağlanıyor?" |

**Not:** Her kategoride tüm katmanlar zorunlu değil — konunun doğasına göre belirlenir.

### 3. Özet Not Dosyası

Her ana konu klasöründe `Obsidian Not Özeti.md` dosyası bulunmalı.

**Format:**
```
**[Konu Adı]**, [tek cümleyle felsefe ve yaklaşım özeti].
**Front-End** kısmında [kullanıcı odaklı hedef] hedeflenirken,
**Back-End** tarafında [teknik hedef] yönetilir.
```

---

## Dosya İsimlendirme Kuralları

| Kural | Format | Örnek |
|-------|--------|-------|
| Klasör | `N. Türkçe Başlık (English Term)/` | `1. Mimari Temeller (Architectural Foundations)/` |
| Dosya | `Açıklayıcı Başlık.md` | `ATP Hesaplama Matematiği ve Rezervasyon Stratejileri.md` |
| Özet | `Obsidian Not Özeti.md` | — |

**İsimlendirme İpuçları:**
- Türkçe başlık + parantezde İngilizce teknik terim
- Eylem veya kavram odaklı
- Spesifik ve açıklayıcı (genel terimlerden kaçın)

---

## Dosya İçerik Formatı

Her dosya şu yapıda başlamalı:

```markdown
**Odak:** [Tek cümleyle dosyanın odak noktası]

[Ana içerik - araştırma notları, bulgular, spesifikasyonlar]
```

---

## Numaralı Kategori Sistemi

Kapsamlı teknik sistemler için numaralı kategoriler kullanılır:

```
[Ana Konu]/
├── 1. Birinci Kategori (First Category)/
├── 2. İkinci Kategori (Second Category)/
├── 3. Üçüncü Kategori (Third Category)/
└── ...
```

**Sıralama Mantığı:** Mantıksal akış sırasına göre (mimari → veri → süreç → istisna)

---

## Katman Esnekliği Kılavuzu

| Konu Tipi | Front-End | Back-End | End-To-End | Neden? |
|-----------|-----------|----------|------------|--------|
| Mimari/Altyapı | ✓ | ✓ | ✓ | Tüm katmanları etkiler |
| Algoritma/Optimizasyon | ✗ | ✓ | ✓ | Kullanıcı görmez |
| Müşteri Deneyimi | ✓ | ✓ | ✓ | UX + operasyon birlikte |
| Entegrasyon/API | ✗ | ✓ | ✓ | Teknik altyapı odaklı |
| Arayüz/UI | ✓ | ✗ | ✗ | Sadece görsel |

---

## Örnek Yapı: OMS (Sipariş Yönetimi)

```
Sipariş Yönetimi ve Operasyon (OMS)/
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

---

## Yeni Konu Ekleme Checklist

1. [ ] Ana klasör oluştur: `N. Konu Adı (English Term)/`
2. [ ] Gerekli alt klasörleri ekle: `Front-End/`, `Back-End/`, `End-To-End/`
3. [ ] Her klasöre ilgili `.md` dosyalarını ekle
4. [ ] `Obsidian Not Özeti.md` dosyasını yaz
5. [ ] Dosya içeriklerinde `**Odak:**` satırıyla başla

---

## Obsidian Entegrasyonu

- **Graph View:** Konular arası ilişkileri görselleştir
- **Tags:** `#front-end`, `#back-end`, `#end-to-end` etiketleri kullan
- **Links:** `[[Dosya Adı]]` ile çapraz referans oluştur
- **Search:** Katman bazlı arama için klasör filtresi kullan
