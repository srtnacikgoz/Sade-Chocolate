# External Integrations

**Analysis Date:** 2026-01-12

## APIs & External Services

**Payment Processing:**
- Iyzico - Turkish payment gateway for checkout and subscription payments
  - SDK/Client: iyzipay npm package 2.0.64 (in functions/)
  - Auth: API key and secret via Firebase Function params (IYZICO_API_KEY, IYZICO_SECRET_KEY)
  - Endpoints used: Checkout Form initialization, payment callbacks
  - Implementation: `functions/src/services/iyzicoService.ts`, `src/components/IyzicoCheckoutModal.tsx`, `src/pages/Checkout.tsx`

**Shipping & Logistics:**
- MNG Kargo - Turkish courier API for tracking and shipping calculations
  - Integration method: REST API via axios in Cloud Functions
  - Auth: Client ID and secret via Function params (MNG_CLIENT_ID, MNG_CLIENT_SECRET, optional JWT token)
  - API Base: `https://api.mngkargo.com.tr/mngapi/api/`
  - Endpoints: standardqueryapi (tracking, status, shipping calc), cbsinfoapi (cities/districts)
  - Functions: `getCities()`, `getDistricts()`, `trackShipment()`, `calculateShipping()`, `createShipment()`
  - Client service: `src/services/shippingService.ts` calls Cloud Functions via httpsCallable
  - Files: `functions/src/index.ts`, `src/services/shippingService.ts`

**Weather Data:**
- OpenWeatherMap API - Current weather and forecasts for logistics decisions (heat-hold protocol)
  - Integration method: REST API via fetch (`https://api.openweathermap.org/data/2.5`)
  - Auth: API key in VITE_OPENWEATHER_API_KEY env var
  - Rate limits: 1000 calls/day (free tier)
  - Features: Temperature thresholds (30°C heat-hold, 20°C+ cold pack requirements)
  - Files: `src/services/weatherService.ts`, `src/services/heatHoldService.ts`

**Email/Communications:**
- SendGrid (via Firebase Extension "Trigger Email")
  - Integration method: Firestore collection writes trigger email sends
  - Target Collection: `mail` in Firestore
  - Auth: SendGrid API key configured in Firebase Extension dashboard
  - Rate limits: 100 emails/day (free tier)
  - Templates: Premium HTML templates with branding (mocha/cream/gold colors)
  - Features: Order confirmations, receipts, password resets, notifications
  - Files: `src/services/emailService.ts` (60KB+ template definitions)

**AI & Content Generation:**
- Google Generative AI (Gemini)
  - SDK/Client: @google/genai npm package 1.34.0
  - Auth: API key in VITE_GEMINI_API_KEY env var (exposed via vite.config.ts)
  - Features: AI sommelier chatbot, taste profile recommendations, multi-language support (TR/EN/RU)
  - Integration: Scenario-based conversational flows driven by Firestore data
  - Files: `src/components/AIAssistant.tsx`, `src/utils/aiResponseGenerator.ts`
  - Related collections: `scenarios`, `ai_knowledge_base`, `ai_guiding_questions`, `conversation_logs`

## Data Storage

**Databases:**
- Firebase Firestore - Primary NoSQL database
  - Connection: via Firebase SDK initialized in `src/lib/firebase.ts`
  - Client: Firebase JS SDK 11.10.0
  - Collections: `products`, `orders`, `customers`, `taste_profiles`, `quiz_config`, `scenarios`, `loyalty_program`, `mail`, `ai_knowledge_base`, `ai_guiding_questions`
  - Offline persistence: Enabled with `persistentLocalCache()` and `persistentMultipleTabManager()`
  - Region: Default (auto-selected by Firebase)

**File Storage:**
- Firebase Cloud Storage - User uploads and product images
  - SDK/Client: Firebase JS SDK 11.10.0 via `getStorage()` in `src/lib/firebase.ts`
  - Auth: Firebase Authentication integration
  - Buckets: Default Firebase Storage bucket (configured in Firebase console)

**Caching:**
- None - No Redis or external caching layer
- Local caching: Firestore offline persistence for database queries
- Browser storage: localStorage for cart, session IDs, theme preferences

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication - Email/password + OAuth providers
  - Implementation: Firebase Auth SDK via `getAuth()` in `src/lib/firebase.ts`
  - Token storage: Session-based (handled by Firebase SDK)
  - Session management: Firebase handles JWT refresh tokens automatically
  - Context: `src/context/UserContext.tsx` manages auth state

**OAuth Integrations:**
- Google OAuth - Social sign-in (configured in Firebase Authentication dashboard)
  - Credentials: Managed in Firebase console
  - Scopes: email, profile

**Admin Authentication:**
- Simple sessionStorage check - `src/components/AdminLoginModal.tsx`
  - Risk: Basic check easily bypassed; no JWT or secure token validation
  - Implementation: sessionStorage.setItem('admin_authenticated', 'true')
  - **Security concern:** Needs proper role-based access control

## Monitoring & Observability

**Analytics:**
- Firebase Analytics - User behavior tracking
  - Implementation: `getAnalytics()` in `src/lib/firebase.ts`
  - Events: Automatic page views, custom events
  - Dashboard: Firebase console

**Error Tracking:**
- None currently implemented
- Project rules mention Sentry but not configured

**Logs:**
- Console logging only - Multiple debug statements in production code
  - `src/stores/orderStore.ts`, `src/stores/loyaltyStore.ts`, `src/context/UserContext.tsx`
  - **Improvement needed:** Replace with proper logging service, remove production console.log

## CI/CD & Deployment

**Hosting:**
- Firebase Hosting - React SPA hosting
  - Deployment: Manual via `firebase deploy` command
  - Build output: `dist/` directory (Vite build)
  - Configuration: `firebase.json` with SPA rewrite rules and cache headers
  - Cache strategy: Assets 1 year immutable, index.html no-cache

**CI Pipeline:**
- None visible - No GitHub Actions, GitLab CI, or similar configuration files
- Deployment: Manual via Firebase CLI

## Environment Configuration

**Development:**
- Required env vars: `.env.example` template with Firebase and API keys
- Secrets location: `.env.local` (gitignored)
- Mock/stub services: Iyzico sandbox mode, OpenWeather free tier, Firebase local emulator (not configured)

**Staging:**
- Not explicitly configured - Same Firebase project as production likely

**Production:**
- Secrets management: Firebase Function params configured via Firebase CLI or console
- Environment vars: Vite exposes VITE_* vars to client-side code
- Database: Firestore production instance with daily backups (Firebase automatic)

## Webhooks & Callbacks

**Incoming:**
- Iyzico Payment Callbacks - `/api/webhooks/iyzico` (Cloud Function)
  - Verification: Iyzico signature validation via `handleIyzicoCallback()` in `functions/src/index.ts`
  - Events: payment_success, payment_failed

**Outgoing:**
- None - No webhooks sent to external services

---

*Integration audit: 2026-01-12*
*Update when adding/removing external services*
