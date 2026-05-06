# PPL AI - Your Personal AI Networker

PPL.AI is a full-stack networking and contacts management platform equipped with AI-powered follow-ups, operating securely via Next.js backend and a fast React single-page frontend.

---

## 🚀 Getting Started

The project is split into two independent directories. You must run both simultaneously for the platform to function.

### 1. Start the Backend API
Navigate to the `netcard-backend` directory to start the Next.js API server (runs on port `3001`):
```bash
cd netcard-backend
npm install
npm run dev
```

### 2. Start the Frontend
Navigate to the `netcard-app` directory to start the Vite React app (runs on port `5173`):
```bash
cd netcard-app
npm install
npm run dev
```

---

## ⚙️ Environment Variables

Before booting up the backend, you must configure your environment keys. Copy `.env.example` to `.env.local` inside the `netcard-backend/` folder and populate it:

- **Clerk Auth:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, & `SUPABASE_SERVICE_ROLE_KEY`
- **AI Core:** `ANTHROPIC_API_KEY`
- **CORS:** `FRONTEND_URL` (Defaults to `http://localhost:5173`)

---

## 🏗 Core Features

- **Profile & Identity (My Card):** Users can manage their digital networking card (name, role, company, avatars, offerings, and seekings). Public QR code generation allows seamless profile sharing.
- **Event Management:** Features to add, switch, activate, and manage events. Contacts can be localized and bucketed to specific events you attend.
- **Contact Management & Scanning:** Add new contacts, view them as a list, and review deep analytics (tags, notes, roles). There is a scanner interface explicitly designed for rapid networking.
- **AI Follow-ups:** Automatically generates highly personalized AI follow-up draft messages based on contacts' notes, context, or interaction events.
- **Conversations & Chat:** Messaging interface managing follow-up threads. 

---

## 🏛 Architecture Details (Reviews, QA & Tests)

### Frontend (`netcard-app/`)
- A React 18 SPA explicitly built with Vite using standard Javascript and CSS (no Tailwind/CSS-in-JS). 
- Defaults to a phone-shell layout emphasizing mobile-first prototyping.
- Routing is managed purely via state in `App.jsx`, pulling views explicitly from `/src/screens/`.

### Backend (`netcard-backend/`)
- A Next.js 15 application utilizing App Router strictly for modular API handlers (`/api/`). It runs on safe TypeScript.
- **Data Flow:** All payload mutations funnel through strict `Zod` validation definitions explicitly before contacting the database. All backend modifications explicitly abide by strict `safeParse` mutations and return safely enveloped `ok/err/handleError` patterns avoiding rogue stack trace leakages to the client.
- Uses `Supabase` (bypassing RLS with a service role securely on the server side) and `Clerk` for middleware authentication gating.

### Quality Assurance & Pre-Push Reviews
- **Testing State:** Currently focused on rapid UI/Feature building. Automated test suites (`Vitest`/`Jest`) are planned for post-beta — see [CLAUDE.md](./CLAUDE.md) Unit Testing section for the full strategy.
- **Pre-Push Integration Rules:** Consult [CHECKLIST.md](./CHECKLIST.md) before merging major changes. It contains the 4 critical manual integration checks (Auth, DB Scoping, AI Parsing, Public Route Isolation).
- **Coding Rules:** All architecture decisions, security rules, compliance requirements, and code review standards are documented in [CLAUDE.md](./CLAUDE.md).

---

## 🛡 Security & Launch Readiness

### Build Phase — Already In Place
These are baked into the architecture and cost nothing extra:

| Control | Where |
|---|---|
| TypeScript `strict: true` + Zod `.safeParse()` on all routes | `lib/schemas.ts` + every route handler |
| Clerk `auth()` called in every protected handler | All `/api/*` except `/api/health` + `/api/qr` |
| Supabase queries scoped by `userId` (IDOR prevention) | All DB queries |
| CORS locked to `FRONTEND_URL` only | `next.config.ts` |
| Security headers (HSTS, CSP, X-Frame-Options, nosniff) | `next.config.ts` |
| No secrets in `NEXT_PUBLIC_` vars | Env config |

### Pre-Beta Launch — Status

| Task | Effort | Status |
|---|---|---|
| ~~Rate limiting on `/api/qr` + `/api/ai/followups` (Upstash Redis)~~ | ~~2–3 hrs~~ | ✅ Shipped — `lib/ratelimit.ts`, needs Upstash env keys |
| ~~`eslint-plugin-security` in `netcard-backend/`~~ | ~~1 hr~~ | ✅ Shipped — run `npm install --save-dev eslint eslint-plugin-security` |
| ~~Add `.github/dependabot.yml`~~ | ~~15 min~~ | ✅ Shipped |
| ~~Durable audit log for create/update/delete mutations~~ | ~~1 day~~ | ✅ Shipped — `lib/audit.ts` |
| `npx gitleaks detect --source . --verbose` (one-time scan) | 15 min | ⏳ Manual step remaining |
| Enable GitHub Secret Scanning in repo settings | 5 min | ⏳ Manual step remaining |

### Post-Beta / Growth Phase

| Task | When |
|---|---|
| Automated unit tests (Vitest) for route handlers | Sprint 1 post-launch |
| DAST scan — OWASP ZAP against staging | Once staging env exists |
| CI/CD pipeline (GitHub Actions) | When team grows |
| Quarterly manual penetration testing | Pre-scale / enterprise |

> **Already shipped:** GDPR hard-erasure (`DELETE /api/profile`) and GDPR data export (`GET /api/profile/export`) — see [AUDIT.md](./AUDIT.md) issues #4 and #14.

### Skip for Now
SOC 2 certification, full E2E tests (Playwright), SonarCloud CI, HIPAA (not applicable).
