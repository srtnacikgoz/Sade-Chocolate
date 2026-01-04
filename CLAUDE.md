# Sade Chocolate - Claude Code Kılavuzu

## Oturum Başlangıcı

**Her oturum başında `.claude/hedefler.md` dosyasını oku ve kullanıcıya:**
1. Tamamlanan son özellikler
2. Bekleyen hedefler
3. Öncelikli görevler

hakkında kısa bir özet sun.

---

## Proje Hakkında
Sade Chocolate e-ticaret platformu. React + TypeScript + Firebase + Tailwind CSS.

---

## Özel Dökümanlar

### Araştırma Framework'leri

| Dosya | Tetikleyiciler | Kullanım |
|-------|----------------|----------|
| `docs/deep-research.md` | "deep research", "derinlemesine araştırma", "araştırma yap" | Yeni bir konuyu araştırırken bu framework'teki soruları kullan |
| `docs/research-findings.md` | "araştırma kaydet", "bulguları kaydet", "research findings" | Araştırma tamamlandığında bulguları bu template'e göre kaydet |

**Workflow:**
1. Kullanıcı "X konusunda deep research yap" dediğinde → `deep-research.md` framework'ünü kullan
2. Araştırma bitince "bulguları kaydet" dediğinde → `research-findings.md` template'ini doldur

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

## Firebase Collections

- `products` - Ürünler
- `orders` - Siparişler
- `customers` - Müşteriler
- `taste_profiles` - Tadım profilleri
- `quiz_config` - Quiz yapılandırması
- `scenarios` - AI Sommelier senaryoları
- `loyalty_program` - Sadakat programı

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

### Email Sistemi

5. **SendGrid domain yapılandırması**
   - Cloudflare DNS'te sadece subdomain kısmını gir (örn: `em8082`, değil `em8082.domain.com`)
   - DMARC kaydı TXT tipinde olmalı, CNAME değil
   - Eski/kullanılmayan domain authentication kayıtlarını sil

### UI/UX

6. **Boş state gösterimi**
   - Liste boşsa kullanıcıya anlamlı mesaj ve CTA göster
   - Loading durumunda skeleton veya spinner kullan

7. **Toast mesajları**
   - Başarı: `toast.success('İşlem tamamlandı')`
   - Hata: `toast.error('Bir hata oluştu')`
   - Türkçe ve kısa mesajlar kullan

---

## Önemli Notlar

- Türkçe UI, Türkçe yorumlar
- Admin paneli: `/admin` route
- AI Sommelier: Senaryo bazlı akıllı asistan
- Tadım Quiz: Firestore'dan dinamik sorular (`quiz_config/default`)
