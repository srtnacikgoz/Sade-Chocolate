### Dinamik Operasyonel Banner (`OperationalBanner.jsx`)

Bu bileşen, belgede belirtilen "Proaktif İletişim" stratejisini uygular. Müşteriye ürünün neden geciktiğini veya neden özel paketleme yapıldığını açıklayarak güven inşa eder.

JavaScript

```
import React from 'react';

/**
 * Hava durumu ve güne göre müşteriyi bilgilendiren dinamik banner.
 * Stratejik Amaç: Beklentileri yönetmek ve güven inşa etmek.
 */
const OperationalBanner = ({ weatherTemp, dayOfWeek }) => {
  // 1. Sıcak Hava Protokolü (Mayıs - Eylül / > 30°C) [cite: 162, 163]
  if (weatherTemp > 30) {
    return (
      <div className="bg-amber-900 text-white px-4 py-2 text-center text-sm font-medium animate-pulse">
        ☀️ Yüksek sıcaklık uyarısı: Çikolatalarınızın erimemesi için ekstra soğutucu 
        ve özel termal yalıtım kullanıyoruz[cite: 165]. Teslimatınız Pazartesi sevk edilebilir.
      </div>
    );
  }

  // 2. Hafta Sonu "Blackout" Protokolü (Cuma - Pazar) [cite: 158]
  if ([5, 6, 0].includes(dayOfWeek)) {
    return (
      <div className="bg-stone-800 text-stone-100 px-4 py-2 text-center text-sm">
        📦 Tazelik Sözü: Ürünlerinizin hafta sonu kargo depolarında beklememesi için 
        sevkiyatlar Pazartesi sabahı başlar[cite: 159, 160].
      </div>
    );
  }

  return null; // Her şey normalse banner gösterme
};

export default OperationalBanner;
```