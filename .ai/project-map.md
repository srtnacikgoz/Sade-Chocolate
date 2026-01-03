# Project Map - Sade Chocolate Codebase

**Purpose:** Quick reference for file locations and codebase structure.

**Last Updated:** 2026-01-03

---

## 📁 Directory Structure

```
C:\dev\sade-chocolate\
│
├── .ai/                        ← AI Memory (you are here!)
│   ├── instructions.md         ← Development rules & standards
│   ├── project-map.md          ← This file (structure guide)
│   ├── active-work.md          ← Current work tracking
│   └── known-issues.md         ← Bugs & workarounds
│
├── .claude/                    ← Claude Code configuration
│   └── hooks/                  ← Git hooks & automation
│
├── .firebase/                  ← Firebase local config
│
├── components/                 ← React Components
│   ├── account/                ← Account-related (login, profile, etc.)
│   ├── admin/                  ← Admin panel components
│   └── ui/                     ← Reusable UI components (buttons, cards, etc.)
│
├── conductor/                  ← Development tracks & guides
│   ├── code_styleguides/       ← Code style references
│   └── tracks/                 ← Feature development tracks
│       ├── sade-chocolate-main/              ← Main track
│       └── urun_katalogu_filtreleme_20251225/ ← Product catalog filtering
│
├── context/                    ← React Context (global state)
│
├── dist/                       ← Build output (generated, don't edit)
│   ├── assets/                 ← Compiled JS/CSS
│   └── fonts/                  ← Fonts (Santana font family)
│
├── docs/                       ← Documentation
│   └── research/               ← Research notes (linked to main docs hub)
│       ├── Genel Bilgiler/
│       ├── Sade CRM/
│       └── Türkiye'de Premium Çikolata Markası Kurulumu/
│
├── pages/                      ← Page components (routing)
│
├── public/                     ← Static assets (images, etc.)
│
├── src/                        ← Main source code
│
├── tests/                      ← Test files
│
├── .env.example                ← Environment variables template
├── .env.local                  ← Actual environment variables (GITIGNORED!)
├── .firebaserc                 ← Firebase project config
├── .gitignore                  ← Git ignore rules
├── App.tsx                     ← Main App component (root)
├── CLAUDE.md                   ← Claude-specific notes
├── constants.ts                ← Global constants
├── package.json                ← Dependencies & scripts
├── tsconfig.json               ← TypeScript configuration
└── vite.config.ts              ← Vite build configuration
```

---

## 🎯 Quick Navigation

### "I need to..."

