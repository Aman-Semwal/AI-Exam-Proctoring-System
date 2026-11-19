# Exam Integrity Additions: Design Spec

**Date:** 2026-11-19 · **Branch:** `development` · **Builds on:** `2026-10-04-proctoring-completion-design.md`

## 1. Why

Compared with real AI proctoring products (Honorlock, Proctorio, Mercer Mettl, OctoProctor), the project covers the
core AI loop: identity, face, gaze, objects, audio, browser lockdown, trust score, review and reports. It is missing
four things that those products treat as basic, and that examiners at the final-year viva are likely to ask about:

1. **Screen proctoring:** what was on the student's screen?
2. **Copy, paste and shortcut blocking:** can the student paste an answer in?
3. **Consent:** did the student agree to camera, mic and screen recording? (privacy question)
4. **Pre-exam system check:** does the setup work before the exam starts?

**Success:** all four are visible in the demo, recorded server-side, and shown in the proctor dashboard and session report.

## 2. Goals, non-goals, anti-goals

**Goals:** the four features above, each as a per-exam rule where it makes sense, with evidence in the existing
review and report flow.

**Non-goals:** full video recording of the screen or webcam, room scan, a phone as a second camera, detecting a second
monitor from browser APIs (`screen.isExtended`), VM or DevTools detection, data-retention jobs, LMS integration.

**Anti-goals (would be a failure even if it works):**
- Breaking existing exams or the current demo checklist.
- Penalising a student for something they can't control. A browser without screen-share support gets a clear
  "use Chrome or Edge on a desktop" message, not a violation.
- Copy, paste or right-click attempts counting toward the tab-switch auto-submit.
- Making the frame upload so heavy that the 5-second loop falls behind.

## 3. Approaches considered (screen monitoring)

| Option | What it does | Trade-off |
|---|---|---|
| **A. Require sharing the whole screen** (chosen) | `getDisplayMedia` before the exam; only `displaySurface === "monitor"` is accepted. A screenshot is attached as evidence to each violation, and stopping the share is a violation. | Matches real products, and the evidence pipeline already exists. About 1 day of work, and adds roughly 60 KB per frame upload. |
| B. Detect a second monitor only | `window.screen.isExtended` | Chrome/Edge only, no screenshots, weak for the viva. |
| C. Periodic screenshots on their own endpoint | Separate 30 s upload loop | A second loop to keep in sync, and the screenshot wouldn't line up with the violation. |

The user picked **A**.

## 4. Pre-exam flow (the setup step in `LiveExam.jsx`)

The single setup card becomes a 4-step checklist. Each step unlocks the next:

```
┌ Pre-Exam Setup ─────────────────────────────────┐
│ 1 System check     ✓ Camera ✓ Mic ✓ Network ✓ Browser │
│ 2 Consent          [x] I agree …            ✓    │
│ 3 Share screen     [ Share Entire Screen ]       │
│ 4 Verify identity  [ Take Photo ]  → Start Exam  │
└──────────────────────────────────────────────────┘
```

Steps that a rule switches off are hidden: no mic check when audio monitoring is off, no screen step when screen
monitoring is off, no photo when identity checks are off.

### 4.1 System check (frontend only)

| Check | Pass condition | If it fails |
|---|---|---|
| Camera | `getUserMedia` video track is `live` and a sampled frame is not all black | Blocks the exam |
| Microphone (only if audio monitoring is on) | Audio track is live and the input level goes above silence within 5 s ("say something") | Blocks the exam |
| Network | `GET /api/health` round-trip under 1500 ms, average of 3 calls | Warning only; the student can continue |
| Browser | `navigator.mediaDevices.getDisplayMedia` exists (if screen monitoring is on), and `requestFullscreen` exists | Blocks, with the message "Use Chrome or Edge on a desktop computer" |

There's a "Re-run checks" button. Nothing is sent to the server.

### 4.2 Consent

