# learnerways — Build Plan

Derived from [`PRD.md`](./PRD.md). Each item maps to a PRD requirement.
**Legend:** ✅ done · 🔨 in progress · ⬜ not started · 🏷️ effort (S/M/L)

Build order is by milestone: foundations → MVP core → hardening → v2.

---

## Phase 0 — Foundations (✅ complete)

| Task | PRD | Status | Notes / Acceptance |
| --- | --- | --- | --- |
| Scaffold Next.js 16 App Router + Tailwind v4 | — | ✅ | Turbopack default, TS strict |
| Dependencies (better-auth, drizzle-orm, better-sqlite3, openai, pdf-parse) | §7 | ✅ | better-sqlite3 pinned to v12 for better-auth peer |
| Drizzle schema + migrations + local SQLite (WAL, FK on) | §8 | ✅ | `drizzle-kit generate/push`, `.gitignore` covers `sqlite.db` + `public/audio/` |
| `.env` template | §7 | ✅ | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `OPENAI_API_KEY` |
| CI-style checks pass at commit gate | NFR-2 | ✅ | `npx tsc --noEmit`, `npm run lint`, `npm run build` |

---

## Phase 1 — MVP core (✅ complete)

| Task | PRD | Status | Notes / Acceptance |
| --- | --- | --- | --- |
| Auth server (`better-auth`) + `/api/auth/[...all]` route | FR-1.1 | ✅ | Email/password; session via cookies |
| Login / signup / sign-out UI | FR-1.1–1.3 | ✅ | Redirects: authed→dashboard, guest→login |
| Protected route group `(app)` with session gate | FR-1.4, NFR-1 | ✅ | Every page/action re-checks session |
| Dashboard (list materials, empty state) | FR-2.4 | ✅ | Title, preview, words, source, date |
| Create material — paste text | FR-2.2 | ✅ | Min 20 chars; validation messages |
| Create material — PDF upload + extraction | FR-2.3 | ✅ | `.pdf`, ≤20 MB, `%PDF` magic check, text extracted; image-only rejected |
| Delete material (cascades content + audio file) | FR-2.5 | ✅ | Confirm-on-click button |
| Summarizer panel | FR-3.1–3.3 | ✅ | Structured markdown; regenerate; 40k-char cap |
| Audio panel (TTS → MP3 → player) | FR-4.1–4.3 | ✅ | `gpt-4o-mini-tts`, alloy voice |
| Quiz panel (generate, answer, grade, retry) | FR-5.1–5.4 | ✅ | Strict JSON schema, shuffled answers, explanations |
| Flashcards panel (generate, flip, navigate) | FR-6.1–6.3 | ✅ | 10 cards default |
| Error surfacing in all panels | FR-7 | ✅ | Server actions return readable errors; scoped queries |

---

## Phase 2 — v1 hardening (🔨 hardening steps done; deployment pass pending)

| Task | PRD | Effort | Acceptance |
| --- | --- | --- | --- |
| Rate-limit generation actions (cooldown per user) | FR-7, NFR-1 | S | ✅ 1 req/5s per user (`enforceCooldown`, env-overridable for tests) |
| Input sanitization & length guard on every action | FR-2.2, NFR-1 | S | ✅ Title ≤200 chars; content hard cap + null-byte strip |
| Content size/word trimming UX (show truncated notice) | FR-3.3 | S | ✅ Amber note on all four panels past 40k chars |
| Production deployment pass (Postgres + blob storage for audio) | §9 | L | ⬜ Same features working off SQLite; env-driven |
| Minimal PostCSS prod asset test + Lighthouse check | NFR-4 | S | ⬜ 90+ perf on landing/dashboard |
| Auth hardening: email verification flag + password reset | FR-1 | M | ✅ Password reset flow (better-auth plugin; dev console logger) |
| E2E smoke tests (signup → create → generate) | NFR-3 | M | ✅ `npm run test:e2e` with local OpenAI stub |

---

## Phase 3 — v2 roadmap (⬜ from PRD §9)

| Task | PRD | Effort | Dependencies |
| --- | --- | --- | --- |
| Flashcards spaced repetition (`know`/`again`) | §9 | M | Phase 1 flashcards (done) |
| Personal notes per item | §9 | S | Any |
| Study progress / quiz score history | §9 | M | Phase 2 rate limiting (scores table) |
| More inputs: DOCX, Markdown, URL, audio transcription | §9 | L | PDF pipeline refactor into generic extractor |
| Export (PDF/Markdown of summary, cards, quiz) | §9 | M | Any |
| Additional tools: mind maps, practice essays | §9 | L | After export |

---

## Milestones & timeline (suggested)

| Milestone | Contains | Target |
| --- | --- | --- |
| M1 · MVP | Phase 0 + Phase 1 | ✅ **Done** |
| M2 · Hardened v1 | Phase 2 | 1 sprint |
| M3 · v2 study engine | Phase 3 | next release |

---

## Risks & mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| OpenAI API cost from spamming generate | High | Phase 2 rate limiting + input caps (already capped) |
| Very long PDFs hit token limits | Medium | Truncation at 40k chars; bigger models later |
| Audio storage in `public/` breaks on serverless deploy | Medium | Phase 2 blob-storage + route handler serving |
| Scanned/image-only PDFs yield no text | Medium | Clear error (done); OCR as v2 option |