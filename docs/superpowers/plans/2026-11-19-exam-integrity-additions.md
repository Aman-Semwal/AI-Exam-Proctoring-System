# Exam Integrity Additions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pre-exam system check, consent, entire-screen sharing with screenshot evidence, and copy/paste/shortcut
blocking to the proctored exam.

**Architecture:** One Flyway migration (V32) adds two exam rules, the session's consent time and the evidence kind. The new
violations reuse the existing `/browser-event` → `recordBrowserEvent` pipeline and the `violation_evidence` table
(now one row per kind). The frontend splits the setup card into four step components and adds a clipboard-guard hook.

**Tech Stack:** Spring Boot 3 / JPA / Flyway / Redis (backend, JUnit 5 + Mockito); React 18 + Vite + Tailwind (frontend);
Playwright for end-to-end.

**Spec:** `docs/superpowers/specs/2026-11-19-exam-integrity-additions-design.md`

Backend root: `backend/proctorbackend/src/main/java/com/proctor/proctorbackend/` (written `B/` below); tests are under
`backend/proctorbackend/src/test/java/com/proctor/proctorbackend/` (`T/`). Frontend root: `frontend/src/` (`F/`).

## Global Constraints

- Migration file name: `V32__exam_integrity_additions.sql`. Never edit V1–V31.
- New rule defaults: `screenMonitoringEnabled = true`, `clipboardBlockingEnabled = true`, in Java, SQL and
  `F/utils/proctoringRules.js`.
- Severities: `SCREEN_SHARE_STOPPED` = HIGH, `COPY_PASTE_ATTEMPT` = LOW. Severity is set server-side only.
- Only `TAB_SWITCH` counts toward `tabSwitchLimit` and auto-submit.
- `COPY_PASTE_ATTEMPT` dedupe: Redis key `proctor:dedupe:copy_paste_attempt:<sessionId>`, TTL `dedupIntervalSeconds` (30 s).
- Screenshot: at most 1280 px wide, JPEG quality 0.6; `screenBase64` fields are `@Size(max = 2_000_000)`.
- Evidence kinds: `CAMERA` (default, existing rows) and `SCREEN`.
- Missing consent → Spring `AccessDeniedException("Consent required")` (handled as 403). A rule that's off → `IllegalStateException("Rule disabled")` (handled as 409).
- Network check threshold: average of 3 `GET /api/health` calls under 1500 ms; a slow network is a warning, not a block.
- Copy text: "Copy and paste are disabled during the exam"; "Please choose *Entire screen*, not a window or tab";
  "Screen sharing stopped. Resume sharing to continue."; "Use Chrome or Edge on a desktop computer";
  "Screen sharing is required for this exam".
- Gates per task: `./mvnw test` green (backend tasks); `npm run lint` with no errors and `npm run build` OK (frontend tasks).
- After code changes: `/c/Users/anura/AppData/Roaming/uv/tools/graphifyy/Scripts/python.exe -m graphify update .`

## Review Focus

1. A **resumed session** (student reloads mid-exam): consent and photo must not be asked again, but the screen share
   must be requested again, because a reload drops the stream. Test in Task 5 (`consentGiven` drives the skip) and in the Task 8 e2e.
2. **Pasting inside the code editor or answer box** must be blocked too, and typing must still work. Test in Task 6
   (the guard listens in the capture phase on `document`).
3. **A screen track ending after the exam was submitted** (unmount, submit) must not report a violation. Test in Task 6:
   the listener is removed and the stream stopped on cleanup before navigation.
4. **An exam with a rule turned off** must never show that step or send that event; if a client sends it anyway, the
   server returns 409. Tests in Task 2 (`rule disabled → IllegalStateException`) and Task 5 (steps hidden).
5. **Old violations with no screenshot** must still render: the screen image shows only when `hasScreenEvidence` is
   true, with no broken image. Covered in Task 3 (`hasScreenEvidence=false` by default) and Task 7.

---

### Task 1: V32 migration, new rules, consent endpoint and enforcement

