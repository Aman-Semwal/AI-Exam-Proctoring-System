# Proctoring Completion — Design Spec

**Date:** 2026-10-04 · **Deadline:** 2026-10-31 · **Branch:** `development`
**Source of scope:** `AI-EXAM-PROCTORING-SYSTEM-SYNOPSIS.docx.pdf`

## 1. Goal

Finish the parts of the synopsis that are missing or not yet connected, so that one exam can be demoed from start to finish:
student verifies identity → takes the proctored exam (video, audio and browser lockdown) → the proctor watches live and can act →
the session gets a trust score and an evidence-backed report.

### Already done (not in this spec)
- **#1 Identity:** a live reference photo is taken before each exam, stored on the session and checked every 10th frame (`V25`).
- **#2 Browser lockdown:** tab switches (`TAB_SWITCH`, HIGH) and full-screen exits (`FULLSCREEN_EXIT`, MEDIUM) are recorded
  server-side. The 2nd tab switch auto-submits the exam.

### Out of scope (cut for the deadline)
- Pausing a session (the timer and the expiry scheduler would need rework), and two-way proctor ↔ student chat. A one-way
  **proctor warning message** replaces chat.
- Subscription billing, payment gateway, audit log, departments. These get their own spec later if time allows.
- S3/MinIO object storage. Evidence is stored in Postgres (see §4).
- Server-side PDF generation. Reports are printed or saved to PDF from the browser (see §7).

## 2. Implementation order

| # | Item | Depends on |
|---|------|-----------|
| 3 | Per-exam proctoring rules | — |
| 4 | Audio monitoring (`SPEECH_DETECTED`) | 3 |
| 5 | Trust score + review outcome | — |
| 6 | Evidence snapshots | — |
| 7 | Proctor actions: terminate + warning message | — |
| 8 | Session report + CSV/PDF export | 5, 6 |
| 9 | Hardening + demo readiness | all |

Rules come first because they control whether audio and identity checks run, and how many tab switches are allowed.

## 3. Per-exam proctoring rules

**Data:** `V26__exam_proctoring_rules.sql` adds these columns to `exams`:

| Column | Type | Default | Effect |
|---|---|---|---|
| `identity_check_enabled` | BOOLEAN | true | Pre-exam photo is required and identity is checked every N frames |
| `audio_monitoring_enabled` | BOOLEAN | true | Student page captures mic audio; speech becomes a violation |
| `gaze_tracking_enabled` | BOOLEAN | true | `LOOKING_AWAY` violations are recorded |
| `object_detection_enabled` | BOOLEAN | true | `UNAUTHORIZED_OBJECT` violations are recorded |
| `tab_switch_limit` | INT | 2 | Tab switches before auto-submit; `0` = never auto-submit |

- Existing exams get the defaults, so current behaviour is unchanged.
- `tab_switch_limit` replaces the global `proctoring.tab-switch.auto-submit-threshold` setting. The setting stays only as
  the default for new exams.
- **Enforcement is on the server.** The AI service still runs every detector, and `ProctoringServiceImpl` drops violation
  types that are disabled for the exam. The identity embedding is only sent when identity checks are enabled. No change
  to the AI service is needed.
- **API:** `ExamRequest` and `ExamResponse` get a nested `proctoringRules` object. Create and update accept it; if it is
  missing, the defaults apply.
- **UI:** a shared `ProctoringRulesFields` component (toggles and a number input) used in both exam forms: the examiner
  create/edit form in `ExaminerDashboard.jsx` and the org-admin create form in `UpcomingExams.jsx`. `LiveExam` reads the
  rules from `GET /exams/{id}`:
  - it skips the photo step when identity checks are off;
  - it skips mic capture when audio monitoring is off;
  - the banner text uses `tab_switch_limit`.

## 4. Audio monitoring

