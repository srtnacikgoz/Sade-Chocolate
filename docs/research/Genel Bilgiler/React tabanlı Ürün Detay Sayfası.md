### 1. Sayfa Mimarisi ve Bileşen Hiyerarşisi

Sayfanın "sinestetik tasarım" prensiplerine göre yapılandırılması gerekir. Bu, görsel uyaranlarla diğer duyuları (tatma, koklama) tetiklemek anlamına gelir.

- **`HeroVisual` Bileşeni:** 4K çözünürlükte, ağır çekim (slow-motion) video arka planı kullanılmalıdır. Çikolatanın kırılma anı (snap) veya ganajın akışkanlığı gibi detaylar "ayna nöronları" tetikleyerek iştah uyandırır.
    
- **`FlavorRadar` Bileşeni:** Kullanıcının tat tahminini kolaylaştırmak ve yanlış ürün alma korkusunu azaltmak için etkileşimli bir radar grafiği.
    
- **`TransparencyTabs` Bileşeni:** Malzemelerin kökenini ve teknik üretim detaylarını içeren akordeon yapısı.
    

---

### 2. Teknik Gereksinimler ve Kod Mantığı

#### A. Duyusal Veri ve Radar Grafiği

Ürün sayfalarındaki radar grafikleri; Tatlılık, Acılık, Asitlik, Meyvemsilik ve Kavrulma gibi 5 ana özniteliği görselleştirmelidir.

JavaScript

```
// Örnek Radar Grafiği Veri Yapısı
const flavorData = [
  { subject: 'Tatlılık', A: 30, fullMark: 100 },
  { subject: 'Acılık', A: 85, fullMark: 100 },
  { subject: 'Asitlik', A: 45, fullMark: 100 },
  { subject: 'Meyvemsilik', A: 60, fullMark: 100 },
  { subject: 'Kavrulma', A: 75, fullMark: 100 },
];
```

#### B. Hediye Modu (Gift Mode) Entegrasyonu

Global bir state (örneğin Context API veya Redux) üzerinden yönetilen "Hediye Modu" anahtarı, sepet ve ödeme sayfalarındaki davranışı belirler.

- **Fonksiyonellik:** Aktif edildiğinde paket fişlerinden fiyatları gizler ve ödeme adımında video/metin mesajı istemini tetikler.
    
- **Stratejik Katkı:** Hediyeleşme sürecindeki sürtünmeyi azaltarak Ortalama Sipariş Değerini (AOV) artırır.
    

#### C. Tazelik ve İzlenebilirlik Bileşenleri

- **Tazelik Geri Sayımı:** "Parti No: #12, Kavrulma Tarihi: 20.12.2025" gibi dinamik metinler, endüstriyel ürünlerin aksine koruyucu madde içermeyen artisanal tazeliği vurgular.
    
- **İçerik Şeffaflığı:** Her bileşenin (örn: "Giresun Fındığı", "Pancar Şekeri") menşei açıkça listelenmelidir.
    

---

### 3. Mobil-Öncelikli Tasarım ve Dönüşüm

Türkiye'deki e-ticaret trafiğinin çoğunluğu mobil cihazlardan geldiği için arayüz "frictionless" (sürtünmesiz) olmalıdır.

- **Tek Sayfa Ödeme (One-Page Checkout):** Adres, kargo ve ödeme bilgilerini tek ekranda toplayan, yükleme sürelerini minimize eden bir yapı.
    
- **Dijital Cüzdanlar:** Apple Pay, Google Pay ve yerel bankacılık uygulamalarıyla tam entegrasyon.
    

---

### 4. Teknik Doğrulama ve Güvenlik

Sistemi kodlarken yasal ve operasyonel şu iki noktayı React mantığına dahil etmelisin:

1. **Alerjen Yönetimi:** `IngredientList` bileşeninde alerjenler (fındık, süt, soya vb.) mutlaka **bold** veya görsel olarak vurgulanmış şekilde render edilmelidir.
    
2. **Hava Durumu Uyarısı:** Eğer teslimat adresi sıcak bir bölgedeyse, "Isı Beklemesi" (Heat Hold) uyarısı veren bir `Banner` bileşeni otomatik olarak aktifleşmelidir.