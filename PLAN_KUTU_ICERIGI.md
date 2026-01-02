# Kutu İçeriği Yönetim Sistemi - Implementation Plan

## 🎯 HEDEF
Marcolini tarzı kutu içeriği yönetimi: Bonbonlar bağımsız ürünler, kutular bu ürünleri içerik olarak seçiyor.

---

## 📊 MEVCUT DURUM

**types.ts (satır 15-24):**
```typescript
export interface BoxItem {
  id: string;
  name: string;
  description: string;
  image: string;
  percentage?: number;
  origin?: string;
  tastingNotes?: string[];
}
```

**Product interface (satır 78):**
```typescript
boxItems?: BoxItem[];  // Her ürün kendi kutu içeriğini tutuyor
```

**SORUN:** BoxItem bir interface ama gerçek ürün değil. Stok takibi yok, ayrı yönetilemiyor.

---

## ✅ YENİ SİSTEM

### 1. Type Güncellemeleri (src/types.ts)

```typescript
// BoxItem artık kullanılmayacak, silinecek

export interface Product {
  // ... mevcut alanlar

  // YENİ ALANLAR:
  isBoxContent: boolean;           // Bu ürün kutu içeriği olarak seçilebilir mi?
  boxContentIds?: string[];        // Sadece type="box" olanlar için, ürün ID'leri
  boxSize?: number;                // Kaç adet bonbon alır? (6, 9, 12, vb.)
}
```

### 2. Firestore Schema

```
products/
  prod_001:
    title: "Sütlü Karamel Bonbon"
    isBoxContent: true          // ✅ Kutu içeriği olarak seçilebilir
    productType: "filled"
    price: 35
    ...

  prod_002:
    title: "9'lu Karma Kutu"
    isBoxContent: false         // Kutu kendisi içerik olamaz
    productType: "box"
    boxSize: 9
    boxContentIds: ["prod_001", "prod_003", "prod_005", ...]  // 9 bonbon ID
    price: 280
    ...
```

### 3. Admin Panel - Envanter Tab Düzeni

**Yeni Tab Yapısı:**
```tsx
<Tabs>
  <Tab value="all">Tüm Ürünler</Tab>
  <Tab value="bonbons">Bonbonlar (Kutu İçeriği)</Tab>  // isBoxContent=true
  <Tab value="boxes">Kutular</Tab>                      // productType="box"
  <Tab value="tablets">Tabletler</Tab>                  // productType="tablet"
  <Tab value="other">Diğer</Tab>
</Tabs>
```

### 4. ProductForm Güncellemeleri

**A) Yeni Toggle (tüm ürünler için):**
```tsx
<div className="flex items-center gap-3">
  <input
    type="checkbox"
    checked={formData.isBoxContent}
    onChange={(e) => setFormData({...formData, isBoxContent: e.target.checked})}
  />
  <label>Bu ürün kutu içeriği olarak seçilebilsin mi?</label>
</div>
```

**B) Kutu Oluştururken (productType === "box"):**
```tsx
{formData.productType === 'box' && (
  <FormAccordion title="KUTU İÇERİĞİ SEÇ" icon={Package}>
    {/* Kutu boyutu */}
    <select value={formData.boxSize} onChange={(e) => setFormData({...formData, boxSize: +e.target.value})}>
      <option value={6}>6'lı Kutu</option>
      <option value={9}>9'lu Kutu</option>
      <option value={12}>12'li Kutu</option>
      <option value={16}>16'lı Kutu</option>
    </select>

    {/* Bonbon seçici - Grid görünüm */}
    <div className="grid grid-cols-4 gap-3 mt-4">
      {bonbonProducts.map(bonbon => (
        <button
          type="button"
          className={`border rounded-xl p-3 ${selectedBonbons.includes(bonbon.id) ? 'ring-2 ring-gold' : ''}`}
          onClick={() => toggleBonbon(bonbon.id)}
        >
          <img src={bonbon.image} className="w-full aspect-square rounded-lg" />
          <p className="text-xs mt-2">{bonbon.title}</p>
          {selectedBonbons.includes(bonbon.id) && (
            <div className="text-gold text-xs mt-1">
              ✓ Seçildi ({selectedBonbons.filter(id => id === bonbon.id).length})
            </div>
          )}
        </button>
      ))}
    </div>

    <p className="text-xs text-gray-400 mt-3">
      {selectedBonbons.length} / {formData.boxSize} bonbon seçildi
    </p>
  </FormAccordion>
)}
```

### 5. Bonbon Seçim Mantığı

