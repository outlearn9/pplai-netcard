# CLAUDE.md
<!-- Loaded into every Claude Code session. Every line costs tokens — keep entries minimal. -->
<!-- To update: add screens to the Screens list, localStorage keys to the Data section, API routes to API routes. -->

## 🛠 Build & Run
- **Frontend** (`netcard-app/`): `npm run dev` → port 5173 | `npm run build` | `npm run preview`
- **Backend** (`netcard-backend/`): `npm run dev` → port 3001 | `npm run build` | `npm run lint`
- **Mock mode**: `NEXT_PUBLIC_MOCK_AUTH=true` in `netcard-backend/.env.local` — skips Clerk + Supabase.

## 🏗 Architecture
- **Pattern**: Phone-shell SPA (`App.jsx`), 402×874px fixed. Screens swap inside; tab bar + ProfileDrawer via `createPortal`.
- **Navigation**: `src/hooks/useNavigation.js` — `navigate(id, data?)`, `goBack()`. Array stack. Screens receive these as props, never import the hook.
- **Add a screen**: `src/screens/X.jsx` → import in `App.jsx` → one line in `makeScreenMap`. Done.
- **Tab screens** (bottom nav): `events` `allContacts` `scan`(center) `mycard` `ai`
- **Scroll gotcha**: `.screen { overflow:hidden }` — inner scroll divs need `minHeight:0` or they won't scroll.
- **CSS tokens** (`src/index.css`): `--indigo` `--green` `--coral` `--amber` `--bg` `--card` `--elevated` `--border` `--text-primary/secondary/muted/tertiary` · `--font-serif`=Fraunces · `--font-sans`=DM Sans · classes: `.screen .content .card .avatar .btn-primary .btn-ghost .tag`
- **Auth gate**: `authed` bool in `App.jsx`; flip via `onAuth` on `AuthScreen`.
- **Backend**: `app/api/` only. Auth→`lib/auth.ts` · DB→`lib/supabase.ts` (service-role, server-only) · responses→`ok()`/`err()`/`handleError()` (`lib/response.ts`) · validate with `.safeParse()` · `logAudit()` on every mutation.
- **vCard**: `buildVCard()` must use `\r\n` line endings (RFC 6350).

## 🗄 Data
<!-- Add a row here when a new screen introduces a localStorage key -->
**localStorage:**
| Key | Contents |
|-----|----------|
| `netcard_my_profile` | name, title, company, email, phone, whatsapp, linkedin, web, seeking, offering |
| `netcard_active_event` | Active event object or `null` |
| `netcard_team` | `[{id, name, email, access}]` |
| `netcard_crm_leads` | Leads: stage, assignee, tags, notes |
| `netcard_suggestions` | Suggestions with vote counts |
| `netcard_support_tickets` | Submitted tickets |
| `netcard_sent_log` | Sent card activity log |
| `netcard_authed` | `'1'` when user is authenticated — persists login across page refresh |
| `netcard_seed_attempted` | `'1'` after first onboarding seed attempt |

