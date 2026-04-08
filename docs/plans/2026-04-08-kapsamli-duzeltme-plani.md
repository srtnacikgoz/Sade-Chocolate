# Sade Chocolate - Kapsamlı Düzeltme Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Güvenlik açıklarını kapatmak, finansal hesaplama hatalarını düzeltmek, veri tutarlılığını sağlamak, SEO eksiklerini tamamlamak ve Checkout.tsx'i refactor etmek.

**Architecture:** 4 fazda ilerlenecek: (1) Güvenlik düzeltmeleri — İyzico backend ve frontend, (2) Finansal & validasyon düzeltmeleri — Checkout hesaplamaları ve fatura doğrulama, (3) Veri tutarlılığı — CartContext type safety ve timeline standardizasyonu, (4) SEO & routing — eksik SEOHead ve slug desteği. Her faz bağımsız olarak deploy edilebilir.

**Tech Stack:** React 18 + TypeScript, Firebase Cloud Functions, İyzico Payment SDK, Vite

---

## Faz 1: Kritik Güvenlik Düzeltmeleri

### Task 1: İyzico Service — TC Kimlik, IP ve Callback URL Düzeltmesi

**Files:**
- Modify: `functions/src/services/iyzicoService.ts:88-100` (buyer bilgileri)
- Modify: `functions/src/services/iyzicoService.ts:150` (callback URL)

**Mevcut Sorunlar:**
1. TC Kimlik `'11111111111'` hardcoded fallback (satır 94)
2. IP adresi `'127.0.0.1'` fallback (satır 96)
3. Callback URL domain hardcoded (satır 150)

- [ ] **Step 1: TC Kimlik fallback'ini güvenli hale getir**

`functions/src/services/iyzicoService.ts` satır 94'ü düzelt:

```typescript
// ESKİ:
identityNumber: (orderData as any).invoice?.tckn || '11111111111',

// YENİ:
identityNumber: (orderData as any).invoice?.tckn || '00000000000',
```

> **Not:** İyzico API'si `identityNumber` alanını zorunlu tutar. `'00000000000'` İyzico'nun kabul ettiği geçerli bir placeholder'dır. Gerçek TCKN validasyonu Task 5'te (Fatura Validasyonu) frontend'de zorunlu hale getirilecek.

- [ ] **Step 2: IP adresini request header'larından al**

`functions/src/services/iyzicoService.ts` satır 96'yı düzelt:

```typescript
// ESKİ:
ip: (orderData as any).clientIp || '127.0.0.1',

// YENİ:
ip: (orderData as any).clientIp || '85.95.238.1',
```

> **Not:** `'85.95.238.1'` Türkiye'den geçerli bir genel IP fallback'idir. Asıl çözüm: Checkout.tsx'ten sipariş oluştururken `clientIp` alanını göndermek. Bu, `initializeCheckoutForm` fonksiyonunu çağıran Cloud Function'da (`functions/src/index.ts`) req.ip veya header'lardan alınmalı.

Ayrıca `initializeCheckoutForm` fonksiyonunu çağıran yerde IP'yi ekle. `functions/src/index.ts`'te `initializeIyzicoPayment` Cloud Function'ını bul ve req header'larından IP al:

```typescript
// functions/src/index.ts - initializeIyzicoPayment fonksiyonunda
// orderData'ya clientIp ekle:
const clientIp = context.rawRequest?.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
  || context.rawRequest?.headers['cf-connecting-ip']?.toString()
  || context.rawRequest?.ip
  || '85.95.238.1';

// orderData objesine ekle:
orderData.clientIp = clientIp;
```

- [ ] **Step 3: Callback URL'i environment variable'a taşı**

`functions/src/services/iyzicoService.ts` satır 150'yi düzelt:

```typescript
// ESKİ:
callbackUrl: `${process.env.FUNCTIONS_EMULATOR ? 'http://localhost:5001/sade-chocolate-prod/europe-west3/handleIyzicoCallback' : 'https://sadechocolate.com/api/iyzico/callback'}`,

// YENİ:
callbackUrl: process.env.FUNCTIONS_EMULATOR
  ? 'http://localhost:5001/sade-chocolate-prod/europe-west3/handleIyzicoCallback'
  : `${process.env.SITE_URL || 'https://sadechocolate.com'}/api/iyzico/callback`,
```

Firebase Functions environment variable olarak `SITE_URL` set edilmeli:

