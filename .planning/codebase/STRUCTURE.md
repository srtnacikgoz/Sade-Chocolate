# Codebase Structure

**Analysis Date:** 2026-01-12

## Directory Layout

```
Sade-Chocolate/
├── src/                        # Frontend source code (130 TypeScript files, ~46K LOC)
│   ├── components/             # UI components (28+ files)
│   │   ├── admin/              # Admin panel components
│   │   │   └── tabs/           # 18 specialized admin tabs
│   │   ├── account/            # User account components
│   │   ├── tracking/           # Order tracking components
│   │   ├── legal/              # Legal content components
│   │   └── ui/                 # Reusable UI primitives
│   ├── pages/                  # Route-level components (18 files)
│   ├── context/                # React Context providers (4 files)
│   ├── stores/                 # Zustand state stores (4 files)
│   ├── services/               # Business logic services (13 files)
│   ├── lib/                    # Library initialization
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions (9 files)
│   ├── types/                  # TypeScript type definitions
│   ├── constants/              # Application constants
│   ├── data/                   # Static data files
│   ├── index.tsx               # React entry point
│   └── App.tsx                 # Root router & providers
├── functions/                  # Firebase Cloud Functions (Node.js 20)
│   ├── src/
│   │   ├── index.ts            # 14 cloud functions (1150 lines)
│   │   └── services/
│   │       └── iyzicoService.ts
│   ├── package.json            # Functions dependencies
│   └── tsconfig.json           # Functions TypeScript config
├── public/                     # Static assets (fonts, icons)
├── tests/                      # E2E test files
│   └── customer-journey.spec.ts
├── .claude/                    # Claude Code configuration
│   ├── project-rules.md        # Development standards
│   ├── FEEDBACK.md             # Issue tracking
│   └── GUNLUK.md               # Daily work log
├── .planning/                  # Project planning documents
│   └── codebase/               # Codebase documentation (this dir)
├── dist/                       # Production build output (not committed)
├── vite.config.ts              # Vite build configuration
├── tailwind.config.js          # Tailwind CSS theme
├── tsconfig.json               # TypeScript configuration
├── firebase.json               # Firebase deployment config
├── index.html                  # HTML entry point
├── package.json                # Frontend dependencies
└── README.md                   # Project documentation
```

## Directory Purposes

