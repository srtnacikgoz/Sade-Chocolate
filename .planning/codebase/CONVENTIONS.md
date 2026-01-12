# Coding Conventions

**Analysis Date:** 2026-01-12

## Naming Patterns

**Files:**
- PascalCase.tsx for React components (Header.tsx, CartDrawer.tsx, ProductCard.tsx)
- camelCase.ts for services and utilities (orderService.ts, shippingUtils.ts)
- camelCase.ts for type files (order.ts, tasteProfile.ts, loyalty.ts)
- No test files in src/ (only E2E tests in tests/ directory)

**Functions:**
- camelCase for all functions (addToCart, calculateShipping, handleSubmit)
- No special prefix for async functions (same naming as sync)
- handle* prefix for event handlers (handleClick, handleSubmit, handleChange)
- Example from `src/context/CartContext.tsx`: `addToCart`, `removeFromCart`, `clearCart`

**Variables:**
- camelCase for variables (cartItems, userProfile, isLoading)
- UPPER_SNAKE_CASE for constants exported from modules (example: `COLLECTIONS` constant)
- No underscore prefix (TypeScript makes _ prefix unnecessary)
- Example from `src/stores/orderStore.ts`: `unsubscribeListener`, `isLoading`, `error`

**Types:**
- PascalCase for interfaces (User, Product, Order, CartItem)
- No "I" prefix for interfaces (User not IUser)
- PascalCase for type aliases (OrderStatus, RefundRecord, CancellationRecord)
- Union types for string literals: `type OrderStatus = 'Pending Payment' | 'pending' | 'In Production'`
- Example from `src/types/order.ts`: `Order`, `OrderTag`, `TrackingInfo`

## Code Style

**Language:**
- Turkish for all UI text, comments, documentation
- Strategic choice: Target audience is Turkish-speaking

**Formatting:**
- 2 space indentation (implicit from code structure)
- Single quotes in import statements: `import React from 'react'`
- Double quotes in JSX attributes: `className="container"`
- Semicolons required (consistently used throughout)
- Line length: Components typically 200-500 lines max (per project rules)
- No Prettier config file found

**Linting:**
- No ESLint configuration file found (.eslintrc missing)
- No automated linting enforced
- Gap: Project rules mention linting but not implemented

## Import Organization

**Order:**
1. React and external packages (react, firebase, lucide-react, etc.)
2. Internal types (import type statements)
3. Context/Store hooks (useCart, useUser, useOrderStore)
4. Services and utilities
5. Components
6. Constants and data

**Example from `src/pages/Home.tsx`:**
```typescript
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { COLLECTIONS } from '../constants';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { QuickViewModal } from '../components/QuickViewModal';
import { Product, BoxConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package } from 'lucide-react';
```

**Grouping:**
- No blank lines between groups (not consistently applied)
- No alphabetical sorting enforced

**Path Aliases:**
- `@/*` maps to root directory (`tsconfig.json`)
- Relative imports used throughout (../, ./)
- Example: `import { db } from '../lib/firebase'`

## Error Handling

**Patterns:**
- Try/catch blocks in some services, missing in others
- Console.error for logging errors
- Errors often not thrown to caller
- Example from `src/services/loyaltyService.ts`:
  ```typescript
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return [];  // Silent failure
  }
  ```

**Error Types:**
- No custom Error classes defined
- Generic Error thrown when needed
- Firebase errors caught and logged

**Async Error Handling:**
- Prefer try/catch over .catch() chains
- Example from `src/stores/orderStore.ts`:
  ```typescript
  try {
    await updateOrder(orderId, { status: newStatus });
    set({ orders: updatedOrders });
  } catch (error: any) {
    console.error('❌ Error updating order status:', error);
    set({ error: error.message });
    throw error;
  }
  ```

## Logging

**Framework:**
- Console.log and console.error only
- No structured logging library
- Debug statements left in production code

**Patterns:**
- Emoji prefixes for visual scanning: `console.log('⚠️ Warning')`, `console.error('❌ Error')`
- Turkish comments with emoji section markers
- Example from `src/stores/orderStore.ts`:
  ```typescript
  // 🔥 OFFLINE PERSISTENCE
  // 🔄 UPDATE ORDER STATUS
  // 📦 ADD TRACKING NUMBER
  ```

**Locations:**
- `src/stores/orderStore.ts` (line 161): `console.log('⚠️ Order store already initialized')`
- `src/stores/loyaltyStore.ts` (multiple debug logs)
- `src/context/UserContext.tsx` (lines 346, 349): Order creation logging
- `src/utils/aiResponseGenerator.ts` (line 588): Debug flow output

