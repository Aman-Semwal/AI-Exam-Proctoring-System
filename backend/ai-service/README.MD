# AI Exam Proctoring — AI/ML Inference Service

FastAPI service handling face detection, gaze tracking, unauthorized-object
detection, identity verification, and voice-activity detection for the
exam-proctoring platform. Everything here is served through ONNX Runtime
or MediaPipe — no torch/insightface/ultralytics at request time, only at
build time (see Dockerfile).

## Endpoints

| Method | Path                     | Purpose                                            |
|--------|--------------------------|-----------------------------------------------------|
| GET    | `/health`                | Liveness check                                       |
| POST   | `/infer/face`            | Face count + bounding boxes (MediaPipe BlazeFace)    |
| POST   | `/infer/gaze`            | Head pose + iris-based gaze (MediaPipe FaceMesh)     |
| POST   | `/infer/object`          | Unauthorized-object detection (YOLOv8n via ONNX)     |
| POST   | `/infer/identity/embed`  | 512-dim ArcFace embedding for a face                 |
| POST   | `/infer/identity/verify` | Cosine-similarity match against a reference embedding|
| POST   | `/infer/audio/voice-activity` | Speech detection (Silero VAD, 16-bit PCM WAV 16kHz mono) |
| POST   | `/infer/analyze`         | Aggregates all of the above into one severity-scored violation record |

## Running tests

The production image (`ai-service`) intentionally does **not** include
pytest/httpx — keeps the shipped image lean. Tests run against a separate
image built from the Dockerfile's `test` stage:

```powershell
cd backend
docker-compose build ai-service-test
docker-compose run --rm ai-service-test pytest tests/ -v
```

68 tests, all against real fixtures (real photo, real speech audio, real
downloaded model weights) — no mocks on the inference path.

## Architecture decisions

- **ONNX Runtime everywhere, torch nowhere at runtime.** YOLOv8n is
  exported to ONNX in a discarded Docker build stage (`onnx-export`);
  ArcFace and Silero VAD are downloaded pre-converted. The shipped image
  never carries the torch/CUDA dependency chain.
- **`mediapipe==0.10.14`, pinned exactly.** Last version on the legacy
  `mp.solutions.*` API; `mediapipe>=1.0.0` uses an incompatible Tasks API.
- **Sync `def` route handlers, not `async def`.** All inference here is
  CPU-bound with no `await` points. FastAPI auto-dispatches sync routes to
  a worker thread pool, so concurrent exam sessions run in parallel
  instead of serializing on one event-loop thread.
- **Every MediaPipe model instance is thread-local, not shared.**
  `app/core/landmarks.py` (FaceMesh) and `app/services/face_service.py`
  (BlazeFace) each give every worker thread its own model instance,
  constructed lazily and guarded by a lock (construction only, not
  inference). This isn't an optimization — a single shared instance
  segfaults under real concurrent load, and even a shared instance behind
  a full inference-level lock still throws real `CalculatorGraph` errors.
  See the docstring in `landmarks.py` for the two failed attempts that
  preceded this fix. ONNX Runtime sessions (YOLO, ArcFace, Silero), by
  contrast, are safe to share directly — documented by ONNX Runtime and
  confirmed here via `tests/test_concurrency.py`.
- **Identity match threshold: 0.38**, calibrated against the Olivetti/
  AT&T faces benchmark (40 subjects, 1,800 genuine + 78,000 impostor
  pairs run through the real embedding pipeline) — 0% false-accept/
  false-reject on that dataset. See `identity_service.py`'s docstring for
  the full numbers and caveats (studio photos, not webcam noise).

## Known limitations

- **Multi-speaker diarization is not implemented.** Only voice *activity*
  (is someone speaking) is detected, not *who* or *how many*. No
  lightweight ONNX speaker-embedding model was found/validated as a
  no-torch-at-runtime option.
- **Severity scoring (`analysis_service.py`) is hand-set, not
  calibrated.** Point values and band cutoffs reflect a reasoned but
  unmeasured judgment call — there's no equivalent to the identity-
  threshold benchmark for "how severe is this violation pattern in an
  exam context." Needs real session data or a policy decision to move
  past hand-set numbers. (One structural fix has been made: the LOW/
  MEDIUM boundary was widened from 15 to 19 points so a single `NO_FACE`
  violation — often just a camera glitch, not real cheating — doesn't
  sit exactly on the boundary.)
- **Backend integration is partial.** Spring Boot's `AiServiceClient`
  currently only calls `/infer/face`. The other endpoints exist and are
  tested but nothing in the backend invokes them yet, and
  `ViolationType` doesn't yet have entries matching this service's
  violation strings (`looking_away`, `unauthorized_object`,
  `identity_mismatch`).
- **Frontend audio format.** `/infer/audio/*` requires 16-bit PCM WAV
  mono 16kHz; browser `MediaRecorder` defaults to WebM/Opus. Conversion
  needs to happen client-side (Web Audio API) before calling that
  endpoint — not yet implemented.