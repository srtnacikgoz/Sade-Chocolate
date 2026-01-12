# Architecture

**Analysis Date:** 2026-01-12

## Pattern Overview

**Overall:** Frontend-Centric SPA with Serverless Backend

**Key Characteristics:**
- React 19 single-page application with client-side routing (HashRouter)
- Serverless backend via Firebase Cloud Functions (Node.js 20)
- Real-time data sync with Firestore offline persistence
- Hybrid state management (React Context + Zustand)
- Turkish market focus (Iyzico payment, MNG Kargo shipping)

## Layers

**Presentation Layer (UI/Components):**
- Purpose: User interface rendering and interaction
- Contains: React components (pages, modals, forms, UI primitives)
- Location: `src/pages/` (18 route components), `src/components/` (28+ components)
- Depends on: Context/Stores for state, Services for business logic
- Used by: React Router for navigation
- Key files: `src/App.tsx` (root router), `src/pages/Home.tsx`, `src/pages/Checkout.tsx` (2394 lines), `src/pages/Admin.tsx` (2250 lines)

**State Management Layer:**
- Purpose: Global application state and data flow
- Contains: React Context providers (user, cart, products, language) + Zustand stores (orders, loyalty, taste profiles, subscriptions)
- Location: `src/context/` (4 Context providers), `src/stores/` (4 Zustand stores)
- Depends on: Services for data operations
- Used by: Components via hooks (useCart, useUser, useOrderStore, etc.)
- Pattern: Hybrid approach - Context for truly global UI state, Zustand for complex business logic with persistence

**Service Layer:**
- Purpose: Business logic and external integrations
- Contains: Firebase operations, order management, loyalty calculations, email sending, shipping logistics
- Location: `src/services/` (13 service modules)
- Depends on: Firebase SDK (`src/lib/firebase.ts`), Cloud Functions (httpsCallable)
- Used by: Context providers, Zustand stores, components
- Key files: `src/services/orderService.ts`, `src/services/emailService.ts` (60KB templates), `src/services/loyaltyService.ts`, `src/services/shippingService.ts`

**Cloud Functions Layer (Backend):**
- Purpose: Server-side logic, external API integration, sensitive operations
- Contains: MNG Kargo integration, Iyzico payment processing, email sending
- Location: `functions/src/` (Node.js 20 runtime)
- Depends on: Firebase Admin SDK, external APIs (Iyzico, MNG Kargo)
- Used by: Frontend services via `httpsCallable(functions, 'functionName')`
- Entry point: `functions/src/index.ts` (1150 lines, 14 exported functions)
- Region: `europe-west3`

**Data Layer:**
- Purpose: Data persistence and retrieval
- Contains: Firestore collections, Firebase Storage
- Location: Firebase backend (accessed via `src/lib/firebase.ts`)
- Depends on: Firebase infrastructure
- Used by: Service layer, Context providers, Zustand stores
- Collections: `products`, `orders`, `customers`, `taste_profiles`, `quiz_config`, `scenarios`, `loyalty_program`, `mail`

**Utility Layer:**
- Purpose: Pure helper functions and data structures
- Contains: Date formatting, shipping calculations, gift note generation, AI response generation
- Location: `src/utils/` (9 utility files)
- Depends on: No other layers (pure functions)
- Used by: Services, components
- Key files: `src/utils/aiResponseGenerator.ts` (36KB), `src/utils/shippingUtils.ts`, `src/utils/estimatedDelivery.ts`

## Data Flow

**User Request Flow (e.g., Add to Cart):**

1. User clicks "Add to Cart" in `src/pages/Catalog.tsx`
2. Component calls `addToCart(item)` from `useCart()` hook
3. CartContext reducer updates local state (`src/context/CartContext.tsx`)
4. State persisted to localStorage automatically
5. Component re-renders with updated cart count

**Order Creation Flow:**

1. User submits checkout form (`src/pages/Checkout.tsx`)
2. Checkout calls `createOrderWithLoyalty()` from UserContext
3. UserContext calls `src/services/orderService.ts` → creates Firestore document
4. OrderService triggers loyalty calculation (`src/services/loyaltyService.ts`)
5. Email service queued (fire-and-forget) → writes to `mail` collection
6. Firestore real-time listener updates OrderStore (Zustand)
7. User redirected to confirmation page with order ID

**Payment Flow:**

1. User clicks "Pay" in checkout → opens `src/components/IyzicoCheckoutModal.tsx`
2. Modal calls Cloud Function: `initializeIyzicoPayment()` (`functions/src/index.ts`)
3. Cloud Function calls `functions/src/services/iyzicoService.ts` → Iyzico API
4. Iyzico returns checkout form HTML
5. Modal injects form via `innerHTML` and renders iframe
6. User completes payment in Iyzico iframe
7. Iyzico sends postMessage callback to modal
8. Modal calls `handleIyzicoCallback()` Cloud Function
9. Function updates order status in Firestore
10. Real-time listener updates UI

**Shipping Calculation Flow:**

1. Checkout page gets user city/district (`src/pages/Checkout.tsx`)
2. Calls `calculateShipping()` from `src/services/shippingService.ts`
3. Service calls Cloud Function: `httpsCallable(functions, 'calculateShipping')`
4. Cloud Function calls MNG Kargo API (`functions/src/index.ts`)
5. Returns shipping cost + estimated delivery
6. Result cached in shipping service for session
7. Weather service optionally checks heat-hold requirements (`src/services/weatherService.ts`)

**State Management:**
- **Cart:** Persistent in localStorage, managed by CartContext
- **User/Auth:** Firebase Authentication session, managed by UserContext
- **Orders:** Real-time Firestore sync via OrderStore (Zustand) with `subscribeToOrders()` listener
- **Products:** Loaded once from Firestore, cached in ProductContext
- **Loyalty:** Calculated on-demand, cached in LoyaltyStore (Zustand)