**Files:**
- Create: `backend/proctorbackend/src/main/resources/db/migration/V32__exam_integrity_additions.sql`
- Modify: `B/exam/ProctoringRules.java`, `B/session/ExamSession.java`, `B/session/dto/SessionResponse.java`,
  `B/session/SessionServiceImpl.java:406` (response builder), `B/proctoring/ProctoringService.java`,
  `B/proctoring/ProctoringServiceImpl.java` (`processFrame` ~L208, `enrollReference` ~L406), `B/proctoring/ProctoringController.java`
- Test: `T/proctoring/ProctoringServiceImplTest.java`, `T/proctoring/ProctoringControllerTest.java`

**Interfaces:**
- Produces: the V32 schema (all columns used by Tasks 2–3); `ProctoringRules.isScreenMonitoringEnabled()`,
  `isClipboardBlockingEnabled()`; `ExamSession.consentGivenAt: LocalDateTime`; `SessionResponse.consentGiven: boolean`;
  `ProctoringService.giveConsent(Long sessionId, String studentEmail): SessionResponse`;
  `POST /api/proctor/session/{sessionId}/consent` (STUDENT) → `ApiResponse<SessionResponse>`.

- [ ] **Step 1: Write the migration**

```sql
ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS screen_monitoring_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS clipboard_blocking_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP NULL;
ALTER TABLE violation_evidence ADD COLUMN IF NOT EXISTS kind VARCHAR(10) NOT NULL DEFAULT 'CAMERA';
CREATE INDEX IF NOT EXISTS idx_violation_evidence_violation_kind ON violation_evidence(violation_id, kind);
```

- [ ] **Step 2: Write the failing tests** in `ProctoringServiceImplTest`. `activeSession` in `@BeforeEach` gets
  `consentGivenAt = LocalDateTime.now()`, so the existing tests keep passing.
  - `giveConsent_setsTimestampOnce`: consentGivenAt null → after the call it is non-null and `sessionRepository.save` is
    called; a second call keeps the first timestamp.
  - `giveConsent_notOwner_throwsUnauthorized`.
  - `processFrame_withoutConsent_throwsAccessDenied`: consentGivenAt null → `assertThrows(AccessDeniedException.class, …)`,
    `verify(aiServiceClient, never()).analyze(any(), any(), any())`.
  - `enrollReference_withoutConsent_throwsAccessDenied`.
  - `ProctoringControllerTest.consent_requiresStudentRole`: a PROCTOR gets 403 and a STUDENT gets 200, following the
    file's existing role-test pattern.

- [ ] **Step 3: Run them and confirm they fail**

