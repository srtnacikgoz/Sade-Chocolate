# Spec: Ürün Kataloğu: Gelişmiş Filtreleme ve Sıralama Özellikleri Ekleme

## Genel Bakış

Bu spesifikasyon, Sade Chocolate e-ticaret uygulamasının ürün kataloğuna gelişmiş filtreleme ve sıralama işlevselliğinin eklenmesini detaylandırmaktadır. Bu özellikler, kullanıcıların ürünleri kategoriye, fiyata, popülerliğe ve diğer ilgili niteliklere göre kolayca bulmalarını sağlayarak alışveriş deneyimini önemli ölçüde geliştirecektir.

## Özellikler

### 1. Kategoriye Göre Filtreleme
Kullanıcılar, ürünleri belirli çikolata kategorilerine (örneğin, bitter, sütlü, beyaz, vegan) göre filtreleyebilmelidir.

### 2. Fiyata Göre Filtreleme
Kullanıcılar, ürünleri belirli fiyat aralıklarına göre filtreleyebilmelidir.

### 3. Sıralama Seçenekleri
Kullanıcılar, ürünleri aşağıdaki kriterlere göre sıralayabilmelidir:
- En Yüksek Fiyat
- En Düşük Fiyat
- En Yeni Ürünler
- En Popüler Ürünler (satış sayısına veya görüntülenme sayısına göre)

### 4. Filtreleri ve Sıralamayı Temizleme
Kullanıcılar, uygulanan tüm filtreleri ve sıralama seçeneklerini tek bir eylemle sıfırlayabilmelidir.

### 5. URL Senkronizasyonu
Uygulanan filtre ve sıralama parametreleri URL'de yansıtılmalı, bu sayede kullanıcılar filtreli görünümleri paylaşabilir veya yer işaretlerine ekleyebilir.

## Teknik Detaylar

- Frontend tarafında filtreleme ve sıralama UI elemanları (`Catalog.tsx` veya ilgili bileşenlerde) eklenecektir.
- `ProductContext.tsx` dosyasında ürün listesini filtrelemek ve sıralamak için gerekli mantık uygulanacaktır.
- Firebase Firestore sorguları, sunucu tarafında filtreleme ve sıralama için optimize edilebilir (gelecekteki performans iyileştirmeleri için).
- Kullanıcı arayüzü, Tailwind CSS ve projenin mevcut UI prensiplerine uygun olarak tasarlanacaktır.