## Key Abstractions

**React Context Providers:**
- Purpose: Provide global state via React Context API
- Examples: `src/context/CartContext.tsx`, `src/context/UserContext.tsx`, `src/context/ProductContext.tsx`, `src/context/LanguageContext.tsx`
- Pattern: `createContext` → Provider component → custom hook (useCart, useUser)
- Usage: Wrapped in `src/App.tsx` as nested providers

**Zustand Stores:**
- Purpose: Lightweight state management with persistence
- Examples: `src/stores/orderStore.ts`, `src/stores/loyaltyStore.ts`, `src/stores/tasteProfileStore.ts`, `src/stores/subscriptionStore.ts`
- Pattern: `create<Type>()(set, get) => ({ state, actions })`
- Features: Real-time Firestore subscriptions, localStorage persistence middleware
- Usage: Accessed via hooks (useOrderStore, useLoyaltyStore)

**Firebase Service Abstraction:**
- Purpose: Encapsulate Firestore operations and prevent direct DB access in components
- Examples: `src/services/orderService.ts`, `src/services/loyaltyService.ts`, `src/services/emailService.ts`
- Pattern: Export functions that wrap Firestore SDK calls
- Usage: Imported by Context providers, Zustand stores, components

**Cloud Functions (Callable):**
- Purpose: Server-side API endpoints for external integrations
- Examples: `trackShipment()`, `calculateShipping()`, `initializeIyzicoPayment()` in `functions/src/index.ts`
- Pattern: `export const functionName = functions.https.onCall(async (data, context) => {...})`
- Usage: Called from frontend via `httpsCallable(functions, 'functionName')`

**Admin Tab Components:**
- Purpose: Feature-isolated admin interface modules
- Examples: `src/components/admin/tabs/OrderManagementTab.tsx` (172KB), `src/components/admin/tabs/CatalogSettingsTab.tsx`
- Pattern: Each tab is independent feature with own state and logic
- Count: 18 specialized admin tabs
- Usage: Rendered in `src/pages/Admin.tsx` based on active tab

## Entry Points

**Client-Side Entry:**
- Location: `src/index.tsx` (15 lines)
- Triggers: Browser loads index.html
- Responsibilities: Mount React app to `#root` DOM element, render `<App />` in StrictMode

**App Router:**
- Location: `src/App.tsx` (104 lines)
- Triggers: After React mount
- Responsibilities:
  - Initialize theme from localStorage
  - Wrap app with providers (Language → User → Product → Cart)
  - Define HashRouter routes (19 routes total)
  - Render layout with Header, BottomNav, Footer
- Routes: `/` → SplashScreen, `/home` → Home, `/catalog` → Catalog, `/product/:id` → ProductDetail, `/checkout` → Checkout, `/admin` → Admin, etc.

**Cloud Functions Entry:**
- Location: `functions/src/index.ts` (1150 lines)
- Triggers: HTTP requests or Firebase callable invocations
- Responsibilities: Export 14 Cloud Functions (shipping, payment, location, email, health check)
- Functions: `trackShipment`, `getShipmentStatus`, `calculateShipping`, `createShipment`, `getCities`, `getDistricts`, `getNeighborhoods`, `findDistrictCode`, `initializeIyzicoPayment`, `handleIyzicoCallback`, `retryPayment`, `sendCustomPasswordResetEmail`, `healthCheck`

**Firebase Config:**
- Location: `src/lib/firebase.ts`
- Triggers: App initialization
- Responsibilities: Initialize Firebase SDK with env vars, configure Firestore offline persistence, export `db`, `auth`, `storage`, `analytics`, `functions` instances

## Error Handling

**Strategy:** Mixed - Try/catch in some services, silent failures in others

**Patterns:**
- **Services:** Try/catch blocks with console.error logging (example: `src/stores/orderStore.ts`)
- **Context:** Minimal error handling, often no try/catch (example: `src/context/UserContext.tsx` login function)
- **Email:** Fire-and-forget pattern, errors logged but not thrown (`src/services/emailService.ts` line 118-121)
- **Cloud Functions:** Try/catch with error responses returned to caller

**Gaps:**
- No centralized error reporting (Sentry mentioned in project rules but not implemented)
- Inconsistent error handling across services
- User feedback missing for many error cases

## Cross-Cutting Concerns

**Logging:**
- Approach: Console.log and console.error throughout codebase
- Location: Multiple production console statements in stores, services, contexts
- Issue: No structured logging, debug statements left in production code

**Validation:**
- Approach: Manual validation in components and services
- Examples: Phone number validation (Checkout), email regex (Checkout)
- Gaps: No schema validation library (Zod, Yup), inconsistent validation patterns

**Authentication:**
- Approach: Firebase Authentication with UserContext managing session
- Pattern: `onAuthStateChanged` listener in UserContext updates global user state
- Admin: Simple sessionStorage check in `src/components/AdminLoginModal.tsx` (security concern)

**Internationalization:**
- Approach: LanguageContext with translation object
- Languages: Turkish (TR), English (EN), Russian (RU)
- Implementation: `src/context/LanguageContext.tsx`, translation object with nested keys
- Usage: `t('key.path')` function from `useLanguage()` hook

**Offline Support:**
- Approach: Firestore offline persistence with multi-tab manager
- Configuration: `persistentLocalCache()` + `persistentMultipleTabManager()` in `src/lib/firebase.ts`
- Cart: localStorage persistence via CartContext
- Orders: Firestore cache syncs when online

---

*Architecture analysis: 2026-01-12*
*Update when major patterns change*
