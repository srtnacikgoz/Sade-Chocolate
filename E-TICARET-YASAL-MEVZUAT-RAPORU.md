# E-Ticaret Sitesi - Yasal Mevzuat ve Uyumluluk Raporu

> **Araştırma Tarihi:** 12 Şubat 2026
> **Kapsam:** Türkiye'de e-ticaret sitesi işletmek için tüm yasal yükümlülükler, olası ihlaller ve çözümleri

---

## İÇİNDEKİLER

1. [KVKK - Kişisel Verilerin Korunması](#1-kvkk---kişisel-verilerin-korunması-kanunu-6698)
2. [6563 Sayılı E-Ticaret Kanunu](#2-6563-sayılı-elektronik-ticaretin-düzenlenmesi-hakkında-kanun)
3. [6502 Sayılı Tüketici Hakları Kanunu](#3-6502-sayılı-tüketicinin-korunması-hakkında-kanun)
4. [Mesafeli Satış ve Cayma Hakkı](#4-mesafeli-sözleşmeler-ve-cayma-hakkı)
5. [Ticari Elektronik İleti (İYS)](#5-ticari-elektronik-ileti-ve-iys)
6. [Vergi ve E-Fatura Yükümlülükleri](#6-vergi-ve-e-fatura-yükümlülükleri)
7. [Ödeme Güvenliği (PCI DSS / 3D Secure)](#7-ödeme-güvenliği)
8. [5651 Sayılı Kanun - Log Tutma](#8-5651-sayılı-kanun---internet-yayınları-ve-log-tutma)
9. [Fikri Mülkiyet ve Marka Hakları](#9-fikri-mülkiyet-ve-marka-hakları)
10. [Rekabet Hukuku ve Reklam Kuralları](#10-rekabet-hukuku-ve-reklam-kuralları)
11. [Ödeme Hizmetleri Kanunu (6493)](#11-ödeme-hizmetleri-kanunu-6493)
12. [ETBİS Kaydı](#12-etbis-kaydı)
13. [Dijital Erişilebilirlik](#13-dijital-erişilebilirlik)
14. [Zorunlu Hukuki Metinler](#14-sitede-bulunması-zorunlu-hukuki-metinler)
15. [Siber Güvenlik ve Teknik Tedbirler](#15-siber-güvenlik-ve-teknik-tedbirler)
16. [Kargo, Teslimat ve Garanti](#16-kargo-teslimat-ve-garanti)
17. [Ürün Güvenliği ve Uygunluk](#17-ürün-güvenliği-ve-uygunluk)

---

## 1. KVKK - Kişisel Verilerin Korunması Kanunu (6698)

### Kanun Kapsamı
6698 sayılı Kişisel Verilerin Korunması Kanunu, Türkiye'de faaliyet gösteren tüm işletmelerin kişisel veri işleme faaliyetlerini düzenler.

### Olası İhlaller ve Cezalar

| İhlal | Ceza | Açıklama |
|-------|------|----------|
| Aydınlatma yükümlülüğünü yerine getirmemek | 50.000 - 1.000.000 TL | Kullanıcılara veri işleme hakkında bilgi vermemek |
| Veri güvenliği yükümlülüklerine aykırılık | 25.000 - 1.000.000 TL | Teknik/idari tedbirleri almamak |
| Kurul kararlarına uymamak | 50.000 - 1.000.000 TL | KVKK Kurulu tarafından verilen kararlara aykırı davranmak |
| VERBİS'e kayıt olmamak | 50.000 - 1.000.000 TL | Veri Sorumluları Siciline kayıt yaptırmamak |
| Veri ihlalini bildirmemek | 25.000 - 1.000.000 TL | 72 saat içinde Kurul'a bildirmemek |

### Gerçek Ceza Örnekleri (E-Ticaret)
- **E-ticaret entegrasyon firması:** TC kimlik, e-posta, telefon verilerinin sızdırılması → **450.000 TL**
- **E-ticaret sitesi çerez ihlali:** Açık rıza olmadan zorunlu olmayan çerez kullanımı → **800.000 TL**
- **E-ticaret platformu 2FA eksikliği:** 673 satıcının hesabının ele geçirilmesi → Kurul kararı

### Karşılaşılabilecek Sorunlar ve Çözümler

**Sorun 1: Açık rıza almadan veri işleme**
- Üyelik formlarında KVKK onayı almamak
- Çerezlerde opt-in yerine opt-out kullanmak
- **Çözüm:** Tüm veri toplama noktalarında açık, bilgilendirilmiş, özgür iradeye dayalı onay mekanizması kur. Çerez banner'ında "Kabul Et / Reddet" seçeneği sun.

**Sorun 2: VERBİS kaydı eksikliği**
- **Çözüm:** kvkk.gov.tr üzerinden VERBİS'e kayıt ol. Veri envanteri çıkar. Veri işleme amaçlarını, saklama sürelerini, aktarım yapılan tarafları kaydet.

**Sorun 3: Veri ihlali müdahale planı yokluğu**
- **Çözüm:** Veri ihlali müdahale prosedürü oluştur. İhlal tespit edildiğinde 72 saat içinde KVKK Kurulu'na, en kısa sürede ilgili kişilere bildirim yap. Bildirimde: ihlalin niteliği, etkilenen veri kategorileri, etkilenen kişi sayısı, olası sonuçlar, alınan tedbirler yer almalı.

**Sorun 4: Üçüncü taraf veri paylaşımı**
- Analitik araçları (Google Analytics), reklam pikselleri (Facebook Pixel), ödeme entegrasyonları
- **Çözüm:** Her üçüncü taraf için Veri İşleyen Sözleşmesi imzala. Gizlilik politikasında hangi verilerin kimlerle paylaşıldığını açıkla. Yurt dışı veri aktarımı için ek tedbirler al.

**Sorun 5: Saklama sürelerini aşan veri tutma**
- **Çözüm:** Veri saklama politikası oluştur:
  - Sipariş/fatura verileri: 10 yıl (TTK)
  - Müşteri hesap bilgileri: İlişki süresince
  - Pazarlama izinleri: İzin geçerli olduğu sürece
  - Çerez/IP logları: Maksimum birkaç ay
  - Süre dolan verileri otomatik sil veya anonimleştir.

**Sorun 6: Kullanıcı haklarını karşılamamak**
- Erişim, düzeltme, silme, taşıma, itiraz hakları
- **Çözüm:** Kullanıcıların hesap ayarlarından verilerini görebileceği, indirebileceği, silebileceği bir panel oluştur. Başvurulara 30 gün içinde yanıt ver.

---

## 2. 6563 Sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun

### Kanun Kapsamı
E-ticaretin temelini oluşturan düzenleme. Ticari iletişim, hizmet sağlayıcı/aracı hizmet sağlayıcıların sorumlulukları, bilgi verme yükümlülükleri ve yaptırımları kapsar.

### Olası İhlaller ve Cezalar

| İhlal | Ceza |
|-------|------|
| Bilgi verme yükümlülüğüne aykırılık | 1.000 - 10.000 TL |
| Siparişe ilişkin yükümlülüklere aykırılık | 1.000 - 10.000 TL |
| Kişisel verilerin korunması yükümlülüğüne aykırılık | 10.000 - 100.000 TL |
| İşlem kayıtlarını saklamama (10 yıl) | 10.000 - 100.000 TL |
| Haksız ticari uygulamalar | 20.000.000 TL'ye kadar |
| Yıllık toplam ceza üst sınırı | 500.000.000 TL |

### Karşılaşılabilecek Sorunlar ve Çözümler

**Sorun 1: Satıcı bilgilerini eksik gösterme**
- **Çözüm:** Sitede aşağıdaki bilgileri açıkça göster:
  - Ticaret unvanı veya gerçek kişi adı soyadı
  - MERSİS numarası
  - Açık adres (gerçek fiziksel adres)
  - Telefon, e-posta
  - Vergi dairesi ve vergi numarası
  - Ticaret sicil numarası ve Ticaret Sicil Müdürlüğü adı
  - Varsa meslek odası bilgileri

**Sorun 2: Sipariş onay sürecindeki eksiklikler**
- **Çözüm:** Sipariş onayını e-posta veya SMS ile derhal gönder. Sipariş özeti (ürün, fiyat, kargo, toplam tutar) içermeli. Sipariş takip mekanizması sun.

**Sorun 3: İşlem kayıtlarını saklamamak**
- **Çözüm:** Tüm e-ticaret işlem kayıtlarını (sipariş, ödeme, iade, iletişim) işlem tarihinden itibaren 10 yıl sakla. Yedekleme stratejisi oluştur.

---

## 3. 6502 Sayılı Tüketicinin Korunması Hakkında Kanun

### Olası İhlaller ve Çözümler

**Sorun 1: Ayıplı mal/hizmet satışı**
- **Çözüm:** Ürün açıklamalarını doğru ve eksiksiz yaz. Ürün fotoğrafları gerçeği yansıtmalı. Ayıplı mal durumunda ücretsiz onarım, değişim, bedel iadesi veya bedel indirimi seçenekleri sun.

**Sorun 2: Haksız şartlar içeren sözleşmeler**
- Tek taraflı değişiklik hakkı, sorumluluğu sınırlayan maddeler
- **Çözüm:** Sözleşmeleri tüketici aleyhine haksız şart içermeyecek şekilde hazırla. Hukuk danışmanından onay al.

**Sorun 3: Fiyat etiketleme/gösterim hataları**
- **Çözüm:** KDV dahil toplam fiyatı açıkça göster. Kargo ücreti ayrıca belirt. İndirimli ürünlerde önceki fiyatı ve indirim oranını doğru göster.

---

## 4. Mesafeli Sözleşmeler ve Cayma Hakkı

### Yasal Çerçeve
Mesafeli Sözleşmeler Yönetmeliği (27 Kasım 2014, değişikliklerle)

### Olası İhlaller ve Çözümler

**Sorun 1: Ön bilgilendirme yapmamak**
- **Çözüm:** Satın alma öncesinde tüketiciye şunları bildir:
  - Satıcının kimlik ve iletişim bilgileri
  - Ürünün temel nitelikleri
  - KDV dahil toplam fiyat
  - Ödeme ve teslimat bilgileri
  - Cayma hakkının varlığı, süresi ve kullanım şekli
  - Cayma hakkı kullanılamayan ürün/hizmetler
  - Varsa garanti bilgileri

**Sorun 2: Cayma hakkını engellemek/zorlaştırmak**
- **Çözüm:**
  - 14 gün cayma hakkı süresini uygula (teslim tarihinden itibaren)
  - Cayma formunu sitede kolay erişilebilir yap
  - Cayma beyanı ulaştıktan sonra 14 gün içinde ödemeyi iade et
  - Cayma formu sunulmadıysa süre 14 güne değil, 1 yıla uzar!

**Sorun 3: Cayma hakkı istisnalarını yanlış uygulamak**
- **Çözüm:** Cayma hakkı KULLANILAMAYAN durumlar:
  - Fiyatı piyasa dalgalanmasına bağlı ürünler (altın, döviz)
  - Kişiye özel üretim (isim baskılı, ölçüye göre)
  - Çabuk bozulan ürünler (taze gıda, çiçek, yaş pasta)
  - Hijyen açısından iadesi uygun olmayan (iç çamaşırı, mayo)
  - Açılmış ses/görüntü/yazılım (CD, DVD)
  - Süreli yayınlar (gazete, dergi)
  - Konaklama, ulaşım, eğlence hizmetleri (tarih belirtilmiş)
  - Dijital içerik (indirme başladıysa)
  - Bu istisnaları ön bilgilendirmede açıkça belirt!

---

## 5. Ticari Elektronik İleti ve İYS

### Yasal Çerçeve
6563 sayılı Kanun + Ticari Elektronik İletiler Hakkında Yönetmelik + İleti Yönetim Sistemi (İYS)

### Olası İhlaller ve Cezalar

| İhlal | Ceza |
|-------|------|
| Onaysız ticari elektronik ileti göndermek | 1.899 - 9.514 TL |
| Toplu onaysız gönderim | 10 katına kadar artırılır |
| İYS'ye kayıt olmamak | İdari para cezası |
| Ret hakkını kullandırmamak | İdari para cezası |

### Karşılaşılabilecek Sorunlar ve Çözümler

**Sorun 1: İYS kaydı yapmamak**
- **Çözüm:** iys.org.tr'ye kayıt ol. Tüm mevcut onayları 3 iş günü içinde İYS'ye aktar. Yeni onayları da İYS üzerinden kaydet.

**Sorun 2: Onay almadan e-posta/SMS kampanya göndermek**
- **Çözüm:** Üyelik sırasında ticari ileti onayı al (ayrı checkbox, ön seçili OLMAMALI). Onay: kime verildiği, hangi kanalla alındığı, tarihi kayıt altında olmalı. Her iletide "abonelikten çık" linki bulunmalı. Ret talebi 3 iş günü içinde işleme alınmalı.

**Sorun 3: Tacir/esnaf ayrımını yapmamak**
- Tacir/esnaf olan alıcılara onaysız ticari ileti gönderilebilir (ilk aşamada)
- Ancak tacir/esnaf ret hakkını kullanırsa artık gönderim yapılamaz
- **Çözüm:** B2B müşterileri ayrı segmentte tut, ret taleplerini takip et.

---

## 6. Vergi ve E-Fatura Yükümlülükleri

### Olası İhlaller ve Çözümler

**Sorun 1: E-fatura/e-arşiv geçişini yapmamak**
- E-ticaret yapan ve brüt satış hasılatı 500.000 TL üzeri olanlar → e-fatura ZORUNLU
- Genel ciro limiti (2025): 3.000.000 TL
- **Çözüm:** Ciro limitlerini takip et. Aştığın yılı takip eden 1 Temmuz'a kadar e-fatura'ya geç. GİB portalı veya özel entegratör kullan.

**Sorun 2: Fatura kesmemek / eksik kesmek**
- E-arşiv fatura alt limiti (2025): Vergiler dahil 3.000 TL üzeri → zorunlu
- Tek seferde 9.900 TL üzeri satışlarda e-arşiv zorunlu (e-fatura mükellefi olmayanlar için)
- **Çözüm:** Her satışta otomatik fatura kes. Muhasebe yazılımı entegrasyonu kur.

**Sorun 3: Stopaj yükümlülüğünü karşılamamak**
- Pazaryeri üzerinden satış yapanlar için %1 stopaj
- **Çözüm:** Pazaryeri satışlarında stopaj kesintilerini takip et. Muhtasar beyanname düzenli ver.

**Sorun 4: KDV/Gelir-Kurumlar Vergisi beyanname eksikliği**
- **Çözüm:**
  - Şahıs: Gelir vergisi + KDV + muhtasar beyanname
  - Şirket: Kurumlar vergisi + KDV + muhtasar beyanname
  - Mali müşavir ile çalış, beyanname takvimini takip et

---

## 7. Ödeme Güvenliği

### PCI DSS (Payment Card Industry Data Security Standard)

### Olası İhlaller ve Çözümler

**Sorun 1: Kart bilgilerini güvensiz ortamda işlemek/saklamak**
- Aylık 5.000 - 100.000 USD ceza (kart şemasına göre)
- Büyük ölçekli ihlallerde çok daha ağır cezalar
- Kart işleme hizmetinin iptali riski
- **Çözüm:**
  - Kart bilgilerini KESİNLİKLE kendi sunucunda saklama
  - PCI DSS sertifikalı ödeme altyapı sağlayıcısı kullan (iyzico, PayTR, Stripe vb.)
  - Tokenizasyon kullan
  - Yıllık PCI DSS uyumluluk denetimi yaptır

**Sorun 2: 3D Secure uygulamamak**
- **Çözüm:** Tüm kart ödemelerinde 3D Secure (3DS2) zorunlu kıl. Bankalar zaten zorunlu tutuyor ancak teknik implementasyonu doğru yap.

**Sorun 3: SSL/TLS sertifikası eksikliği**
- Bankalar SSL olmadan sanal POS vermez
- **Çözüm:** EV SSL veya en az OV SSL sertifikası al. TLS 1.2+ kullan. Let's Encrypt ücretsiz de olabilir ancak e-ticaret için ücretli tercih edilmeli.

---

## 8. 5651 Sayılı Kanun - İnternet Yayınları ve Log Tutma

### Olası İhlaller ve Cezalar

| İhlal | Ceza |
|-------|------|
| Log kayıtlarını tutmamak | 15.000 - 100.000 TL |
| Trafik bilgilerini saklamamak | İdari para cezası |
| İçerik kaldırma yükümlülüğüne uymamak | Erişim engeli kararı |

### Karşılaşılabilecek Sorunlar ve Çözümler

**Sorun 1: Erişim loglarını saklamamak**
- Yer sağlayıcılar: trafik bilgilerini 1-2 yıl saklama yükümlülüğü
- **Çözüm:** IP adresleri, erişim zamanları, yapılan işlemler gibi trafik loglarını en az 1 yıl, en fazla 2 yıl sakla. Logların doğruluğunu, bütünlüğünü ve gizliliğini sağla.

**Sorun 2: Yasaklı içerik barındırmak**
- Katalog suçlar: çocuk istismarı, uyuşturucu, müstehcenlik, kumar vb.
- **Çözüm:** Kullanıcı tarafından oluşturulan içerikleri (yorum, fotoğraf) moderasyon mekanizmasıyla denetle. Şikayet/bildirim mekanizması kur. Mahkeme kararı veya idari karara uygun şekilde içerik kaldır.

**Sorun 3: Yer sağlayıcı/içerik sağlayıcı ayrımını bilmemek**
- E-ticaret sitesi = İçerik sağlayıcı (kendi ürünlerini satıyorsa)
- Pazaryeri = Yer sağlayıcı + Aracı hizmet sağlayıcı
- **Çözüm:** Hangi kategoride olduğunu belirle ve ona göre yükümlülükleri uygula.

---

## 9. Fikri Mülkiyet ve Marka Hakları

### Yasal Çerçeve
6769 sayılı Sınai Mülkiyet Kanunu + 5846 sayılı Fikir ve Sanat Eserleri Kanunu + 7416 sayılı Kanun değişiklikleri (1 Ocak 2023)

### Olası İhlaller ve Cezalar

| İhlal | Ceza |
|-------|------|
| Marka ihlali (taklit ürün satışı) | 1-5 yıl hapis + maddi/manevi tazminat |
| Telif hakkı ihlali (fotoğraf, metin) | 1-5 yıl hapis + tazminat |
| İhlal bildirimine 48 saat içinde yanıt vermemek (pazaryeri) | 10.000 - 100.000 TL |

### Karşılaşılabilecek Sorunlar ve Çözümler

**Sorun 1: Başka sitelerden ürün görseli/açıklaması kopyalamak**
- **Çözüm:** Tüm ürün fotoğraflarını kendine özel çek. Ürün açıklamalarını orijinal yaz. Üretici görseli kullanacaksan lisans/izin al.

**Sorun 2: Marka tescilsiz ürün satışı**
- **Çözüm:** Satılan ürünlerin marka haklarını kontrol et. Yetkili bayi/distribütör olmadan markalı ürün satma. Marka sahiplerinden yazılı yetki al.

**Sorun 3: Pazaryerinde sahte ürün satışı şikayeti**
- **Çözüm:** Şikayet mekanizması kur. Marka sahibi başvurduğunda 48 saat içinde ilgili ürünü kaldır. Satıcıyı bilgilendir. Haksız şikayet durumunda satıcının itiraz mekanizmasını sun.

**Sorun 4: Site tasarımı/kodu telif ihlali**
- Tema, eklenti, font, ikon lisansları
- **Çözüm:** Tüm kullanılan varlıkların (font, ikon, tema, kütüphane) lisanslarını kontrol et. GPL, MIT, Apache gibi açık kaynak lisansları dahi koşullar içerir.

---

## 10. Rekabet Hukuku ve Reklam Kuralları

### Yasal Çerçeve
Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği + 6502 sayılı Kanun

### Olası İhlaller ve Cezalar
- Reklam Kurulu: Durdurma, düzeltme, 3 aya kadar tedbiren durdurma
- İdari para cezası: Mecra türüne göre değişir, tekrarda 10 katına kadar artırılır
- 2024 yılında 927 dosyada toplam **148.783.980 TL** idari para cezası

### Karşılaşılabilecek Sorunlar ve Çözümler

**Sorun 1: Yanıltıcı indirim kampanyaları**
- "Sürekli indirim" göstermek, önceki fiyatı şişirmek
- **Çözüm:** İndirimli fiyat gösterirken önceki satış fiyatını doğru göster. İndirim süresini belirt. "Son X adet" gibi ifadeler gerçeği yansıtmalı.

**Sorun 2: Sahte/yanıltıcı yorum ve puanlar**
- **Çözüm:** Sahte yorum oluşturmama. Satın almayan kullanıcılardan yorum almama. Olumsuz yorumları silmeme. "Doğrulanmış alıcı" etiketi kullan.

**Sorun 3: Karşılaştırmalı reklam ihlalleri**
- **Çözüm:** Rakiplerle karşılaştırma yaparken doğrulanabilir, objektif veriler kullan. Rakibi karalayıcı ifadeler kullanma. Karşılaştırma aynı kategorideki ürünler arasında olmalı.

**Sorun 4: Influencer/sosyal medya reklamlarını gizlemek**
- **Çözüm:** Ücretli iş birlikleri "#reklam" veya "#işbirliği" etiketi ile belirtilmeli. Influencer sözleşmelerinde bu zorunluluğu ekle.

---

## 11. Ödeme Hizmetleri Kanunu (6493)

### Olası İhlaller ve Çözümler

**Sorun 1: Lisanssız ödeme hizmeti sunmak**
- Kendi ödeme sisteminizi kurup para tutuyorsanız → Lisans gerekir
- **Çözüm:** Lisanslı ödeme kuruluşu veya elektronik para kuruluşu ile çalış (iyzico, PayTR, Sipay vb.). Kendi bünyende para tutma, cüzdan sistemi kurma (lisans gerektir). Ön ödemeli kart/puan sistemi = elektronik para ihracı = TCMB lisansı gerekir.

**Sorun 2: Marketplace'te ödeme akışı hataları**
- Satıcı parasını doğrudan almak → lisanssız ödeme hizmeti
- **Çözüm:** Marketplace modelinde lisanslı bir ödeme kuruluşu üzerinden split payment (alt satıcılara ödeme dağıtımı) kullan.

---

## 12. ETBİS Kaydı

### Yasal Çerçeve
Elektronik Ticaret Bilgi Sistemi - Ticaret Bakanlığı

### Olası İhlaller ve Çözümler

**Sorun 1: ETBİS'e kayıt yaptırmamak**
- E-ticaret faaliyetine başladıktan sonra 30 gün içinde kayıt zorunlu
- **Çözüm:** eticaret.gov.tr/etbis adresinden kayıt yap. Gerekli bilgiler: tüzel/gerçek kişi bilgileri, web sitesi adresi, faaliyet alanı, iletişim bilgileri, kargo anlaşmaları, ödeme yöntemleri.

**Sorun 2: ETBİS bilgilerini güncel tutmamak**
- **Çözüm:** Bilgilerde değişiklik olduğunda 30 gün içinde güncelle.

---

## 13. Dijital Erişilebilirlik

### Yasal Çerçeve
5378 sayılı Engelliler Hakkında Kanun + 6563 sayılı Kanun + Cumhurbaşkanlığı Genelgesi

### Olası İhlaller ve Çözümler

**Sorun 1: WCAG 2.2 uyumluluğunu sağlamamak**
- E-ticaret firmaları 2 yıl içinde A seviyesi uyumluluğu sağlamalı
- **Çözüm:**
  - Alt text (alternatif metin) tüm görsellere ekle
  - Klavye navigasyonu destekle
  - Renk kontrastı yeterli olmalı (4.5:1 minimum)
  - Form elemanlarında label kullan
  - Ekran okuyucu uyumluluğu test et
  - ARIA etiketlerini doğru kullan
  - Video içeriklerde altyazı/transkript sun

---

## 14. Sitede Bulunması ZORUNLU Hukuki Metinler

### Eksiklik = İhlal. Aşağıdaki tüm metinler sitede OLMALI:

| # | Metin | Dayanak Kanun | Notlar |
|---|-------|---------------|--------|
| 1 | **Gizlilik Politikası** | KVKK (6698) | Hangi veriler, neden, nasıl, ne kadar süre toplandığını açıkla |
| 2 | **KVKK Aydınlatma Metni** | KVKK (6698) Md.10 | Veri sorumlusu bilgileri, işleme amaçları, haklar |
| 3 | **Çerez Politikası** | KVKK (6698) | Hangi çerezler, ne amaçla, nasıl kapatılır |
| 4 | **Açık Rıza Metni** | KVKK (6698) Md.5 | Veri işleme için onay |
| 5 | **Mesafeli Satış Sözleşmesi** | 6502 + Yönetmelik | Her sipariş öncesi onay alınmalı |
| 6 | **Ön Bilgilendirme Formu** | 6502 + Yönetmelik | Satış öncesi tüketici bilgilendirmesi |
| 7 | **Üyelik Sözleşmesi** | 6563 | Hak ve yükümlülükler |
| 8 | **Kullanım Koşulları** | Genel Hükümler | Site kullanım kuralları |
| 9 | **İade ve Cayma Hakkı Politikası** | 6502 + Yönetmelik | 14 gün kuralı ve istisnalar |
| 10 | **Ticari Elektronik İleti Onay Metni** | 6563 + İYS | Pazarlama izni |
| 11 | **Kişisel Veri Saklama ve İmha Politikası** | KVKK | Saklama süreleri ve imha prosedürleri |

### Çözüm
- Tüm metinleri hukuk danışmanı ile hazırla
- Footer'da daima erişilebilir olsun
- Satın alma akışında ilgili sözleşmeleri göster ve onay al
- Sözleşme versiyonlarını sakla (hangi tarihte hangi metin onaylandı)

---

## 15. Siber Güvenlik ve Teknik Tedbirler

### OWASP Top 10 Riskleri (E-ticaret özelinde)

| Risk | E-ticaret Etkisi | Çözüm |
|------|-------------------|-------|
| **SQL Injection** | Veritabanı ele geçirme, kullanıcı verisi sızdırma | Parametrik sorgular, ORM kullan, input validation |
| **XSS (Cross-Site Scripting)** | Oturum çalma, sahte ödeme formları | Output encoding, CSP header, input sanitization |
| **Broken Authentication** | Hesap ele geçirme | 2FA, güçlü parola politikası, rate limiting |
| **CSRF** | Kullanıcı adına işlem yapma | CSRF token, SameSite cookie |
| **IDOR (Insecure Direct Object Reference)** | Başka kullanıcının siparişini görme | Yetkilendirme kontrolleri, UUID kullan |
| **Security Misconfiguration** | Sunucu bilgi sızıntısı | Header'ları yapılandır, debug modu kapat |
| **Sensitive Data Exposure** | Kredi kartı, şifre sızıntısı | Şifreleme (AES-256), HTTPS zorunlu, kart bilgisi saklama |
| **Broken Access Control** | Admin paneline yetkisiz erişim | RBAC, en az yetki prensibi |

### KVKK Teknik Tedbirler (Zorunlu)

| Tedbir | Açıklama |
|--------|----------|
| Şifreleme | Kişisel veriler şifreli saklanmalı |
| Erişim kontrolü | Rol bazlı yetkilendirme |
| Güvenlik duvarı | WAF (Web Application Firewall) |
| Sızma testi | Periyodik penetrasyon testi |
| Log yönetimi | Erişim logları, değişiklik logları |
| Yedekleme | Düzenli yedek, felaket kurtarma planı |
| Güncellemeler | Yazılım/kütüphane güvenlik yamaları |
| Eğitim | Çalışanlara güvenlik farkındalık eğitimi |

---

## 16. Kargo, Teslimat ve Garanti

### Olası İhlaller ve Çözümler

**Sorun 1: Teslimat süresini aşmak**
- Taahhüt edilen süre yoksa → 30 gün içinde teslim zorunlu
- **Çözüm:** Gerçekçi teslimat süreleri belirt. Gecikme durumunda proaktif bilgilendirme yap. 30 günü aşarsan tüketicinin sözleşmeden dönme hakkı var.

**Sorun 2: Garanti yükümlülüklerini karşılamamak**
- Asgari garanti süresi: Teslimden itibaren 2 yıl
- **Çözüm:** Garanti belgesi düzenle. Garanti kapsamı ve koşullarını açıkça belirt. Garanti servisi bilgilerini ürünle birlikte sun.

**Sorun 3: Hasarlı/kayıp kargo sorumluluğu**
- Satıcı, ürünün tüketiciye sağlam ulaşmasından sorumlu
- **Çözüm:** Kargo sigortası yaptır. Hasarlı teslimat durumunda ücretsiz yeniden gönderim veya iade sağla. Kargo firması ile sorumluluk sözleşmesi yap.

---

## 17. Ürün Güvenliği ve Uygunluk

### Yasal Çerçeve
1 Nisan 2025 - Uzaktan İletişim Araçları Yoluyla Piyasaya Arz Edilen Ürünlerin Piyasa Gözetimi ve Denetimi Yönetmeliği

### Olası İhlaller ve Çözümler

**Sorun 1: Ürün uygunluk belgeleri eksikliği**
- CE işareti, uygunluk beyanı olmayan ürün satışı yasaklanabilir
- **Çözüm:** Her ürün için gerekli uygunluk belgelerini temin et. Ürün ilanında CE işareti ve güvenlik bilgilerini göster. Üretici/ithalatçı belgelerini sakla.

**Sorun 2: Türkçe kullanım talimatı/uyarı eksikliği**
- **Çözüm:** Tüm ürünlerde Türkçe etiket, uyarı ve kullanım talimatı bulunmalı. İthal ürünlerde Türkçe çeviri yaptır.

**Sorun 3: Yasaklı/tehlikeli ürün satışı**
- **Çözüm:** Ticaret Bakanlığı'nın güvensiz ürün listelerini düzenli kontrol et. Geri çağırma duyurularını takip et. Yasaklanan ürünleri derhal satıştan kaldır.

---

## ÖZET: KRİTİK UYUMLULUK KONTROL LİSTESİ

### Hukuki Metinler
- [ ] Gizlilik Politikası
- [ ] KVKK Aydınlatma Metni
- [ ] Çerez Politikası ve Banner
- [ ] Açık Rıza Metni
- [ ] Mesafeli Satış Sözleşmesi
- [ ] Ön Bilgilendirme Formu
- [ ] Üyelik Sözleşmesi
- [ ] Kullanım Koşulları
- [ ] İade ve Cayma Hakkı Politikası
- [ ] Ticari Elektronik İleti Onay Metni

### Kayıtlar ve Lisanslar
- [ ] ETBİS kaydı
- [ ] VERBİS kaydı
- [ ] İYS kaydı
- [ ] Ticaret sicil kaydı
- [ ] Vergi kaydı (e-fatura/e-arşiv geçişi)

### Teknik Tedbirler
- [ ] SSL/TLS sertifikası (EV veya OV)
- [ ] PCI DSS uyumlu ödeme altyapısı
- [ ] 3D Secure entegrasyonu
- [ ] OWASP Top 10 güvenlik tedbirleri
- [ ] Log tutma ve saklama (5651)
- [ ] Veri şifreleme (AES-256)
- [ ] Düzenli yedekleme
- [ ] WAF (Web Application Firewall)
- [ ] Sızma testi (periyodik)
- [ ] WCAG 2.2 A seviyesi erişilebilirlik

### İş Süreçleri
- [ ] 14 gün cayma hakkı uygulaması
- [ ] 30 gün teslimat süresi takibi
- [ ] 2 yıl garanti yükümlülüğü
- [ ] Veri ihlali müdahale planı
- [ ] Veri saklama ve imha politikası
- [ ] 10 yıl işlem kaydı saklama
- [ ] Ürün güvenliği/uygunluk belge kontrolü
- [ ] Şikayet/itiraz mekanizması
- [ ] İade süreci yönetimi

---

## KAYNAKLAR

### Resmi Kaynaklar
- [KVKK Resmi Sitesi](https://www.kvkk.gov.tr)
- [ETBİS - Elektronik Ticaret Bilgi Platformu](https://www.eticaret.gov.tr/mevzuat)
- [İYS - İleti Yönetim Sistemi](https://iys.org.tr)
- [6563 Sayılı E-Ticaret Kanunu](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6563.pdf)
- [Mesafeli Sözleşmeler Yönetmeliği](https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=20237&MevzuatTur=7&MevzuatTertip=5)
- [5651 Sayılı Kanun](https://mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=1&MevzuatNo=5651&MevzuatTertip=5)
- [6493 Sayılı Ödeme Hizmetleri Kanunu](https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6493&MevzuatTur=1&MevzuatTertip=5)
- [Tüketici Hakları Bilgi Rehberi](https://tuketici.ticaret.gov.tr/yayinlar/tuketici-bilgi-rehberi)
- [KVKK Veri Güvenliği Rehberi](https://www.kvkk.gov.tr/yayinlar/veri_guvenligi_rehberi.pdf)

### KVKK Kurul Kararları (E-ticaret)
- [2024/1385 - E-ticaret platformu veri ihlali](https://www.kvkk.gov.tr/Icerik/8140/2024-1385)
- [2022/229 - E-ticaret çerez ihlali (800.000 TL)](https://www.kvkk.gov.tr/Icerik/7275/2022-229)
- [Kurul Karar Özetleri](https://www.kvkk.gov.tr/Icerik/5406/Kurul-Karar-Ozetleri)

### Hukuki Kaynaklar
- [E-Ticaret Sözleşmeleri - Tekcan Av.](https://www.tekcan.av.tr/e-ticaret-sitelerinde-olmasi-gereken-hukuki-sozlesmeler/)
- [E-Ticaret Hukuki Metinler - Mıhcı Hukuk](https://mihci.av.tr/e-ticaret-sitesi-hukuki-metinleri/)
- [E-Ticaret Mevzuatı Gelişmeler - Turkish Law Blog](https://turkishlawblog.com/insights/detail/e-ticaret-mevzuatinda-meydana-gelen-gelismeler-18032025)
- [Fikri Mülkiyet ve E-Ticaret - Gün + Partners](https://gun.av.tr/tr/goruslerimiz/guncel-yazilar/e-ticaret-platformlarinda-fikri-mulkiyet-hakki-ihlallerine-iliskin-yeni-yasal-duzenlemeler)
- [KVKK Uyumluluk Rehberi](https://cookie-script.com/guides/practical-guide-to-kvkk-compliance)
- [PCI DSS Sertifikası - ikas](https://ikas.com/tr/blog/pci-dss-sertifikasi-nedir)
- [E-Fatura Zorunluluğu - ideasoft](https://www.ideasoft.com.tr/e-ticaret-icin-e-fatura-zorunlulugu/)
- [7 Hukuki Zorunluluk - Umut Akpınar](https://umutakpinar.com/e-ticaret-sitesi-acmadan-once-7-onemli-konu/)
