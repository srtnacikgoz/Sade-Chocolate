# Testing Patterns

**Analysis Date:** 2026-01-12

## Test Framework

**Runner:**
- Playwright 1.57.0 - E2E testing only
- No unit test framework configured (Vitest mentioned in project rules but not set up)

**Assertion Library:**
- Playwright built-in assertions
- No unit test assertions available

**Run Commands:**
```bash
npx ts-node tests/customer-journey.spec.ts   # Run E2E test manually
npx playwright test tests/                    # Run via Playwright CLI
# No npm test script defined in package.json
```

## Test File Organization

**Location:**
- E2E tests only: `tests/customer-journey.spec.ts`
- No unit tests in src/ directory (no *.test.ts files)

**Naming:**
- E2E: `*.spec.ts` (only one file exists)
- Unit: Not applicable (no unit tests)

**Structure:**
```
Sade-Chocolate/
├── tests/
│   └── customer-journey.spec.ts      # E2E customer journey simulation
├── src/                              # No *.test.ts files
└── functions/                        # No *.test.ts files
```

## Test Structure

**E2E Test Pattern:**
```typescript
// From tests/customer-journey.spec.ts
import { chromium, Browser, Page, BrowserContext } from 'playwright';

const log = {
  step: (msg: string) => console.log(`\n[STEP] ${msg}`),
  success: (msg: string) => console.log(`   [OK] ${msg}`),
  fail: (msg: string) => console.log(`   [FAIL] ${msg}`),
  section: (msg: string) => console.log(`\n========== ${msg} ==========`),
};

async function runCustomerJourney() {
  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 500,  // Slow down for visual feedback
  });

  const context: BrowserContext = await browser.newContext({
    locale: 'tr-TR',
    viewport: { width: 1400, height: 900 }
  });

  const page: Page = await context.newPage();
  let testResults: { name: string; status: 'pass' | 'fail' | 'skip' }[] = [];

  try {
    // Test sections
    await page.goto(BASE_URL, { waitUntil: 'load' });
    // ... test assertions
  } finally {
    await browser.close();
  }
}
```

**Patterns:**
- Manual test execution (no test runner)
- Visual feedback (headless: false, slowMo: 500)
- Turkish locale (tr-TR)
- Structured logging with emoji prefixes ([STEP], [OK], [FAIL])
- Test result reporting at end

## Test Types

**E2E Tests:**
- Framework: Playwright for full browser simulation
- Scope: Complete user journey from landing to checkout
- Current coverage: Single comprehensive test file
- Location: `tests/customer-journey.spec.ts`
- Sections tested:
  1. Home page load & navigation
  2. Products/Catalog page
  3. Product detail page
  4. Shopping cart
  5. Checkout flow
  6. Login page
  7. Registration page
  8. Admin panel access
  9. Other pages (About, Contact)

**Unit Tests:**
- Status: Not implemented
- Gap: No tests for services (orderService.ts, loyaltyService.ts, emailService.ts)

**Integration Tests:**
- Status: Not implemented
- Gap: No tests for Context providers, Zustand stores

## Mocking

**Status:** Not applicable (no unit/integration tests)

**If Implemented Would Need:**
- Firebase Firestore mocking
- Firebase Auth mocking
- localStorage mocking
- External API mocking (Iyzico, MNG Kargo, OpenWeather)

## Fixtures and Factories

**Test Data:**
- No factory functions defined
- Mock data inline in `src/stores/orderStore.ts` for development (INITIAL_ORDERS array)

**Location:**
- No dedicated fixtures/ directory
- Test data would need to be created for unit tests

## Coverage

**Requirements:**
- No coverage measurement
- No coverage goals documented
- No coverage tooling configured

**Reality:**
- E2E: 1 comprehensive test file
- Unit: 0% coverage (no unit tests)
- Integration: 0% coverage (no integration tests)