Run: `cd backend/proctorbackend && ./mvnw -q test -Dtest=ProctoringServiceImplTest,ProctoringControllerTest`
Expected: compile failure (`giveConsent` and `consentGivenAt` don't exist yet).

- [ ] **Step 4: Implement**
  - Add the two rule fields, with `@Column(name = …, nullable = false)` and default `true`.
  - Add `ExamSession.consentGivenAt` (`@Column(name = "consent_given_at")`).
  - `SessionResponse.consentGiven` = `session.getConsentGivenAt() != null`.
  - `giveConsent`: the same ownership and ACTIVE checks as `enrollReference`; sets the time only when it is null;
    returns the session mapped the way `SessionServiceImpl` does it (reuse its mapper method, made package-visible or
    moved to a shared `SessionMapper` if needed).
  - The consent check goes at the top of `processFrame` and `enrollReference`, after the ownership check.

- [ ] **Step 5: Run the backend suite**

Run: `./mvnw -q test` · Expected: BUILD SUCCESS

- [ ] **Step 6: Commit** with the message `feat: consent before proctoring and V32 integrity schema`

---

### Task 2: `SCREEN_SHARE_STOPPED` and `COPY_PASTE_ATTEMPT` browser events

**Files:**
- Modify: `B/violation/ViolationType.java` (add both under "Client/frontend-detected"),
  `B/violation/BrowserSignal.java` (add `SCREEN_SHARE_ENDED, COPY, CUT, PASTE, CONTEXT_MENU, SHORTCUT`),
  `B/proctoring/ProctoringServiceImpl.java` (`recordBrowserEvent` ~L438, `describe`, `recordBrowserReturn` ~L536)
- Test: `T/proctoring/ProctoringServiceImplTest.java`

**Interfaces:**
- Consumes: the Task 1 rule getters.
- Produces: the two violation types and six signals, which the frontend sends as strings.

- [ ] **Step 1: Write the failing tests**
  - `recordBrowserEvent_screenShareStopped_persistsHigh_notCounted`: severity HIGH; `resp.isAutoSubmitted()` is false
    even when `countNotDismissedBySessionIdAndType(55L, TAB_SWITCH)` returns 5.
  - `recordBrowserEvent_copyPaste_persistsLow`: signal PASTE → severity LOW, `browserSignal == PASTE`, details contain "paste".
  - `recordBrowserEvent_copyPaste_dedupedWithin30s`: `hasKey("proctor:dedupe:copy_paste_attempt:55")` returns true →
    `violationRepository.save` is never called, and the response has `violationId == null` and is not auto-submitted.
  - `recordBrowserEvent_copyPaste_setsDedupKey`: verifies `valueOps.set("proctor:dedupe:copy_paste_attempt:55", "1", Duration.ofSeconds(30))`.
  - `recordBrowserEvent_ruleDisabled_throwsConflict`: `clipboardBlockingEnabled = false` → `IllegalStateException`;
    the same for `screenMonitoringEnabled = false` with SCREEN_SHARE_STOPPED.
  - `recordBrowserReturn_allowedForScreenShareStopped`, and `recordBrowserReturn_rejectsCopyPaste` (BadRequestException).

- [ ] **Step 2: Run them and confirm they fail** (`-Dtest=ProctoringServiceImplTest`): the enum constants are missing.

- [ ] **Step 3: Implement**
  - Severity switch: `SCREEN_SHARE_STOPPED -> HIGH`, `COPY_PASTE_ATTEMPT -> LOW`.
  - After the ACTIVE check: the rule check, then for COPY_PASTE_ATTEMPT the Redis dedupe. The dedupe returns
    `BrowserEventResponse` with a null `violationId` and the current tab-switch count; the key is set with the same
    `valueOps.set(..., Duration.ofSeconds(dedupIntervalSeconds))` call used for frames.
  - Default signal when it's null: SCREEN_SHARE_STOPPED → `SCREEN_SHARE_ENDED`, COPY_PASTE_ATTEMPT → `SHORTCUT`.
  - `describe(...)` text per new signal, for example "Screen sharing was stopped", "Tried to paste",
    "Tried to open the context menu", "Used a blocked keyboard shortcut".
  - `recordBrowserReturn` accepts SCREEN_SHARE_STOPPED as well.
  - The auto-submit condition stays `type == TAB_SWITCH && …`; don't change it.

- [ ] **Step 4: Run the backend suite**: `./mvnw -q test` → BUILD SUCCESS

- [ ] **Step 5: Commit** with the message `feat: record screen-share-stopped and copy/paste attempts`

---

### Task 3: Screenshot evidence (kind) in storage, the API and the report

**Files:**
- Create: `B/violation/EvidenceKind.java` (`enum EvidenceKind { CAMERA, SCREEN }`)
- Modify: `B/violation/ViolationEvidence.java` (`@Enumerated(STRING) @Column(nullable=false, length=10) kind`, builder default CAMERA),
  `B/violation/ViolationEvidenceRepository.java`, `B/violation/ViolationService.java`, `B/violation/ViolationServiceImpl.java:98-148`,
  `B/violation/ViolationController.java:74-85`, `B/violation/dto/ViolationResponse.java`,
  `B/proctoring/dto/FrameUploadRequest.java`, `B/proctoring/dto/BrowserEventRequest.java`,
  `B/proctoring/ProctoringService.java`, `B/proctoring/ProctoringServiceImpl.java` (`processFrame` L342, `recordBrowserEvent` L471, `saveEvidence` L596),
  `B/proctoring/ProctoringController.java:61`, `B/session/SessionReportService.java:53`, `B/session/dto/SessionReportResponse.java`
- Test: `T/proctoring/ProctoringServiceImplTest.java`, `T/violation/ViolationServiceImplTest.java`, `T/session/SessionReportServiceTest.java`

**Interfaces:**
- Consumes: the V32 `kind` column.
- Produces:
  - `FrameUploadRequest.screenBase64` and `BrowserEventRequest.screenBase64`.
  - A new 6-argument `recordBrowserEvent(Long, ViolationType, BrowserSignal, String snapshotBase64, String screenBase64, String email)`. The existing 5-argument version delegates with `screenBase64 = null`.
  - `ViolationService.getEvidence(Long violationId, EvidenceKind kind, String requesterEmail)`.
  - `GET /api/violations/{id}/evidence?kind=CAMERA|SCREEN` (default CAMERA).
  - `ViolationResponse.hasScreenEvidence`.
  - `SessionReportResponse.consentGivenAt`, and `Entry.hasScreenEvidence`.
  - Repository methods: `findFirstByViolationIdAndKind(Long, EvidenceKind)`, `findViolationIdsWithEvidenceOfKind(Collection<Long>, EvidenceKind)`.

- [ ] **Step 1: Write the failing tests**
  - `processFrame_violation_storesCameraAndScreenEvidence`: a frame with `screenBase64` that triggers a violation →
    `evidenceRepository.save` is called twice, with kinds CAMERA and SCREEN.
  - `processFrame_noViolation_storesNoScreenshot`: never saved.
  - `recordBrowserEvent_storesScreenEvidence`.
  - `processFrame_invalidScreenBase64_keepsCameraEvidence`: one save (CAMERA) and no exception.
  - `ViolationServiceImplTest.getEvidence_byKind` returns SCREEN; and `getEvidence_missingKind_throwsNotFound`.
  - `SessionReportServiceTest.report_carriesConsentAndScreenFlags`.

- [ ] **Step 2: Run them and confirm they fail** (compile errors).

- [ ] **Step 3: Implement**
  - `saveEvidence(Violation, String base64, EvidenceKind kind)`. The existing callers pass CAMERA; the screen call
    happens only when `screenBase64` is non-blank and the violation was saved.
  - Change the old `findViolationIdsWithEvidence` callers to the `…OfKind(…, CAMERA)` version, so that
    `hasEvidence` keeps meaning "has a webcam image".
  - The controller has `@RequestParam(defaultValue = "CAMERA") EvidenceKind kind`.

- [ ] **Step 4: Run the backend suite**: `./mvnw -q test` → BUILD SUCCESS

- [ ] **Step 5: Commit** with the message `feat: screenshot evidence alongside webcam evidence`

---

### Task 4: Rule toggles and the warning-counter fix (frontend)

**Files:**
- Modify: `F/utils/proctoringRules.js` (add `screenMonitoringEnabled: true, clipboardBlockingEnabled: true`),
  `F/components/exam/ProctoringRulesFields.jsx` (add 2 entries to `TOGGLES`),
  `F/components/exam/AIStatus.jsx:112` (replace the hard-coded `/ 3` with a `limit` prop; `LiveExam` passes `rules.tabSwitchLimit`, and the label is hidden when the limit is 0)

**Toggles:**
- `{ key: "screenMonitoringEnabled", label: "Screen monitoring", hint: "Entire screen shared; screenshots kept as evidence" }`
- `{ key: "clipboardBlockingEnabled", label: "Block copy & paste", hint: "Blocks clipboard, right-click and shortcuts" }`

- [ ] **Step 1: Make the edits**
- [ ] **Step 2: Verify**: `cd frontend && npm run lint && npm run build`. Expected: no lint errors, and the build succeeds.
- [ ] **Step 3: Commit** with the message `feat: screen and clipboard rule toggles; real tab-switch limit in AIStatus`

---

### Task 5: The pre-exam 4-step setup

**Files:**
- Create: `F/components/exam/setup/SystemCheck.jsx`, `F/components/exam/setup/ConsentStep.jsx`, `F/components/exam/setup/ScreenShareStep.jsx`, `F/utils/systemCheck.js`
- Modify: `F/pages/Student/LiveExam.jsx` (setup render ~L400–497; the session-load effect, which reads `consentGiven`)

**Interfaces:**
- Consumes: `POST /proctor/session/{id}/consent` (Task 1); `rules` (Task 4).
- Produces:
  - `F/utils/systemCheck.js` exports:
    - `checkCamera(stream): Promise<boolean>`: samples one frame and fails when the mean pixel value is below 8.
    - `checkMicLevel(stream, timeoutMs = 5000): Promise<boolean>`: true when the RMS is above 0.02.
    - `checkNetwork(api): Promise<{ ok: boolean, avgMs: number }>`: 3× `GET /health`, ok when the average is under 1500.
    - `checkBrowser({ needScreen }): { ok: boolean, message?: string }`.
  - `<SystemCheck rules cameraStream onPassed />`
  - `<ConsentStep rules sessionId onConsented />`
  - `<ScreenShareStep onShared(stream) />`
  - `LiveExam` holds `screenStreamRef` (a `MediaStream` ref), which Task 6 uses.

- [ ] **Step 1: Build `systemCheck.js` and the three components**
  - The step order is system → consent → screen → photo. A step is shown only while the earlier ones are done.
  - A step is skipped when its rule is off: the mic check when audio monitoring is off, the screen step when screen
    monitoring is off, the photo when identity checks are off.
  - Consent is skipped when the session already has `consentGiven`.
  - The consent text lists only the captures that are on for this exam.
  - The screen step calls `getDisplayMedia({ video: { displaySurface: "monitor" }, audio: false })`. It rejects any
    `displaySurface` other than `"monitor"`: it stops the tracks and shows the copy from Global Constraints.
  - A 403 "Consent required" from `/reference` or `/proctor/frame` sends the student back to the consent step.
- [ ] **Step 2: Gate "Start Exam"** on every required step being done. The existing "Anti-Cheat Rules" list gets a
  bullet for screen sharing and one for copy and paste, each shown only when its rule is on.
- [ ] **Step 3: Verify**: `npm run lint && npm run build`. Then a manual smoke test against the running verify stack:
  the steps appear in order, and turning a rule off hides its step.
- [ ] **Step 4: Commit** with the message `feat: pre-exam system check, consent and screen share steps`

---

### Task 6: During the exam: screenshots, share-stopped overlay, clipboard guard

**Files:**
- Create: `F/hooks/useClipboardGuard.js`
- Modify:
  - `F/components/exam/WebcamCard.jsx`: an optional `screenStream` prop. Each tick it draws the screen to a second
    off-screen canvas (1280 px, quality 0.6) and adds `screenBase64` to the `/proctor/frame` body. If the capture
    throws, the frame is sent without it. `snapshotRef.current.captureScreen()` returns the base64 or null.
  - `F/pages/Student/LiveExam.jsx`: `reportEvent` sends `screenBase64` (from `snapshotRef.current?.captureScreen?.()`).

**Interfaces:**
- Consumes: `screenStreamRef` (Task 5); event types and signals (Task 2); `screenBase64` (Task 3).
- Produces: `useClipboardGuard({ enabled, onBlocked(signal) })`, where `signal` is one of
  `"COPY" | "CUT" | "PASTE" | "CONTEXT_MENU" | "SHORTCUT"`.

- [ ] **Step 1: Build `useClipboardGuard`**
  - `document.addEventListener(…, { capture: true })` for `copy`, `cut`, `paste` and `contextmenu`, plus `keydown`
    matching Ctrl/Cmd + C/V/X/P/S/U, F12 and Ctrl+Shift+I/J/C. Every match calls `preventDefault()` and then
    `onBlocked(signal)`.
  - Listeners are removed on cleanup, or when `enabled` becomes false.
- [ ] **Step 2: Wire the guard into `LiveExam`**, enabled when `step === "active_exam" && rules.clipboardBlockingEnabled`.
  `onBlocked` shows a 2 s toast with the exact copy and calls `reportEvent("COPY_PASTE_ATTEMPT", signal)`, using the
  existing `EVENT_DEBOUNCE_MS` debounce per type. No away-tracking entry is created for this type.
- [ ] **Step 3: Handle a stopped screen share**
  - On the video track's `ended` event: `reportEvent("SCREEN_SHARE_STOPPED", "SCREEN_SHARE_ENDED")` and show the
    blocking overlay (same style as the full-screen overlay at ~L620) with the exact copy and a **Resume sharing**
    button.
  - Resuming re-runs the monitor-only `getDisplayMedia` check, replaces `screenStreamRef`, re-binds the `ended`
    listener and calls `finishAway("SCREEN_SHARE_STOPPED")`.
  - On cleanup (unmount, submit, auto-submit, time up) remove the listener **before** `stop()`-ing the tracks.
  - On a reload with an ACTIVE session: show the screen step again before going back into the exam.
  - Only when `import.meta.env.DEV`: set `window.__proctorScreenStream = screenStreamRef.current`, so the Task 8 e2e
    can stop the track.
- [ ] **Step 4: Verify**: `npm run lint && npm run build`
- [ ] **Step 5: Commit** with the message `feat: clipboard guard, screen-share-stopped handling and screenshots per frame`

---

### Task 7: Show screenshots and consent to reviewers

**Files:**
- Modify:
  - `F/components/common/EvidenceImage.jsx`: a `kind = "CAMERA"` prop, appended as `?kind=${kind}`.
  - `F/pages/Proctor/ProctorDashboard.jsx:1064`: when `hasScreenEvidence`, show a second `EvidenceImage kind="SCREEN"`
    labelled "Screen". Keep `hasScreenEvidence` in the violation-to-row mapping around L242.
  - `F/pages/Reports/SessionReport.jsx`:
    - a "Consent given" row in the details grid (the time, or "—");
    - the screen thumbnail next to the camera one when `e.hasScreenEvidence`;
    - a `screen_evidence` yes/no column in the CSV, after the existing evidence column.

- [ ] **Step 1: Make the edits**
- [ ] **Step 2: Verify**: `npm run lint && npm run build`
- [ ] **Step 3: Commit** with the message `feat: screenshots and consent in review modal and session report`

---

### Task 8: End-to-end verification, README, graph

**Files:**
- Modify: `README.md` (Demo checklist: add "paste blocked", "stop screen share → overlay → resume", "screenshot in report")
- Scratch (not committed): extend the `/verify` Playwright script

- [ ] **Step 1: Rebuild the backend jar** and restart it against the throwaway database (`/verify` skill). V32 must
  apply: look for `now at version v32` in `backend.log`.
- [ ] **Step 2: Extend the Playwright run**
  - Add the Chromium flags `--auto-select-desktop-capture-source=Entire screen` and `--enable-usermedia-screen-capturing`.
  - Drive: system check passes → tick consent → Share Entire Screen → Take Photo → Start.
  - Press Ctrl+V three times in the textarea, then expect exactly 1 `COPY_PASTE_ATTEMPT` from
    `GET /violations/session/{id}`.
  - Stop the screen track with `page.evaluate(() => window.__proctorScreenStream.getTracks().forEach(t => t.stop()))`.
    Expect the overlay, then a `SCREEN_SHARE_STOPPED` violation, then click **Resume sharing** and the overlay goes away.
  - Check the report: `hasScreenEvidence` is true on at least one entry, and the consent row is present.
  - All 12 existing checks still pass.
- [ ] **Step 3: Update the graph**: `…/python.exe -m graphify update .`
- [ ] **Step 4: Commit** with the message `docs: demo checklist for integrity additions`