**Client (`WebcamCard.jsx`):** asks for `{ video: true, audio: true }` when `audioMonitoringEnabled` is on. It records with
an `AudioContext({ sampleRate: 16000 })` and an `AudioWorklet` (or `ScriptProcessorNode` where worklets aren't supported).
Each 5-second frame tick encodes the last 5 s as **16-bit PCM mono 16 kHz WAV** (the format the AI service expects) and
sends it with the frame as `audioBase64` in `POST /proctor/frame`. If the mic is denied, a banner appears and the exam
continues on video only; no violation is recorded.

**Server:**
- `FrameUploadRequest` gets an optional `audioBase64`, limited to 1 MB.
- `ProctoringServiceImpl` passes it to `aiServiceClient.analyze(frame, embedding, audio)`.
- If `voice_activity.speech_detected` is true and `speech_fraction ≥ proctoring.audio.speech-fraction-threshold`
  (default `0.3`), the backend records a new `ViolationType.SPEECH_DETECTED` at **MEDIUM** severity. It is
  de-duplicated over the same 30 s Redis window as `LOOKING_AWAY`.
- The AI service does not flag speech itself, because voice activity alone doesn't show whose voice it is. The backend
  makes the call, using the per-exam rule.

**Limitation (shown in the UI copy):** this detects *speech*, not *multiple speakers*. Diarization with pyannote is
future scope.

## 5. Trust score + review outcome

**Review outcome:**
- `V27__violation_review_outcome.sql` adds `review_outcome VARCHAR(20)` to `violations`. Allowed values: `CONFIRMED`,
  `DISMISSED`, or NULL (not reviewed yet).
- `PATCH /violations/{id}/review` accepts an optional body `{ "outcome": "CONFIRMED" | "DISMISSED" }`. With no body the
  outcome is `CONFIRMED`, so the current dashboard keeps working.
- The proctor dashboard review modal gets **Confirm** and **Dismiss (false positive)** buttons.

**Trust score:** `TrustScoreService.calculate(sessionId)` → an integer from 0 to 100.
- Start at 100 and subtract a penalty for each violation that is **not DISMISSED**: LOW 2, MEDIUM 5, HIGH 10, CRITICAL 20.
  The result can't go below 0.
- Bands: **≥ 80 Trusted** (green), **50–79 Review** (amber), **< 50 Suspicious** (red).
- **Computed when read, never stored.** Dismissing a violation later updates the score straight away, and there is no
  stored value that can go stale. The synopsis ER diagram shows `trust_score` on the session; we deliberately compute it
  instead and note this in the report.
- Shown in:
  - `SessionResponse` and `ExamResultResponse` (new `trustScore` and `trustLevel` fields);
  - the student Results page (the score only; individual violations are not shown to the student);
  - the proctor dashboard session list;
  - the report.

## 6. Evidence snapshots

- `V28__violation_evidence.sql` adds a table `violation_evidence(id, violation_id FK ON DELETE CASCADE, content_type,
  data BYTEA, created_at)`.
- When `processFrame` **saves** an AI violation, it also saves that frame's JPEG as evidence. Frames skipped by
  de-duplication save no evidence. Browser events have no image, and the report says "No image (browser event)".
- **Size:** frames are scaled down to at most 640 px wide on the client before upload (≈30–50 KB). That keeps a demo-scale
  database well inside the free Neon/Supabase limits.
- **API:** `GET /api/violations/{id}/evidence` returns `image/jpeg`, with the same access checks as `GET /violations/{id}`
  (same organization, and proctors only for exams they're assigned to). It returns 404 when there is no evidence.
  `ViolationResponse` gets `hasEvidence: boolean`.
- **UI:** a thumbnail in the proctor review modal and in the report. The image is loaded with the auth header as a blob
  URL, because a plain `<img src>` can't send the JWT.

## 7. Proctor actions: terminate + warning

- **Terminate:** `PUT /api/sessions/{id}/terminate` with body `{ "reason": string }`.
  - Roles: PROCTOR (assigned to the exam), ORG_ADMIN, SUPER_ADMIN.
  - Sets status TERMINATED, the score, and endTime. It also records a violation of type `OTHER`, severity CRITICAL,
    details "Terminated by proctor: <reason>".
  - Sends `SESSION_TERMINATED` to the student's `/user/queue/session-events` (same message shape as the existing
    auto-terminate).
- **Warning:** `POST /api/sessions/{id}/warn` with body `{ "message": string (≤ 300 chars) }`. Sends `PROCTOR_WARNING` to
  the student's queue. Nothing is stored.
- **Student side (new):** `LiveExam` subscribes to `/user/queue/session-events` using the existing `useWebSocket` hook.
  - `PROCTOR_WARNING` shows a dismissible amber banner with the message.
  - `SESSION_TERMINATED` shows a full-screen notice and then goes to Results.
  - This also fixes the existing auto-terminate notice, which nothing currently listens for.
- **Proctor UI:** each live session row gets **Warn** and **Terminate** buttons. Terminate asks for confirmation and a
  reason.

## 8. Session report + export

- `GET /api/sessions/{id}/report` (proctor, examiner, org admin, super admin; same access checks as above) returns:
  - session: id, attempt, status, start, end, duration;
  - student: name, email;
  - exam: title;
  - score and max score;
  - trust score and level;
  - violation counts by type and severity;
  - the full violation timeline: time, type, severity, details, review outcome, `hasEvidence`.
- **Frontend:** a `SessionReport` page at `/reports/session/:id`, opened from the proctor dashboard and from org admin
  exam views.
  - **Export CSV:** the violation timeline, built in the browser.
  - **Print / Save as PDF:** `window.print()` with a print stylesheet. Evidence thumbnails are included and the
    navigation is hidden.

## 9. Hardening + demo readiness

- **Seeded credentials:** migrations V14–V21 can't be edited because they've already been applied. Instead, a startup
  `ApplicationRunner` sets the seeded demo accounts (matched by their seeded emails) to inactive when
  `SEED_ACCOUNTS_ENABLED=false`. The default is `true`, so local demos keep working. The README says to set it to `false`
  and change the super-admin password before any shared deployment.
- Add `scratch/` to `.gitignore`.
- Tests: each item above gets service unit tests written first, plus controller tests for the new endpoints (role
  checks). `mvnw test`, `npm run lint` and `npm run build` must all pass.
- **Demo checklist** in the README, a one-page run-through:
  1. log in as an examiner and create an exam with rules;
  2. assign a student and a proctor;
  3. the student takes the exam (photo, a tab switch, speaking, a phone in view);
  4. the proctor sees alerts, reviews/dismisses one, and warns;
  5. the trust score updates;
  6. the report is exported.
- README updates: the new env vars (`PROCTORING_TAB_SWITCH_AUTO_SUBMIT`, `PROCTORING_SPEECH_FRACTION_THRESHOLD`,
  `SEED_ACCOUNTS_ENABLED`), corrected service ports, and removal of the stray Docker-cleanup notes.

## 10. Error handling (applies to all items)

- AI service outage during frames: the existing skip-frame behaviour stays (no violations, no evidence). Enrollment
  during an outage returns 503 (already implemented).
- Actions on a session that isn't ACTIVE return 409. The student page treats 409 as "session over" and goes to Results.
- All new student endpoints check that the student owns the session. All new staff endpoints use the existing
  `validateSameOrganization` checks plus the check that a proctor is assigned to the exam.

## 11. Success criteria

- The demo checklist (§9) runs end to end against `docker-compose up` with no manual database edits.
- Every synopsis feature in §11 *Features* except billing, audit log and SMS is visible in the UI.
- The backend test suite is green, and frontend lint shows no errors.
