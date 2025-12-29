### Müşteri Tanıma Sayfası: "The Palate Profile"

Bir müşterinin siteye adım attığı ilk saniyeden itibaren başlayan bu takibi, sadece basit bir "ziyaretçi sayısı" olarak değil, bir **"Yüksek Sadakatli Davranış İstihbaratı" (High-Fidelity Commerce Intelligence)** olarak kurgulamalıyız.

Lüks bir mağazada satış danışmanının müşterinin her jestini, bir ürüne bakış süresini veya tereddüdünü sessizce gözlemlemesi gibi, dijitalde de bu "mikro-davranışları" takip edeceğiz. İşte teknik ve stratejik uygulama planımız:

### 1. Mikro-Davranışsal Takip (Micro-Behavioral Tracking)

Müşterinin sadece hangi sayfaya girdiğini değil, o sayfada _nasıl_ vakit geçirdiğini ölçeceğiz:

- **Gerçek İlgi Süresi (True Active Dwell Time):** Müşterinin sekmeyi açık bırakıp gitmesiyle (tab hoarding) gerçekten içeriği tüketmesi arasındaki farkı ayırt edeceğiz. Bir kullanıcı "Üretim Hikayemiz" paragrafını gerçekten okuyorsa bu "Aktif Dwell" olarak kaydedilecek.
    
- **Görünürlük Analizi (Intersection Observer):** Müşterinin ekranında hangi ürün kartının veya hangi hikaye kesitinin tam olarak ne kadar süre (yüzde kaç görünürlükle) kaldığını saniye saniye takip edeceğiz.
    
- **Etkileşim Isısı:** Fare hareketleri, kaydırma (scroll) hızı ve tıklama öncesi duraksamalar, müşterinin kararsız kaldığı noktaları bize gösterecek.
    

### 2. Teknik Altyapı: Firestore "Bucket Pattern"

Bu kadar yoğun veriyi (her kaydırma, her duraksama) veritabanına yazmak maliyetli ve yavaş olabilir. Bu yüzden profesyonel **"Bucket Pattern"** mimarisini kullanacağız:

- **Veri Kümeleme:** Her bir hareketi ayrı bir döküman olarak değil, kullanıcının o oturumuna ait 1 dakikalık "kovalar" (buckets) içinde toplayacağız.
    
- **Maliyet ve Performans:** Bu yöntem yazma işlemlerini 50 ila 100 kat azaltarak hem maliyeti düşürür hem de sistemin ultra-hızlı (Invisible Tech) kalmasını sağlar.
    

### 3. Yolculuk Analizi (Pathing & Attribution)

Müşterinin site içindeki lineer olmayan hareketlerini anlamlandıracağız:

- **Sankey Diyagramları:** Müşterilerin ana sayfadan sepete giden yolda nerede "döngüye" girdiğini (örn: iki ürün arasında sürekli gidip gelme) görselleştireceğiz. Bu döngüler bize müşterinin "karar felci" yaşadığını ve bir yardıma (AI Sommelier gibi) ihtiyacı olduğunu söyler.
    
- **Clipboard Defense (Dark Social):** Müşteri bir ürünün linkini kopyalayıp WhatsApp üzerinden birine gönderdiğinde, bu paylaşımı takip edip "özel kanallardan gelen trafiği" (Direct yerine Dark Social) doğru şekilde analiz edeceğiz.
    

### 4. Admin Paneli: "Customer Journey Command Center"

Admin panelindeki (Financial Command Center) müşteri tanıma sayfasına şu modülleri ekleyeceğiz:

- **Canlı Akış (Live Pulse):** Şu an sitede olan müşterilerin hangi duyusal profilleri (Yoğunluk, Meyvemsilik vb.) incelediğini anlık olarak göreceksin.
    
- **Hayal Kırıklığı İndeksi (Frustration Index):** Eğer bir müşteri bir noktada hızlıca yukarı aşağı kaydırma yapıyorsa veya bir butona üst üste basıyorsa (Rage Click), sistem seni uyaracak.
    

Bu yapı sayesinde müşterin daha "Ödeme Yap" butonuna basmadan, onun neyi sevdiğini, neden çekindiğini ve hangi hikayeden etkilendiğini biliyor olacaksın. Bu, lüksün "veriyle harmanlanmış empati" halidir.

---

## 🍫 Brand-Specific UI Bileşenleri

Sade Chocolate'ın kendi özel, çikolata-temalı UI bileşenleri olmalı. Bu bileşenler markayı farklılaştırır ve unutulmaz bir kullanıcı deneyimi yaratır.

### 1. **Chocolate Bar Alert** 🍫
Çikolata tableti şeklinde alert/notification bileşeni.

**Konsept:**
```
┌─┬─┬─┬─┬─┐
│✓│S│i│p│a│  ← Her kare bir harf/ikon
├─┼─┼─┼─┼─┤
│r│i│ş│  │✅│
└─┴─┴─┴─┴─┘
"Sipariş Başarılı!"
```