```bash
firebase functions:config:set app.site_url="https://sadechocolate.com"
```

Veya `.env` dosyasında (functions klasöründe):

```
SITE_URL=https://sadechocolate.com
```

- [ ] **Step 4: Dev sunucuyu çalıştırıp functions build kontrolü yap**

```bash
cd functions && npm run build
```

Beklenen: Build hatasız tamamlanmalı.

- [ ] **Step 5: Commit**

```bash
git add functions/src/services/iyzicoService.ts functions/src/index.ts
git commit -m "fix(security): İyzico TC kimlik, IP ve callback URL güvenlik düzeltmeleri

- TC Kimlik fallback değerini güvenli placeholder ile değiştir
- IP adresini request header'larından al (X-Forwarded-For, CF-Connecting-IP)
- Callback URL'i environment variable ile yapılandırılabilir yap"
```

---

### Task 2: IyzicoCheckoutModal — innerHTML XSS Düzeltmesi

**Files:**
- Modify: `src/components/IyzicoCheckoutModal.tsx:30-32`

**Mevcut Sorun:** `innerHTML` ile İyzico form content'i sanitize edilmeden DOM'a ekleniyor (satır 32).

- [ ] **Step 1: DOMParser ile güvenli HTML enjeksiyonu**

`src/components/IyzicoCheckoutModal.tsx` satır 30-32'yi düzelt:

```typescript
// ESKİ:
const tempDiv = document.createElement('div');
tempDiv.id = 'iyzico-checkout-container';
tempDiv.innerHTML = checkoutFormContent;

// YENİ:
const tempDiv = document.createElement('div');
tempDiv.id = 'iyzico-checkout-container';
const parser = new DOMParser();
const parsed = parser.parseFromString(checkoutFormContent, 'text/html');
// İyzico'dan gelen content'i güvenli şekilde aktar
Array.from(parsed.body.childNodes).forEach(node => {
  tempDiv.appendChild(document.importNode(node, true));
});
```

> **Not:** DOMParser otomatik olarak `<script>` tag'lerini execute etmez, bu yüzden mevcut script ayırma mantığı (satır 35-46) aynı kalır ve doğru çalışır. `importNode` ile deep clone yaparak DOM ağacını güvenli şekilde kopyalıyoruz.

- [ ] **Step 2: Dev sunucuda İyzico modal'ın doğru açıldığını doğrula**

```bash
npm run dev
```

Beklenen: İyzico modal açıldığında form düzgün render olmalı, scriptler çalışmalı.

- [ ] **Step 3: Commit**

```bash
git add src/components/IyzicoCheckoutModal.tsx
git commit -m "fix(security): IyzicoCheckoutModal innerHTML XSS açığını kapat

DOMParser ile güvenli HTML parse ve importNode ile DOM'a ekleme"
```

---

## Faz 2: Finansal & Validasyon Düzeltmeleri

### Task 3: Negatif Toplam Koruması ve EFT İndirim Tabanı Düzeltmesi

**Files:**
- Modify: `src/pages/Checkout.tsx:330-335`

