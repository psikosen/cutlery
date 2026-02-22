# Code Review: Shadow System

**Project**: Shadow System — A gamified habit tracker with genetic creature evolution
**Stack**: React 19 + TypeScript + Vite (frontend), Express + PostgreSQL (backend), IndexedDB (offline), PWA

---

## Critical Issues

### 1. Variable Used Before Declaration (`gameEngine.ts:768`)

In `completeTask()`, `skillResult` and `abilityResult` are referenced on line 768 in the call to `checkAchievements()`, but they are not declared until lines 785–802. This will cause a runtime `ReferenceError` because `let`/`const` declarations are not hoisted.

```ts
// Line 768 — references skillResult and abilityResult BEFORE they exist
const achResult = checkAchievements(updatedPlayer, updatedCreatures, achievements, skillResult.skills, abilityResult.abilities);

// Lines 785-802 — declared AFTER use
const skillResult = checkSkillUnlocks(updatedCreatures, currentSkills);
const abilityResult = checkAbilityUnlocks(...);
```

**Fix**: Move the `checkAchievements` call to after `skillResult` and `abilityResult` are declared. This is a **crash bug** in the core task completion pipeline.

### 2. Insecure Default Secrets (`server/src/middleware/auth.ts:10`, `server/src/routes/auth.ts:14`)

```ts
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const MFA_ENC_KEY = process.env.MFA_ENCRYPTION_KEY || '0'.repeat(64);
```

Both fall back to hardcoded values. If the server accidentally starts without env vars set (e.g., a misconfigured deploy), it will silently run with known secrets. The server should **refuse to start** if these are not set (at minimum in `production` mode).

### 3. MFA Encryption Key Is All Zeros in `.env.example`

`server/.env.example` sets `MFA_ENCRYPTION_KEY=000...000`. If someone copies this file to `.env` without changing it, MFA secrets will be encrypted with a known key — effectively no encryption.

---

## Security Issues

### 4. Session Store Uses `userId` as Primary Key (`authService.ts:111-118`)

The client-side IndexedDB sessions store uses `userId` as the keyPath. This means a user can only have one session at a time, but more importantly, calling `db.put('sessions', session)` overwrites by `userId`, not `sessionId`. If the MFA verification flow happens to race or fail, it could corrupt the session record. A per-session ID would be safer.

### 5. Backup Codes Stored in Plaintext (Client-Side — `authService.ts:303`)

During MFA setup on the client side, backup codes are stored in IndexedDB under `backup_codes` as plain strings. The server-side correctly hashes them with bcrypt. The client-side should either not store them at all, or at minimum encrypt them like MFA secrets.

### 6. No Rate Limiting on Server MFA Verification (`server/src/routes/auth.ts:214-280`)

The `/auth/mfa/verify` endpoint has no rate limiting or lockout after failed attempts. An attacker with a valid partial session (post-OTP, pre-MFA) could brute-force 6-digit TOTP codes. With a 30-second TOTP window and ~1M combinations, this is feasible without throttling.

### 7. Token Returned in MFA Verification Response Could Allow Session Fixation

In `auth.ts:245-246`, when a backup code is accepted during MFA verification, a new JWT is generated and returned. However, the old partial-session JWT remains valid until expiry. The old token should be invalidated or the session should be rotated.

---

## Bugs

### 8. `handleFuseGenes` Doesn't Delete Removed Genes from IndexedDB (`useGameState.tsx:377`)

```ts
// Note: we don't delete genes from IDB for simplicity; they're filtered in state
```

The comment acknowledges this, but it means IndexedDB will accumulate stale gene records indefinitely. On reload, these ghost genes will be loaded back into state, causing stale/phantom data. Genes removed during fusion should be deleted from persistence.

### 9. Daily Reset Timer Leaks Interval (`useGameState.tsx:291-296`)

```ts
const timer = setTimeout(() => {
  performDailyReset();
  const interval = setInterval(performDailyReset, 24 * 60 * 60 * 1000);
  return () => clearInterval(interval); // This return value is never used
}, msUntilMidnight);
```

The cleanup function returned from inside `setTimeout` is never captured or called. The `setInterval` created at midnight will never be cleared, leaking an interval on every component remount.

### 10. Creature Reference Equality Check for Persistence (`useGameState.tsx:347-349`)

```ts
const original = s.creatures.find(o => o.id === c.id);
if (original !== c) await saveCreature(c);
```

Since `completeTask` creates new creature objects via spread (`{ ...creature }`), `original !== c` will **always** be true. This means every creature gets persisted on every task completion, not just the ones that changed. This is wasteful but not incorrect—just an FYI.

