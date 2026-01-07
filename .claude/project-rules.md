Temel Felsefe (Pragmatik SDUI)

- **Kademeli SDUI:** İlk aşamada sadece ana sayfa ve kampanya alanları gibi sık değişen yerler SDUI ile yönetilir 6. Karmaşık iş mantığı içeren ekranlar geleneksel yapıda kalır.
    
- **Configuration-First:** Bir özellik kodlanmadan önce şeması planlanır. Ancak karmaşıklık, ekip ölçeğiyle doğru orantılı tutulur8.
    
- **BFF (Backend-for-Frontend):** İstemciye ham veri yerine, render edilmeye hazır "View Model" gönderilir9.

Kritik İş Akışı ve Test Standartları

Süreç şu sırayla ilerler:

1. **Fikir & Plan:** AI Mentor ile mimari ve FSD katmanlaması netleştirilir.
    
2. **Test-Driven Development (TDD):** Kritik iş mantığı Vitest ile, UI bileşenleri Storybook ile izole şekilde geliştirilir.
    
3. **Görsel Regresyon:** 1px hassasiyetiyle görsel snapshot testleri yapılır12.
    
4. **Onay & Uygula:** AI denetiminden geçen kod, başarı kriterleri sağlandığında merge edilir.

Teknik Mimari (FSD & Migration)

- **Feature-Sliced Design (FSD):** Shared, Entities, Features, Widgets katmanları uygulanır.
    
- **Migration Path:** Mevcut kodlar "Tombstoning" yöntemiyle kademeli olarak FSD'ye taşınır; eski kodlar deprecated olarak işaretlenir15.
    
- **Dosya Limiti:** 200-500 satır kuralı esastır. Aşan kodlar hook veya atomik parçalara ayrılır.
    
- **Z-Index:** Sticky: 100 | Overlay: 500 | Modal: 1000 | Popover: 1500 | Toast: 2000.

UI/UX ve DesignOps (Nordic Noir)

- **Design Tokens:** Renk ve boşluklar Figma'dan JSON olarak beslenir (Generated Code)16.
    
- **A11y (Erişilebilirlik):** WCAG 2.1 standartları CI/CD'de otomatik test edilir.
    
- **Modern Köşeler:** Ana elementler: `rounded-[32px]` | Kartlar: `rounded-2xl`.

Güvenlik ve İzlenebilirlik
 **Edge & Security:** A/B testleri Edge seviyesinde çözülür. Tüm SDUI verileri sanitize edilerek XSS önlenir.
    
- **Observability:** Sentry ve Session Replay ile hata analizi yapılır.

Kurumsal Kimlik

- **Ünvan:** Sade Unlu Mamülleri San ve Tic Ltd Şti
    
- **Adres:** Yeşilbahçe mah. Çınarlı cd 47/A Muratpaşa Antalya
    
- **Vergi Bilgileri:** Vd: Antalya Kurumlar | Vn: 7361500827
- **Edge & Security:** A/B testleri Edge seviyesinde çözülür. Tüm SDUI verileri sanitize edilerek XSS önlenir.
    
- **Observability:** Sentry ve Session Replay ile hata analizi yapılır.

 Renk Paleti
Brand Blue	Brand Yellow	Brand Mustard	Brand Green	Brand Peach	Brand Orange
#a4d1e8	#e7c57d	#d4a945	#a4d4bc	#f3d1c8	#e59a77


