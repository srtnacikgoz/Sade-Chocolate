# Sade Patisserie Geliştirme Standartları (v1.3)

**Scope:** Sade Chocolate E-commerce Platform (React + TypeScript + Firebase)

**Last Updated:** 2026-01-03

Bu doküman, Sade Patisserie dijital ekosistemindeki tüm projelerin teknik, görsel ve operasyonel anayasasıdır. Koddan önce bu doküman ve bağlı olduğu bulut yapıları referans alınır.

---

## 🏗 1. Temel Felsefe (Pragmatik SDUI)

### Configuration-First Approach
- **Kademeli SDUI:** İlk aşamada sadece ana sayfa ve kampanya alanları gibi sık değişen yerler SDUI ile yönetilir. Karmaşık iş mantığı içeren ekranlar geleneksel yapıda kalır.

- **Configuration-First:** Bir özellik kodlanmadan önce şeması planlanır. Ancak karmaşıklık, ekip ölçeğiyle doğru orantılı tutulur.

- **BFF (Backend-for-Frontend):** İstemciye ham veri yerine, render edilmeye hazır "View Model" gönderilir.

### Pragmatic Implementation
```typescript
// ✅ GOOD: Configurable where it makes sense
interface CampaignConfig {
  type: 'hero' | 'banner' | 'carousel';
  title: string;
  cta: { text: string; link: string };
}

// ❌ BAD: Over-engineering simple cases
interface ButtonConfig {
  shape: 'rectangle' | 'circle';
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  animation: 'none' | 'bounce' | 'pulse'; // Overkill for most buttons
}
```

**Principle:** Start simple, scale complexity as needed.

---

## 🤖 2. AI Team Collaboration & Governance

### Team Structure
- **Claude Code (Primary Developer):** Application development, feature implementation
- **Gemini (Research & Strategy):** Research, code review, strategic planning
- **n8n (Automation):** Workflow automation (planned, not yet active)

### Context Management Rules
- **Max 5 files per prompt:** Keep AI context focused and manageable
- **Chunk large tasks:** Break down complex features into smaller, sequential steps
- **Session continuity:** Always read `.ai/` files at session start

### Memory Management Protocol
```markdown
Every AI session MUST start with:
1. Read .ai/instructions.md (development rules)
2. Read .ai/active-work.md (current state)
3. Read .ai/project-map.md (file structure)
4. Optional: Read .ai/known-issues.md (if troubleshooting)
```

**Update Frequency:**
- `active-work.md` - After every coding session
- `known-issues.md` - Immediately when bug discovered/fixed
- `instructions.md` - When standards change
- `project-map.md` - When structure changes

---

## ⚠️ 3. Kritik İş Akışı ve Test Standartları

### Development Process Flow

**1. Fikir & Plan**
- AI Mentor ile mimari netleştirilir
- FSD (Feature-Sliced Design) katmanlaması belirlenir
- API contract tanımlanır
- Component tree çizilir

**2. Test-Driven Development (TDD)**
```typescript
// ✅ Write test first
describe('calculateTotal', () => {
  it('should sum cart item prices', () => {
    const cart = [{ price: 100 }, { price: 50 }];
    expect(calculateTotal(cart)).toBe(150);
  });
});

// Then implement
const calculateTotal = (cart: CartItem[]) => {
  return cart.reduce((sum, item) => sum + item.price, 0);
};
```

**Test Priorities:**
- **Kritik iş mantığı:** Vitest unit tests (pricing, cart, checkout)
- **UI bileşenleri:** Storybook ile izole geliştirme
- **Görsel regresyon:** 1px hassasiyetiyle snapshot testleri (planned)
- **E2E:** Playwright/Cypress (critical user flows only)

**3. Görsel Regresyon (Planned)**
- 1px hassasiyetiyle görsel snapshot testleri
- CI/CD pipeline ile otomatik görsel karşılaştırma
- Critical pages: Home, Product Detail, Checkout

**4. Onay & Uygula**
- AI code review (Gemini)
- Manual testing in browser
- TypeScript compilation check
- Merge to main

