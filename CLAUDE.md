# Sade Chocolate - Claude Code Kılavuzu

## Oturum Başlangıcı

**Her oturum başında:**
1. `.claude/project-rules.md` - Proje kuralları ve standartları
2. `.claude/kişiselbağlam.md` - Kullanıcı tercihleri ve çalışma tarzı
3. `.claude/fikirler.md` - Gelecek fikirler ve notlar
4. `.claude/hedefler.md` - Hedefler ve görevler
5. `.claude/FEEDBACK.md` - Bug, improvement, refactor ve todo kayıtları
6. `.claude/GUNLUK.md` - Günlük çalışma kayıtları

dosyalarını oku, kurallara sadık kal, oturum süresince uygula ve kullanıcıya:
- Tamamlanan son özellikler
- Bekleyen hedefler
- Öncelikli görevler

hakkında kısa bir özet sun.

---

## Proje Hakkında

Sade Chocolate e-ticaret platformu.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (özel renk paleti)
- **Backend:** Firebase (Firestore + Hosting + Auth + Functions)
- **Ödeme:** İyzico (3D Secure) + Havale/EFT
- **Email:** SendGrid (Firebase Extensions)
- **Kargo:** MNG Kargo API entegrasyonu
- **CDN/DNS:** Cloudflare

---

## Aktif Sistemler

### Ödeme Sistemleri
| Sistem | Durum | Dosyalar |
|--------|-------|----------|
| İyzico 3D Secure | Aktif | `functions/src/services/iyzicoService.ts`, `IyzicoCheckoutModal.tsx` |
| Havale/EFT | Aktif | `Checkout.tsx` (%2 indirim, geri sayım timer) |

### Email Sistemi
| Template | Tetikleyici |
|----------|-------------|
| Hoş geldin | Kayıt sonrası |
| Sipariş onayı | Checkout tamamlandığında |
| Kargo bildirimi | Admin panel'den |
| Ödeme başarılı/başarısız | İyzico callback |
| Teslimat onayı | Sipariş "Delivered" olduğunda |

**Dosya:** `src/services/emailService.ts`

### Kargo Sistemi
- MNG Kargo API entegrasyonu
- Otomatik gönderi oluşturma
- Takip numarası yönetimi
- **Dosyalar:** `functions/src/services/mngCargoService.ts`, `CreateShipmentModal.tsx`

### Admin Panel Özellikleri
| Tab | Açıklama |
|-----|----------|
| Katalog Ayarları | Grid kolon sayısı, sıralama modu, kutu kartı pozisyonu |
| Kargo Ayarları | Ücretsiz kargo limiti, hediye çantası sistemi |
| Bakım Modu | Site geneli bakım ekranı toggle |
| Kutu Oluşturucu | Dinamik kutu boyutları yönetimi |
| Tipografi | H1-H4 font seçimi, logo koruması |

---

## Özel Dökümanlar

### Proje Takip Dosyaları

| Dosya | Amaç | Kullanım |
|-------|------|----------|
| `.claude/FEEDBACK.md` | Bug, improvement, refactor kayıtları | `/feedback` skill'i ile yönet veya manuel düzenle |
| `.claude/GUNLUK.md` | Günlük çalışma kayıtları | Her oturum sonunda yapılan işleri kaydet |

**FEEDBACK.md Kategorileri:**
- `[BUG-XXX]` - Hatalar
- `[IMP-XXX]` - İyileştirmeler
- `[REFACTOR-XXX]` - Refactoring görevleri
- `[TODO-XXX]` - Yapılacaklar

**GUNLUK.md Formatı:**
```markdown
## YYYY-MM-DD
### Yapılan İşler
- İş açıklaması
```

---

### Araştırma Framework'leri

| Dosya | Tetikleyiciler | Kullanım |
|-------|----------------|----------|
| `docs/deep-research.md` | "deep research", "derinlemesine araştırma", "araştırma yap" | Yeni bir konuyu araştırırken bu framework'teki soruları kullan |
| `docs/research-findings.md` | "araştırma kaydet", "bulguları kaydet", "research findings" | Araştırma tamamlandığında bulguları bu template'e göre kaydet |

---

## Firebase Collections

### Ana Koleksiyonlar
| Koleksiyon | Açıklama |
|------------|----------|
| `products` | Ürünler (sortOrder, isOutOfStock, isVisibleInCatalog) |
| `orders` | Siparişler (hasGiftBag, isGift, giftMessage) |
| `customers` | Müşteriler |
| `taste_profiles` | Tadım profilleri |
| `quiz_config` | Quiz yapılandırması |
| `scenarios` | AI Sommelier senaryoları |
| `loyalty_program` | Sadakat programı |
| `mail` | Email queue (SendGrid Extension) |

