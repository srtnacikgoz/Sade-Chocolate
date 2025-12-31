### 1. Firestore Veri Modelleri (Schema)

Firestore koleksiyonlarınızı, belgede vurgulanan "şeffaflık" ve "izlenebilirlik" prensiplerine göre yapılandırmalıyız.

#### **`products` Koleksiyonu**

Her ürün dokümanı, müşterinin güvenini kazanacak teknik detayları içermelidir:

- **`origin`**: Çikolatanın coğrafi ve genetik kökeni (örn: "Tanzania Kokoa Kamili 74%").
    
- **`sensoryProfile`**: Radar grafiği için 0-100 arası değerler (Tatlılık, Acılık, Asitlik, Meyvemsilik, Kavrulma).
    
- **`ingredients`**: Hammadde menşei (örn: "Pancar Şekeri", "Giresun Fındığı").
    
- **`allergens`**: Kalın punto ile vurgulanacak alerjen listesi.
    
- **`batchInfo`**: Parti numarası ve "Batch Roasted On" (Kavrulma Tarihi) bilgisi.
    
- **`legal`**: TETT (Son Tüketim Tarihi) ve İşletme Kayıt Numarası.
    

#### **`orders` Koleksiyonu**

Lojistik riskleri yönetmek için bu koleksiyon dinamik veriler tutmalıdır:

- **`giftMode`**: Fiyat gizleme ve hediye mesajı flag'leri.
    
- **`thermalProtection`**: Hesaplanan jel paket (buz aküsü) miktarı ve yalıtım tipi.
    
- **`weatherData`**: Teslimat noktasının kargolama anındaki tahmini sıcaklığı.
    
- **`status`**: "Confirmed", "Heat Hold" (Isı Beklemesi), "Shipped" veya "Delivered".
    

---

### 2. Görsel Varlık (Asset) Optimizasyon Stratejisi

Belge, görsel kalitesinin "Michelin yıldızlı" ürün kalitesini yansıtması gerektiğini belirtir. React tarafında performansı düşürmeden bu kaliteyi sağlamak için şu stratejiyi izlemelisiniz:

- **4K Makro Videolar**: Çikolatanın kırılma (snap) ve erime anlarını gösteren videolar, iştah uyandırmak için "ayna nöronları" tetiklemelidir.
    
    - _Teknik:_ `.webm` formatında, düşük bit hızında optimize edilmiş ve React tarafında `framer-motion` ile yumuşak geçişler yapılarak sunulmalıdır.
        
- **Doku Fotoğrafçılığı (Texture Photography)**: Ürünün parlaklığı, temper dengesi ve iç dolgusunun pürüzsüzlüğü yüksek kontrastlı yakın çekimlerle gösterilmelidir.
    
    - _Teknik:_ `WebP` formatı ve `next/image` (veya benzeri bir lazy-loading kütüphanesi) kullanarak LCP (Largest Contentful Paint) süresini optimize edin.
        
- **Duyusal Grafik Tasarımı**: Radar grafikleri, kullanıcının "yanlış ürün alma korkusunu" azaltacak şekilde interaktif olmalıdır.
    

---

### 3. Firebase Cloud Functions: Lojistik ve Operasyonel Mantık

Sisteminizin "akıllı" kısmı burada çalışacaktır. Claude Code ile şu fonksiyonları kurgulamalıyız:

- **Isı Kontrolü (Heat Hold Logic)**: Teslimat adresi Antalya veya Adana gibi sıcak bir bölgedeyse ve sıcaklık 30°C üzerindeyse, fonksiyon siparişi otomatik olarak "Heat Hold" durumuna almalıdır.
    
- **Soğutucu Hesaplayıcı**: Yaz aylarında (Mayıs-Eylül) 2 kg çikolata için 1 kg jel akü oranını ve çift katmanlı termal astar kullanımını paketleme talimatına eklemelidir.
    
- **Kargo Takvimi Filtresi**: Ürünlerin hafta sonu depolarda beklememesi için , Cuma-Pazar arası sevkiyat oluşturulmasını engelleyen bir mantık kurulmalıdır.