# Technology Stack

**Analysis Date:** 2026-01-12

## Languages

**Primary:**
- TypeScript 5.8.2 - All application code (`package.json`, `tsconfig.json`)

**Secondary:**
- JavaScript ES2022 - Build scripts and configuration files

## Runtime

**Environment:**
- Node.js 20 (for Firebase Cloud Functions) - `firebase.json`, `functions/package.json`
- Browser environment (Chrome, Firefox, Safari) - React SPA

**Package Manager:**
- npm - `package.json`, `package-lock.json` present
- No version requirement specified

## Frameworks

**Core:**
- React 19.2.3 with React DOM 19.2.3 - UI framework (`package.json`)
- React Router DOM 7.11.0 - Client-side routing (HashRouter)
- Firebase 11.10.0 - Backend platform (Firestore, Auth, Storage, Functions, Analytics) (`src/lib/firebase.ts`)

**Testing:**
- Playwright 1.57.0 - E2E testing (`tests/customer-journey.spec.ts`)
- No unit test framework configured (Vitest mentioned in project rules but not set up)

**Build/Dev:**
- Vite 6.2.0 - Development server and bundling (`vite.config.ts`)
- TypeScript 5.8.2 - Type checking and compilation
- PostCSS 8.5.6 - CSS processing (`postcss.config.js`)

## Key Dependencies

**Critical:**
- firebase 11.10.0 - Backend services (Firestore, Auth, Storage, Functions, Analytics) (`src/lib/firebase.ts`)
- zustand 5.0.9 - State management for order, loyalty, taste profile, subscription stores (`src/stores/`)
- tailwindcss 3.4.17 - Utility-first CSS framework with custom color palettes (`tailwind.config.js`)
- @google/genai 1.34.0 - Google Gemini AI integration for AI assistant (`src/components/AIAssistant.tsx`)
- iyzipay 2.0.64 (functions) - Turkish payment gateway integration (`functions/src/services/iyzicoService.ts`)

**Infrastructure:**
- firebase-admin 12.0.0 (functions) - Firebase Admin SDK for Cloud Functions
- firebase-functions 7.0.2 (functions) - Cloud Functions framework
- axios 1.6.0 (functions) - HTTP client for MNG Kargo and external API calls

**UI/UX:**
- @radix-ui/react-alert-dialog 1.1.15 - Accessible modal dialogs
- @radix-ui/react-dialog 1.1.15 - Dialog primitives
- lucide-react 0.562.0 - Icon library
- sonner 2.0.7 - Toast notifications
- framer-motion 12.23.26 - Animation library
- recharts 3.6.0 - Data visualization charts (`vite.config.ts` - separate chunk)

## Configuration

**Environment:**
- .env files for configuration - `.env.example` template present
- Required env vars: `VITE_FIREBASE_*`, `VITE_GEMINI_API_KEY`, `VITE_OPENWEATHER_API_KEY`
- Firebase Functions params: `MNG_CLIENT_ID`, `MNG_CLIENT_SECRET`, `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`

**Build:**
- `vite.config.ts` - Vite bundler configuration with manual chunk splitting
- `tsconfig.json` - TypeScript compiler options (ES2022 target, JSX: react-jsx, path alias @/*)
- `tailwind.config.js` - Tailwind theme customization (Mocha Mousse palette, dynamic typography)
- `postcss.config.js` - PostCSS plugins (postcss-import, tailwindcss, autoprefixer)
- `firebase.json` - Firebase Hosting and Functions deployment config

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js)
- Node.js 20+ required for Cloud Functions development
- No Docker or external dependencies required

**Production:**
- Firebase Hosting - Static SPA hosting (`firebase.json`: `dist/` public directory)
- Firebase Cloud Functions - Serverless backend (Node.js 20 runtime, `europe-west3` region)
- Browser: Modern browsers supporting ES2022 (Chrome 90+, Firefox 88+, Safari 14+)

---

*Stack analysis: 2026-01-12*
*Update after major dependency changes*