### Test Pyramid
```
        /\
       /E2E\        (Few - Critical flows only)
      /------\
     /  Int.  \     (Some - API + Component integration)
    /----------\
   /   Unit     \   (Many - Business logic, utils)
  /--------------\
```

---

## 🛠 4. Teknik Mimari (FSD & Migration)

### Feature-Sliced Design (FSD)

**Katmanlar:**
```
src/
├── shared/          ← Generic UI, utils (Button, Input)
├── entities/        ← Business entities (Product, User)
├── features/        ← User actions (AddToCart, Login)
├── widgets/         ← Page sections (Header, ProductGrid)
└── pages/           ← Full pages (HomePage, CheckoutPage)
```

**Dependency Rules:**
- `shared` ← depended by all, depends on none
- `entities` ← can use `shared`
- `features` ← can use `shared`, `entities`
- `widgets` ← can use `shared`, `entities`, `features`
- `pages` ← can use all layers

**Migration Path (Kademeli Geçiş):**
```typescript
// Old code (to be migrated)
// @deprecated Use src/features/cart/AddToCartButton.tsx
export const OldAddToCart = () => { /* ... */ };

// New FSD structure
// src/features/cart/AddToCartButton.tsx
export const AddToCartButton = () => { /* ... */ };
```

**Tombstoning Method:**
1. Keep old code functional
2. Mark as `@deprecated` with pointer to new code
3. Migrate gradually
4. Remove old code when all references migrated

### Dosya Limiti
- **Max 200-500 satır per file**
- **Aşan kodlar:**
  - Extract custom hooks
  - Split into smaller components
  - Separate business logic to utils

```typescript
// ❌ BAD: 800-line component
const ProductPage = () => {
  // 800 lines of mixed logic + UI
};

// ✅ GOOD: Split into smaller pieces
const ProductPage = () => {
  const product = useProduct(); // 50 lines (hook)
  const cart = useCart();       // 50 lines (hook)

  return (
    <>
      <ProductInfo product={product} />     {/* 100 lines */}
      <ProductReviews productId={product.id} /> {/* 100 lines */}
      <AddToCartSection product={product} cart={cart} /> {/* 100 lines */}
    </>
  );
};
```

### Z-Index Scale
```typescript
const Z_INDEX = {
  BASE: 0,
  STICKY: 100,      // Sticky header
  OVERLAY: 500,     // Background overlay
  MODAL: 1000,      // Modals, dialogs
  POPOVER: 1500,    // Dropdowns, tooltips
  TOAST: 2000,      // Notifications
} as const;
```

**Usage:**
```tsx
<div className="z-[1000]"> {/* Modal */}
<div className="z-[1500]"> {/* Dropdown */}
```

---

## 🎨 5. UI/UX ve DesignOps (Nordic Noir)

### Design Tokens (Future: Figma → JSON)
```json
{
  "colors": {
    "brand": {
      "blue": "#a4d1e8",
      "yellow": "#e7c57d",
      "mustard": "#d4a945",
      "green": "#a4d4bc",
      "peach": "#f3d1c8",
      "orange": "#e59a77"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px"
  }
}
```

**Current State:** Manual Tailwind configuration
**Future State:** Auto-generated from Figma

### Accessibility (A11y)
- **Standard:** WCAG 2.1 Level AA
- **Testing:** CI/CD automated checks (planned)
- **Key Requirements:**
  - Semantic HTML
  - Keyboard navigation
  - Screen reader support
  - Color contrast ratio ≥ 4.5:1

```tsx
// ✅ GOOD: Accessible button
<button
  className="bg-blue-500 text-white"
  aria-label="Add to cart"
  onClick={handleAddToCart}
>
  Add to Cart
</button>

// ❌ BAD: Inaccessible div button
<div
  className="bg-blue-500 text-white cursor-pointer"
  onClick={handleAddToCart}
>
  Add to Cart
</div>
```

