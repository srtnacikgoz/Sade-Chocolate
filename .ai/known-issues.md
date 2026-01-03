# Known Issues & Bugs - Sade Chocolate Project

**Purpose:** Track bugs, issues, workarounds, and fixes.

**Update Frequency:** Immediately when issue discovered or resolved.

**Last Updated:** 2026-01-03 (Initial setup)

---

## 🚨 Active Issues (Need Attention)

_No active issues currently. Add issues below as they're discovered._

---

### [Example Issue - Remove When Real Issue Added]

### [ISSUE-001] Example Bug Title
**Severity:** 🔴 Critical / 🟡 Medium / 🟢 Low
**Status:** ⏳ Open / 🔄 In Progress / ✅ Fixed
**Discovered:** YYYY-MM-DD
**Affected:** What part of the app?

**Problem:**
Description of the bug or issue.

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Bug occurs

**Expected Behavior:**
What should happen?

**Actual Behavior:**
What actually happens?

**Workaround (if any):**
Temporary fix or how to avoid the issue.

**Root Cause:**
Technical explanation (if known).

**Permanent Fix (planned):**
What needs to be done to fix it properly.

**ETA:** When will it be fixed?

**Fixed:** YYYY-MM-DD (when resolved)

---

## ✅ Resolved Issues (Last 30 Days)

_No resolved issues yet. They'll appear here after fixes._

---

## 🔍 Monitoring (Potential Issues)

### [WATCH-001] TypeScript Strict Mode Compliance
**Watch For:** Type errors creeping in
**Risk:** Medium
**Mitigation:** Run `npm run build` before commits

**Why We're Watching:**
New code might introduce `any` types or type errors that weren't caught during development.

**Indicators of Problem:**
- Build fails with TypeScript errors
- Excessive `any` types in codebase
- Type assertions (`as`) used frequently

**Action if Detected:**
1. Review new code
2. Add proper types
3. Remove `any` usage
4. Run type check before committing

**Review:** Weekly (during code review)

---

### [WATCH-002] Firebase Quota/Limits
**Watch For:** Exceeding Firebase free tier limits
**Risk:** Low (early development)
**Mitigation:** Monitor Firebase console

**Why We're Watching:**
Firebase has free tier limits:
- Firestore: 50k reads/day, 20k writes/day
- Auth: Unlimited
- Storage: 5GB total, 1GB/day download

**Indicators of Problem:**
- Firebase console shows warning
- API calls start failing
- "Quota exceeded" errors

**Action if Detected:**
1. Check Firebase console for usage
2. Optimize queries (reduce reads)
3. Consider upgrade if necessary
4. Add caching to reduce calls

**Review:** Monthly

---

### [WATCH-003] Build Size
**Watch For:** Bundle size growing too large
**Risk:** Low
**Mitigation:** Check `dist/` size periodically

**Why We're Watching:**
Large bundles = slow load times = poor UX.

**Target Metrics:**
- Initial JS bundle: < 500KB (gzipped)
- Total assets: < 2MB
- Lighthouse score: > 90

**Indicators of Problem:**
- Build output > 500KB
- Slow page loads
- Lighthouse performance score drops

**Action if Detected:**
1. Analyze bundle (use Vite bundle analyzer)
2. Code splitting
3. Lazy loading
4. Remove unused dependencies

**Review:** Monthly or when adding large dependencies

---

## 🐛 Common Error Patterns

### Pattern 1: Firebase "Permission Denied"
**Symptoms:**
```
FirebaseError: Missing or insufficient permissions
```

**Common Causes:**
- User not authenticated
- Firestore rules too restrictive
- Trying to access other user's data

**Quick Fix:**
1. Check `auth.currentUser` exists
2. Verify Firestore rules allow the operation
3. Check document ownership

**Prevention:**
- Always check auth state before Firebase calls
- Test with different user roles
- Review security rules

---

### Pattern 2: TypeScript "Type 'unknown' is not assignable"
**Symptoms:**
```
Type 'unknown' is not assignable to type 'Product'
```

**Common Causes:**
- Firebase doc data is `unknown` by default
- Need to type assert or validate

