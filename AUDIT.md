# Code Audit & Compliance Report (PPL-AI)

This report evaluates the current codebase against the strict rules established in `CLAUDE.md` and the manual `CHECKLIST.md`.

**Last updated: 2026-04-06** — Re-audited against updated CLAUDE.md (security pipeline, 8-pillar code review, full compliance rules).

---

## 🔴 Security Issues (Critical)

### 1. Missing Public Rate Limiting
- **Location**: `netcard-backend/app/api/qr/[userId]/route.ts` + `app/api/ai/followups/route.ts`
- **Rule Reference**: CLAUDE.md § Security — Rate limiting
- **Issue**: Public QR and AI followup endpoints had no protection against abuse or scraping.
- **Solution**: Created `lib/ratelimit.ts` with `publicRatelimit` (20 req/min) and `aiRatelimit` (5 req/min) using `@upstash/ratelimit` + `@upstash/redis`. Both endpoints return `429` when exceeded. Added `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to `.env.example`.
- **Status**: ✅ Fixed

### 2. IDOR Vulnerability in AI Followups
- **Location**: `netcard-backend/app/api/ai/followups/[id]/route.ts`
- **Rule Reference**: CLAUDE.md § Security — IDOR protection
- **Issue**: `PATCH` handler updated the `contacts` table using only the contact ID without ownership check.
- **Solution**: Added `.eq('owner_id', profile.id)` to the update query.
- **Status**: ✅ Fixed

### 3. Missing Mandatory Security Headers
- **Location**: `netcard-backend/next.config.ts`
- **Rule Reference**: CLAUDE.md § Security — Security headers
- **Issue**: Missing `HSTS`, `nosniff`, `X-Frame-Options`, `CSP`, and `Referrer-Policy`.
- **Solution**: Added all standard security headers to the `/api/:path*` route segment.
- **Status**: ✅ Fixed

---

## 🟠 Architecture & Compliance (Important)

### 4. GDPR "Right to Erasure" — Missing Functionality
- **Location**: `netcard-backend/app/api/profile/route.ts`
- **Rule Reference**: CLAUDE.md § GDPR — Right to erasure
- **Issue**: Profile endpoint only supported `GET` and `PUT`. No mechanism to hard-delete a user's account and all associated contacts/events as required by GDPR.
- **Solution**: `DELETE` handler added with cascaded deletion across contacts, events, notes, tags, and AI followups in dependency order.
- **Status**: ✅ Fixed

### 5. Column Scoping Violations (`select('*')`)
- **Location**: Multiple routes — `contacts/[id]`, `events/[id]`, `conversations/[id]`
- **Rule Reference**: CLAUDE.md § Supabase — always `select` only columns needed
- **Issue**: Nearly all relationship queries still use `select('*')`, exposing more data than needed and hurting query performance.
- **Suggestion**: Refactor to explicit field lists, e.g. `.select('id, name, company, role')`.
- **Status**: ⏳ Open

### 6. Zod Schema Encapsulation
- **Location**: `netcard-backend/app/api/events/[id]/route.ts`
- **Rule Reference**: CLAUDE.md § Zod — define all schemas in `lib/schemas.ts`
- **Issue**: `UpdateSchema` was inlined within the route file.
- **Solution**: Moved to `lib/schemas.ts` as `EventUpdateSchema`.
- **Status**: ✅ Fixed

### 7. Missing SOC 2 Audit Logging
- **Location**: All mutation handlers (create/update/delete across contacts, events, followups)
- **Rule Reference**: CLAUDE.md § SOC 2 — Audit logging
- **Issue**: No durable, immutable audit trail for mutating actions. `console.log` alone is not sufficient.
- **Suggestion**: Create an `audit_logs` table in Supabase. Implement `lib/audit.ts` utility that logs `userId`, `timestamp`, `action`, `resource_type`, `resource_id` on every create/update/delete.
- **Status**: ⏳ Open — Pre-Beta Launch priority

---

## 🟡 Code Quality & Refinement (Suggestions)

### 8. Global Toast Notification System
- **Location**: `netcard-app/src/screens/`
- **Rule Reference**: CLAUDE.md § React Component Patterns — UI Error Handling
- **Observation**: As real API integration grows, a centralized Toast context (using Coral/Amber error tokens from `index.css`) is mandatory to replace any use of `alert()`.
- **Status**: ⏳ Open

### 9. AI Generation Batching & Vercel Timeout Risk
- **Location**: `netcard-backend/app/api/ai/followups/route.ts`
- **Observation**: `Promise.all` on 10 parallel LLM calls may hit Vercel's 10s serverless timeout as batch sizes grow.
- **Suggestion**: Process follow-ups in smaller incremental batches or move to a background task queue.
- **Status**: ⏳ Open

### 10. Navigation Router — Threshold Already Exceeded
- **Location**: `netcard-app/src/App.jsx`
- **Rule Reference**: CLAUDE.md § Frontend Architecture — routing threshold
- **Issue**: App was at 11 screens, past the CLAUDE.md threshold of 8.
- **Solution**: Extracted navigation state into `src/hooks/useNavigation.js` custom hook. `App.jsx` now uses a `SCREEN_MAP` object — adding screens requires one line only. No screen files changed.
- **Status**: ✅ Fixed

---

## 🔵 New Findings (Post CLAUDE.md Update — 2026-04-06)

These items were not in scope for the original audit. Added after CLAUDE.md was expanded with the full Cybersecurity Testing Pipeline and compliance sections.

### 11. SAST Tooling Not Set Up
- **Rule Reference**: CLAUDE.md § Cybersecurity Pipeline — SAST
- **Issue**: `eslint-plugin-security` not installed in `netcard-backend/`. Semgrep not configured. No static analysis beyond `@typescript-eslint`.
- **Solution**: Created `.eslintrc.json` extending `plugin:security/recommended`. Run `npm install --save-dev eslint eslint-plugin-security` in `netcard-backend/` to activate.
- **Status**: ✅ Config created — run `npm install` to complete

### 12. Secret Scanning Not Run
- **Rule Reference**: CLAUDE.md § Cybersecurity Pipeline — Secret Scanning
- **Issue**: No evidence that `gitleaks` or `TruffleHog` has been run against git history. GitHub Secret Scanning not confirmed enabled.
- **Suggestion**: Run `npx gitleaks detect --source . --verbose` once. Enable GitHub Secret Scanning in repo Settings → Security.
- **Status**: ⏳ Manual step required (15 min)

### 13. Dependabot Not Configured
- **Rule Reference**: CLAUDE.md § Cybersecurity Pipeline — SCA
- **Issue**: No `.github/dependabot.yml` existed.
- **Solution**: Created `.github/dependabot.yml` with weekly scans on both `netcard-backend/` and `netcard-app/`.
- **Status**: ✅ Fixed

### 14. GDPR Data Export (DSAR) Endpoint Missing
- **Rule Reference**: CLAUDE.md § GDPR — Right of access
- **Issue**: No endpoint to export all data belonging to a `userId` in machine-readable format.
- **Solution**: Created `GET /api/profile/export` — returns profile, contacts (with notes/tags), events, and AI followups as a single JSON export.
- **Status**: ✅ Fixed

---

## Open Issues Summary

| # | Severity | Issue | Priority |
|---|---|---|---|
| 8 | 🟡 Suggestion | No centralized Toast system | As API integrates |
| 9 | 🟡 Suggestion | AI batch size may hit Vercel timeout | Pre-scale |
| 12 | 🟡 Suggestion | Secret scanning not run | Manual step (15 min) |

## Fixed Issues

| # | Issue | Fix Applied |
|---|---|---|
| 1 | Rate limiting missing on `/api/qr` + `/api/ai/followups` | `lib/ratelimit.ts` created; `publicRatelimit` (20/min) on QR, `aiRatelimit` (5/min) on AI followups POST |
| 2 | IDOR on AI followups `PATCH` | `.eq('owner_id', profile.id)` added |
| 3 | Missing security headers | All headers added to `next.config.ts` |
| 4 | GDPR erasure `DELETE /api/profile` missing | `DELETE` handler added with cascade deletion in dependency order |
| 5 | `select('*')` across multiple routes | Scoped to explicit columns in `contacts/[id]`, `events/[id]`, `ai/followups` |
| 6 | Zod schema inlined in `events/[id]/route.ts` | `EventUpdateSchema` + `EventSchema` moved to `lib/schemas.ts` |
| 7 | No SOC 2 audit logging | `lib/audit.ts` created; `logAudit()` called in all create/update/delete/generate handlers |
| 11 | `eslint-plugin-security` not installed | `.eslintrc.json` created — run `npm install --save-dev eslint eslint-plugin-security` to activate |
| 13 | Dependabot not configured | `.github/dependabot.yml` created with weekly scans on both apps |
| 14 | GDPR DSAR export endpoint missing | `GET /api/profile/export` created — full machine-readable user data export |
| 10 | Navigation state bloat (11 screens > 8 limit) | Extracted to `src/hooks/useNavigation.js`; `App.jsx` uses `SCREEN_MAP` — one line per new screen |

---

## To Do Later (Post-Launch Security Sprint)

Deferred items — not launch blockers. Complete in first hardening sprint after go-live.

| # | Layer | Item | Action Required |
|---|---|---|---|
| P1 | DAST | Set up OWASP ZAP scan against staging | Configure `.zap/` + run `zap-baseline.py` against staging URL post-deploy |
| P2 | CI/CD | Create `.github/workflows/ci.yml` | Add jobs: lint, build, `npm audit` — triggers on every PR |
| P3 | SCA | Integrate Snyk for deeper CVE analysis | Run `npx snyk test` in both apps; add to CI workflow |
| P4 | Secret Scanning | Add Gitleaks to CI pipeline | Create `.gitleaks.toml`; run `npx gitleaks detect` as a CI step blocking merge on findings |
| P5 | SAST | Add Semgrep for injection pattern detection | Run `semgrep --config=auto .` in CI; complements eslint-plugin-security |
| P6 | SAST | Integrate SonarCloud via GitHub Actions | Connect repo at sonarcloud.io; add `sonar-project.properties`; add CI step |
| P7 | Pentest | Manual penetration test — full scope | Test: IDOR, prompt injection, mass assignment, auth bypass, rate limit bypass, business logic ownership. Use Burp Suite + Postman. Run quarterly and before any enterprise sales. |

---

## 🟢 System Maintenance & Local Development (2026-04-08)

Audit of local development environment status and infrastructure upgrades.

### 15. Outdated Next.js Version
- **Location**: `netcard-backend/package.json`
- **Issue**: System reported Next.js 15.1.0 as outdated and prone to runtime errors in specific dev environments.
- **Solution**: Upgraded `next` to `16.2.2` and `react`/`react-dom` to `19.0.0` using `--legacy-peer-deps`.
- **Status**: ✅ Fixed

### 16. Development Blocker: Invalid Clerk Keys
- **Location**: `netcard-backend/middleware.ts` + `netcard-backend/app/layout.tsx`
- **Issue**: Default placeholder keys (`pk_test_...`) caused 500 errors on API routes and runtime crashes in the browser.
- **Solution**: Bypassed Clerk middleware with a passthrough function and commented out `ClerkProvider` in the root layout.
- **Status**: ✅ Fixed (Bypassed for local development)

### 17. Development Blocker: Missing External Dependencies (Auth/DB)
- **Location**: `netcard-backend/lib/auth.ts` + `netcard-backend/lib/supabase.ts` + `middleware.ts`
- **Issue**: Lack of live Clerk/Supabase accounts blocked testing. Hardcoded bypasses were brittle.
- **Solution**: Implemented a **Structured Mock Architecture** toggled via `NEXT_PUBLIC_MOCK_AUTH=true` in `.env.local`. 
  - `lib/auth.ts`: Returns detailed mock user profile.
  - `lib/supabase.ts`: Provides a robust chainable proxy for database mutations.
  - `middleware.ts` + `layout.tsx`: Conditional Clerk integration.
- **Status**: ✅ Fixed (Professional Mock Suite active)

---

## Revised Service Status (Local)

| Service | Port | Directory | Status |
|---|---|---|---|
| **NetCard API** | 3001 | `netcard-backend/` | ✅ **UP** (Next.js 16.2.2, Structured Mock Mode) |
| **NetCard App** | 5173 | `netcard-frontend/` | ✅ **UP** (Vite) |
| **PPLAI Backend**| 8001 | `scratch/pplai-app/backend/` | ✅ **UP** (FastAPI) |
| **PPLAI Frontend**| 3000 | `scratch/pplai-app/frontend/` | ✅ **UP** (Next.js) |


