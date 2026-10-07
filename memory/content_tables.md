---
name: Content table convention
description: Each website section has its own key-value content table (home_content, ministries_content, etc.) in Supabase
type: project
---

Each website section gets its **own table** for its content, named `{section}_content`:
- `home_content`, `ministries_content`, `sermons_content`, `give_content`, `calendar_content`, `contact_content`

**Schema (same for all sections):**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, `gen_random_uuid()` |
| `key` | VARCHAR | UNIQUE NOT NULL — field identifier, e.g. `review_2025_youtube` |
| `value` | TEXT | The content value |
| `updated_at` | TIMESTAMPTZ | Default `now()` |

**Why:** Flexible key-value structure so new fields can be added per section without schema changes. Admins edit content via the `{Section}Admin` pages; the public pages read from the same table.

**Why not `site_content`:** User preferred per-section tables instead of one generic table.

**Home keys so far:**
- `review_title` — editable review section title (default "2025 Review")
- `review_2025_youtube` — YouTube embed link for the review video
- `worship_title` — Sunday Worship Service section title
- `worship_image_left` / `worship_image_right` — public image URLs from the `images` storage bucket
- `worship_map_coords` — Google Maps coordinates (e.g. `14.847457, 120.977211`); public page builds `https://www.google.com/maps?q=<coords>`
- `worship_zoom_link` — Zoom join URL