### Ayar Koleksiyonları
| Koleksiyon/Doküman | Açıklama |
|--------------------|----------|
| `site_settings/catalog` | Grid ayarları, sıralama modu, kutu kartı pozisyonu |
| `site_settings/maintenance` | Bakım modu durumu |
| `settings/shipping` | Ücretsiz kargo limiti, hediye çantası ayarları |
| `settings/payment` | İyzico credentials, EFT ayarları |

---

## Cloud Functions

| Fonksiyon | Endpoint | Açıklama |
|-----------|----------|----------|
| `createIyzicoPayment` | `/iyzico/create` | Ödeme formu oluşturma |
| `iyzicoCallback` | `/iyzico/callback` | 3D Secure callback |
| `createShipment` | `/cargo/create` | MNG Kargo gönderi oluşturma |
| `trackShipment` | `/cargo/track` | Kargo takip |

---

## Tailwind Renk Paleti

Projede tanımlı renkler (geçersiz renk kullanma):
- `cream-*` (50-900)
- `mocha-*` (50-900)
- `gold-*` (50-900)
- `brown-*` (50-900)
- `dark-*` (50-900)
- `brand-*`

**UYARI:** `chocolate-*` renkleri tanımlı DEĞİL, kullanma!

---

## Best Practices / Standart Kurallar

### React State Yönetimi

1. **Silme işlemlerinde anında UI güncellemesi**
   - Firestore'dan silme başarılı olduktan sonra `setState` ile local state'i de güncelle
   - Birleşik listeler varsa (örn: `allCustomers = customers + newsletterSubscribers`), ilgili TÜM state'leri güncelle
   ```tsx
   // ❌ Yanlış - sadece Firestore'dan siler, UI güncellenmez
   await deleteDoc(doc(db, 'users', id));

   // ✅ Doğru - hem Firestore hem local state
   await deleteDoc(doc(db, 'users', id));
   setCustomers(prev => prev.filter(c => c.id !== id));
   ```

2. **Tehlikeli işlemlerde onay dialogu**
   - Silme, toplu güncelleme gibi geri alınamaz işlemlerde `AlertDialog` kullan
   - Kullanıcıya ne sileceğini açıkça göster (email, isim vb.)

### Firebase / Firestore

3. **Email gönderimlerinde hata yönetimi**
   - Email gönderimi arka planda çalışsın, ana işlemi bloklamasın
   - Hata olursa sadece console'a logla, kullanıcıya gösterme
   ```tsx
   // ✅ Arka planda, hata tolere edilir
   sendEmail(email).catch(err => console.error(err));
   ```

4. **Collection yapısı**
   - Yeni koleksiyon eklerken bu dosyayı güncelle
   - İlişkili veriler için tutarlı email/id referansları kullan

5. **Site ayarları pattern**
   - Global ayarlar: `site_settings/{feature}` dokümanda
   - useEffect ile çek, loading state kullan
   ```tsx
   const [settings, setSettings] = useState<CatalogSettings | null>(null);
   useEffect(() => {
     const docRef = doc(db, 'site_settings', 'catalog');
     getDoc(docRef).then(snap => setSettings(snap.data()));
   }, []);
   ```

### Email Sistemi

6. **SendGrid domain yapılandırması**
   - Cloudflare DNS'te sadece subdomain kısmını gir (örn: `em8082`, değil `em8082.domain.com`)
   - DMARC kaydı TXT tipinde olmalı, CNAME değil
   - Eski/kullanılmayan domain authentication kayıtlarını sil

7. **Email template'leri**
   - `emailService.ts` içinde tanımlı HTML template'ler
   - Typography değişkenleri admin panelden yönetiliyor
   - Gönderen: `Sade Chocolate <bilgi@sadechocolate.com>`

### UI/UX

8. **Boş state gösterimi**
   - Liste boşsa kullanıcıya anlamlı mesaj ve CTA göster
   - Loading durumunda skeleton veya spinner kullan

9. **Toast mesajları**
   - Başarı: `toast.success('İşlem tamamlandı')`
   - Hata: `toast.error('Bir hata oluştu')`
   - Türkçe ve kısa mesajlar kullan

10. **Ürün görünürlük kontrolü**
    - `isVisibleInCatalog: false` ile katalogdan gizle
    - `isOutOfStock: true` ile "Tükendi" badge göster
    - `sortOrder` ile manuel sıralama

### Kod Kalitesi

11. **Dosya boyutu limiti**
    - Max 500 satır (ideal: 300-450)
    - Büyük dosyalar refactor edilmeli

12. **BrandIcon kullanımı**
    - Sparkles ikonu yerine `BrandIcon` komponenti kullan
    - Tutarlı marka kimliği için

---

## Önemli Notlar

- Türkçe UI, Türkçe yorumlar
- Admin paneli: `/admin` route
- AI Sommelier: Senaryo bazlı akıllı asistan
- Tadım Quiz: Firestore'dan dinamik sorular (`quiz_config/default`)

---

## İletişim Tarzı

Her prompta mümkünse kısa da olsa fikrini sun. Proaktif öneriler ve alternatif yaklaşımlar önerilmeli.
