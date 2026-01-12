# Codebase Concerns

**Analysis Date:** 2026-01-12

## Tech Debt

**FSD Architecture Not Implemented:**
- Issue: Project rules specify Feature-Sliced Design (FSD) but codebase uses traditional structure
- Files: `.claude/project-rules.md` mentions FSD, but `src/` follows components/pages/services pattern
- Why: Rapid development prioritized over architectural goals
- Impact: Harder to maintain, scale, and onboard new developers as codebase grows
- Fix approach: Gradual migration using "Tombstoning" method mentioned in project rules - mark old files as deprecated, create new FSD structure alongside

**Oversized Components:**
- Issue: Multiple components exceed 1000+ lines, violating 200-500 line guideline
- Files:
  - `src/components/admin/tabs/OrderManagementTab.tsx` (3672 lines / 172KB) - Handles multiple responsibilities
  - `src/pages/Checkout.tsx` (2394 lines) - Complex checkout with guest/auth modes, validation, payment
  - `src/pages/Admin.tsx` (2250 lines) - Admin dashboard with 15+ tabs mixed together
  - `src/services/emailService.ts` (1268 lines / 60KB) - All email templates hardcoded in service
  - `src/components/admin/ProductForm.tsx` (1381 lines) - Complex form with nested validation
- Why: Feature additions without refactoring, tight deadlines
- Impact: Hard to test, review, maintain; high cognitive load; tight coupling
- Fix approach: Extract to smaller modules - separate components, hooks, and utilities; move templates to separate files

**No Test Coverage:**
- Issue: Zero unit tests, only one E2E test file
- Files: No `*.test.ts` files in `src/` directory, only `tests/customer-journey.spec.ts`
- Why: Vitest mentioned in project rules but never configured
- Impact: Refactoring is dangerous, regressions go undetected, business logic bugs hard to catch
- Fix approach: Add Vitest, create `vitest.config.ts`, start with critical services (order, loyalty, email)

**TypeScript Type Safety Gaps:**
- Issue: Widespread use of `any` type, loose typing
- Files:
  - `src/pages/Admin.tsx` (lines 65-92) - Multiple `any[]` declarations
  - `src/context/UserContext.tsx` (line 156) - `as any` casting
  - `src/pages/Checkout.tsx` - Various form data with loose typing
  - `src/components/admin/tabs/OrderManagementTab.tsx` - Order objects with loose typing
- Why: Quick development, complex types not defined properly
- Impact: Reduced IDE support, harder refactoring, runtime errors
- Fix approach: Define proper interfaces, enable strict TypeScript mode, gradually remove `any` usage

**Email Sending Fire-and-Forget:**
- Issue: Email failures are silently logged, no retry mechanism or user notification
- File: `src/services/emailService.ts` (lines 118-121)
- Why: Simplified implementation, Firebase Extension handles delivery
- Impact: Customers may not receive order confirmations or critical emails
- Fix approach: Add email delivery status tracking, implement retry queue, notify users of failures

**Admin Authentication Weakness:**
- Issue: Admin panel uses simple sessionStorage check, easily bypassed
- File: `src/pages/Admin.tsx` (lines 37-43), `src/components/AdminLoginModal.tsx` (line 23)
- Why: Quick implementation for demo/development
- Impact: Security risk - anyone can access admin panel by setting sessionStorage value
- Fix approach: Implement proper JWT-based authentication with Firebase Custom Claims or Cloud Functions verification

## Known Bugs

**Missing Error Handling in Auth:**
- Symptoms: Auth failures crash without user-friendly messages
- Trigger: Failed login attempts, network errors during authentication
- File: `src/context/UserContext.tsx` (lines 240-243) - login() function has no try/catch
- Workaround: None (users see browser error or blank screen)
- Root cause: Missing error boundaries and error handling
- Fix: Add try/catch blocks, display toast notifications for errors

**Incomplete TODO: Loyalty Tier Email:**
- Symptoms: Users not notified when they reach new loyalty tier
- Trigger: Loyalty tier upgrade after purchase
- File: `src/services/orderService.ts` (line 352) - TODO comment
- Workaround: Users discover new tier when they check account
- Root cause: Feature incomplete, email template not created
- Fix: Create tier upgrade email template, implement notification in loyalty service

## Security Considerations

**Admin Panel Access Control:**
- Risk: Unauthorized admin access via sessionStorage manipulation
- Files: `src/pages/Admin.tsx`, `src/components/AdminLoginModal.tsx`
- Current mitigation: None (client-side check only)
- Recommendations: Implement Firebase Custom Claims for admin role, verify role server-side in Cloud Functions, add proper authentication flow

**Iyzico Checkout XSS Risk:**
- Risk: Payment form HTML injection via `innerHTML` could execute malicious scripts
- File: `src/components/IyzicoCheckoutModal.tsx` (line 33)
- Current mitigation: Trusting Iyzico API response
- Recommendations: Validate and sanitize HTML from Iyzico, use DOMPurify library, or switch to iframe-only approach

**Sensitive Data in localStorage:**
- Risk: Cart data, session IDs, admin auth status in localStorage accessible to XSS attacks
- Files:
  - `src/context/CartContext.tsx` (lines 50-52) - Cart items in localStorage
  - `src/utils/conversationLogger.ts` - AI session IDs in localStorage
  - `src/components/AdminLoginModal.tsx` - Admin auth in sessionStorage
  - `src/pages/Checkout.tsx` - Draft checkout data in localStorage
- Current mitigation: None (plain text storage)
- Recommendations: Encrypt sensitive data, use httpOnly cookies for auth, implement CSP headers

