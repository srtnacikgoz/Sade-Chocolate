# AI Instructions - Sade Chocolate Project

**Project Type:** React + TypeScript + Firebase E-commerce Platform
**Last Updated:** 2026-01-03

---

## 📋 Session Start Checklist

Every AI session MUST start with:

1. **Read these files:**
   - `.ai/instructions.md` (this file) ← Kurallar
   - `.ai/project-map.md` ← Dosya yapısı
   - `.ai/active-work.md` ← Şu an ne yapılıyor

2. **Optional (task'e göre):**
   - `.ai/known-issues.md` ← Bug'lar ve workaround'lar
   - `conductor/tracks/[active-track]/` ← Aktif geliştirme track'i

3. **Never start coding without understanding current state**

---

## 🎯 Development Standards

### TypeScript Rules
```typescript
// ✅ GOOD
const products: Product[] = await getProducts();
const total = calculateTotal(cart);

// ❌ BAD
const products: any = await getProducts(); // NO 'any'!
const total = cart.reduce((a,b) => a + b.price, 0); // Extract to function
```

**Rules:**
- ✅ Strict mode enabled (`tsconfig.json`)
- ✅ No `any` types (use `unknown` if must, then narrow)
- ✅ Explicit return types on functions
- ✅ Interface over type (for objects)
- ❌ No implicit `any`
- ❌ No unused variables

### React/Component Rules

**Preferred Patterns:**
```tsx
// ✅ Functional components only
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return <div>{product.name}</div>;
};

// ✅ Named exports (not default)
export { ProductCard };

// ✅ Props interface
interface ProductCardProps {
  product: Product;
  onAddToCart: (id: string) => void;
}
```

**Forbidden:**
```tsx
// ❌ Class components (use functional)
class ProductCard extends React.Component { }

// ❌ Default exports (use named)
export default ProductCard;

// ❌ Inline styles (use Tailwind)
<div style={{ color: 'red' }}>
```

### File Organization

**Structure:**
```
src/
├── components/          ← Reusable UI components
│   ├── ui/             ← Generic UI (Button, Input, Card)
│   ├── account/        ← Account-related components
│   └── admin/          ← Admin panel components
├── pages/              ← Page components (routing)
├── context/            ← React Context (state management)
├── utils/              ← Helper functions
├── types/              ← TypeScript types/interfaces
└── lib/                ← External integrations (Firebase, etc.)
```

**Naming Conventions:**
- Components: `PascalCase.tsx` (e.g., `ProductCard.tsx`)
- Utils: `camelCase.ts` (e.g., `formatPrice.ts`)
- Types: `PascalCase.ts` (e.g., `Product.ts`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)

### Firebase Rules

**Authentication:**
```typescript
// ✅ Always check auth state
const user = auth.currentUser;
if (!user) throw new Error('Unauthorized');

// ✅ Use Firebase hooks
import { useAuthState } from 'react-firebase-hooks/auth';
const [user, loading, error] = useAuthState(auth);
```

**Firestore:**
```typescript
// ✅ Typed collections
const productsRef = collection(db, 'products') as CollectionReference<Product>;

// ✅ Error handling
try {
  const doc = await getDoc(productRef);
  if (!doc.exists()) throw new Error('Product not found');
} catch (error) {
  console.error('Failed to fetch product:', error);
  // Handle gracefully
}

// ❌ Don't ignore errors
const doc = await getDoc(productRef); // What if it fails?
```

### CSS/Styling

**Preferred:** Tailwind CSS
```tsx
// ✅ GOOD
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Add to Cart
</button>

// ❌ BAD
<button style={{ backgroundColor: 'blue' }}>Add to Cart</button>
```

**Brand Colors (use these):**
```css
/* From brand guidelines */
--brand-blue: #a4d1e8;
--brand-yellow: #e7c57d;
--brand-mustard: #d4a945;
--brand-green: #a4d4bc;
--brand-peach: #f3d1c8;
--brand-orange: #e59a77;
```

---

## 🚀 Task Execution Protocol

### Phase 1: UNDERSTAND (5 min)
- [ ] Read `.ai/active-work.md` (what's already in progress?)
- [ ] Read `.ai/known-issues.md` (any related bugs?)
- [ ] Read relevant code files
- [ ] Ask clarifying questions if unclear

### Phase 2: PLAN (10 min)
- [ ] **Show plan BEFORE coding** (always!)
- [ ] List files to modify
- [ ] Outline approach
- [ ] Identify potential issues
- [ ] Get user approval

### Phase 3: IMPLEMENT (80%)
- [ ] Write code following standards
- [ ] Add TypeScript types
- [ ] Handle errors properly
- [ ] Add comments only where non-obvious
- [ ] Test as you go

### Phase 4: TEST (10 min)
- [ ] Run `npm run dev` (verify no errors)
- [ ] Test in browser (manual QA)
- [ ] Check console for warnings
- [ ] Verify TypeScript compiles (`npm run build`)

### Phase 5: DOCUMENT (5 min)
- [ ] Update `.ai/active-work.md` (what changed?)
- [ ] Update `.ai/known-issues.md` (fixed any bugs?)
- [ ] Add to git commit (good message)

---

## ⚡ Common Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript check (if available)

# Firebase
firebase emulators:start # Local Firebase emulators
firebase deploy          # Deploy to production (careful!)

# Git
git status               # Check current state
git add .                # Stage changes
git commit -m "feat: ..." # Commit (use conventional commits)
git push                 # Push to remote
```

---

## 🎨 Code Quality Checklist

Before marking task complete:

- [ ] **TypeScript:** No `any`, no type errors
- [ ] **ESLint:** No warnings/errors
- [ ] **Console:** No errors in browser console
- [ ] **Naming:** Follows conventions (PascalCase, camelCase)
- [ ] **Imports:** Organized (React first, then libs, then local)
- [ ] **Error Handling:** Try/catch where needed
- [ ] **Loading States:** Show loading UI for async ops
- [ ] **Responsive:** Works on mobile (Tailwind responsive classes)
- [ ] **Accessibility:** Proper semantic HTML, ARIA if needed

---

## 🛠️ Project-Specific Rules

### E-commerce Logic
```typescript
// ✅ Always validate cart operations
const addToCart = (productId: string, quantity: number) => {
  if (quantity <= 0) throw new Error('Invalid quantity');
  if (!productId) throw new Error('Product ID required');
  // Add to cart...
};

// ✅ Price calculations server-side (never trust client)
// Use Firebase Functions for checkout
```

### State Management
- **Global State:** React Context (`context/` folder)
- **Local State:** `useState`, `useReducer`
- **Server State:** React Query (if implemented) or direct Firebase hooks

### Routing
- Pages in `pages/` folder
- Use React Router (check existing setup)
- Protected routes require auth check

---

## 🚨 Critical Rules (NEVER BREAK)

1. **NEVER deploy without testing locally first**
2. **NEVER commit `.env.local` (secrets!)**
3. **NEVER use `any` type in TypeScript**
4. **NEVER skip error handling on Firebase calls**
5. **NEVER hardcode prices (fetch from Firestore)**
6. **NEVER trust client-side validation (validate server-side too)**
7. **ALWAYS read `.ai/active-work.md` before starting**
8. **ALWAYS update `.ai/active-work.md` after finishing**

---

## 🔗 Important File Locations

| What | Where |
|------|-------|
| Components | `src/components/`, `components/` |
| Pages | `pages/` |
| Firebase config | `src/firebase.ts` (or similar) |
| Types | `src/types/` or inline |
| Utils | `src/utils/` |
| Constants | `constants.ts` |
| Environment vars | `.env.local` (gitignored) |
| Track guides | `conductor/tracks/[track-name]/` |

---

## 📚 Reference Docs

- **Project Docs:** `docs/` folder
- **Research Notes:** `docs/research/` (from Sade Chocolate documentation)
- **Development Tracks:** `conductor/tracks/`
- **Main Documentation Hub:** `C:\dev\Sade Chocolate\` (outside this project)

---

## 🤝 Collaboration Tips (for AI)

### When User Says "Add a feature"
1. Check `.ai/active-work.md` first (already planned?)
2. Ask clarifying questions (UX? Edge cases?)
3. Show plan before coding
4. Implement incrementally
5. Update active work file

### When You Get Stuck
1. Check `.ai/known-issues.md` (known problem?)
2. Check `conductor/tracks/` (track guide exists?)
3. Ask user for guidance
4. Document the blocker in active-work.md

### When You Find a Bug
1. Add to `.ai/known-issues.md` immediately
2. Propose fix or workaround
3. Ask if should fix now or defer

---

## 🎯 Success Metrics

**Good Session:**
- Code compiles (no TypeScript errors)
- App runs (no runtime errors)
- Feature works (tested in browser)
- `.ai/active-work.md` updated
- Clean commit message

**Great Session:**
- All of above +
- No ESLint warnings
- Responsive design
- Accessible
- Performance considered

---

**Last Updated:** 2026-01-03
**Next Review:** Monthly or when major changes occur
