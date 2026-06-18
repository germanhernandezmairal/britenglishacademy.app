# Functional Bug Hunt — Findings

End-to-end functional testing of the authenticated app against the live Supabase
project, using dedicated test users. Approach: hybrid (static skim of each flow's
server action + schema, then browser-driven verification). Fixing as we go.

**Test users** (created via service-role admin API, `email_confirm: true`, no emails sent).
Left in the live DB so we can resume; clean up at the end of the hunt.
- Student: `qa.student@example.com` — id `60714bd7-b8fc-49d5-a325-6176c03aa3e8` — level **B2** (set during onboarding test)
- Admin: `qa.admin@example.com` — id `efbcb150-9675-4192-a514-9b40ca1501e4`
- Password (both): `TestPass123!`
- Provisioning/reset script (idempotent, gitignored, local only): `_setup-test-users.mjs`
- Browser harness (gitignored, local only): `_harness.mjs` (+ `_f1*.mjs` flow runners). Dev server: `npm run dev` → http://localhost:3000

**Severity:** 🔴 blocker · 🟠 major · 🟡 minor · 🔵 polish

> **▶ RESUME HERE (next session):** Flow 1 done. Start Flow 2 (student core) by running
> `node _f2.mjs` with the dev server up. Note: the student (B2) has no visible content
> yet, so lesson/exam **detail** views need content first — create a published B2 lesson
> + exam in the admin panel (Flow 4) or seed via service-role, then verify student views.

---

## Flow 1 — Auth & onboarding ✅ no bugs

Verified end-to-end:
- Login (correct) → forced onboarding when `level` is null → dashboard. ✓
- Onboarding sets level (B2) + learning goals → dashboard. ✓
- Wrong password → `/login?error=invalid_credentials` with visible error message. ✓
- Logout → home; protected route afterwards bounces to `/login?redirectTo=%2Fdashboard`. ✓
- Dashboard renders correctly (greeting, level card, stat tiles, empty states). 0 console/network errors.

Note (dev-only, not a bug): the Next.js dev-mode "N" indicator overlaps the
"Cerrar sesión" control in the sidebar bottom-left. Cosmetic in dev; gone in prod.

## Flow 2 — Student core (dashboard, lessons, exams, homework)

_(not started — **resume here**)_ — dashboard already verified rendering correctly in Flow 1.

## Flow 3 — Community & messages

_(pending)_

## Flow 4 — Admin panels

_(pending)_

---

## Fixed

_(none yet)_

## Cleanup checklist

- [ ] Delete test users (`qa.student@example.com`, `qa.admin@example.com`)
- [ ] Delete any test rows created (lessons, posts, homework, messages, conversations)
