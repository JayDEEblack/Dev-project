# learnerways — Product Requirements Document

**Status:** Draft · v1.0 · Phase 2 hardening complete (rate limits, input caps, truncation notice, password reset, E2E smoke tests)
**Date:** 2026-08-20
**Owner:** learnerways team

---

## 1. Executive Summary

learnerways is a web application that helps students study more effectively. A user
paste in their notes (or uploads a PDF) and the app transforms that material into a
complete "learning kit" with four study aids:

1. **Summarizer** — a clear, structured summary of the material.
2. **Audio version** — a text-to-speech audio file of the material for hands-free review.
3. **Quiz** — multiple-choice questions generated from the material to test recall.
4. **Flashcards** — flip cards front/back for spaced and active recall practice.

The app is AI-powered (OpenAI) and requires a user account so each learner's
materials and generated content are kept private and scoped to them.

---

## 2. Goals

| Goal | Priority |
| --- | --- |
| Let users convert notes/PDFs into multiple study formats in seconds | P0 |
| Provide a clean, distraction-free study workspace | P0 |
| Keep each user's data isolated (auth required) | P0 |
| Make generated content accurate and faithful to the source material | P1 |
| Support long documents (chapters, lecture notes) | P1 |
| Zero-setup local experience (SQLite, no external DB required) | P1 |

### Non-goals (v1)

- Social/collaborative features, sharing, or public decks.
- Spaced-repetition scheduling engine (flashcards review across days).
- Mobile apps; the web app is responsive but desktop-first.
- Offline / PWA support.
- Image or scanned-PDF OCR.

---

## 3. Personas

### Student (primary)
- Studies from lecture notes, textbook chapters, and handouts.
- Wants quick summaries, listens to material on the go, self-tests with quizzes, and
  practices with flashcards before exams.

### Lifelong learner (secondary)
- Studies articles, courses, or self-study materials.
- Same workflows, lighter usage frequency.

---

## 4. User Stories

| ID | Story |
| --- | --- |
| US-1 | As a student, I can create an account with email/password and sign in. |
| US-2 | As a student, I can sign out and sign back in at any time. |
| US-3 | As a student, I can view all my materials on a dashboard. |
| US-4 | As a student, I can add a new material by pasting text. |
| US-5 | As a student, I can add a new material by uploading a PDF (text auto-extracted). |
| US-6 | As a student, I can generate a structured summary of a material. |
| US-7 | As a student, I can generate and listen to an audio version of a material. |
| US-8 | As a student, I can generate multiple-choice questions and check my answers. |
| US-9 | As a student, I can generate flashcards and flip through them to practice. |
| US-10 | As a student, I can regenerate any study item and retry quizzes. |
| US-11 | As a student, I can delete a material (removes its generated content). |
| US-12 | As a student, my study content is only visible to me. |

---

## 5. Functional Requirements

### FR-1 Authentication
- **FR-1.1** Email + password sign up with name, valid email, and password of at
  least 8 characters.
- **FR-1.2** Email + password sign in.
- **FR-1.3** Signed-in users are redirected to the dashboard; guests are redirected
  to login for protected pages.
- **FR-1.4** All study routes require an active session.

### FR-2 Materials
- **FR-2.1** A material has: title, source text, source type (`text` | `pdf`),
  optional original file name, and created date.
- **FR-2.2** Paste mode: user enters a title and pastes notes (min 20 characters).
- **FR-2.3** PDF mode: user uploads a `.pdf` (max 20 MB); text is extracted
  automatically and stored. Non-PDF, invalid, or image-only PDFs are rejected with
  a clear message.
- **FR-2.4** The dashboard lists a user's materials with title, preview, word count,
  source type, and date.
- **FR-2.5** Users can delete a material; this deletes its summary, quiz, flashcards,
  and generated audio file too.

### FR-3 Summarizer
- **FR-3.1** Generates a concise, structured summary (markdown headings + bullets)
  of the material's full text.
- **FR-3.2** Summary can be regenerated.
- **FR-3.3** Input is capped (first ~40k characters) to control cost/latency for
  very long documents.

