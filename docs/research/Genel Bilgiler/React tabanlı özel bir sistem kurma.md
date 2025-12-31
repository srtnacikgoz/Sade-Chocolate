### 1. Dijital Mimari: "Hub-and-Spoke" (Merkez ve Uzantılar) Modeli

Belge, e-ticaret platformunu tüm veri akışının merkezde toplandığı bir yapı olarak tanımlar2. React tabanlı bir "Headless" (başsız) yapıda şu entegrasyonları kurmanız gerekecektir:

- **Merkez (Hub):** Ürün kataloğu, müşteri kimlikleri ve sipariş işleme süreçlerinin yönetildiği ana yapı3.
    
- **Ödeme Uzantısı (Payment Spoke):** Türkiye pazarı için standart olan **Iyzico** veya **PayTR** entegrasyonu; güvenli token değişimi ve başarılı/başarısız sinyallerinin yönetimi4444.
    
- **Lojistik Uzantısı (Logistics Spoke):** Aras Kargo veya benzeri taşıyıcıların API'leri ile gerçek zamanlı kargo takip numaralarının müşteriye iletilmesi5.
    
- **Destek Uzantısı:** Müşteri tereddütlerini anında çözmek için doğrudan storefront içine gömülmüş **WhatsApp Business** hattı6.
    

---

### 2. React Bileşenleri İçin UX/UI Gereksinimleri

Belgeye göre, bir "lezzet sözü" satabilmek için arayüzün şu fonksiyonel özellikleri içermesi kritiktir7:

- **Duyusal Tasarım Bileşenleri:**
    
    - **Makro Video Player:** Çikolatanın "snap" (kırılma) sesini ve dokusunu gösteren 4K yavaş çekim videoları içermelidir8.
        
    - **İnteraktif Tadım Radarı:** Tatlılık, acılık, asitlik, meyvemsilik ve kavrulma oranlarını gösteren interaktif grafikler (Radar Charts)9.
        
- **Dönüşüm Odaklı Özellikler:**
    
    - **Hediye Modu Toggle:** Fiyatları gizleyen, video veya metin notu eklemeye olanak tanıyan küresel bir anahtar10.
        
    - **Tazelik Geri Sayımı:** "X tarihinde kavruldu, en iyi X tarihine kadar tüketilir" şeklinde dinamik metinler11.
        
    - **İçerik Şeffaflığı Sekmeleri:** Malzemelerin menşeini (Giresun fındığı, pancar şekeri vb.) listeleyen akordeon menüler12.
        

---

### 3. Lojistik ve Isı Yönetimi Algoritması

Sistemin en kritik "backend" mantığı, ürünlerin erimesini önlemek üzerine kurulmalıdır13.

- **Hava Durumu API Entegrasyonu:** Teslimat yapılacak ilin (örneğin Antalya) hava durumu 30°C'yi aşıyorsa, siparişi otomatik olarak "Isı Beklemesi" (Heat Hold) durumuna alan bir mantık kurulmalıdır14.
    
- **Gönderim Kısıtlama Mantığı:** Ürünlerin hafta sonu depolarda beklememesi için Cuma, Cumartesi ve Pazar günleri kargolamayı engelleyen "Blackout Days" protokolü kodlanmalıdır15.
    
- **Dinamik Soğutucu Hesaplayıcı:** Yaz aylarında 2 kg çikolata için 1 kg jel paket (buz aküsü) eklenmesini zorunlu kılan bir paketleme algoritması16161616.
    

---

### 4. Pazarlama ve Sadakat Yazılımı

- **Çikolata Kulübü (Abonelik):** Tekrarlayan gelir için "Tadım Yolculuğu" abonelik sistemini React tarafında yönetilebilir bir dashboard ile kurun17.
    
- **Yönlendirme Döngüsü:** "Bir kutu hediye et, bir kutu kazan" mantığıyla çalışan, müşteri edinme maliyetini (CAC) düşüren referans sistemleri18.
    

---

### 5. Yasal ve Operasyonel Hazırlık Kontrol Listesi

Claude Code ile kodlamaya başlamadan önce operasyonel tarafta şu yasal gereklilikleri planlamalısınız:

| **Aşama**          | **Gereklilik**                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Üretim Lisansı** | Tarım ve Orman Bakanlığı'ndan "İşletme Kayıt Belgesi" alınmış ticari bir tesis20.                                                 |
| **Etiketleme**     | Alerjenlerin (fındık, süt, soya vb.) kalın puntolarla belirtilmesi ve Türk Gıda Kodeksi'ne uygunluk21.                            |
| **Sınıflandırma**  | Sadece saf kakao yağı kullanılması; bitkisel yağ kullanılırsa ürünün "Çikolata" değil "Kokolin" olarak tanımlanması zorunluluğu22 |