| Task | Go To |
|------|-------|
| Add a new reusable button/input | `components/ui/` |
| Create account-related feature | `components/account/` |
| Add admin panel feature | `components/admin/` |
| Create a new page | `pages/` |
| Add global state/context | `context/` |
| Add utility function | `src/utils/` (or create if doesn't exist) |
| Define TypeScript types | `src/types/` (or inline with component) |
| Configure Firebase | Look for `firebase.ts` or `firebaseConfig.ts` in `src/` |
| Check current feature track | `conductor/tracks/[active-track]/` |
| Add static image/icon | `public/` |
| View build output | `dist/` (don't edit manually) |
| Read research notes | `docs/research/` |
| Check environment setup | `.env.example` (template), `.env.local` (actual) |

---

## 🔍 Important Files

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, project metadata |
| `tsconfig.json` | TypeScript compiler settings (strict mode!) |
| `vite.config.ts` | Vite bundler configuration |
| `.firebaserc` | Firebase project ID |
| `.gitignore` | Files to exclude from git |
| `.env.local` | **SECRET!** API keys, Firebase config |
| `.env.example` | Template for environment variables |

### Entry Points

| File | Purpose |
|------|---------|
| `App.tsx` | Main React component (root) |
| `main.tsx` (likely in `src/`) | Vite entry point (renders App) |
| `index.html` | HTML entry point |

### Core Application Files

| File | Purpose |
|------|---------|
| `constants.ts` | Global constants (URLs, config values) |
| `src/firebase.ts` (or similar) | Firebase initialization |
| `src/routes.tsx` (if exists) | Routing configuration |

---

## 📦 Key Dependencies (from package.json)

**Check actual `package.json` for full list, but likely includes:**

### Core
- `react` + `react-dom` - UI framework
- `typescript` - Type safety
- `vite` - Build tool

### Firebase
- `firebase` - Backend (Auth, Firestore, Storage, etc.)
- `react-firebase-hooks` (maybe) - React hooks for Firebase

### Styling
- `tailwindcss` (likely) - Utility-first CSS

### Routing
- `react-router-dom` (likely) - Client-side routing

### Forms & Validation
- `react-hook-form` (maybe)
- `zod` (maybe) - Schema validation

---

## 🗂️ Component Organization

### UI Components (`components/ui/`)
**Purpose:** Generic, reusable components

**Examples:**
- Button
- Input
- Card
- Modal
- Dropdown
- Spinner/Loader

**Rules:**
- No business logic
- Highly reusable
- Props-driven
- Styled with Tailwind

### Account Components (`components/account/`)
**Purpose:** User account features

**Likely includes:**
- Login form
- Registration form
- Profile page
- Password reset
- Account settings

### Admin Components (`components/admin/`)
**Purpose:** Admin panel features

**Likely includes:**
- Product management
- Order management
- User management
- Analytics dashboard

---

## 🛤️ Development Tracks (`conductor/tracks/`)

### What are tracks?
Structured guides for feature development. Each track contains:
- Feature requirements
- Implementation steps
- Code examples
- Testing checklist

### Active Tracks (as of 2026-01-03)

#### `sade-chocolate-main/`
Main development track (overall project direction)

#### `urun_katalogu_filtreleme_20251225/`
Product catalog filtering feature (Dec 25, 2025 start date)

**When to use:**
- Starting new feature → Check if track exists
- Stuck on implementation → Read track guide
- Need context on why something exists → Check track history

---

## 🔗 External References

### Main Documentation Hub
`C:\dev\Sade Chocolate\` - Complete business documentation
- Research notes
- Business strategy
- Technical architecture
- AI collaboration guides

**Link:** `docs/research/` in this project mirrors parts of main hub

### Key External Docs (from main hub)

| Doc | Location |
|-----|----------|
| Development Standards | `C:\dev\Sade Chocolate\🛠️ Teknik Altyapı\Kurallar ve Protokoller\Sade Patisserie Geliştirme Standartları.md` |
| AI Collaboration Playbook | `C:\dev\Sade Chocolate\🛠️ Teknik Altyapı\Kurallar ve Protokoller\AI Team Collaboration Playbook.md` |
| AI Instructions | `C:\dev\Sade Chocolate\🛠️ Teknik Altyapı\Kurallar ve Protokoller\AI Instructions - Quick Reference.md` |
| Overall TODO | `C:\dev\Sade Chocolate\📋 Dokümantasyon Merkezi\TODO.md` |

---

## 🚀 Common Workflows

### 1. Add New Component

```
1. Decide category: ui / account / admin
2. Create file: components/[category]/ComponentName.tsx
3. Define props interface
4. Implement component (functional, TypeScript)
5. Export (named export, not default)
6. Import & use in parent component
7. Test in browser
```

### 2. Add New Page

```
1. Create file: pages/PageName.tsx
2. Implement page component
3. Add route (check src/routes.tsx or App.tsx)
4. Add navigation link (if needed)
5. Test routing
```

### 3. Add Firebase Feature

```
1. Check firebase.ts for config
2. Import needed Firebase modules
3. Implement with error handling
4. Add TypeScript types
5. Test with Firebase emulators (local)
6. Test with real Firebase (staging)
```

### 4. Fix Bug

```
1. Reproduce bug
2. Check .ai/known-issues.md (already known?)
3. Identify root cause
4. Implement fix
5. Test fix
6. Update .ai/known-issues.md (mark resolved)
7. Commit with clear message
```

---

## 📊 File Count Overview (Approximate)

**Total Files:** ~hundreds (including node_modules)
**Source Files:** ~50-100 (actual code)
**Components:** ~20-40
**Pages:** ~10-20
**Config Files:** ~10

**Most Active Areas:**
- `components/` - Frequent changes
- `pages/` - Frequent changes
- `src/` - Frequent changes
- `conductor/tracks/` - Moderate changes
- Config files - Rare changes

---

## 🎯 Search Tips

### Find a component
```bash
# By name
find . -name "ProductCard.tsx"

# By content
grep -r "ProductCard" --include="*.tsx"
```

### Find where something is used
```bash
# Find all imports of ProductCard
grep -r "import.*ProductCard" --include="*.tsx"

# Find all usages
grep -r "<ProductCard" --include="*.tsx"
```

### Find Firebase calls
```bash
grep -r "getDoc\|setDoc\|updateDoc" --include="*.ts" --include="*.tsx"
```

---

## 🔄 File Lifecycle

### Development Flow
```
1. Edit source files (src/, components/, pages/)
2. Vite hot-reloads (instant preview)
3. Fix TypeScript errors (if any)
4. Test in browser
5. Commit to git
6. Build for production (npm run build)
7. Deploy to Firebase (firebase deploy)
```

### Build Output
```
Source (src/, components/)
  → Vite build
    → dist/ (minified, optimized)
      → Firebase hosting (production)
```

**Important:** Never edit `dist/` directly! Always edit source files.

---

## 📌 Quick Reference

### Most Accessed Files (likely)
1. `App.tsx` - Main app component
2. `components/ui/*` - UI components
3. `pages/*` - Page components
4. `constants.ts` - Global constants
5. `.env.local` - Environment config

### Most Important Folders
1. `components/` - Core UI
2. `pages/` - User-facing pages
3. `src/` - Business logic
4. `conductor/tracks/` - Feature guides
5. `.ai/` - AI collaboration (this folder!)

### Files to NEVER Edit
- `node_modules/` (managed by npm)
- `dist/` (generated by build)
- `.firebase/` (managed by Firebase CLI)

### Files to BE CAREFUL With
- `.env.local` (secrets!)
- `tsconfig.json` (affects entire project)
- `vite.config.ts` (build configuration)
- `package.json` (dependencies)

---

**Maintained By:** AI Agents + Human Developer
**Last Updated:** 2026-01-03
**Next Review:** When major structure changes occur