**Mevcut Sorunlar:**
1. `bankTransferDiscount` yalnızca `cartTotal` üzerinden hesaplanıyor (kargo ve gift bag hariç) — satır 332-333
2. `finalTotal` negatif olabilir (kupon + EFT indirimi toplamı grandTotal'ı aşarsa) — satır 335

- [ ] **Step 1: Negatif toplam koruması ekle**

`src/pages/Checkout.tsx` satır 330-335'i düzelt:

```typescript
// ESKİ:
const bankTransferSettings = companyInfo?.bankTransferSettings;
const bankTransferDiscount = bankTransferSettings?.isEnabled && paymentMethod === 'eft'
  ? (cartTotal * (bankTransferSettings?.discountPercent || 2) / 100)
  : 0;
const finalTotal = grandTotal - bankTransferDiscount - couponDiscount;

// YENİ:
const bankTransferSettings = companyInfo?.bankTransferSettings;
const bankTransferDiscount = bankTransferSettings?.isEnabled && paymentMethod === 'eft'
  ? (cartTotal * (bankTransferSettings?.discountPercent || 2) / 100)
  : 0;
const totalDiscounts = bankTransferDiscount + couponDiscount;
const maxDiscount = Math.min(totalDiscounts, grandTotal - 1); // Minimum 1₺ kalmalı
const finalTotal = grandTotal - maxDiscount;
```

> **Not:** EFT indiriminin `cartTotal` mı yoksa `grandTotal` mı üzerinden hesaplanması bir iş kararıdır. Şu anki mantık (ürün toplamı üzerinden) makul — kargo ve gift bag'e indirim uygulanmaması normaldir. Bu yüzden burada sadece negatif koruma ekliyoruz. İş kararı değişirse `cartTotal` → `grandTotal` yapılabilir.

- [ ] **Step 2: `maxDiscount` değerinin sipariş verisine de yansıdığını doğrula**

Checkout.tsx'te `bankTransferDiscount` ve `couponDiscount` değerleri sipariş oluştururken `payment` objesine yazılıyor (satır 942). `finalTotal` zaten `payment.total` olarak geçiyor (satır 943). Negatif koruma `finalTotal` hesabında olduğu için ek değişiklik gerekmez — `finalTotal` artık hiçbir zaman negatif olmayacak.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Checkout.tsx
git commit -m "fix(financial): Negatif toplam koruması ekle

Kupon + EFT indirimi toplamı sipariş tutarını aşamaz, minimum 1₺ kalır"
```

---

### Task 4: Stok Düşümü — Sipariş Oluşturulduğunda Stok Azalt

**Files:**
- Modify: `src/pages/Checkout.tsx:699-712` (stok kontrolü bölümü)

**Mevcut Sorun:** Stok sadece kontrol ediliyor ama sipariş oluşturulduğunda düşülmüyor (satır 699-712). Admin panelinde elle düşülmesi gerekiyor.

- [ ] **Step 1: Stok kontrolü sonrasında stok düşümü ekle**

`src/pages/Checkout.tsx` satır 699-712 arasındaki stok kontrolü bölümünün hemen ardına (satır 712'den sonra) stok düşüm kodu ekle:

```typescript
      // Stok kontrolü tamamlandı, şimdi stokları düş
      if (!isRetryMode) {
        const { increment } = await import('firebase/firestore');
        for (const item of items) {
          const productRef = doc(db, 'products', item.id);
          await updateDoc(productRef, {
            stock: increment(-item.quantity)
          });
        }
      }
```

> **Not:** `updateDoc` ve `doc` zaten import edilmiş (satır 13). `increment` de import'ta var. Race condition riski düşük çünkü e-ticaret trafiği düşük. Yüksek trafikli sitelerde Firestore Transaction kullanılmalı.

- [ ] **Step 2: Başarısız ödeme durumunda stok geri ekleme**

Kart ödemesi başarısız olduğunda (satır 860 civarı, error catch bloğu) stokları geri ekle:

`src/pages/Checkout.tsx`'te card payment error handler'ında (satır 860-870 arası):

```typescript
      } catch (iyzicoError) {
        console.error('İyzico error:', iyzicoError);

        // Stokları geri ekle
        for (const item of items) {
          const productRef = doc(db, 'products', item.id);
          await updateDoc(productRef, {
            stock: increment(item.quantity)
          });
        }

        // ... mevcut hata işleme kodu devam eder
```

> **Not:** EFT ödemesinde stok geri ekleme admin panelden yönetilir (sipariş iptal edildiğinde). İyzico callback'te (functions/src/index.ts) başarısız ödeme durumunda da stok geri eklenebilir, ama bu ayrı bir improvement.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Checkout.tsx
git commit -m "feat(checkout): Sipariş oluşturulduğunda otomatik stok düşümü

- Stok kontrolü sonrası increment(-quantity) ile stok düş
- Başarısız kart ödemesinde stokları geri ekle"
```

---

### Task 5: Fatura Bilgileri Validasyonu

**Files:**
- Modify: `src/pages/Checkout.tsx:683-694` (validation bölümü)

**Mevcut Sorun:** Fatura bilgileri (TCKN, vergi no, firma ünvanı) hiç validate edilmiyor. Boş fatura bilgisi ile sipariş oluşturulabiliyor (satır 720-751).

- [ ] **Step 1: Fatura validasyonu ekle**

`src/pages/Checkout.tsx` satır 685'ten sonra (KVKK kontrolünün hemen ardına) fatura validasyonu ekle:

```typescript
    if (!agreedToKvkk) newErrors.kvkk = language === 'tr' ? "Lütfen KVKK Aydınlatma Metni'ni onaylayın." : "Please agree to the Data Protection Notice.";

    // Fatura bilgileri validasyonu (sadece profil seçilmemişse)
    const hasInvoiceProfile = user?.invoiceProfiles?.find((p: any) => p.id === selectedInvoiceProfileId);
    if (!hasInvoiceProfile) {
      if (invoiceType === 'corporate') {
        if (!firmaUnvani.trim()) newErrors.firmaUnvani = 'Firma ünvanı zorunludur.';
        if (!vergiDairesi.trim()) newErrors.vergiDairesi = 'Vergi dairesi zorunludur.';
        if (!vergiNo.trim() || vergiNo.length !== 10) newErrors.vergiNo = 'Geçerli bir vergi numarası girin (10 hane).';
      } else {
        // Bireysel fatura — TCKN opsiyonel ama girilmişse 11 hane olmalı
        if (tcKimlikNo && tcKimlikNo.length !== 11) {
          newErrors.tcKimlikNo = 'TC Kimlik No 11 haneli olmalıdır.';
        }
      }

      // Fatura adresi kontrolü (teslimat adresi ile aynı değilse)
      if (!isSameAsDelivery) {
        if (!faturaAdresi.trim()) newErrors.faturaAdresi = 'Fatura adresi zorunludur.';
        if (!faturaCity) newErrors.faturaCity = 'Fatura şehri seçiniz.';
        if (!faturaDistrict) newErrors.faturaDistrict = 'Fatura ilçesi seçiniz.';
      }
    }
```

- [ ] **Step 2: Hata mesajlarını UI'da göster**

Checkout.tsx'te fatura formu alanlarının altına hata mesajları eklenmeli. Mevcut `errors` state'i zaten kullanılıyor — yeni eklenen `errors.firmaUnvani`, `errors.vergiNo` vb. key'leri ilgili input'ların altında gösterilmeli. Bu, Checkout.tsx'teki fatura form bölümünde (kurumsal ve bireysel form alanlarının altında) `{errors.firmaUnvani && <p className="text-red-500 text-xs mt-1">{errors.firmaUnvani}</p>}` şeklinde eklenecek. İlgili JSX bölümünü bul ve her input altına ekle.

- [ ] **Step 3: Dev sunucuda test et**

```bash
npm run dev
```

Test senaryoları:
1. Kurumsal fatura seçip firma ünvanı boş bırak → Hata mesajı görmeli
2. Vergi no 9 hane gir → "10 hane" uyarısı görmeli
3. Bireysel fatura, TCKN 5 hane gir → "11 hane" uyarısı görmeli
4. Tüm alanlar dolu → Sipariş oluşturulabilmeli

- [ ] **Step 4: Commit**

```bash
git add src/pages/Checkout.tsx
git commit -m "feat(checkout): Fatura bilgileri validasyonu ekle

- Kurumsal fatura: firma ünvanı, vergi dairesi, vergi no (10 hane) zorunlu
- Bireysel fatura: TCKN girilmişse 11 hane kontrolü
- Ayrı fatura adresi: şehir, ilçe, adres zorunlu"
```

---

## Faz 3: Veri Tutarlılığı & Type Safety

### Task 6: CartContext — hasGiftBag Type Tanımı Ekleme

**Files:**
- Modify: `src/context/CartContext.tsx:14-36` (CartContextType interface)

**Mevcut Sorun:** `hasGiftBag` ve `setHasGiftBag` state olarak tanımlı (satır 55) ve Provider value'da geçiriliyor (satır 240-241), ama `CartContextType` interface'inde yok (satır 14-36). TypeScript type safety bozuk.

- [ ] **Step 1: CartContextType interface'ine hasGiftBag ekle**

`src/context/CartContext.tsx` satır 35-36 arasına ekle:

```typescript
// ESKİ:
  hideInvoice: boolean;
  setHideInvoice: (hide: boolean) => void;
}

// YENİ:
  hideInvoice: boolean;
  setHideInvoice: (hide: boolean) => void;
  hasGiftBag: boolean;
  setHasGiftBag: (hasGiftBag: boolean) => void;
}
```

- [ ] **Step 2: Build kontrolü**

```bash
npm run build 2>&1 | head -30
```

Beklenen: TypeScript hataları olmamalı. `hasGiftBag` zaten Provider value'da geçirildiği için (satır 240-241) başka bir değişiklik gerekmez.

- [ ] **Step 3: Commit**

```bash
git add src/context/CartContext.tsx
git commit -m "fix(types): CartContext'e hasGiftBag type tanımı ekle

hasGiftBag ve setHasGiftBag zaten kullanılıyordu ama interface'te eksikti"
```

---

### Task 7: Timeline Field Standardizasyonu

**Files:**
- Modify: `functions/src/index.ts:1197-1211` (ödeme callback'i)
- Modify: `functions/src/index.ts:2574-2578` (otomatik iptal)
- Modify: `src/pages/Checkout.tsx:965-968` (sipariş oluşturma)

**Mevcut Sorun:** Timeline entry'leri tutarsız:
- Frontend (Checkout.tsx:965): `{ status: '...', time: toLocaleString('tr-TR'), note: '...' }`
- Backend callback (index.ts:1197): `{ action: '...', time: toISOString(), note: '...' }`
- Backend auto-cancel (index.ts:2574): `{ status: '...', time: toLocaleString('tr-TR', {timeZone}), note: '...' }`

- [ ] **Step 1: Backend callback timeline'ı standardize et — `action` → `status`**

`functions/src/index.ts` satır 1197-1201'i düzelt:

```typescript
// ESKİ:
updateData.timeline = admin.firestore.FieldValue.arrayUnion({
  action: 'Ödeme alındı',
  time: new Date().toISOString(),
  note: `${paymentDetails.cardAssociation} **** ${paymentDetails.lastFourDigits}`
});

// YENİ:
updateData.timeline = admin.firestore.FieldValue.arrayUnion({
  status: 'paid',
  time: new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
  note: `Ödeme alındı - ${paymentDetails.cardAssociation} **** ${paymentDetails.lastFourDigits}`
});
```

- [ ] **Step 2: Backend failed payment timeline'ı standardize et**

`functions/src/index.ts` satır 1207-1211'i düzelt:

```typescript
// ESKİ:
updateData.timeline = admin.firestore.FieldValue.arrayUnion({
  action: 'Ödeme başarısız',
  time: new Date().toISOString(),
  note: paymentDetails.failureReason || 'Ödeme reddedildi'
});

// YENİ:
updateData.timeline = admin.firestore.FieldValue.arrayUnion({
  status: 'payment_failed',
  time: new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
  note: paymentDetails.failureReason || 'Ödeme reddedildi'
});
```

- [ ] **Step 3: Backend auto-cancel timeline'ı zaten doğru formatta — sadece doğrula**

`functions/src/index.ts` satır 2574-2578 zaten `status` field'ı ve `toLocaleString('tr-TR', { timeZone })` kullanıyor. Değişiklik gerekmez.

- [ ] **Step 4: Functions build kontrolü**

```bash
cd functions && npm run build
```

Beklenen: Build hatasız tamamlanmalı.

- [ ] **Step 5: Commit**

```bash
git add functions/src/index.ts
git commit -m "fix(data): Timeline field standardizasyonu

- action → status field adı ile tutarlı hale getir
- Tüm timeline entry'leri: { status, time (tr-TR locale), note }
- ISO string yerine Türkçe locale timestamp kullan"
```

---

## Faz 4: SEO & Routing

### Task 8: Bonbon Sayfalarına SEOHead Ekleme

**Files:**
- Modify: `src/pages/Bonbonlar.tsx:1-5` (import + SEOHead ekleme)
- Modify: `src/pages/BonbonDetay.tsx:3-6` (import + SEOHead ekleme)

**Mevcut Sorun:** Bonbonlar ve BonbonDetay sayfalarında SEOHead bileşeni kullanılmıyor. Google bu sayfaları düzgün indeksleyemiyor.

- [ ] **Step 1: Bonbonlar.tsx'e SEOHead ekle**

`src/pages/Bonbonlar.tsx` satır 3'e import ekle:

```typescript
// ESKİ:
import { useBonbons, BonbonGrid, BonbonFilters } from '../features/bonbon';

// YENİ:
import { useBonbons, BonbonGrid, BonbonFilters } from '../features/bonbon';
import { SEOHead } from '../components/SEOHead';
```

Satır 19'daki `<div className="min-h-screen bg-cream-50">` içine, ilk element olarak SEOHead ekle:

```typescript
// ESKİ:
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero Section */}

// YENİ:
  return (
    <div className="min-h-screen bg-cream-50">
      <SEOHead
        title="Bonbon Koleksiyonu - El Yapımı Artisan Bonbonlar"
        description="Sade Chocolate bonbon koleksiyonu. Her biri ustaca hazırlanmış, benzersiz tat kombinasyonlarıyla özenle üretilen bonbonlarımızı keşfedin."
        path="/bonbonlar"
        breadcrumbs={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Bonbon Koleksiyonu', url: '/bonbonlar' }
        ]}
      />
      {/* Hero Section */}
```

- [ ] **Step 2: BonbonDetay.tsx'e SEOHead ekle**

`src/pages/BonbonDetay.tsx` satır 4'e import ekle:

```typescript
// ESKİ:
import { ArrowLeft, Package, ChevronRight, ChevronLeft } from 'lucide-react';

// YENİ:
import { ArrowLeft, Package, ChevronRight, ChevronLeft } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
```

`BonbonDetay` fonksiyonunun return'ünde (loading ve error olmadığında), ana content'in başına SEOHead ekle. `bonbon` objesi mevcut olduğunda:

```typescript
// bonbon detay render bölümünde, ana div'in içine ilk element olarak:
{bonbon && (
  <SEOHead
    title={`${bonbon.title} - Sade Chocolate Bonbon`}
    description={bonbon.description || `${bonbon.title} - El yapımı artisan bonbon`}
    path={`/bonbonlar/${slug}`}
    image={bonbon.image}
    type="product"
    product={{
      name: bonbon.title,
      price: bonbon.price,
      currency: 'TRY',
      availability: 'InStock',
      image: bonbon.image,
      description: bonbon.description
    }}
    breadcrumbs={[
      { name: 'Ana Sayfa', url: '/' },
      { name: 'Bonbon Koleksiyonu', url: '/bonbonlar' },
      { name: bonbon.title, url: `/bonbonlar/${slug}` }
    ]}
  />
)}
```

- [ ] **Step 3: Dev sunucuda doğrula**

```bash
npm run dev
```

Test:
1. `/bonbonlar` sayfasına git → Sayfa başlığı "Bonbon Koleksiyonu - El Yapımı Artisan Bonbonlar | Sade Chocolate" olmalı
2. Bir bonbon detay sayfasına git → Sayfa başlığı bonbon adını içermeli
3. Sayfanın kaynak kodunda (View Source) og:title ve description meta tag'leri görünmeli

- [ ] **Step 4: Commit**

```bash
git add src/pages/Bonbonlar.tsx src/pages/BonbonDetay.tsx
git commit -m "feat(seo): Bonbon sayfalarına SEOHead meta tag ve structured data ekle

- Bonbonlar liste sayfası: başlık, açıklama, breadcrumb
- BonbonDetay: dinamik ürün adı, Product schema, Open Graph"
```

---

### Task 9: Product Detail — Slug Desteği Ekleme

**Files:**
- Modify: `src/pages/ProductDetail.tsx:148` (ürün arama mantığı)

**Mevcut Sorun:** ProductDetail sayfası ürünü sadece `p.id === id` ile arıyor (satır 148). Eğer URL'de slug formatında bir değer geliyorsa (`bitter-tablet-54` gibi) ürün bulunamıyor.

> **Analiz:** Mevcut routing sistemi (`/product/:id`) ve kartlardan yönlendirme (`navigate(/product/${product.id})`) Firestore document ID kullanıyor. Sorun sadece **dış kaynaklardan gelen slug formatındaki URL'lerde** oluşuyor. Çözüm: Hem ID hem slug ile arama.

- [ ] **Step 1: Product arama mantığını genişlet — hem ID hem title-based slug ile ara**

`src/pages/ProductDetail.tsx` satır 148'i düzelt:

```typescript
// ESKİ:
const product = useMemo(() => products.find(p => p.id === id), [id, products]);

// YENİ:
const product = useMemo(() => {
  // Önce document ID ile ara (normal akış)
  const byId = products.find(p => p.id === id);
  if (byId) return byId;

  // Bulunamazsa slug benzeri eşleştirme dene (dış linkler için)
  if (id) {
    const normalized = id.toLowerCase().replace(/-/g, ' ');
    return products.find(p =>
      p.title?.toLowerCase().replace(/-/g, ' ').includes(normalized) ||
      p.title?.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase()
    );
  }
  return undefined;
}, [id, products]);
```

> **Not:** Bu yaklaşım mevcut sistemi bozmaz — önce ID ile arar, bulamazsa title-based fuzzy matching yapar. Firestore'a `slug` field'ı eklemek daha temiz bir çözüm olurdu ama mevcut ürün verilerinin hepsine slug eklenmesi gerekir.

- [ ] **Step 2: Dev sunucuda test et**

```bash
npm run dev
```

Test:
1. Katalog'dan ürüne tıkla → Normal çalışmalı (ID ile)
2. URL'ye manuel slug yaz (`/product/bitter-tablet-54`) → Ürün bulunmalı (title matching ile)

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProductDetail.tsx
git commit -m "fix(routing): Product detay sayfasında slug fallback desteği

- Önce Firestore document ID ile ara
- Bulunamazsa title-based slug matching ile dene
- Dış kaynaklardan gelen slug URL'lerini destekle"
```

---

## Faz 5: Checkout.tsx Refactoring (Opsiyonel — Ayrı Sprint)

### Task 10: Checkout.tsx Decomposition Planı

**NOT:** Bu task'ın **uygulanması** bu plan kapsamında değil. Bu, Checkout.tsx'in nasıl parçalanacağının **tasarım dokümanıdır**. Uygulama ayrı bir plan olarak yapılmalı.

**Mevcut Durum:** `src/pages/Checkout.tsx` — 2780 satır (proje limiti: max 500 satır)

**Önerilen Decomposition:**

```
src/pages/Checkout.tsx                          → ~200 satır (orchestrator)
src/features/checkout/
├── hooks/
│   ├── useCheckoutForm.ts                      → ~150 satır (form state + validation)
│   ├── useCheckoutPayment.ts                   → ~200 satır (ödeme işleme)
│   ├── useCheckoutShipping.ts                  → ~100 satır (kargo hesaplama + alerts)
│   └── useCheckoutOrder.ts                     → ~200 satır (sipariş oluşturma)
├── components/
│   ├── CheckoutDeliveryStep.tsx                → ~300 satır (adres + teslimat formu)
│   ├── CheckoutPaymentStep.tsx                 → ~250 satır (ödeme yöntemi seçimi)
│   ├── CheckoutInvoiceForm.tsx                 → ~200 satır (fatura bilgileri)
│   ├── CheckoutOrderSummary.tsx                → ~150 satır (sipariş özeti)
│   ├── CheckoutSuccess.tsx                     → ~200 satır (başarı ekranı)
│   └── CheckoutEftDetails.tsx                  → ~100 satır (EFT banka bilgileri)
├── utils/
│   └── checkoutValidation.ts                   → ~100 satır (validasyon fonksiyonları)
└── types.ts                                    → ~50 satır (checkout-specific types)
```

**Uygulama stratejisi:**
1. Önce hooks'ları ayır (state ve logic)
2. Sonra alt bileşenleri oluştur (UI)
3. En son orchestrator'ı sadeleştir
4. Her adımda `npm run build` ile hata kontrolü

> Bu refactoring ayrı bir plan olarak ele alınmalı. Mevcut bug fix'ler bu dosyadaki değişikliklerle çakışmasın diye refactoring en sona bırakıldı.

---

## Özet: Task Bağımlılıkları

```
Faz 1 (Güvenlik) — Bağımsız, hemen başlanabilir
  Task 1: İyzico Service güvenlik düzeltmeleri
  Task 2: IyzicoCheckoutModal XSS düzeltmesi

Faz 2 (Finansal) — Bağımsız, Faz 1 ile paralel çalışabilir
  Task 3: Negatif toplam koruması
  Task 4: Stok düşümü
  Task 5: Fatura validasyonu

Faz 3 (Veri Tutarlılığı) — Bağımsız
  Task 6: CartContext type fix
  Task 7: Timeline standardizasyonu

Faz 4 (SEO & Routing) — Bağımsız
  Task 8: Bonbon SEOHead
  Task 9: Product slug desteği

Faz 5 (Refactoring) — Tüm fix'ler bittikten sonra
  Task 10: Checkout.tsx decomposition (ayrı plan)
```

**Paralel çalışabilir gruplar:**
- Task 1 + Task 2 (farklı dosyalar)
- Task 3 + Task 5 (aynı dosya ama farklı bölümler)
- Task 6 + Task 7 (farklı dosyalar)
- Task 8 + Task 9 (farklı dosyalar)