### Modern Design Language
```tsx
// Border Radius
const RADIUS = {
  BUTTON: 'rounded-[32px]',     // Main elements
  CARD: 'rounded-2xl',          // Cards, containers
  INPUT: 'rounded-xl',          // Form inputs
  IMAGE: 'rounded-lg',          // Product images
} as const;

// Shadows (Soft Nordic aesthetic)
const SHADOW = {
  SM: 'shadow-sm',              // Subtle elevation
  MD: 'shadow-md',              // Card elevation
  LG: 'shadow-lg',              // Modal, popover
  GLOW: 'shadow-[0_0_15px_rgba(164,209,232,0.3)]', // Brand glow
} as const;
```

### Typography
```typescript
// Font Families (check actual fonts in project)
const FONTS = {
  HEADING: 'font-heading',      // Santana or similar
  BODY: 'font-sans',            // System sans-serif
  MONO: 'font-mono',            // Code, numbers
} as const;

// Font Sizes
const TEXT = {
  XS: 'text-xs',                // 12px - Captions
  SM: 'text-sm',                // 14px - Body small
  BASE: 'text-base',            // 16px - Body
  LG: 'text-lg',                // 18px - Subheading
  XL: 'text-xl',                // 20px - Heading 3
  '2XL': 'text-2xl',            // 24px - Heading 2
  '3XL': 'text-3xl',            // 30px - Heading 1
  '4XL': 'text-4xl',            // 36px - Hero
} as const;
```

---

## 🔒 6. Güvenlik ve İzlenebilirlik

### Security Best Practices

**Edge & A/B Testing (Future):**
- A/B testleri Edge seviyesinde çözülür (Vercel Edge Functions)
- Zero client-side overhead

**XSS Prevention:**
```typescript
// ✅ GOOD: Sanitize SDUI data
import DOMPurify from 'dompurify';

const SafeSDUIComponent = ({ config }) => {
  const cleanHTML = DOMPurify.sanitize(config.html);
  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
};

// ❌ BAD: Direct HTML injection
const UnsafeComponent = ({ config }) => {
  return <div dangerouslySetInnerHTML={{ __html: config.html }} />; // XSS risk!
};
```

**Firebase Security:**
```typescript
// ✅ GOOD: Validate server-side
// Firestore Rules
match /products/{productId} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == 'admin-uid';
}

// ❌ BAD: Trust client
const updateProduct = (productId, data) => {
  // No auth check - anyone can update!
  updateDoc(doc(db, 'products', productId), data);
};
```

**Environment Variables:**
```bash
# .env.local (NEVER commit to git!)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com

# .env.example (Template, safe to commit)
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-domain-here
```

### Observability & Monitoring

**Error Tracking (Sentry):**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(), // Session Replay
  ],
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0.1, // 10% of sessions
});
```

**Custom Error Boundaries:**
```tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

**Performance Monitoring:**
```typescript
// Track critical operations
const trackCheckout = () => {
  const transaction = Sentry.startTransaction({ name: 'checkout' });

  // ... checkout logic

  transaction.finish();
};
```

---

## 🏢 7. Kurumsal Kimlik

### Company Information
- **Ünvan:** Sade Unlu Mamülleri San ve Tic Ltd Şti
- **Adres:** Yeşilbahçe mah. Çınarlı cd 47/A Muratpaşa Antalya
- **Vergi Dairesi:** Antalya Kurumlar
- **Vergi No:** 7361500827

### Brand Color Palette

| **Brand Blue** | **Brand Yellow** | **Brand Mustard** | **Brand Green** | **Brand Peach** | **Brand Orange** |
|----------------|------------------|-------------------|-----------------|-----------------|------------------|
| #a4d1e8        | #e7c57d          | #d4a945           | #a4d4bc         | #f3d1c8         | #e59a77          |

**Usage Guidelines:**
```typescript
const BRAND_COLORS = {
  blue: '#a4d1e8',      // Primary CTA, links, brand accents
  yellow: '#e7c57d',    // Highlights, special offers
  mustard: '#d4a945',   // Premium products, gold tier
  green: '#a4d4bc',     // Success states, eco-friendly
  peach: '#f3d1c8',     // Backgrounds, soft accents
  orange: '#e59a77',    // Warnings, limited time offers
} as const;
```