**Issue:** Console statements should be removed from production code or moved to proper logging service

## Comments

**Style: Turkish Documentation**
- All comments in Turkish
- Detailed business logic explanations
- Example from `src/utils/shippingUtils.ts`:
  ```typescript
  /**
   * Shipping Utilities - Blackout Days & Shipping Date Calculations
   *
   * Çikolata lojistiği için gönderim kuralları:
   * - Cuma, Cumartesi, Pazar günleri kargolama yapılmaz (Blackout Days)
   * - Hafta sonu depoda bekleyen ürünler erime riski taşır
   */
  ```

**Emoji Section Markers:**
- Used for visual organization and quick scanning
- Example from `src/stores/orderStore.ts`:
  ```typescript
  // --- INITIAL MOCK DATA ---
  // 🔥 OFFLINE PERSISTENCE
  // 🔄 UPDATE ORDER STATUS
  ```

**Type Documentation:**
- Inline comments for complex types
- Example from `src/types/order.ts`:
  ```typescript
  export type OrderStatus =
    | 'Pending Payment'    // EFT/Havale ödemesi bekleniyor
    | 'pending'            // Lowercase alternatif (Checkout uyumu)
    | 'In Production'
  ```

**TODO Comments:**
- Format: `// TODO: description`
- Example from `src/services/orderService.ts` (line 352): `// TODO: Send tier upgrade email notification`

## Function Design

**React Components:**
```typescript
// From CartContext.tsx - Context Provider pattern
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State and logic
  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

// Custom hook export
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
```

**Zustand Stores:**
```typescript
// From orderStore.ts - Store pattern with actions
export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  isLoading: true,
  error: null,

  initialize: async () => { /* ... */ },
  updateOrderStatus: async (orderId, newStatus) => { /* ... */ },
  addTracking: async (orderId, carrier, trackingNumber) => { /* ... */ }
}));
```

**Service Functions:**
```typescript
// From orderService.ts - Async service functions
export async function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  // Implementation
}
```

**Size:**
- No strict limit enforced
- Project rules state 200-500 lines max, but many components exceed this:
  - `src/pages/Checkout.tsx`: 2394 lines
  - `src/pages/Admin.tsx`: 2250 lines
  - `src/components/admin/tabs/OrderManagementTab.tsx`: 3672 lines (172KB)

**Parameters:**
- No strict max on parameter count
- Object destructuring in React component props:
  ```typescript
  export const Header: React.FC<{ onMenuClick: () => void; onSearchClick: () => void }> = ({ onMenuClick, onSearchClick }) => {
  ```

**Return Values:**
- Explicit return statements
- Early returns for guard clauses
- Example: `if (!user) return null;`

## Module Design

**Exports:**
- Named exports preferred for services and utilities
- Default exports for React components (inconsistent - some use named)
- Example from `src/context/CartContext.tsx`:
  ```typescript
  export const CartProvider: React.FC = ...
  export const useCart = ...
  ```

**Barrel Files:**
- Not used (no index.ts re-exports)
- Direct imports from files throughout

**Firebase Imports:**
```typescript
// Centralized Firebase instance from lib/firebase.ts
import { db, auth, functions } from '../lib/firebase';

// Direct Firebase SDK imports when needed
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
```

## State Management Patterns

**React Context - Lazy Initialization:**
```typescript
// From CartContext.tsx - Initialize from localStorage
const [items, setItems] = useState<CartItem[]>(() => {
  const saved = localStorage.getItem('sade_cart');
  return saved ? JSON.parse(saved) : [];
});

// Persist to localStorage on change
useEffect(() => {
  localStorage.setItem('sade_cart', JSON.stringify(items));
}, [items]);
```

**Zustand - Real-time Subscriptions:**
```typescript
// From orderStore.ts - Firestore real-time listener
unsubscribeListener = subscribeToOrders(
  (orders) => { set({ orders, isLoading: false }); },
  (error) => { set({ error: error.message }); }
);
```

**TypeScript Patterns:**
- Strict null checking enabled
- Generic types: `React.FC<Props>`, `create<Store>()`
- Type unions for status values: `'processing' | 'shipped' | 'cancelled'`
- Path alias: `@/*` maps to root
- Use of `any` type common (type safety gap):
  ```typescript
  // From UserContext.tsx line 156
  setUser({ ... } as any);
  ```

---

*Convention analysis: 2026-01-12*
*Update when patterns change*