**Critical Gaps:**
- `src/services/loyaltyService.ts` (727 lines) - Complex tier calculations untested
- `src/services/orderService.ts` (562 lines) - Order creation with loyalty untested
- `src/services/emailService.ts` (1268 lines) - Email templates untested
- `src/context/UserContext.tsx` - Auth state management untested
- `src/stores/orderStore.ts` - Order state management untested

## Linting & Formatting

**ESLint:**
- Status: Not configured
- No .eslintrc file found
- No ESLint in package.json

**Prettier:**
- Status: Not configured
- No .prettierrc file found
- No Prettier in package.json

**PostCSS:**
- Configured: `postcss.config.js` present
- Plugins: postcss-import, tailwindcss, autoprefixer

**Tailwind:**
- Configured: `tailwind.config.js` present
- Custom theme with Mocha Mousse color palette

## Project Rules vs Reality

**From `.claude/project-rules.md`:**
> "Test-Driven Development (TDD): Kritik iş mantığı Vitest ile, UI bileşenleri Storybook ile izole şekilde geliştirilir."

**Reality:**
- ❌ Vitest: Not configured (no vitest.config.ts, no test scripts)
- ❌ Storybook: Not configured (no .storybook/ directory)
- ✅ Playwright: Only testing tool implemented (E2E only)

**Gap Analysis:**

| Tool/Practice | Planned (project-rules.md) | Actual Implementation | Status |
|---|---|---|---|
| Vitest | Required for unit tests | Not configured | ❌ Missing |
| Storybook | Required for component tests | Not configured | ❌ Missing |
| ESLint | Implied (code quality) | Not configured | ❌ Missing |
| Prettier | Implied (formatting) | Not configured | ❌ Missing |
| Playwright | Not mentioned | Implemented (E2E only) | ✅ Present |
| Visual Regression | Required (1px accuracy) | Not configured | ❌ Missing |

## Configuration Files

**Missing:**
- `vitest.config.ts` - Vitest configuration
- `jest.config.js` - Jest configuration (alternative)
- `.eslintrc.json` or `eslint.config.js` - Linting rules
- `.prettierrc.json` - Code formatting
- `playwright.config.ts` - Playwright configuration (test runs manually)

**Present:**
- `vite.config.ts` - Build tool only, no test configuration
- `tsconfig.json` - TypeScript compilation, no test setup

## Recommendations

**Priority 1 (Critical):**
1. Add Vitest for unit tests
2. Create `vitest.config.ts` configuration
3. Add test scripts to `package.json`: `test`, `test:watch`, `test:coverage`
4. Write unit tests for critical services (order, loyalty, email)

**Priority 2 (High):**
5. Add React Testing Library for component tests
6. Add ESLint for code quality
7. Add Prettier for consistent formatting
8. Configure Playwright properly with `playwright.config.ts`

**Priority 3 (Medium):**
9. Add Storybook for component development
10. Implement visual regression testing
11. Add test coverage reporting
12. Set coverage thresholds (minimum 80% for critical paths)

**Priority 4 (Low):**
13. Add integration tests for Context/Store interactions
14. Add E2E tests for admin flows
15. Configure pre-commit hooks for tests

## Example Test Structure (If Implemented)

**Unit Test Pattern (Vitest):**
```typescript
// src/services/orderService.test.ts (would need to be created)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createOrder } from './orderService';

describe('OrderService', () => {
  describe('createOrder', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create order with loyalty points', async () => {
      // arrange
      const orderData = { /* ... */ };

      // act
      const result = await createOrder(orderData);

      // assert
      expect(result).toBeDefined();
      expect(result.loyaltyPointsEarned).toBeGreaterThan(0);
    });

    it('should throw on invalid input', async () => {
      await expect(createOrder(null)).rejects.toThrow('Invalid order data');
    });
  });
});
```

**Component Test Pattern (React Testing Library):**
```typescript
// src/components/ProductCard.test.tsx (would need to be created)
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('should render product information', () => {
    const product = { id: '1', name: 'Test Product', price: 100 };

    render(<ProductCard product={product} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('100 TL')).toBeInTheDocument();
  });
});
```

---

*Testing analysis: 2026-01-12*
*Update when test patterns change*
