# PPL.AI - Build Stage Integration Checklist

During the active build phase, use this manual checklist to verify the 4 critical integration points holding the application together. Run through these checks whenever major architectural or feature changes are made before committing.

## 1. 🔐 Authentication Flow (Frontend ↔ Clerk ↔ Backend)
*Ensures the React app successfully talks to the Next.js API as an authenticated user.*
- [ ] Log in via the Vite frontend using Clerk.
- [ ] Trigger a request that hits a protected backend route (e.g., loading the `My Card` screen to hit `GET /api/profile`).
- [ ] **Verify:** The Next.js backend correctly unpacks the Clerk `userId`, and the request returns a `200 OK` (not a `401 Unauthorized`).

## 2. 🗄️ Database Security Scoping (Next.js ↔ Supabase)
*Because the Supabase service role is used to bypass RLS, your backend code is solely responsible for scoping data.*
- [ ] Create a new Contact or Event while logged in as User A.
- [ ] Check your Supabase dashboard or log in as a completely different User B.
- [ ] **Verify:** User B absolutely cannot retrieve, view, edit, or delete User A's contacts. The backend logic successfully enforces `.eq('owner_id', profile.id)` on all queries.

## 3. 🤖 AI Engine Output Validation (Backend ↔ Anthropic)
*LLM outputs can be unpredictable; ensure the bridge handles messy data.*
- [ ] Add a contact with chaotic, misspelled, or poorly formatted "Notes".
- [ ] Trigger the AI follow-up generation for that contact.
- [ ] **Verify:** The Anthropic API responds correctly without a timeout.
- [ ] **Verify:** The backend correctly parses the response payload into the required JSON/Markdown format and renders gracefully on the frontend without crashing.

## 4. 🌍 Public Route Isolation (Public Endpoints ↔ Security)
*Ensures public-facing routes are completely isolated from protected routes.*
- [ ] Open an Incognito/Private browsing window (unauthenticated state).
- [ ] Navigate directly to the public QR endpoint (e.g., `/api/qr/:userId`).
- [ ] **Verify:** The QR code or digital card renders correctly.
- [ ] **Verify:** Attempting to access ANY other route (like `/api/contacts`) in that same Incognito window is actively blocked heavily by Next.js `middleware.ts` and returns a secure `401 Unauthorized`.

## 5. ⚡ Rate Limiting (Pre-Beta Launch Blocker)
*Prevents AI cost abuse and public endpoint scraping before real users arrive.*
- [ ] Confirm `@upstash/ratelimit` is wired into `/api/qr/[userId]` and `/api/ai/followups`.
- [ ] Trigger the endpoint more than the configured limit (e.g. 10 requests in quick succession).
- [ ] **Verify:** The 11th request returns `429 Too Many Requests` — not `200` or `500`.

### Summary for the Build Stage:
Don't worry about Vitest, Jest, or automated scripts right now. Just maintain a checklist of these 5 manual integration flows. Whenever you make major updates to the codebase, physically click through your app to ensure the Auth, Database, AI, Public Share, and Rate Limiting layers are all still working correctly.

## Add later - During Launch for External Users

When the application moves from the Build stage to a Production release with real external users, you should prioritize adding the following automated quality checks:
- **Unit Testing (Vitest + React Testing Library):** For critical frontend components and complex utility functions.
- **Integration Testing (Vitest + node-mocks-http):** To automatically enforce edge-cases on your backend API handlers.
- **End-to-End (E2E) Testing (Playwright or Cypress):** To script user flows simulating logging in, creating context, and receiving AI followups.
- **CI/CD Pipelines:** Automatically run all your test suites on GitHub Actions before allowing Vercel to deploy to production.