**Quick Fix:**
```typescript
// ❌ BAD
const data = doc.data(); // unknown

// ✅ GOOD
const data = doc.data() as Product; // typed

// ✅ BETTER (with validation)
const data = doc.data();
if (!isProduct(data)) throw new Error('Invalid data');
```

**Prevention:**
- Define type guards (`isProduct`, `isUser`, etc.)
- Use TypeScript generics for Firebase calls
- Add runtime validation

---

### Pattern 3: React "Cannot read property of undefined"
**Symptoms:**
```
TypeError: Cannot read property 'name' of undefined
```

**Common Causes:**
- Data not loaded yet (async)
- Optional chaining missing
- Null/undefined not handled

**Quick Fix:**
```typescript
// ❌ BAD
<div>{product.name}</div>

// ✅ GOOD
<div>{product?.name ?? 'Loading...'}</div>

// ✅ BETTER
{product ? <div>{product.name}</div> : <div>Loading...</div>}
```

**Prevention:**
- Always handle loading states
- Use optional chaining `?.`
- Add null checks

---

### Pattern 4: Vite "Module not found"
**Symptoms:**
```
Error: Cannot find module './Component'
```

**Common Causes:**
- Wrong import path
- Missing file extension
- Case sensitivity (Windows vs Linux)

**Quick Fix:**
1. Check file exists
2. Check import path (relative vs absolute)
3. Check file extension (.tsx, .ts)
4. Check case (Component vs component)

**Prevention:**
- Use absolute imports (configure Vite)
- Consistent naming (always PascalCase for components)
- Use IDE autocomplete

---

## 💊 Common Workarounds

### Workaround 1: Firebase Emulator Connection Issues
**Problem:** Can't connect to Firebase emulators

**Symptoms:**
- "ECONNREFUSED" errors
- App trying to use production Firebase