- A short notice lists exactly what is captured, based on the exam's rules: camera snapshots, mic audio,
  screenshots, and browser activity. It also says who can see it: proctors and admins of the organization.
- A checkbox with the text "I understand and agree", then **Continue**.
- `POST /api/proctor/session/{sessionId}/consent` (student must own the session; idempotent) sets
  `exam_sessions.consent_given_at = now()` the first time and returns the session.
- **Server enforcement:** `POST /proctor/session/{id}/reference` and `POST /proctor/frame` return **403** with
  "Consent required" while `consent_given_at` is null. A resumed session that already consented skips this step
  (`SessionResponse.consentGiven: boolean`).
- The session report shows "Consent given: <time>".

### 4.3 Screen share

- **Share Entire Screen** calls `navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" }, audio: false })`.
- If `track.getSettings().displaySurface !== "monitor"`, the stream is stopped and the student sees "Please choose
  *Entire screen*, not a window or tab", then tries again.
- A small preview shows on the setup card. The stream is kept for the whole exam (in a ref, stopped on unmount and
  after submit).

## 5. During the exam

### 5.1 Screen share stopped

- When the screen track fires `ended` (the student clicks "Stop sharing"), the page reports a browser event
  `type = SCREEN_SHARE_STOPPED`, `signal = SCREEN_SHARE_ENDED`, with a webcam snapshot. This uses the existing
  `/browser-event` and `/return` flow, so time away is recorded too.
- A blocking overlay appears, like the existing full-screen overlay: "Screen sharing stopped. **Resume sharing** to
  continue." Resuming calls `getDisplayMedia` again, applies the same monitor check, then calls `/return`.
- Severity **HIGH**. It does not count toward the tab-switch limit.

### 5.2 Screenshots as evidence

- `WebcamCard` gets an optional `screenStream`. On each 5 s tick it also draws the current screen frame to a canvas,
  scaled to at most **1280 px** wide at JPEG quality **0.6** (about 60–120 KB), and sends it as `screenBase64` in
  `POST /proctor/frame`.
- `FrameUploadRequest.screenBase64`: optional, `@Size(max = 2_000_000)`.
- The backend stores the screenshot **only when that frame saves a violation**, the same as the webcam frame. Frames
  without violations store nothing.
- Browser events (tab switch, full-screen exit, copy or paste) also send a `screenBase64` taken at that moment
  (`BrowserEventRequest.screenBase64`, same size limit).
- **Storage:** `V32` adds `violation_evidence.kind VARCHAR(10) NOT NULL DEFAULT 'CAMERA'` (values `CAMERA`, `SCREEN`).
  Existing rows become `CAMERA`.
- **API:**
  - `GET /api/violations/{id}/evidence?kind=CAMERA|SCREEN`. Default `CAMERA`, so the current UI keeps working.
    Same access checks as today; 404 when there is no evidence of that kind.
  - `ViolationResponse` gets `hasScreenEvidence: boolean`.
- **UI:** the proctor review modal and the session report show the screenshot next to the webcam snapshot, using the
  existing `EvidenceImage` component with a `kind` prop.

### 5.3 Copy, paste, right-click and shortcuts

- On the exam page only, while `step === "active_exam"`, in the capture phase:
  - `copy`, `cut`, `paste` and `contextmenu` → `preventDefault()`.
  - `keydown` for Ctrl/Cmd + C, V, X, P (print), S (save), U (view source), plus F12 and Ctrl+Shift+I/J/C
    → `preventDefault()`.
- Each blocked action shows a toast for 2 s ("Copy and paste are disabled during the exam") and reports a browser
  event `type = COPY_PASTE_ATTEMPT` with signal `COPY | CUT | PASTE | CONTEXT_MENU | SHORTCUT`, plus webcam and screen
  snapshots.
- Severity **LOW**, de-duplicated **server-side** over 30 s per session, in the same Redis window used for
  `LOOKING_AWAY`. A burst of Ctrl+V presses becomes one violation. The frontend also debounces using the existing
  `EVENT_DEBOUNCE_MS`.