```typescript
const [selectedBonbons, setSelectedBonbons] = useState<string[]>(
  product?.boxContentIds || []
);

const toggleBonbon = (bonbonId: string) => {
  // Aynı bonbon'dan birden fazla seçilebilir (örn: 3 adet Karamel bonbon)
  if (selectedBonbons.length >= formData.boxSize && !selectedBonbons.includes(bonbonId)) {
    toast.error(`En fazla ${formData.boxSize} bonbon seçebilirsiniz!`);
    return;
  }

  // Ekle veya çıkar
  if (selectedBonbons.includes(bonbonId)) {
    setSelectedBonbons(prev => {
      const index = prev.indexOf(bonbonId);
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  } else {
    setSelectedBonbons(prev => [...prev, bonbonId]);
  }
};
```

### 6. Ürün Detay Sayfası (ProductDetail.tsx)

**Kutu görünümü için:**
```tsx
{product.productType === 'box' && product.boxContentIds && (
  <section>
    <h3>Kutu İçeriği</h3>
    <div className="grid grid-cols-3 gap-4">
      {getBoxContentProducts(product.boxContentIds).map((bonbon, idx) => (
        <div key={idx} className="border rounded-xl p-4">
          <img src={bonbon.image} />
          <p>{bonbon.title}</p>
          {bonbon.tastingNotes && <p className="text-xs">{bonbon.tastingNotes}</p>}
        </div>
      ))}
    </div>
  </section>
)}
```

---

## 🔄 MİGRASYON

### Mevcut BoxItem'lı ürünler için:

```typescript
// Migration script (tek seferlik)
async function migrateBoxItemsToProducts() {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);

  for (const doc of snapshot.docs) {
    const product = doc.data() as Product;

    if (product.boxItems && product.boxItems.length > 0) {
      // Her BoxItem için yeni bonbon ürünü oluştur
      const bonbonIds: string[] = [];

      for (const item of product.boxItems) {
        const newBonbonId = await createBonbonFromBoxItem(item);
        bonbonIds.push(newBonbonId);
      }

      // Kutu ürünü güncelle
      await updateDoc(doc.ref, {
        boxContentIds: bonbonIds,
        boxSize: product.boxItems.length,
        productType: 'box',
        boxItems: deleteField()  // Eski field'ı sil
      });
    }
  }
}
```

---

## 📋 IMPLEMENTATION ADIMLARI

1. ✅ **types.ts güncelle** (5 dk)
   - `isBoxContent: boolean` ekle
   - `boxContentIds?: string[]` ekle
   - `boxSize?: number` ekle
   - `BoxItem` interface'ini deprecate et

2. ✅ **ProductForm.tsx - Toggle ekle** (10 dk)
   - "Kutu içeriği olarak seçilebilsin mi?" checkbox

3. ✅ **ProductForm.tsx - Kutu içeriği seçici** (30 dk)
   - Bonbon grid görünümü
   - Multi-select mantığı
   - Adet limiti kontrolü

4. ✅ **Admin.tsx - Tab filtresi ekle** (15 dk)
   - Bonbonlar tab'ı (isBoxContent filter)
   - Kutular tab'ı (productType="box" filter)

5. ✅ **ProductDetail.tsx - Kutu görünümü** (20 dk)
   - boxContentIds'den ürünleri fetch et
   - Grid layout

6. ✅ **Migration script** (opsiyonel - mevcut veri varsa)

---

## ❓ AÇIK SORULAR

**1. Stok Yönetimi:**
   - Kutu satıldığında bonbon stoklarından otomatik düşsün mü?
   - Yoksa kutular ayrı stok mu tutsun?

**Önerim:** Kutular ayrı stok tutsun. Çünkü:
- Bonbonlar tek satılabilir
- Kutular önceden hazırlanmış olabilir
- Stok karmaşası önlenir

**2. Fiyatlandırma:**
   - Kutu fiyatı manuel mi girilecek?
   - Yoksa bonbon fiyatları toplamı + markup mı olacak?

**Önerim:** Manuel. Kutular genelde indirimli veya özel fiyatlandırma yapılır.

**3. Aynı bonbon'dan birden fazla:**
   - Kutuda 3 adet Karamel bonbon olabilir mi?

**Önerim:** Evet. Array'de aynı ID birden fazla kez olabilir.

---

## ⏱️ ESTIMATED TIMELINE

- **Toplam süre:** ~2 saat
- **Testing:** +30 dk
- **Migration (opsiyonel):** +1 saat

---

**Onaylar mısın? Başlayalım mı?**