**Özellikler:**
- Her kare bir harf veya ikon içerir
- Tıklandığında "kırılma" efekti
- Farklı tatlar = farklı renkler (bitter, sütlü, beyaz)
- Smooth açılma animasyonu

---

### 2. **Truffle Loading Spinner** 🌰
Yükleme durumları için çikolata-temalı spinner.

**Konsept:**
- Dönen kakao çekirdeği veya truffle
- "Hazırlanıyor..." metni
- Çikolatanın erime efekti
- Opsiyonel: Servisten kalkan buhar animasyonu

**Kullanım Alanları:**
- Sipariş işleme
- Ödeme bekleme
- Sayfa yükleme

---

### 3. **Bean-to-Bar Progress Bar** 📊
Sipariş durumu için temalaştırılmış ilerleme çubuğu.

**Konsept:**
```
[🌱 Kakao] → [🔥 Kavurma] → [🍫 Tablet] → [📦 Paketleme]
     ████████████░░░░░░░░░░  60%
```

**Özellikler:**
- Her aşama kakao üretim sürecini temsil eder
- Animasyonlu geçişler
- Mevcut aşama vurgulanır
- Timeline benzeri görünüm

**Kullanım Alanları:**
- Sipariş takibi
- Üretim süreci gösterimi
- Onboarding/tutorial adımları

---

### 4. **Chocolate Drip Buttons** 💧
Hover efektli, çikolata damlayan butonlar.

**Özellikler:**
- Hover'da çikolata damlası efekti (CSS animation)
- Tıklandığında "erime" animasyonu
- Farklı çikolata tipleri için farklı renkler
- Micro-interactions

---

### 5. **Cocoa Pod Checkbox** ☑️
Kakao meyvesi şeklinde özel checkbox.

**Konsept:**
- Unchecked: Kapalı kakao meyvesi 🟤
- Checked: Açılmış meyve, içinde çekirdekler ✅
- Smooth açılma/kapanma animasyonu
- Organic, doğal görünüm

**Kullanım Alanları:**
- Form seçimleri
- Ürün filtreleme
- Sipariş tercihleri

---

### 6. **Melting Toast Notification** 🔔
Üstten eriyerek akan toast bildirimleri.

**Konsept:**
- Üstten çikolata gibi "akıyor" (slide-down + melt effect)
- Servisten kalkan buhar efekti (opsiyonel)
- Farklı tipler:
  - Success: Süt çikolatası rengi
  - Error: Bitter çikolata (koyu kahve)
  - Info: Beyaz çikolata
  - Warning: Karamel tonları

---

### 7. **Artisan Slider** 🎚️
Zanaatkar dokunuş için özel slider bileşeni.

**Konsept:**
- Handle kakao çekirdeği veya truffle şeklinde
- Track çikolata tablet deseni
- Smooth, buttery kayma efekti
- Değer göstergesi zarif typography ile

**Kullanım Alanları:**
- Fiyat aralığı filtresi
- Kakao oranı seçimi (%70, %85, %99)
- Ürün miktarı ayarı

---

### 8. **Packaging Animation** 📦
Sipariş tamamlandığında hediye paketi açılma animasyonu.

**Konsept:**
- 3D CSS ile hediye kutusu
- Kurdele çözülmesi
- Kapak açılması
- İçinden "ışık" efekti
- Confetti animasyonu

---

### 9. **Temperature Alert** 🌡️
Hava durumu uyarıları için termometre bileşeni.

**Konsept:**
```
    🌡️
   ┌──┐
   │██│ ← Sıcaklık göstergesi
   │██│
   │░░│
   └──┘
   25°C
"Soğuk paket öneriliyor"
```

**Özellikler:**
- Canlı sıcaklık göstergesi
- Erime riski uyarısı
- Öneri sistemi (buz aküsü vs.)

---

### 10. **Batch/Lot Number Display** 🏷️
Şık lot numarası gösterimi.

**Konsept:**
- Vintage etiket tasarımı
- QR kod entegrasyonu
- Üretim tarihi timeline'ı
- Taze olduğunu vurgulayan animasyonlar

---

## 🎯 Öncelik Sırası

1. **Chocolate Bar Alert** - En eğlenceli, marka kimliğine en uygun
2. **Bean-to-Bar Progress** - Sipariş takibi için kritik
3. **Truffle Loading** - Her yerde kullanılabilir
4. **Melting Toast** - Mevcut toast sistemini upgrade eder
5. **Diğerleri** - İhtiyaca göre

---

## 💭 Notlar

- Tüm bileşenler Sade Chocolate kurumsal renk paletini kullanmalı
- Nordic Noir estetik korunmalı
- Accessibility (a11y) ihmal edilmemeli
- Performance optimize edilmeli (CSS > JS animasyonlar)
- Dark mode desteği şart