- No `/return` call, because the student never leaves the page.
- Never counts toward the auto-submit limit.
- Typing inside the answer boxes and the code editor still works. Only clipboard actions are blocked.

## 6. Rules, data and API summary

**Per-exam rules** (`ProctoringRules`, V32 adds columns to `exams`):

| Column | Default | Effect |
|---|---|---|
| `screen_monitoring_enabled` | true | Screen-share step, screenshots and `SCREEN_SHARE_STOPPED` |
| `clipboard_blocking_enabled` | true | Blocking and `COPY_PASTE_ATTEMPT` |

Consent and the system check are always on; they are not rules. Both exam forms get two more toggles in the shared
`ProctoringRulesFields` component.

**V32__exam_integrity_additions.sql:** the two `exams` columns, `exam_sessions.consent_given_at TIMESTAMP NULL`, and
`violation_evidence.kind`.

**Enums:**
- `ViolationType`: add `SCREEN_SHARE_STOPPED` (HIGH) and `COPY_PASTE_ATTEMPT` (LOW).
- `BrowserSignal`: add `SCREEN_SHARE_ENDED`, `COPY`, `CUT`, `PASTE`, `CONTEXT_MENU` and `SHORTCUT`.
- The backend rejects a browser event whose type is turned off for the exam: 409 "Rule disabled".

**Trust score:** no formula change. The new violations use the existing severity penalties (HIGH 10, LOW 2).

**Session report:** a consent line, the screenshots, and the new types in the counts and the timeline. The CSV
gets a `screen_evidence` yes/no column.

## 7. Error handling

- `getDisplayMedia` is denied or cancelled: the student stays on step 3 with "Screen sharing is required for this
  exam". No violation, because the exam hasn't started.
- Screen capture fails during a tick: the frame is sent without `screenBase64`, so a screenshot is never a reason to
  drop a webcam frame.
- An invalid base64 screenshot is logged and skipped, the same as the webcam frame today.
- Consent missing → 403 on reference and frame. The page treats it as "go back to the consent step".

## 8. Testing

- **Backend unit tests (written first):**
  - consent: 403 before consent, then OK, idempotent;
  - `SCREEN_SHARE_STOPPED` is HIGH and is not counted toward the tab-switch limit;
  - `COPY_PASTE_ATTEMPT` is de-duplicated in the 30 s window;
  - a disabled rule → 409;
  - a screenshot is stored only when a violation is saved;
  - `kind` filter on the evidence endpoint.
- **Controller tests:** access checks on the consent endpoint and on the evidence `kind` parameter.
- **Frontend:** `npm run lint` and `npm run build` clean.
- **End to end:** the `/verify` Playwright run, extended. Chromium flag `--auto-select-desktop-capture-source="Entire screen"`
  (or `--use-fake-ui-for-media-stream`) so `getDisplayMedia` resolves headlessly. The run checks the system check,
  consent, share, a paste attempt (one violation after three pastes), stopping the share (overlay, then resume), and
  a screenshot in the report.
- **Demo checklist** in the README gets steps for "paste blocked", "stop screen share" and "show screenshot in report".

## 9. Left to the builder

- Exact Tailwind styling of the 4-step checklist, matching the existing dark setup card.
- Whether the mic-level meter is a bar or a dot.
- How to split the new code into components, for example `SystemCheck.jsx`, `ConsentStep.jsx`,
  `ScreenShareStep.jsx` and `useClipboardGuard.js`.

## 10. Calls made by Claude (not explicitly decided by the user)

- New rules default to **on**, like the existing rules, so existing exams pick them up after V32.
- Copy and paste attempts are LOW, de-duplicated over 30 s; stopping the screen share is HIGH.
- Screenshots are capped at 1280 px and quality 0.6, and stored only with violations.
- A slow network gives a warning, not a block.
- Consent is stored as a timestamp on the session, not as a separate table with the full notice text.