**Testimonials section (below worship):**
- `testimonials_title` — heading (default "Testimonials")
- `replay_youtube` — the YouTube video shown below the Testimonials heading (also used as the link target for the International card's "See Our Fourth International Worship Service" button)

**International & Replay cards (below testimonials, two side by side) — all text editable:**
- `international_title` — left card heading (default "International Worship Service")
- `international_body` — left card body, multi-line (`\n`-separated; public page renders each line as a paragraph)
- `international_button` — left card button text
- `replay_title` — right card heading (default "Replay Worship Services")
- `replay_body` — right card body, multi-line (`\n`-separated)
- `replay_button` — right card button text

Button destinations are fixed: left card links to `/international` (a page hidden from the public navbar but present in the admin sidebar — placeholder for now); right card links to `/sermons`. The two buttons are pinned to the bottom of equal-height cards so they stay side by side.

**Empower & Connect section (below the cards) — all text editable:**
- `empower_title` — heading (default "Empower & Connect")
- `empower_body` — paragraph text (`\n`-separated; public page renders each line as a paragraph)
- `empower_button` — button text; the button links to `/contact`

Worship section shows two image cards, each with a button below (Map / Zoom). `testimonial_image_left` / `testimonial_image_right` keys were removed from the design (no longer used).

**Home ministries carousel + mini-calendar now pull from other tables (2026-08-11):** the Home page "Ministries" card rotates the **`ministries_content`** images (`ministry_{1..4}_image`, read via `useMinistryContent()` in `EventsMinistriesSection`) — the old `home_content` keys `ministry_image_1..4` are deprecated (pickers removed from `HomeAdmin`; rows deleted via SQL `delete from public.home_content where key like 'ministry_image_%'`). The Home "Upcoming Events" mini-calendar now marks days that have a `calendar_events` event (fetches the table directly in `EventsMinistriesSection`, expanded across multi-day ranges with `expandDates`; marks only today/future days, matching `/calendar`). Styling: **today = solid blue circle, event days = outlined circle**, via `.home-calendar__day--today .num` / `.home-calendar__day--events .num` — the day number MUST be rendered inside a `<span className="num">` wrapper or the circle CSS matches nothing (was the root cause of "no circles on the homepage": had the class names but no `.num` element).

**Calendar events (relational table, not key-value — events are a list):**
- `calendar_events` — one row per event, ordered by date/time:
  - `id` UUID PK default `gen_random_uuid()`
  - `title` TEXT NOT NULL
  - `event_date` DATE NOT NULL — the event's **start** date
  - `end_date` DATE — end of the date range; app always writes it (= `event_date` for single-day events). Multi-day events span `event_date`..`end_date`
  - `start_time` / `end_time` TIME (nullable; null both = all-day event)
  - `location` TEXT
  - `description` TEXT
  - `created_at` TIMESTAMPTZ default `now()`
- Shared date helpers live in `src/lib/calendar.js` (`dateKey`, `parseDateKey`, `formatTime`, `expandDates`, `dateRangeLabel`) — used by both public + admin pages so multi-day ranges stay consistent.
- Public `/calendar` page (`src/pages/Calendar.jsx`) expands each event across its range for dots + the day modal, and shows upcoming events (`end_date >= today`) in the left panel.
- Admin CRUD lives in `src/admin/CalendarAdmin.jsx` (built): mini calendar + upcoming list + add/edit modal + delete. All reads/writes hit the `calendar_events` table (no cache layer).

**Ministries page (2026-08-11):** new `ministries_content` table (table + anon RLS in `supabase/migrations/20260811_ministries_content.sql`). Public page `src/pages/Ministries.jsx` reads it via `useMinistryContent()` (`src/lib/ministryContent.js`, own cache key `ministries_content_cache_v1`); admin form `src/admin/MinistriesAdmin.jsx` upserts + `writeMinistryContentCache()`. Fixed 4 blocks (2 sections × alternating image-left/image-right), each block 4 keys: `ministry_{1..4}_{kicker,title,text,image}`. Images upload to `images` bucket under `ministries/block-{n}-…`. Block 1 look: image-left kicker+photo / title+text right; blocks 1&3 image-left, 2&4 image-right. Page header "Join Our Ministry" is hardcoded.

**Ministry members + shared Google Calendar sync (2026-08-07):**
- `ministry_members` — one row per member (admin-managed only, no public page):
  - `id` UUID PK default `gen_random_uuid()`
  - `name` TEXT NOT NULL
  - `email` TEXT NOT NULL UNIQUE
  - `spiritual_birthday` / `physical_birthday` DATE (nullable)
  - `avatar_url` TEXT — public URL from the `images` storage bucket (uploaded to `members/<ts>-<safeName>`)
  - `created_at` TIMESTAMPTZ default `now()`
- **Why:** The church ("One Faith Church", Philippines) wanted events to land on members' Google Calendars automatically when an admin saves an event. Chosen approach = **shared calendar + Google Service Account** (supersedes an earlier per-member OAuth plan). The church owns one public Google Calendar; a service account writes events to it; each member subscribes once and Google syncs events out to them automatically. No per-member OAuth, no consent screen, no stored Google tokens.
- **How it works:**
  - `calendar-sync` edge function (POST, invoked by `CalendarAdmin.jsx` right after insert/update/delete) writes the change to the shared calendar via the service account. Reads secrets `GOOGLE_SERVICE_ACCOUNT` (the service-account JSON key) + `CHURCH_CALENDAR_ID`. No DB access, so no service-role client needed. **Self-contained single file** (`supabase/functions/calendar-sync/index.ts` — helpers inlined, no `_shared` import) so it can be pasted straight into the Supabase dashboard.
  - The local event's UUID is used as the Google event id (Google allows `[a-zA-Z0-9-_]`, 5-1024 chars), so no mapping table: upsert = POST insert, fall back to PUT on 409; delete = DELETE (404 = already gone, treated as success).
  - Shared helpers in `supabase/functions/_shared/google.ts`: `getAccessToken` (mints an RS256 JWT with Web Crypto for the service account, `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`), `googleEventBody` (timed → dateTime in Asia/Manila; all-day → date with exclusive end), `upsertEvent`, `deleteEvent`.
  - Public subscribe callout **removed 2026-08-09**: `src/pages/Calendar.jsx` no longer shows the "Add church events to your Google Calendar" subscribe banner. The `VITE_CHURCH_CALENDAR_ID` env var is now unused by the frontend (kept in place; the edge function uses its own `CHURCH_CALENDAR_ID` secret). Dead `.calendar-subscribe` CSS was removed.
  - **SUPERSEDED 2026-08-10 (see "FINAL flow" at the bottom of this file) — Real per-member Google OAuth (2026-08-10, replaces the `connect=1` flow above)**: `send-invite` emails a single "**Add church calendar**" button linking to Google's OAuth consent URL (`https://accounts.google.com/o/oauth2/v2/auth`, scope `email https://www.googleapis.com/auth/calendar.calendarlist`, `access_type=offline`, `state` = the invite token), reading a `GOOGLE_OAUTH_CLIENT_ID` secret. The callback edge function **`google-oauth-callback`** (**Verify JWT OFF** — it receives anonymous browser GET redirects from Google) exchanges the code, adds the church calendar to the member's own calendar list via CalendarList API (`POST /users/me/calendarList { id: CHURCH_CALENDAR_ID }`), stores tokens in the RLS-locked **`member_calendar_tokens`** table, stamps `connected_at` + `google_email` on `ministry_members`, and 302-redirects to `/permissions?token&connected=1`. Columns added by migration `supabase/migrations/20260810_member_oauth.sql`. Admin badge (`MembersAdmin.jsx` `inviteStatusOf`) prioritizes `connected_at` (**Connected** + google email + date) > `consent_granted_at` (Consented, legacy) > `invite_sent_at` (Invite sent) > Not invited. `/permissions` gained `connected=1` / `connected=0` / `error=denied` screens. **Constraint:** until the OAuth app is Google-verified it runs in "Testing" mode — every member Gmail must be added as a **test user** on the Google Cloud consent screen or their approval fails.
  - **Invite email carries full legal text inline (2026-08-09)**: the `send-invite` email body embeds the complete "What this means" bullets, the Terms paragraph, and the **entire Privacy Policy** (all 7 sections from `src/pages/Privacy.jsx` — last updated August 7, 2026) so members never need to open `/privacy`. A "website" link to `${SITE_URL}/privacy` is kept as a convenience. If the privacy text on the site is ever edited, it must be re-pasted into `buildHtml` here to stay in sync.
  - Admin member manager (`src/admin/MinistriesAdmin.jsx`) is back to plain member CRUD (Add/Edit/Delete/avatar) — no per-member connect UI.
- **Dropped (2026-08-07):** the OAuth plan's `member_calendar_tokens` + `calendar_sync` tables and the `google-oauth` / `google-oauth-callback` functions were removed. Cleanup SQL: `drop table if exists public.calendar_sync; drop table if exists public.member_calendar_tokens;`
- **Google Cloud + deploy still pending for the user:** create a church Google account; make the calendar public ("See all event details"); share it with the service-account email as editor; create a service account in a Cloud project (Calendar API enabled) and download its JSON key; set function secrets `GOOGLE_SERVICE_ACCOUNT` (raw JSON) + `CHURCH_CALENDAR_ID`; deploy `calendar-sync` (default Verify JWT ON — called from the SPA with the anon key); put the calendar ID in `.env` as `VITE_CHURCH_CALENDAR_ID`.
- **Live Google values (2026-08-07):** church calendar id = `1faithchurchph@gmail.com` (church account's default calendar). Service account: `church-calendar-sync@glass-icon-407211.iam.gserviceaccount.com`; key JSON at `c:\Users\marilen\Downloads\glass-icon-407211-a91156ce0302.json` (contents pasted into the `GOOGLE_SERVICE_ACCOUNT` secret). Public subscribe URL (for `VITE_CHURCH_CALENDAR_ID`/manual sharing): `https://calendar.google.com/calendar/ical/1faithchurchph%40gmail.com/public/basic.ics`.
- **Vercel deploy method (2026-08-07, superseded 2026-08-09):** site was deployed via **local build + prebuilt** (`npx vercel pull --yes --environment production` → `npx vercel build --prod` → `npx vercel deploy --prebuilt --prod`). Root `.env` was the source of truth for all `VITE_` vars — `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` were **NOT** in Vercel env, so a plain remote `vercel --prod` build would bake in `undefined` and break the site.
  - **2026-08-09:** added `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` to Vercel **production** env as **non-sensitive** (`vercel env add <NAME> production --value "<val>" --no-sensitive --force --yes`). All 3 `VITE_` vars are now in Vercel env, so plain `vercel --prod` (remote build) is now safe and is the simplest deploy command. The local-build flow still works too. Local `.env` is still needed for `npm run dev`.
  - Gotcha: Vercel env vars marked **sensitive** are redacted to the literal `[SENSITIVE]` in local pulls/builds — `VITE_CHURCH_CALENDAR_ID` had this bug (subscribe URL built as `ical/[SENSITIVE]/basic.ics`); fixed by re-adding with `--no-sensitive --force`. Keep all VITE_ vars non-sensitive.
  - **CLI regression discovered 2026-08-12:** Vercel CLI **58.x** fails EVERY deploy (`vercel deploy --prebuilt --prod` AND `vercel --prod`) with `<400, code "invalid_root_directory">` — the newer CLI sends `rootDirectory: "."` (project has it unset) and the server rejects `.`. Patching `rootDirectory` via the API (`PATCH /v9/projects/{name}`) rejects both `.` and `""`. **Fix applied 2026-08-12 — global CLI downgraded to 56.3.1** (`npm i -g vercel@56.3.1`), so plain `vercel --prod` works again (verified). If the global CLI ever gets updated into the 58.x line again, re-downgrade to 56.3.1. (`npx vercel@56.3.1 deploy --prebuilt --prod` is the equivalent one-off.)
- **Calendar delete + cleanup lessons (2026-08-07):**
  - Delete bug (fixed): `CalendarAdmin.jsx` `confirmDelete` deleted the DB row FIRST then called `calendar-sync` — but the function looks up `google_id` from that row, so it found nothing and left the Google event behind (silently returned `{"synced":1}`). Fixed by calling `fireSync({action:'delete'})` BEFORE the DB delete (row still exists → function removes Google event). Sync button relabeled to just "Sync".
  - **CRITICAL — the church Google Calendar is NOT empty:** it contains many **pre-website historical events** the user created before the website existed (recurring "Song line up" and "Sunday Sermon/Lesson" every week, Retreats, Parties, etc.), which have **no rows** in `calendar_events`. NEVER run a blanket "delete Google events that aren't in the DB" cleanup — it would wipe the entire historical calendar. Cleanup must be **targeted by exact Google event id**. Event ids from the app sync are plain ids (e.g. `st66au1ars4kjsfbaq51idkjes`); pre-website recurring instances have a `_YYYYMMDDTHHMMSSZ` suffix — leave those alone.
- **Calendar status verified 2026-08-08 (supersedes the 2026-08-07 `1faithchurchph@gmail.com` note):**
  - **Live calendar ID is now `7d53fdc25d1665857176fe8147a9d53b0a7d0c549f9614009d3cbada79ec6c21@group.calendar.google.com`** (the value in root `.env` as `VITE_CHURCH_CALENDAR_ID`). Its public feed `https://calendar.google.com/calendar/ical/7d53...@group.calendar.google.com/public/basic.ics` returns HTTP 200 and IS public (full details). The old `1faithchurchph@gmail.com` public feed is **404 (private)** — the calendar is NOT public under that ID.
  - Sync pipeline confirmed working: DB `calendar_events` row's `google_id` (e.g. `34tiihp8amqecpbuof9a9tvemo`) matches the UID in the `7d53...` public feed. Only **1 event** currently exists in `calendar_events` (Sunday Worship Service, 2026-08-16).
  - **REAL root cause of "Login – Vercel" page (2026-08-08, supersedes the "Deployment Protection ON" guess below):** the repo's working-tree `index.html` had been **overwritten with the Vercel login page** (484 KB, `<title>Login – Vercel</title>`, `data-dpl-id="dpl_EJzhzQ2APppUhyBvFUWMvSieKNis"`, mtime 2026-08-08 22:25). Committed `HEAD:index.html` is the real 394-byte Vite entry. Because `vercel build --prod` is a LOCAL build of the working tree, every deploy after that overwrite served the login page. **NOT Vercel Deployment Protection** (project `ssoProtection` is null; the 302 to `vercel.com/login` was the login SPA in the bundle, not an infra protection wall). FIXED by `git checkout -- index.html` + rebuild + `vercel deploy --prebuilt --prod` (new prod deploy `onefaith-odv7bmfhi`, 2026-08-09). Verify live with: `curl -s https://onefaithph.vercel.app/ | grep -o '<title>[^<]*</title>'`.
  - Deployment-protection hypothesis (below) was WRONG — kept for the record: production alias served login, but that was the corrupted index.html, not protection.
  - **Vercel env var `VITE_CHURCH_CALENDAR_ID` fixed 2026-08-09:** was `1faithchurchph@gmail.com` (the NON-public, 404 calendar). Re-added via `vercel env add ... --value "7d53..." --no-sensitive --force` so it is now **non-sensitive** (no more `[SENSITIVE]` redaction in local pulls) and points to the working public calendar. `.env.vercel.prod` on disk may still show the stale `[SENSITIVE]` — run `npx vercel pull --yes --environment production` to refresh it. Root `.env` already had the correct `7d53...` id.

- **FINAL flow (2026-08-10, supersedes the OAuth plan above):** OAuth was dropped entirely — the user chose the simple consent + public-calendar subscribe model (no verification wait, no OAuth). Flow: admin adds a Gmail member → `send-invite` emails a single "Review & accept" button linking to `${SITE_URL}/permissions?token=<token>&connect=1` (no OAuth URL; the email no longer carries the giant legal text either) → the page verifies the token via `calendar-consent` `verify` and, if not yet consented, shows **Terms & Conditions + the full Privacy Policy inline inside a scrollable box, one checkbox ("agree to Terms & Privacy"), Confirm disabled until checked** → tapping Confirm calls `calendar-consent` `accept` (records `consent_granted_at`) → same-tab `window.location.replace(subscribeUrl)` (Google "Add calendar" page built from `VITE_CHURCH_CALENDAR_ID`) → one Add tap subscribes them to the public calendar; events then sync to their Google Calendar automatically forever.
  - **Honest limits (user accepted these):** no OAuth means no verified "Connected" signal. The admin badge shows **Consented** (`consent_granted_at`) / Invite sent / Not invited — it cannot prove the member tapped Add on Google's side (Google doesn't expose who subscribes to a public calendar). The Google "Add calendar" page is the one unavoidable Google screen — Google blocks any app from silently adding a calendar to a someone's account.
  - Deleted 2026-08-10: `supabase/functions/google-oauth-callback/` (function) and `supabase/migrations/20260810_member_oauth.sql` (migration) — both removed from the repo. `member_calendar_tokens` was never created; `connected_at`/`google_email` were never added if the migration never ran. `MembersAdmin.jsx` badge reverted to consent-based and the `.member-card__connected` CSS removed.