**API Keys Exposed to Client:**
- Risk: Firebase config and API keys exposed in client-side code
- File: `vite.config.ts` (lines 14-15) - GEMINI_API_KEY exposed to client
- Current mitigation: Firebase security rules (need verification)
- Recommendations: Move sensitive operations to Cloud Functions, verify Firestore security rules are properly configured

## Performance Bottlenecks

**Large Components Loading:**
- Problem: OrderManagementTab (172KB) loads entire admin interface
- File: `src/components/admin/tabs/OrderManagementTab.tsx`
- Measurement: File size 172KB, likely several seconds to parse on low-end devices
- Cause: All admin logic in single component without code splitting
- Improvement path: Implement lazy loading for admin tabs, split into smaller modules

**No Bundle Optimization:**
- Problem: Entire app likely bundles together without splitting
- File: `vite.config.ts` has manual chunk splitting but limited (only Firebase and Recharts)
- Measurement: Bundle size not measured
- Cause: Default Vite configuration, no route-based code splitting
- Improvement path: Add route-based lazy loading with React.lazy(), split vendor bundles

**Potential N+1 Queries:**
- Problem: UserContext may query products for each order separately
- File: `src/context/UserContext.tsx` (lines 162-225) - Orders listener
- Measurement: Not profiled
- Cause: Firestore listener pattern without batch loading
- Improvement path: Use Firestore batch reads, implement caching layer

## Fragile Areas

**Email Service Template Management:**
- Files: `src/services/emailService.ts` (1268 lines of inline HTML templates)
- Why fragile: 200+ lines of HTML per email template hardcoded in TypeScript
- Common failures: HTML syntax errors hard to spot, changes require code deployment
- Safe modification: Extract templates to separate files or Firestore documents
- Test coverage: None (no email template tests)

**Payment Flow Error Handling:**
- Files: `src/components/IyzicoCheckoutModal.tsx`, `functions/src/services/iyzicoService.ts`
- Why fragile: Payment callbacks via postMessage, error cases not fully handled
- Common failures: Callback timeout, payment declined without clear user feedback
- Safe modification: Add timeout handling, implement retry mechanism, test all error paths
- Test coverage: None (no payment flow tests)

**Order Status Transitions:**
- Files: `src/stores/orderStore.ts`, `src/services/orderService.ts`
- Why fragile: Multiple services can update order status, no state machine validation
- Common failures: Invalid status transitions (e.g., "Shipped" to "Pending Payment")
- Safe modification: Implement state machine with valid transitions only
- Test coverage: None (no order lifecycle tests)

## Scaling Limits

**Firestore Free Tier:**
- Current capacity: 50K reads/day, 20K writes/day, 1GB storage (Firebase free tier)
- Limit: ~500-1000 active users estimated before hitting limits
- Symptoms at limit: 429 rate limit errors, slow queries, operations fail
- Scaling path: Upgrade to Blaze plan (pay-as-you-go), implement caching layer

**localStorage Size:**
- Current capacity: ~5-10MB browser localStorage limit
- Limit: Large carts or conversation histories could hit limit
- Symptoms at limit: localStorage.setItem() throws QuotaExceededError
- Scaling path: Implement chunking, move large data to Firestore

## Dependencies at Risk

**React 19 Stability:**
- Risk: React 19 is very recent (released 2024), ecosystem catching up
- Files: `package.json` - react 19.2.3, react-dom 19.2.3
- Impact: Some libraries may not be compatible, breaking changes possible
- Migration plan: Monitor React 19 stability, have rollback plan to React 18

**Zustand 5:**
- Risk: Zustand 5 released recently, migration from Zustand 4 may have breaking changes
- Files: `package.json` - zustand 5.0.9
- Impact: Middleware compatibility issues, state persistence changes
- Migration plan: Review Zustand 5 migration guide, test all stores thoroughly

## Missing Critical Features

**Error Reporting:**
- Problem: No centralized error tracking (Sentry mentioned but not configured)
- Current workaround: Console.log errors only
- Blocks: Can't diagnose production issues, no error analytics
- Implementation complexity: Low (add Sentry SDK, configure in vite.config.ts)

**Test Infrastructure:**
- Problem: No unit test framework, no component testing
- Current workaround: Manual testing only
- Blocks: Safe refactoring, continuous integration, confidence in changes
- Implementation complexity: Medium (add Vitest, configure, write initial tests)

**Proper Logging Service:**
- Problem: Console.log everywhere, no structured logging
- Current workaround: Browser console only
- Blocks: Production debugging, audit trails, monitoring
- Implementation complexity: Low (add logging library like pino, wrap console calls)

## Test Coverage Gaps

**Critical Business Logic:**
- What's not tested: Order creation with loyalty integration (`src/services/orderService.ts`)
- Risk: Loyalty points calculated incorrectly, orders created without proper validation
- Priority: High
- Difficulty to test: Medium (need Firestore mocking)

**Payment Flow:**
- What's not tested: Iyzico integration end-to-end (`functions/src/services/iyzicoService.ts`, `src/components/IyzicoCheckoutModal.tsx`)
- Risk: Payment processing could break silently, has happened before per analysis
- Priority: High
- Difficulty to test: High (need Iyzico test fixtures, webhook simulation)

**State Management:**
- What's not tested: Context providers and Zustand stores
- Risk: State updates could break, causing UI inconsistencies
- Priority: Medium
- Difficulty to test: Low (can mock Firebase easily)

**Component Rendering:**
- What's not tested: React components (no Storybook or React Testing Library)
- Risk: UI regressions go unnoticed
- Priority: Medium
- Difficulty to test: Low (add React Testing Library)

---

*Concerns audit: 2026-01-12*
*Update as issues are fixed or new ones discovered*
