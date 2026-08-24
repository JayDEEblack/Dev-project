# learnerways — Step-by-Step Execution Plan

Builds on [`BUILD_PLAN.md`](./BUILD_PLAN.md). Phases 0–1 (MVP) are done;
this plan executes Phase 2 (hardening) then hands off Phase 3 (v2).
Each step lists **edit** targets and a **verify** gate. Run steps in order.

---

## How to use this plan

- Work one step at a time; the **Verify** command must pass before moving on.
- Every verify gate starts with the project checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Dev server: `npm run dev` → http://localhost:3000
- `.env` must already contain a real `OPENAI_API_KEY` before any generate feature is tested.

---

## Step 0 — Baseline (5 min)

| Task | Edit | Verify |
| --- | --- | --- |
| Confirm baseline is green and clean DB | — | `npx tsc --noEmit` · `npm run lint` · `npm run build` |
| Confirm seeded state has no test users | — | `node -e "console.log(require('better-sqlite3')('sqlite.db').prepare('SELECT COUNT(*) c FROM user').get())"` |

---

# PHASE 2 — Hardening

## Step 1 — Rate-limit generation actions (S)

**Goal:** PRD FR-7, NFR-1. Prevent API-cost abuse per user.

1. Create `lib/rate-limit.ts` (server-only):
   - In-memory `Map<userId, { lastAt: number }>` for `generateSummary / generateAudio / generateQuiz / generateFlashcards`.
   - `export async function enforceCooldown(userId: string, ms = 5000)` — throws if called twice within `ms`.
2. In `app/actions.ts`, call `await enforceCooldown(user.id)` at the top of the **four** generation actions (after `currentUser()`).
3. (Optional, cheap) also enforce on `createMaterialAction` and `deleteMaterialAction`.

**Verify:** trigger a generate twice in <5 s → second call returns the cooldown error message; `npx tsc --noEmit` green.

## Step 2 — Input sanitization & hard caps (S)

**Goal:** FR-2.2, NFR-1.

1. In `app/actions.ts` `createMaterialAction`:
   - `title.length > 200` → error `"Title is too long (max 200 characters)."`
   - `textContent.length > 120_000` (pasted text) → error `"Notes are too long (max 120,000 characters)."`
   - Trim whitespace; strip null bytes from content before insert.
2. Add `maxLength={200}` and `maxLength={0}` n/a on the title input in `components/NewMaterialForm.tsx` (`maxLength={200}`).

**Verify:** paste an oversized string → clear error; normal input still works; `npx tsc --noEmit`.

## Step 3 — Show truncation notice (S)

**Goal:** FR-3.3 transparency.

1. Export a constant `MAX_CONTENT_CHARS = 40000` from `lib/ai.ts`.
2. Modify `generate*` calls to also return `truncated: boolean` (content longer than cap).
3. In each panel (`SummaryPanel`, `AudioPanel`, `QuizPanel`, `FlashcardPanel`) render an amber note when `truncated`: *"Only the first 40,000 characters were used."*
4. Server actions pass the flag through their existing result objects.

**Verify:** create a >40k-char material → note appears on all generated outputs.

## Step 4 — Password reset flow (M)

**Goal:** FR-1 auth maturity (better-auth email/password plugin).

1. Add `sendPasswordResetEmail` config to `lib/auth.ts`:
   - Needs an email transport (Resend/SendGrid/etc. via env `RESEND_API_KEY`) OR a dev-only logger writing reset links to the server console.
2. `authClient.requestPasswordReset.email({ email })` in a `forgot-password` client form; new route `app/(auth)/forgot-password/page.tsx`.
3. Handle `authClient.resetPassword.email({ newPassword, token })` on `app/(auth)/reset-password/page.tsx` (reads `token` from query).
4. Link into the login card (small "Forgot password?" under the form).

**Verify:** request reset → link logged/emailed; visiting the URL with a new password works; login with the new password succeeds.

## Step 5 — E2E smoke tests (M)

**Goal:** NFR-3 regression safety.

1. `npm i -D @playwright/test`, `npx playwright install chromium`.
2. Create `e2e/study-flow.spec.ts`:
   - signup (unique email) → dashboard → create pasted-text material → summary panel generates → audio player renders → quiz generates and grades → flashcards generate and flip → sign out.
   - Use a mocked OpenAI (point `OPENAI_BASE_URL` at a local stub) so the suite never hits real API.
3. Add `"test": "playwright test"`, `"test:e2e": "playwright test"` scripts; wire into the commit gate.

**Verify:** `npm run test:e2e` passes against the local stub.

---

# PHASE 3 — v2 (kickoff steps only)

## Step 6 — Flashcards spaced repetition (M)

1. Add `rating` + `interval` columns to a new `progress` table (or columns on `flashcard`).
2. In `FlashcardPanel`, replace corner nav buttons with `Know / Still learning` ratings (PRD §9).
3. Store `(userId, card, box)` and schedule reviews by interval.

## Step 7 — Study progress dashboard (M)

1. Add `quiz_result` table (`userId, materialId, score, total, createdAt`).
2. After "Check answers", server action records the result.
3. Dashboard shows last scores + study streak.

## Step 8 — Export & extra inputs (L, optional)

1. Refactor PDF/text extraction into `lib/extract.ts` + add DOCX/Markdown/URL readers.
2. Add export server action → stream PDF/Markdown of summary, cards, quiz.

---

## Definition of Done (Phase 2)

- [x] All Phase-2 steps merged; CI-gate (`tsc`, `lint`, `build`, `e2e`) green
- [x] Manual smoke: signup → create (text + PDF) → generate all four tools → delete
- [x] `.env.example` updated with any new vars; `PRD.md`/`BUILD_PLAN.md` statuses flipped to ✅