**Quick Fix:**
1. Check emulators running: `firebase emulators:start`
2. Check ports: 8080 (Auth), 8081 (Firestore)
3. Ensure app configured for emulators:
   ```typescript
   if (location.hostname === 'localhost') {
     connectAuthEmulator(auth, 'http://localhost:9099');
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

---

### Workaround 2: Hot Reload Not Working
**Problem:** Changes not reflected in browser

**Symptoms:**
- Edit file, no update in browser
- Need to manually refresh

**Quick Fix:**
1. Check console for errors
2. Restart dev server (`npm run dev`)
3. Clear browser cache
4. Check file is in `src/` or `components/` (not `node_modules/`)

---

### Workaround 3: Environment Variables Not Loading
**Problem:** `import.meta.env.VITE_*` is undefined

**Symptoms:**
- Environment variables undefined
- "Cannot read property of undefined"

**Quick Fix:**
1. Check `.env.local` exists
2. Check variable name starts with `VITE_`
   ```bash
   # ❌ BAD
   API_KEY=abc123

   # ✅ GOOD
   VITE_API_KEY=abc123
   ```
3. Restart dev server (env changes need restart)
4. Check `.env.local` not in `.gitignore` (it should be!)

---

## 📊 Issue Metrics

### Current Status (2026-01-03)
```
🚨 Active Issues:     0 (clean slate!)
✅ Resolved (30d):    0
🔍 Watching:          3 areas
📈 Avg Resolution:    N/A (no issues yet)
```

### Issue Categories (When They Occur)
```
Firebase:       0%
TypeScript:     0%
React:          0%
Build/Deploy:   0%
UI/UX:          0%
Performance:    0%
```

---

## 🔧 Debugging Checklist

### When Something Breaks

**1. Identify Scope (2 min)**
- [ ] Can you reproduce it?
- [ ] Does it happen in dev or production?
- [ ] Does it happen for all users or just you?
- [ ] What changed recently?

**2. Check Console (2 min)**
- [ ] Browser console errors?
- [ ] Network tab errors?
- [ ] React dev tools errors?

**3. Check Environment (2 min)**
- [ ] Correct `.env.local` values?
- [ ] Dependencies installed (`node_modules/` exists)?
- [ ] Running latest code (`git pull`)?

**4. Isolate Issue (5 min)**
- [ ] Comment out recent changes
- [ ] Bisect git commits (find breaking commit)
- [ ] Minimal reproduction (smallest code that breaks)

**5. Search & Ask (5 min)**
- [ ] Check this file (known issue?)
- [ ] Google error message
- [ ] Check Stack Overflow
- [ ] Ask in project chat/Discord

**6. Fix & Document (varies)**
- [ ] Implement fix
- [ ] Test fix works
- [ ] Update this file (add to resolved or update workaround)
- [ ] Commit with clear message

---

## 🎯 Issue Resolution Protocol

### Priority Levels

| Severity | Description | Response Time |
|----------|-------------|---------------|
| 🔴 Critical | App broken, can't develop | Fix immediately (<1 hour) |
| 🟡 Medium | Feature broken, workaround exists | Fix within 1-2 days |
| 🟢 Low | Minor bug, doesn't block work | Fix when convenient |

### Resolution Steps
1. **Reproduce:** Confirm issue exists
2. **Document:** Add to this file (active issues)
3. **Workaround:** Find temporary fix (if needed)
4. **Fix:** Implement permanent solution
5. **Test:** Verify fix works, no side effects
6. **Document:** Move to resolved, update `.ai/active-work.md`
7. **Prevent:** Add to common patterns or instructions to avoid recurrence

---

## 🔗 Related Resources

### Internal
- **Development Rules:** `.ai/instructions.md`
- **File Locations:** `.ai/project-map.md`
- **Active Work:** `.ai/active-work.md`
- **Main Project Issues:** `C:\dev\Sade Chocolate\📋 Dokümantasyon Merkezi\AI Memory\06-Known-Issues.md`

### External
- **Firebase Status:** https://status.firebase.google.com/
- **React Docs:** https://react.dev/
- **TypeScript Docs:** https://www.typescriptlang.org/docs/
- **Vite Docs:** https://vitejs.dev/

---

## 📝 How to Report Issue

### For Human Developer
1. Copy issue template (from top of this file)
2. Fill in all sections
3. Add to **Active Issues**
4. Update metrics at bottom
5. Mention in `.ai/active-work.md` if blocking

### For AI Agent
Same process, plus:
- Alert human if severity is CRITICAL
- Propose fix if you can implement
- Link to related code/files
- Add to monitoring if pattern (not one-time bug)

---

## 🚨 Emergency Procedures

### Production is Down
1. **Don't panic**
2. Check Firebase status (external issue?)
3. Check recent deployments (rollback if needed)
4. Check Firebase console (quota exceeded?)
5. Check domain/DNS (expired?)
6. Notify users (status page/social)
7. Fix issue
8. Post-mortem (what happened, how to prevent)

### Lost Data / Accidental Delete
1. **Don't panic**
2. Check Firebase console (can restore?)
3. Check git history (code deleted?)
4. Check backups (if configured)
5. Recreate if necessary
6. Add safeguards to prevent recurrence

### Secrets Leaked (API Keys in Git)
1. **Act immediately**
2. Revoke compromised keys (Firebase console)
3. Generate new keys
4. Update `.env.local`
5. Redeploy
6. Check git history (remove from all commits - use git-filter-branch)
7. Add to `.gitignore` (should already be there)

---

**Maintained By:** Human Developer + AI Agents
**Last Updated:** 2026-01-03 (Initial setup)
**Next Review:** Weekly or when issues occur

---

## 📌 Quick Reference

**Most Common Fixes:**
1. Restart dev server (`Ctrl+C`, `npm run dev`)
2. Clear cache (`Ctrl+Shift+R` in browser)
3. Reinstall dependencies (`rm -rf node_modules && npm install`)
4. Check `.env.local` values

**Emergency Contacts:**
- Firebase Support: https://firebase.google.com/support
- Project Lead: (You!)

**Fast Checks:**
```bash
# TypeScript errors
npm run build

# Linting
npm run lint

# Check for secrets in git
git log -p | grep -i "api_key\|secret\|password"
```