---

## Architecture Concerns

### 11. Dual Auth Systems

The codebase has **two complete auth implementations**:
- **Client-side** (`src/services/auth/`): OTP + MFA via IndexedDB, in-memory OTP store
- **Server-side** (`server/src/routes/auth.ts`): OTP + MFA via PostgreSQL, bcrypt

The `useAuth` hook and `LoginScreen` appear to use the client-side system, while the server routes exist but are only used via the `api.ts` client. It's unclear which path is actually active. Having two systems increases the attack surface and maintenance burden. Consolidate to one.

### 12. No Input Validation on Game API Routes

The server game routes (`server/src/routes/game.ts`) accept client-provided data (player stats, creature data, gene data) and write it directly to PostgreSQL with no validation:

```ts
// PUT /game/player — trusts everything from the client
const player = req.body;
await pool.query('UPDATE players SET name = $1, hunter_rank = $2, total_power = $3, ...');
```

A malicious client can set arbitrary stats (total_power: 999999, gold: Infinity, etc.). All game state mutations should be validated server-side, or the server should compute the canonical state from task completions rather than accepting it from the client.

### 13. No Request Body Size/Shape Validation

None of the Express routes validate the shape or types of `req.body`. A malformed request could cause unexpected behavior or errors. Consider using a validation library (zod, joi) for request schemas.

---

## Performance

### 14. Sequential Creature Saves in `initializeGame` (`useGameState.tsx:310`)

```ts
for (const c of creatures) await saveCreature(c);
```

Six sequential IndexedDB writes. These could be batched in a single transaction (like `saveTasks` does with `tx.store.put`).

### 15. Sequential Backup Code Inserts (`server/src/routes/auth.ts:307-313`)

```ts
for (const code of backupCodes) {
  const hash = await bcrypt.hash(normalized, BCRYPT_ROUNDS);
  await pool.query('INSERT INTO backup_codes ...');
}
```

Eight sequential bcrypt hashes + DB inserts. These could be parallelized with `Promise.all`, reducing MFA setup latency significantly since bcrypt with 12 rounds is slow.

### 16. HubScreen Renders 7 `CreatureCanvas` Components

The HubScreen renders a main creature canvas (280x280) plus six mini canvases (48x48) in the domain switcher. Each `CreatureCanvas` runs the full procedural rendering pipeline with canvas 2D operations. On lower-end mobile devices this could cause jank during scrolling.

---

## Code Quality

### 17. Duplicated Constants

`CREATURE_DOMAINS` in `gameEngine.ts:52-59` is an exact duplicate of `CREATURE_TO_DOMAIN` from `types/index.ts:311-318`. Use the existing constant.

### 18. Duplicated `constantTimeEqual` Function

`constantTimeEqual` is defined in both `otpService.ts:119-126` and `mfaService.ts:153-160`. Extract to a shared utility.

### 19. `creatureRenderer.ts` Is 1,881 Lines

This single file is extremely long for a renderer. Consider splitting into sub-modules: body rendering, tentacles, eyes, ambient effects, etc.

### 20. Service Worker Only Caches Two Assets (`sw.js:6-9`)

```js
const STATIC_ASSETS = ['/', '/index.html'];
```

The SW installs with only two assets cached. The Vite build output (JS bundles, CSS, fonts) won't be in the pre-cache, so the first offline visit after install will fail to load the app. Either use a Vite PWA plugin (like `vite-plugin-pwa`) that auto-generates the asset manifest, or manually include the build output patterns.

---

## Minor Issues

- **`package.json` name** is `"shadow-temp"` — probably should be renamed to match the project.
- **No test files** exist anywhere in the project. The game engine logic (gene fusion, evolution, streaks, achievements) is complex enough to warrant unit tests.
- **`eslint.config.js`** exists but there's no `lint` script for the server package.
- **`server/package.json`** was not committed to `master` based on the diff — make sure the server dependencies are tracked.
- **Missing `.gitignore` for `server/`** — `server/node_modules/` and `server/.env` should be ignored (the root `.gitignore` may already cover this).

---

## Summary

| Severity | Count |
|----------|-------|
| Critical (crash/security) | 3 |
| Security | 4 |
| Bug | 3 |
| Architecture | 3 |
| Performance | 3 |
| Code Quality | 4 |

**Top priorities**:
1. Fix the `completeTask()` variable-before-declaration crash (Issue #1)
2. Require secrets in production, reject defaults (Issue #2)
3. Add rate limiting to MFA verification (Issue #6)
4. Delete fused genes from IndexedDB (Issue #8)
5. Fix the interval leak in daily reset timer (Issue #9)