<!-- /api/health and /api/qr/[userId] are intentionally public — do not add auth to them -->
**API routes:**
| Method | Route | Auth | Body / Params | Notes |
|--------|-------|------|---------------|-------|
| GET | `/api/health` | Public | — | Liveness check |
| GET | `/api/profile` | Clerk | — | Returns own profile |
| PATCH | `/api/profile` | Clerk | `{name?,role?,company?,…}` | Update profile fields |
| GET | `/api/profile/export` | Clerk | — | Returns vCard string |
| GET | `/api/contacts` | Clerk | `?event_id=` `?search=` `?tag=` | Paginated contact list |
| POST | `/api/contacts` | Clerk | `{name,email?,phone?,…}` | Auto-fills `met_*` from active event |
| GET | `/api/contacts/[id]` | Clerk | — | Single contact with tags+notes |
| PATCH | `/api/contacts/[id]` | Clerk | `{name?,bookmarked?,…}` | Update contact |
| DELETE | `/api/contacts/[id]` | Clerk | — | Hard delete |
| GET | `/api/contacts/[id]/tags` | Clerk | — | List tags |
| POST | `/api/contacts/[id]/tags` | Clerk | `{tag}` | Add tag |
| DELETE | `/api/contacts/[id]/tags` | Clerk | `{tag}` | Remove tag |
| GET | `/api/contacts/[id]/notes` | Clerk | — | List notes |
| POST | `/api/contacts/[id]/notes` | Clerk | `{content}` | Add note |
| POST | `/api/contacts/scan` | Clerk | `{raw_vcard?} \| {name?,email?,phone?,…} \| {qr_data?}` | Parse QR/vCard, save contact, fire notification |
| GET | `/api/events` | Clerk | — | List own events |
| POST | `/api/events` | Clerk | `{name,start_date,end_date?,location?,seeking?,offering?}` | Create event |
| GET | `/api/events/[id]` | Clerk | — | Single event |
| PATCH | `/api/events/[id]` | Clerk | `{name?,status?,…}` | Update event |
| DELETE | `/api/events/[id]` | Clerk | — | Delete event |
| POST | `/api/events/[id]/activate` | Clerk | — | Set active; deactivates all others |
| POST | `/api/events/import` | Clerk | `{csv}` | Bulk import events from CSV |
| GET | `/api/conversations` | Clerk | — | All DM threads (sorted by last_message_at) |
| POST | `/api/conversations` | Clerk | `{contact_profile_id}` | Start or return existing conversation |
| GET | `/api/conversations/[id]` | Clerk | — | Single conversation |
| GET | `/api/conversations/[id]/messages` | Clerk | `?cursor=` | Paginated messages |
| POST | `/api/conversations/[id]/messages` | Clerk | `{content}` | Send message |
| POST | `/api/conversations/[id]/upload` | Clerk | `FormData {file}` | Upload attachment |
| GET | `/api/ai/followups` | Clerk | — | List followups |
| POST | `/api/ai/followups` | Clerk | `{contact_ids?}` | Generate AI followup suggestions |
| PATCH | `/api/ai/followups/[id]` | Clerk | `{status:'sent'\|'dismissed'}` | Update followup status |
| DELETE | `/api/ai/followups/[id]` | Clerk | — | Delete followup |
| GET | `/api/notifications` | Clerk | — | List 50 most recent |
| POST | `/api/notifications` | Clerk | `{type,title,body,…}` | Create notification |
| PATCH | `/api/notifications` | Clerk | — | Mark ALL unread as read |
| PATCH | `/api/notifications/[id]` | Clerk | — | Mark single as read |
| DELETE | `/api/notifications/[id]` | Clerk | — | Delete notification |
| GET | `/api/qr/[userId]` | Public | `?format=vcard` | QR payload; `format=vcard` → `.vcf` download |
| POST | `/api/onboarding/seed` | Clerk | — | Idempotent: seed 2 events + 6 contacts + welcome notif |
| DELETE | `/api/onboarding/seed` | Clerk | — | Remove all `is_sample=true` data, reset `seeded_at` |
| GET | `/api/team` | Clerk | — | List team members |
| POST | `/api/team` | Clerk | `{name,email,access}` | Invite member |
| PATCH | `/api/team/[id]` | Clerk | `{access}` | Change access level |
| DELETE | `/api/team/[id]` | Clerk | — | Remove member |
| GET | `/api/analytics` | Clerk | — | Computed stats: events, contacts, outreach, pipeline |
| GET | `/api/support` | Clerk | — | List own support tickets |
| POST | `/api/support` | Clerk | `{category,message,email?}` | Submit support ticket |
| GET | `/api/suggestions` | Clerk | — | List suggestions sorted by votes |
| POST | `/api/suggestions` | Clerk | `{title,body,category}` | Submit suggestion |
| POST | `/api/suggestions/[id]/vote` | Clerk | `{vote:'up'\|'down'\|null}` | Toggle vote |
| POST | `/api/crashes` | Public | `{error,stack?,url?,ua?}` | Ingest crash report |
| GET | `/api/admin/tickets` | Admin key | — | List all support tickets |
| PATCH | `/api/admin/tickets/[id]` | Admin key | `{status,admin_note?}` | Update ticket |
| GET | `/api/admin/suggestions` | Admin key | — | List all suggestions |
| PATCH | `/api/admin/suggestions/[id]` | Admin key | `{status}` | Update suggestion status |
| GET | `/api/admin/crashes` | Admin key | — | List crash reports |
| GET | `/api/admin/stats` | Admin key | — | Computed: users, DAU, events, contacts, messages |

<!-- Increment count and add row when adding a screen. File name = PascalCase, nav id = camelCase -->
**Screens (22):**
| Nav id | Screen |
|--------|--------|
| `home` `scan` `mycard` `events` `ai` `chatList` | Tab screens (bottom nav visible) |
| `contact` `chat` | Receive `screenData: contact` |
| `addEvent` `allContacts` `switchEvent` `shareCard` | Standard screens |
| `account` `team` `crm` `help` `suggest` | Settings/tools screens |
| `analytics` `notifications` `eventContacts` | Additional screens |
| — | `AuthScreen` — pre-shell, not in `makeScreenMap` |
| — | `AllScreensPreview` — `?preview` URL only |

## 📏 Coding Standards
- **TypeScript**: `strict:true` — no `any`, no `!` assertions. Use `unknown` + type guards.
- **Supabase**: Scope all queries by `userId`. Never `select('*')`. Service role key = server-only.
- **Auth**: Call `auth()` in every protected handler — middleware is not enough.
- **Zod**: Schemas in `lib/schemas.ts`. `.safeParse()` at route boundary before any DB call.
- **React**: No business logic in JSX. API errors → toast (`--coral`/`--amber`). Never `alert()`.
- **Secrets**: Never in `NEXT_PUBLIC_` vars. Never log PII, tokens, or keys.

## 🎯 Active Goals
<!-- Check off items here as they're completed; remove when shipped -->
- [ ] Run `supabase/notifications_schema.sql` and `supabase/seed_schema.sql` in Supabase SQL Editor (manual step)

<!-- Reference docs (not needed during coding sessions) -->
> [CHECKLIST.md](./CHECKLIST.md) · [AUDIT.md](./AUDIT.md) · [SETUP.md](./SETUP.md)
