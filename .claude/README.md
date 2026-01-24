# Sade Chocolate - Claude Code Setup

Bu proje **Universal Claude Code Setup** yapısını kullanır.

## Yapı

```
.claude/
├── CLAUDE.md              # Proje genel bakış (her zaman okunur)
├── rules/                 # Pasif kurallar (her zaman aktif)
│   ├── conventions.md     # Kod standartları ve konvansiyonlar
│   ├── styling.md         # Tailwind CSS kuralları
│   ├── firebase.md        # Firestore best practices
│   └── security.md        # Güvenlik kuralları
├── skills/                # Aktif iş akışları (ihtiyaç anında)
│   ├── order-workflow.md  # Sipariş işleme workflow'u
│   ├── email-workflow.md  # Email gönderme workflow'u
│   └── shipping-workflow.md # Kargo entegrasyonu workflow'u
├── agents/                # Özel ajanlar
│   └── code-reviewer.md   # Kod inceleme ajanı
├── context/               # Proje context dosyaları
│   ├── hedefler.md
│   ├── kişiselbağlam.md
│   └── ...
├── settings.local.json    # Hooks ve permissions
└── README.md              # Bu dosya
```

## Katmanlar

### 1. Pasif Katman (rules/)

**Her zaman aktif**, Claude her oturumda otomatik okur:

- `conventions.md` - Dosya organizasyonu, naming, TypeScript kuralları
- `styling.md` - Tailwind renk paleti, z-index, border radius
- `firebase.md` - Firestore CRUD, timestamp, error handling
- `security.md` - API keys, input validation, XSS önleme

**Ne zaman kullanılır:** Her kod yazma işleminde

### 2. Aktif Katman (skills/)

**İhtiyaç anında** yüklenir, detaylı iş akışları:

- `order-workflow.md` - Sipariş oluşturma, durum güncelleme, iptal
- `email-workflow.md` - SendGrid ile email gönderme
- `shipping-workflow.md` - Geliver/MNG kargo entegrasyonu

**Ne zaman kullanılır:** İlgili özellik üzerinde çalışırken

### 3. Agent Katmanı (agents/)

**Özel görevler** için delegasyon:

- `code-reviewer.md` - Kod kalitesi, güvenlik, konvansiyon kontrolü

**Nasıl çağrılır:** `@code-reviewer dosyayı incele`

### 4. Enforcement Katmanı (hooks/)

`settings.local.json` içinde tanımlı:

- `UserPromptSubmit` - Her prompt gönderiminde bilgi göster
- `PreToolUse` - Kritik işlemler öncesi beep sesi

## Kullanım

### Yeni Özellik Geliştirirken

1. **Rules otomatik aktif** - Kod standartlarına uyulur
2. **Skill'i referans al** - İlgili workflow'u kullan
3. **Agent'i çağır** - Kod inceleme için

```bash
# Örnek: Sipariş işleme
"Yeni sipariş oluşturma özelliği ekle"
→ Claude otomatik: rules/conventions.md, rules/firebase.md
→ Claude kullanır: skills/order-workflow.md
→ Bitince: @code-reviewer ile incele
```

### Kod İncelemesi

```bash
@code-reviewer src/components/admin/OrderCard.tsx dosyasını incele
```

Agent kontrol eder:
- ✅ Konvansiyonlara uyum
- ✅ Güvenlik (XSS, injection)
- ✅ Firebase best practices
- ✅ Tailwind kullanımı
- ✅ TypeScript tip güvenliği

## Enforcement Pyramid

```
        ▲
    Hooks (Zorlama)
        │
    Agents (Delegasyon)
        │
    Skills (İş akışları)
        │
    Rules (Kurallar)
        │
    CLAUDE.md (Genel bakış)
        ▼
```

**Kritik kurallar için Hooks kullan**, öneriler için Rules yeterli.

## Maintenance

### Yeni Kural Ekleme

```bash
# Eğer aynı hata 3+ kez tekrarlanıyorsa
→ .claude/rules/ altına ekle

# Eğer kural sürekli göz ardı ediliyorsa
→ settings.local.json'a hook ekle
```

### Yeni Workflow Ekleme

```bash
# Karmaşık ve tekrarlayan bir iş akışı varsa
→ .claude/skills/ altına ekle

# Örnekler:
- Payment workflow
- Refund workflow
- Inventory management
```

### Yeni Agent Ekleme

```bash
# Özel bir görev için delegasyon gerekiyorsa
→ .claude/agents/ altına ekle

# Örnekler:
- Security auditor
- Performance optimizer
- Test expert
```

## Best Practices

1. **CLAUDE.md kısa tutun** - Sadece genel bakış
2. **Detayları rules/ ve skills/'e koy** - Organize kalır
3. **Hooks'u az kullan** - Sadece kritik işlemler
4. **Agent'lara delege et** - Karmaşık inceleme görevleri
5. **Ayda bir review** - Güncel kalmasını sağla

## Fark

### Eski Yapı (öncesi)
- ❌ Tüm kurallar CLAUDE.md'de (uzun, karışık)
- ❌ Detaylar kaybolur, context dolunca
- ❌ Enforcement yok, kurallar öneri gibi
- ❌ İş akışları net değil

### Yeni Yapı (sonrası)
- ✅ Organize dosya yapısı (rules, skills, agents)
- ✅ Context verimli kullanılır
- ✅ Hooks ile enforcement
- ✅ Detaylı iş akışları (skills)
- ✅ Kod inceleme otomasyonu (agents)

## Kaynaklar

- Universal Guide: `c:\dev\claude-notes\Claude Code Setup Universal Guide.md`
- Claude Code Docs: https://code.claude.com/docs
- Anthropic Best Practices: https://docs.anthropic.com/

---

**Version:** 1.0
**Oluşturulma:** 2026-01-19
**Proje:** Sade Chocolate
