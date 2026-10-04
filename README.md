# AI Exam Proctoring System

A multi-tenant AI exam proctoring platform: a React frontend, a Spring Boot REST/WebSocket backend, and a Python AI service that checks webcam frames (faces, gaze, objects, identity) and microphone audio (speech) during an exam.

## Project Structure

```
AI-Exam-Proctoring-System/
├── frontend/                       # React + Vite app (port 5173)
├── backend/
│   ├── docker-compose.yml
│   ├── .env                        # secrets (not committed)
│   ├── .env.example                # template for env setup
│   ├── proctorbackend/             # Spring Boot REST API (port 8080)
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/
│   └── ai-service/                 # Python FastAPI AI/ML service (port 8000)
│       ├── Dockerfile
│       ├── requirements.txt
│       └── app/
│           └── main.py
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, STOMP over SockJS |
| REST API | Spring Boot 3.3, Java 21 |
| AI/ML Service | FastAPI, MediaPipe, OpenCV, ONNX Runtime (YOLOv8n, ArcFace), Silero VAD |
| Database | PostgreSQL (online) |
| Cache / Session | Redis (online) |
| Auth | Spring Security + JWT |
| Container | Docker, Docker Compose |

## Prerequisites

- Docker Desktop
- Online PostgreSQL instance (Supabase / Neon / Railway)
- Online Redis instance (Upstash / Railway)

## Setup

**1. Clone the repo**
```bash
git clone <repo-url>
cd AI-Exam-Proctoring-System/backend
```

**2. Create `.env` from template**
```bash
cp .env.example .env
```

**3. Fill in your credentials in `.env`**
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<dbname>
SPRING_DATASOURCE_USERNAME=<username>
SPRING_DATASOURCE_PASSWORD=<password>
SPRING_DATA_REDIS_HOST=<redis-host>
SPRING_DATA_REDIS_PORT=<redis-port>
SPRING_DATA_REDIS_PASSWORD=<redis-password>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRATION_MS=900000
AI_SERVICE_URL=http://ai-service:8000
```

## Running with Docker

```bash
# Build and start both services
docker-compose up --build
# Run in background
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Services

| Service | URL |
|---|---|
| Spring Boot REST API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |
| Python AI Service | http://localhost:8001 |
| AI Service Docs | http://localhost:8001/docs |

Run the frontend separately:

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (set VITE_API_BASE_URL if the API is not on localhost:8080)
```

## API Endpoints

### AI Service (called only by the backend)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/infer/analyze` | All checks in one call: faces, gaze, objects, optional identity + voice activity |
| POST | `/infer/identity/embed` | Face embedding for the pre-exam reference photo |
| POST | `/infer/face`, `/infer/gaze`, `/infer/object`, `/infer/identity/verify`, `/infer/audio/voice-activity` | Individual detectors |

### Proctoring (backend)
| Method | Endpoint | Who | Description |
|---|---|---|---|
| POST | `/api/proctor/session/{id}/reference` | Student | Enroll the live photo taken before the exam |
| POST | `/api/proctor/frame` | Student | Webcam frame (+ optional audio chunk) every 5 s |
| POST | `/api/proctor/session/{id}/browser-event` | Student | `TAB_SWITCH` / `FULLSCREEN_EXIT`; may auto-submit |
| GET | `/api/sessions/{id}/report` | Staff | Integrity report: trust score, counts, evidence timeline |
| GET | `/api/violations/{id}/evidence` | Staff | Webcam snapshot behind a violation |
| PATCH | `/api/violations/{id}/review` | Staff | `{ "outcome": "CONFIRMED" \| "DISMISSED" }` |
| PUT | `/api/sessions/{id}/terminate` · POST `/api/sessions/{id}/warn` | Proctor / admin | Live actions, pushed to the student over WebSocket |

Full interactive docs: Swagger UI (above).

## Environment Variables

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC connection URL (include `?prepareThreshold=0` for PgBouncer/Supabase) |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL username |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password |
| `SPRING_DATA_REDIS_HOST` | Redis host |
| `SPRING_DATA_REDIS_PORT` | Redis port |
| `SPRING_DATA_REDIS_PASSWORD` | Redis password |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRATION_MS` | JWT expiry in milliseconds (default: 900000 = 15 min) |
| `AI_SERVICE_URL` | Internal Docker URL for AI service (default: `http://ai-service:8000`) |
| `AI_SERVICE_API_KEY` | Shared secret for Spring → AI service authentication (`X-API-Key` header) |
| `AUTH_BOOTSTRAP_ENABLED` | Set to `false` after SUPER_ADMIN is created to disable `/api/auth/register` |
| `SEED_ACCOUNTS_ENABLED` | Default `true`. Set `false` on any shared deployment: deactivates the demo accounts seeded by migrations (known password) |
| `PROCTORING_SPEECH_FRACTION_THRESHOLD` | Share of an audio chunk that must be speech to record `SPEECH_DETECTED` (default `0.3`) |
| `PROCTORING_CRITICAL_THRESHOLD` | CRITICAL violations that auto-terminate a session (default `5`) |
| `PROCTORING_IDENTITY_CHECK_INTERVAL_FRAMES` | Identity is verified every N frames (default `10` ≈ every 50 s) |
| `FRONTEND_URL`, `WEBSOCKET_ALLOWED_ORIGINS` | Frontend origin for invitation links and WebSocket CORS (default `http://localhost:5173`) |

Per-exam settings (identity check, audio, gaze, object detection, tab-switch limit) are chosen in the exam form, not in env vars.

> **Security:** migrations seed demo users with a known password. Before sharing a deployment, set `SEED_ACCOUNTS_ENABLED=false`
> and change the `superadmin@proctor.com` password.

> **Port note:** The AI service listens on port **8000 internally** (Docker network) but is mapped to **8001 on the host** (`docker-compose.yml` `ports: "8001:8000"`). Use `http://localhost:8001` from your machine and `http://ai-service:8000` from within Docker.

## Demo checklist

A full run-through of the exam flow (about 10 minutes, two browsers or one normal + one private window):

1. **Examiner** (`examiner@tech.edu`): create an exam starting in a few minutes. Open *Proctoring rules* and keep all checks on, with a tab-switch limit of 2. Add a few MCQ questions and publish it.
2. **Org admin** (`admin@tech.edu`): assign the student and the proctor to the exam.
3. **Student** (`student@tech.edu`): start the exam, allow camera and microphone, take the reference photo, then start in full screen.
   - Answer a question: the panel shows *✓ Answer saved*.
   - Switch tabs once: a warning banner appears and the proctor gets an alert.
   - Talk for a few seconds, hold a phone up to the camera, or let someone else step into view.
4. **Proctor** (`proctor@tech.edu`): alerts arrive live. Open one, see the evidence snapshot, and **Dismiss** it as a false positive or **Confirm** it.
   In *Live Sessions*, send a **Warn** message: it appears on the student's screen.
5. **Student**: switch tabs a second time. The exam is auto-submitted and Results shows the score and trust score.
6. **Proctor / examiner**: open the **Integrity Report** for the session, then **Export CSV** and **Print / Save as PDF**.

## Docker cleanup

```bash
docker container prune -f   # remove stopped containers
docker image prune -af      # remove unused images
docker builder prune -af    # clear the build cache (usually the largest)
docker volume prune -f      # remove unused volumes
```