### FR-4 Audio version
- **FR-4.1** Generates an MP3 of the material using OpenAI text-to-speech.
- **FR-4.2** Renders a built-in HTML5 audio player.
- **FR-4.3** Audio can be regenerated (replaces the previous file).

### FR-5 Quiz
- **FR-5.1** Generates N (default 5) multiple-choice questions from the material.
- **FR-5.2** Each question has 4 options and one correct answer (shuffled position).
- **FR-5.3** Users select answers and click "Check answers" to see score, per-question
  correctness, and explanations.
- **FR-5.4** Users can retry the same questions or generate a new set.

### FR-6 Flashcards
- **FR-6.1** Generates N (default 10) front/back cards from the material.
- **FR-6.2** Users flip cards and navigate previous/next.
- **FR-6.3** Users can generate a new set.

### FR-7 Error handling
- **FR-7.1** Generation failures (missing API key, API errors, timeouts) surface a
  readable error message in the UI without breaking the page.
- **FR-7.2** Unauthorized server actions fail closed and never expose other users'
  data (every query is scoped by `userId`).

---

## 6. Non-Functional Requirements

- **NFR-1 Security:** PBKDF2 password hashing via better-auth; session cookies;
  SQLite foreign keys on; all queries scoped to the authenticated user; secrets only
  in `.env` (git-ignored).
- **NFR-2 Performance:** Generation runs server-side and returns the result to the UI
  on completion (no polling); pages stream naturally.
- **NFR-3 Reliability:** SQLite (WAL mode) for durable local persistence with zero
  external database setup.
- **NFR-4 Accessibility/UX:** Keyboard-usable forms, ARIA labels on inputs, responsive
  layout, dark mode via `prefers-color-scheme`.
- **NFR-5 Observability:** Server logs include API errors for diagnostics.

---

## 7. Tech Stack (v1 implementation)

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.3.1 (App Router, Turbopack) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | better-auth 1.7 (email/password) with next-js cookies |
| Database | SQLite + Drizzle ORM (better-sqlite3) |
| Migrations | drizzle-kit (generated SQL in `drizzle/`) |
| AI text | OpenAI Responses API, `gpt-4o-mini` (structured JSON outputs for quiz/flashcards) |
| TTS | OpenAI `gpt-4o-mini-tts`, alloy voice → MP3 |
| PDF parsing | pdf-parse (pdf.js) on the server |
| Environment | `.env`: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `OPENAI_API_KEY` |

---

## 8. Data Model

Core auth tables (better-auth): `user`, `session`, `account`, `verification`.

App tables:

| Table | Key fields |
| --- | --- |
| `material` | `id`, `user_id` (FK→user), `title`, `content`, `source_type`, `file_name`, `created_at` |
| `summary` | `id`, `material_id` (FK, one-to-one), `content`, `created_at` |
| `audio_file` | `id`, `material_id` (FK, one-to-one), `file_name`, `created_at` |
| `quiz` | `id`, `material_id` (FK), `title`, `questions` (JSON), `created_at` |
| `flashcard` | `id`, `material_id` (FK), `cards` (JSON), `created_at` |

Deletes cascade from `material` to all generated content.

---

## 9. Future Roadmap

- **Personal notes per item** — save custom annotations on summaries/flashcards.
- **Spaced repetition** — deck scheduling (`known`/`again` ratings).
- **Study progress** — track dashboard and quiz scores over time.
- **More input types** — DOCX, Markdown, web URLs, audio transcription.
- **More study tools** — mind maps, practice essays, "explain like I'm 5".
- **Export** — print/download summary, flashcards, or quiz as PDF/Markdown.
- **Deployment** — swap SQLite for Postgres and add proper object storage for audio.

---

## 10. Out of Scope (v1)

OCR of scanned PDFs, collaborative sharing, payments/billing, admin panel, mobile
apps, offline mode.

---

## 11. Success Metrics

- **Adoption:** % of users who generate at least 2 of the 4 study tools per material.
- **Retention:** weekly-returning users.
- **Quality:** quiz accuracy; summary faithfulness (manual spot checks).
- **Reliability:** generation success rate; no silent auth failures.