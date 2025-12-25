# Plan: Sade Chocolate Ana Kuralları

## 1. Genel Bakış

Bu doküman, "Sade Chocolate" projesinin geliştirme süreçlerinde uyulması gereken temel kuralları, stil rehberlerini ve UI/UX prensiplerini içerir. Bu track, projenin tamamı için geçerli olan ana bağlamı temsil eder.

## 2. Teknolojiler ve Kütüphaneler

- **Frontend:** React, TypeScript, Vite
- **Stil:** Tailwind CSS
- **UI Bileşenleri:** Shadcn UI (varsa), Headless UI (varsa)
- **Dil Desteği:** i18next (veya benzeri)
- **State Management:** React Context API
- **Form Yönetimi:** React Hook Form (varsa)

*Not: Yeni bir kütüphane eklemeden önce projedeki mevcut kullanımları kontrol et.*

## 3. Kodlama Stili ve Kuralları

- **Dil:** Kodun tamamı TypeScript ile yazılmalıdır. `any` tipinden mümkün olduğunca kaçınılmalıdır.
- **İsimlendirme:**
    - Bileşenler: `PascalCase` (örn. `ProductCard`).
    - Değişkenler ve Fonksiyonlar: `camelCase` (örn. `addToCart`).
    - Tipler ve Interface'ler: `PascalCase` (örn. `Product`).
- **Dosya Yapısı:**
    - Bileşenler: `src/components/` altında mantıksal gruplara ayrılmalıdır.
    - Sayfalar: `src/pages/` altında her sayfa için bir dosya olacak şekilde yapılandırılmalıdır.
    - Context'ler: `src/context/` altında toplanmalıdır.
- **Formatlama:** Projedeki mevcut `.prettierrc` (varsa) veya `tsconfig.json` formatlama kurallarına uyulmalıdır. Kod tutarlılığı esastır.

## 4. UI/UX Prensipleri

- **Tasarım Dili:** Sade, minimalist ve lüks. "Mocha Mousse" renk paletine ve "Playfair Display" / "Inter" fontlarına sadık kalınmalıdır.
- **Kullanıcı Deneyimi:**
    - **Sezgisel:** Arayüzler karmaşadan uzak ve kullanıcıyı yormayacak şekilde tasarlanmalıdır.
    - **Erişilebilirlik:** `aria-label` gibi HTML attributeları ve klavye navigasyonu gibi temel erişilebilirlik kurallarına dikkat edilmelidir.
    - **Performans:** Geçişler ve animasyonlar akıcı olmalı, görseller optimize edilmelidir. Gereksiz yeniden render işlemlerinden kaçınılmalıdır.
- **Görsel Tutarlılık:** Renkler, gölgeler, kenar yuvarlaklıkları ve boşluklar gibi görsel elementler projenin genelinde tutarlı olmalıdır. `tailwind.config.js` dosyasında tanımlanan tema değerleri kullanılmalıdır.

## 5. Yapılacak Değişiklikler İçin Yönergeler

- **Yeni Bileşen Ekleme:** Yeni bir bileşen eklenirken, mümkünse mevcut UI bileşenlerinden (örn. `src/components/ui/Button.tsx`) türetilmelidir.
- **State Yönetimi:** Global state gerektiren durumlar için (sepet, kullanıcı bilgisi vb.) React Context API kullanılmalıdır. Lokal state'ler bileşen içinde `useState` ile yönetilmelidir.
- **Hata Yönetimi:** Kullanıcıya gösterilen hatalar net ve anlaşılır olmalıdır. `sonner` veya benzeri bir kütüphane ile bildirimler gösterilebilir.

*Bu doküman, proje geliştikçe güncellenebilir.*
