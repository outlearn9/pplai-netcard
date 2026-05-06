# SETUP.md — NetCard / PPL-AI Developer Setup

This guide gets a new developer from zero to a running local environment.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | v18+ (v22 recommended) | [nodejs.org](https://nodejs.org) |
| npm | v9+ (bundled with Node) | — |
| Git | any recent | — |

> **Verify:** `node -v && npm -v`

---

## 1. Clone & Navigate

```bash
git clone <repo-url>
cd "PPL AI-Claude2"
```

---

## 2. Backend Setup (`netcard-backend/`)

### 2a. Install dependencies

```bash
cd netcard-backend
npm install
```

### 2b. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in every value:

```env
# ── Clerk Auth ────────────────────────────────────────────────────────────────
# https://dashboard.clerk.com → Create application → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Leave these as-is for local dev:
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# ── Supabase ──────────────────────────────────────────────────────────────────
# https://supabase.com/dashboard → Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── Anthropic Claude API ──────────────────────────────────────────────────────
# https://console.anthropic.com → API Keys
ANTHROPIC_API_KEY=sk-ant-...

# ── CORS ──────────────────────────────────────────────────────────────────────
# Must match the frontend dev server URL exactly
FRONTEND_URL=http://localhost:5173

# ── Upstash Redis (rate limiting) ─────────────────────────────────────────────
# https://console.upstash.com → Create database → REST API
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

> **Skip credentials for now?** Add `NEXT_PUBLIC_MOCK_AUTH=true` to `.env.local`.
> This bypasses Clerk + Supabase and returns a mock profile — useful for pure frontend work.

### 2c. Apply the database schema

In your Supabase dashboard → **SQL Editor**, paste and run the contents of:

```
netcard-backend/supabase/schema.sql
```

If you use the chat feature, also run:

```
netcard-backend/supabase/chat_schema.sql
```

### 2d. Start the backend

```bash
npm run dev
# → Running on http://localhost:3001
```

Verify it's alive:

```bash
curl http://localhost:3001/api/health
# → {"ok":true}
```

---

## 3. Frontend Setup (`netcard-app/`)

Open a **second terminal tab**.

### 3a. Install dependencies

```bash
cd netcard-app
npm install
```

### 3b. Start the dev server

```bash
npm run dev
# → Running on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Design preview:** Append `?preview` to the URL to see all screens side-by-side:
> `http://localhost:5173?preview`

---

## 4. Running Both Simultaneously

You need **two terminal tabs** running at the same time:

| Tab | Directory | Command | Port |
|---|---|---|---|
| 1 | `netcard-backend/` | `npm run dev` | 3001 |
| 2 | `netcard-app/` | `npm run dev` | 5173 |

---

## 5. Common Commands

### Frontend

```bash
npm run dev        # Start dev server (hot reload)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

### Backend

```bash
npm run dev        # Start dev server (hot reload)
npm run build      # Compile TypeScript → .next/
npm run start      # Run compiled production server
npm run lint       # Run Next.js ESLint
```

---

## 6. Project Structure at a Glance

```
PPL AI-Claude2/
├── netcard-app/           # React 18 + Vite frontend
│   └── src/
│       ├── screens/       # One file per screen (HomeScreen, MyCardScreen, …)
│       ├── hooks/         # useNavigation.js — all nav state lives here
│       ├── App.jsx        # Phone shell, screen map, tab bar, ProfileDrawer
│       └── index.css      # All design tokens (--indigo, --card, --bg, …)
│
├── netcard-backend/       # Next.js 15 + TypeScript API
│   ├── app/api/           # Route handlers (GET/POST/PUT/DELETE per file)
│   ├── lib/               # auth.ts, supabase.ts, schemas.ts, response.ts
│   ├── supabase/          # schema.sql, chat_schema.sql
│   └── middleware.ts      # Clerk auth gating
│
├── CLAUDE.md              # Architecture reference for AI-assisted development
├── CHECKLIST.md           # Pre-merge integration checklist
├── AUDIT.md               # Security & compliance audit log
└── SETUP.md               # ← you are here
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| Backend crashes on startup | Check `.env.local` exists and all keys are filled. Alternatively add `NEXT_PUBLIC_MOCK_AUTH=true`. |
| Frontend shows blank screen | Open browser devtools console — likely a React runtime error. Check `App.jsx` imports. |
| QR code shows wrong URL | Ensure `VITE_API_URL` is set in `netcard-app/.env.local` (defaults to `http://localhost:3001`). |
| CORS errors in browser | Confirm `FRONTEND_URL=http://localhost:5173` in backend `.env.local` matches exactly (no trailing slash). |
| Supabase `relation does not exist` | Schema hasn't been applied — run `schema.sql` in the Supabase SQL editor. |
| Rate limit errors locally | Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to `.env.local`, or comment out the ratelimit calls in `lib/ratelimit.ts` for dev. |

---

## 8. Adding a New Screen

1. Create `netcard-app/src/screens/MyScreen.jsx`
2. Import it in `App.jsx`
3. Add one line to `makeScreenMap` in `App.jsx`:
   ```js
   myScreen: (nav) => <MyScreen navigate={nav.navigate} goBack={nav.goBack} />,
   ```
4. Navigate to it from anywhere with `navigate('myScreen')`

That's the entire process — no router config, no extra files.

---

> For full architecture details, coding rules, and security guidelines see [CLAUDE.md](./CLAUDE.md).