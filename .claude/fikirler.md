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