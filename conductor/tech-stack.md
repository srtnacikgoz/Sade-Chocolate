# Sade Chocolate Teknoloji Yığını

Bu belge, Sade Chocolate projesinin temel teknoloji yığınını ve mimari prensiplerini detaylandırmaktadır.

## 1. Teknoloji Bileşenleri

### Genel Bakış
Sade Chocolate, modern bir e-ticaret uygulaması olarak aşağıdaki teknolojileri kullanmaktadır:
- **Programlama Dili:** TypeScript
- **Frontend Çerçevesi:** React
- **Derleme Aracı:** Vite
- **Stil:** Tailwind CSS
- **Backend/Veritabanı:** Firebase
- **UI Kütüphaneleri:** Radix UI, Lucide React, Sonner
- **Yönlendirme:** React Router DOM
- **Durum Yönetimi:** React Context API

### Detaylı Bileşenler
- **React:** Kullanıcı arayüzleri oluşturmak için bildirimsel, bileşen tabanlı bir JavaScript kütüphanesi.
- **TypeScript:** React uygulamalarının geliştirilmesinde tip güvenliği ve daha iyi ölçeklenebilirlik sağlayan JavaScript'in tip üst kümesi.
- **Vite:** Hızlı geliştirme deneyimi için optimize edilmiş, yeni nesil bir frontend derleme aracı.
- **Tailwind CSS:** Hızlı ve esnek UI geliştirmesi için hizmete yönelik (utility-first) bir CSS çerçevesi.
- **Firebase:** Kimlik doğrulama, gerçek zamanlı veritabanı (Firestore) ve barındırma gibi birçok arka uç hizmetini sağlayan bir platform.

## 2. Mimari Prensipler

### Headless (Başsız) Mimari ve Hız Performansı
Modern altyapının en kritik bileşeni, arka uç (backend) fonksiyonlarının ön yüz (frontend) sunumundan tamamen ayrılmasıdır. Bu mimari, "Invisible Tech" vizyonunu destekler; teknoloji arka planda sorunsuz çalışırken kullanıcıya duyusal bir yolculuk sunar.

- **Tasarım Özgürlüğü:** Şablonlara bağlı kalmadan markanın ruhunu yansıtan tamamen özel (bespoke) arayüzler tasarlanmasına olanak tanır.
- **Teknolojik Esneklik:** Ön yüzün React + Vite gibi modern frameworkler ile geliştirilmesini sağlayarak anlık sayfa geçişleri ve uygulama akıcılığı sunar.
- **Performans = Lüks Algısı:** Yavaş açılan bir sayfa, lüks ve kalite algısına doğrudan zarar verir. Bu nedenle, performans en önemli önceliklerden biridir.
- **Modern Yükleme Stratejileri:**
    - **Skeleton Screens:** Klasik "spinner" yerine, içeriğin iskeletini gösteren gri kutucuklar kullanılarak "bekleme" algısı psikolojik olarak düşürülür.
    - **Lazy Loading:** Görseller sadece ekrana yaklaştığında yüklenir.
- **Görsel Formatları:**
    - **Yeni Nesil Formatlar:** Tüm içerikler otomatik olarak WebP veya AVIF formatına dönüştürülür.
    - **Performans Hedefi:** Google Lighthouse skorlarında "Performance" segmentinde 95+ puan hedeflenir.

### Composable (Bileşenli) Yapı
Sistemler, "Bileşenli" (Composable) bir yapıda kurgulanmalıdır.
- **En İyi Araçların Seçimi (Best-in-Class):** Her bir iş fonksiyonu (ödeme, içerik yönetimi vb.) için o alandaki en iyi çözümün entegre edilmesidir.
- **Modülerlik:** Değişen pazar ihtiyaçlarına göre altyapının belirli parçalarının tüm sistemi bozmadan güncellenebilmesini sağlar.
- **Veri Entegrasyonu:** Farklı sistemlerin API'ler aracılığıyla birbiriyle kusursuz konuşmasını temel alır.

### Çok Kanallı (Omnichannel) Hazırlık
Altyapı, tüm dijital temas noktaları için bir veri merkezi görevi görür.
- **Merkezi Veri Dağıtımı:** Ürün verileri ve içerikler API'ler aracılığıyla web sitesi, mobil uygulamalar, IoT cihazları veya mağaza içi kiosklara eşzamanlı aktarılır.
- **Kesintisiz Deneyim:** Kullanıcının hangi kanaldan gelirse gelsin aynı stok bilgisini, fiyatlandırmayı ve marka hikayesini görmesini sağlar.
- **Geleceğe Hazırlık:** Yeni gelişen teknolojilerin mevcut altyapıya hızla entegre edilmesine imkan tanır.