**src/**
- Purpose: Frontend application source code
- Contains: React components, TypeScript files, styles
- Key files: `index.tsx` (React mount), `App.tsx` (root component)
- Subdirectories: components/, pages/, context/, stores/, services/, lib/, hooks/, utils/, types/, constants/, data/

**src/components/**
- Purpose: Reusable UI components
- Contains: React component files (.tsx)
- Key files: `Header.tsx`, `Footer.tsx`, `CartDrawer.tsx`, `Menu.tsx`, `ProductCard.tsx`, `QuickViewModal.tsx`, `IyzicoCheckoutModal.tsx`
- Subdirectories:
  - `admin/` - Admin panel components (ProductForm, AdminSidebar, UnifiedOrderModal)
  - `admin/tabs/` - 18 specialized admin tabs (OrderManagementTab.tsx 172KB, CatalogSettingsTab, ShippingSettingsTab, etc.)
  - `account/` - User account UI (AddressForm, OrderHistory, TasteProfileCard)
  - `tracking/` - Order tracking components
  - `legal/` - Legal content (Terms, Privacy, etc.)
  - `ui/` - Reusable primitives (Button, Input, PhoneInput, ConfirmDialog, TierBadge, BrandIcon)

**src/pages/**
- Purpose: Route-level page components
- Contains: One component per route (18 files)
- Key files:
  - `Home.tsx` - Landing page
  - `Catalog.tsx` (531 lines) - Product listing
  - `ProductDetail.tsx` (528 lines) - Single product view
  - `Checkout.tsx` (2394 lines) - Checkout flow (largest file)
  - `Admin.tsx` (2250 lines) - Admin dashboard (second largest)
  - `Account.tsx` (510 lines) - User account management
  - `Cart.tsx` (223 lines) - Shopping cart
  - `Register.tsx` (241 lines) - User registration
  - `OrderConfirmation.tsx` (296 lines) - Order success page
  - `About.tsx` (638 lines), `Story.tsx` (182 lines), `Favorites.tsx` (197 lines)

**src/context/**
- Purpose: React Context providers for global state
- Contains: 4 Context provider components
- Files:
  - `CartContext.tsx` - Cart items, favorites, gift state (localStorage persistence)
  - `UserContext.tsx` - Authentication, user profile, addresses, orders
  - `ProductContext.tsx` - Product catalog, filtering, sorting
  - `LanguageContext.tsx` - i18n support (TR/EN/RU translation)

**src/stores/**
- Purpose: Zustand state management stores
- Contains: 4 Zustand store definitions
- Files:
  - `orderStore.ts` - Order management with Firestore real-time subscriptions
  - `loyaltyStore.ts` - Loyalty points and tier system
  - `tasteProfileStore.ts` - User taste preferences
  - `subscriptionStore.ts` - Subscription management

**src/services/**
- Purpose: Business logic and external integrations
- Contains: 13 service modules
- Key files:
  - `orderService.ts` (562 lines) - Order CRUD + loyalty integration
  - `emailService.ts` (1268 lines / 60KB) - Email templates and sending (largest service)
  - `loyaltyService.ts` (727 lines) - Points calculation, tier management, referrals
  - `shippingService.ts` - MNG Kargo integration
  - `weatherService.ts` - OpenWeather API for heat-hold decisions
  - `tasteProfileService.ts` - Taste profile management
  - `subscriptionService.ts` - Subscription operations
  - `referralCodeService.ts` - Referral code generation/validation
  - `heatHoldService.ts` - Temperature-sensitive logistics
  - `notificationService.ts`, `notificationTemplates.ts` - In-app notifications

**src/lib/**
- Purpose: External library initialization
- Contains: `firebase.ts` - Firebase SDK configuration
- Key file: `firebase.ts` - Initializes and exports `db`, `auth`, `storage`, `analytics`, `functions`

**src/hooks/**
- Purpose: Custom React hooks
- Contains: `useToast.ts` - Toast notification hook

**src/utils/**
- Purpose: Pure utility functions
- Contains: 9 utility files
- Key files:
  - `aiResponseGenerator.ts` (36KB) - AI assistant logic (largest utility)
  - `conversationLogger.ts` - AI conversation tracking
  - `shippingUtils.ts` - Shipping calculations (blackout days, delivery estimates)
  - `estimatedDelivery.ts` - Delivery date calculation
  - `giftNoteGenerator.ts` - Personalized gift messages
  - `cookieConsent.ts` - Cookie consent management
  - `seedWebFonts.ts`, `seedEmailFonts.ts` - Font data seeding
  - `seedOrders.ts` - Test data generation

**src/types/**
- Purpose: TypeScript type definitions
- Contains: Type and interface definitions
- Files:
  - `types.ts` (root) - Product interface
  - `order.ts` - Order, OrderTag, RefundRecord, CancellationRecord
  - `subscription.ts` - Subscription types
  - `tasteProfile.ts` - Taste profile definitions
  - `loyalty.ts` - Loyalty tier and points types
  - `conversationFlow.ts` - AI conversation state

**src/constants/**
- Purpose: Application constants
- Contains: `giftNoteTemplates.ts` - Pre-written gift note templates (emotion-based)

**src/data/**
- Purpose: Static data files
- Contains: `turkeyLocations.ts` - Turkish cities, districts, neighborhoods lookup data

**functions/**
- Purpose: Firebase Cloud Functions (serverless backend)
- Runtime: Node.js 20
- Region: `europe-west3`
- Entry: `functions/src/index.ts` (1150 lines, 14 exported functions)
- Functions:
  - Shipping: `trackShipment`, `getShipmentStatus`, `calculateShipping`, `createShipment`
  - Location: `getCities`, `getDistricts`, `getNeighborhoods`, `findDistrictCode`
  - Payment: `initializeIyzicoPayment`, `handleIyzicoCallback`, `retryPayment`
  - Auth: `sendCustomPasswordResetEmail`
  - Health: `healthCheck`
- Service: `functions/src/services/iyzicoService.ts` - Iyzico payment integration

**tests/**
- Purpose: Test files
- Contains: E2E tests only (no unit tests)
- Key file: `customer-journey.spec.ts` - Playwright E2E customer journey simulation

**.claude/**
- Purpose: Claude Code configuration and documentation
- Files:
  - `project-rules.md` - Development philosophy, FSD architecture, coding standards
  - `FEEDBACK.md` - Bug, improvement, refactor tracking
  - `GUNLUK.md` - Daily work log
  - `hedefler.md` - Goals and objectives
  - `fikirler.md` - Ideas and notes
  - `kişiselbağlam.md` - User preferences

**.planning/codebase/**
- Purpose: Codebase documentation (map-codebase output)
- Files: STACK.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, INTEGRATIONS.md, CONCERNS.md

## Key File Locations

**Entry Points:**
- `src/index.tsx` - React app mount point
- `src/App.tsx` - Root component with router and providers
- `functions/src/index.ts` - Cloud Functions entry

**Configuration:**
- `vite.config.ts` - Vite bundler config (port 3000, manual chunk splitting)
- `tsconfig.json` - TypeScript config (ES2022 target, path alias @/*)
- `tailwind.config.js` - Tailwind theme (Mocha Mousse palette, dynamic typography)
- `postcss.config.js` - PostCSS plugins
- `firebase.json` - Firebase Hosting and Functions deployment
- `package.json` - Frontend dependencies and scripts
- `functions/package.json` - Cloud Functions dependencies
- `.env.example` - Environment variable template

**Core Logic:**
- `src/services/` - All business logic services
- `src/context/` - Global state management
- `src/stores/` - Complex state with Zustand
- `functions/src/` - Backend serverless functions

**Testing:**
- `tests/customer-journey.spec.ts` - E2E test suite
- No unit test files (`*.test.ts`) in src/ directories

**Documentation:**
- `README.md` - Project overview
- `CLAUDE.md` - Claude Code instructions
- `.claude/project-rules.md` - Development standards
- `.planning/codebase/` - Codebase documentation

## Naming Conventions

**Files:**
- PascalCase.tsx - React components (Home.tsx, ProductCard.tsx, CartContext.tsx)
- camelCase.ts - Services, utilities, types (orderService.ts, shippingUtils.ts, order.ts)
- kebab-case.ts - Not used (project uses camelCase for non-components)
- index.tsx/ts - Entry points or barrel exports

**Directories:**
- camelCase - All directories (components/, services/, utils/)
- No kebab-case directories

**Special Patterns:**
- *.test.ts - Test files (none exist in src/)
- *.spec.ts - E2E test files (tests/customer-journey.spec.ts)

## Where to Add New Code

**New Feature:**
- Primary code: `src/services/{feature}Service.ts` for business logic
- State: `src/stores/{feature}Store.ts` if complex state needed, or `src/context/{Feature}Context.tsx` if global UI state
- UI: `src/components/{Feature}` directory or `src/pages/{Feature}.tsx` if new route
- Types: `src/types/{feature}.ts` for type definitions
- Tests: `tests/{feature}.spec.ts` for E2E (no unit test infrastructure)

**New Component:**
- Implementation: `src/components/{ComponentName}.tsx`
- Types: Define inline or in `src/types.ts` if shared
- UI primitives: `src/components/ui/{ComponentName}.tsx`
- Admin components: `src/components/admin/{ComponentName}.tsx`
- Admin tabs: `src/components/admin/tabs/{TabName}Tab.tsx`

**New Route/Page:**
- Definition: `src/pages/{PageName}.tsx`
- Router: Add route to `src/App.tsx` HashRouter
- Navigation: Update `src/components/Header.tsx`, `src/components/Menu.tsx`, or `src/components/BottomNav.tsx`

**New Cloud Function:**
- Definition: Export from `functions/src/index.ts`
- Handler: Add handler function in `functions/src/index.ts` or extract to `functions/src/services/`
- Frontend call: Use `httpsCallable(functions, 'functionName')` in service layer

**Utilities:**
- Shared helpers: `src/utils/{utilityName}.ts`
- Type definitions: `src/types/{typeName}.ts`
- Constants: `src/constants/{constantName}.ts`

## Special Directories

**dist/**
- Purpose: Vite build output
- Source: Generated by `npm run build` (Vite)
- Committed: No (.gitignored)
- Deployed: Yes (to Firebase Hosting)

**node_modules/**
- Purpose: npm dependencies
- Source: Installed by `npm install`
- Committed: No (.gitignored)

**.planning/**
- Purpose: GSD (Get Shit Done) project planning documents
- Source: Created by /gsd:* skills
- Committed: Yes (project documentation)

**.claude/**
- Purpose: Claude Code configuration and context
- Source: User-maintained documentation
- Committed: Yes (team-shared context)

---

*Structure analysis: 2026-01-12*
*Update when directory structure changes*