**Tailwind Config:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#a4d1e8',
          yellow: '#e7c57d',
          mustard: '#d4a945',
          green: '#a4d4bc',
          peach: '#f3d1c8',
          orange: '#e59a77',
        },
      },
    },
  },
};
```

### Logo & Assets
- **Logo Location:** `public/logo.svg` (or similar)
- **Favicon:** `public/favicon.ico`
- **Social Preview:** `public/og-image.jpg` (1200x630px)

---

## 📜 8. Güncelleme Günlüğü (Changelog)

### Version History

**[v1.0-1.2] - Initial Standards**
- Temel felsefe tanımlandı
- SDUI yaklaşımı belirlendi
- FSD ve AI protokolleri eklendi

**[v1.3] - 2026-01-03: "Pragmatik Uygulama"**
- Kademeli SDUI stratejisi
- Test Piramidi detaylandırıldı
- Migration stratejisi (Tombstoning) eklendi
- Over-engineering risklerine karşı esneklik sağlandı
- React projesi için `.ai/` klasörüne uyarlandı

### Pending Updates
- [ ] Vitest + Storybook kurulumu
- [ ] Sentry entegrasyonu
- [ ] Figma → JSON token pipeline
- [ ] A11y automated testing
- [ ] E2E test suite (Playwright)

---

## 🔗 Related Documents

### Project Documentation
- **AI Instructions:** `.ai/instructions.md` (Development rules for AI agents)
- **Project Map:** `.ai/project-map.md` (File structure guide)
- **Active Work:** `.ai/active-work.md` (Current tasks)
- **Known Issues:** `.ai/known-issues.md` (Bug tracking)

### External References
- **Main Documentation Hub:** `C:\dev\Sade Chocolate\📋 Dokümantasyon Merkezi\`
- **AI Collaboration Playbook:** `C:\dev\Sade Chocolate\🛠️ Teknik Altyapı\Kurallar ve Protokoller\AI Team Collaboration Playbook.md`
- **Research Notes:** `docs/research/` (in this project)

---

## ✅ Compliance Checklist

Before marking any task as "done", verify:

### Code Quality
- [ ] TypeScript compiles (no errors)
- [ ] ESLint passes (no warnings)
- [ ] No `any` types
- [ ] File size < 500 lines
- [ ] Functions < 50 lines
- [ ] Proper error handling

### Architecture
- [ ] Follows FSD structure
- [ ] Proper layer dependencies
- [ ] No circular dependencies
- [ ] Reusable components in `shared/`

### UI/UX
- [ ] Uses brand colors
- [ ] Proper border radius (rounded-2xl, etc.)
- [ ] Responsive design (mobile-first)
- [ ] Accessible (semantic HTML, ARIA)

### Security
- [ ] No secrets in code
- [ ] Input sanitization (XSS prevention)
- [ ] Firebase auth checks
- [ ] Environment variables used correctly

### Testing
- [ ] Unit tests for business logic
- [ ] Component tests for UI (if critical)
- [ ] Manual browser testing
- [ ] No console errors

### Documentation
- [ ] `.ai/active-work.md` updated
- [ ] `.ai/known-issues.md` updated (if bugs found/fixed)
- [ ] Comments added (where non-obvious)
- [ ] README updated (if public API changed)

---

**Document Owner:** Sade Patisserie Tech Team
**Last Reviewed:** 2026-01-03
**Next Review:** Quarterly or when major architectural changes occur

---

## 📌 Quick Reference

**When in doubt:**
1. Read this document
2. Check `.ai/instructions.md` for AI-specific rules
3. Ask in team chat
4. Document decision in `.ai/active-work.md`

**Most Important Rules:**
1. Configuration-first, but pragmatic
2. Test critical business logic
3. Follow FSD structure
4. Use brand colors
5. Update `.ai/` files after every session
