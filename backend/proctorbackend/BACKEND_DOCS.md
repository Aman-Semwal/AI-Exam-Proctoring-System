# Proctor Backend — Java Documentation

> Spring Boot REST API for the AI Exam Proctoring System.  
> Port **8080** · Java 21 · Spring Boot 3.x · PostgreSQL · Redis · JWT Auth

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Package Structure](#3-package-structure)
4. [Configuration Layer](#4-configuration-layer)
5. [Auth Module](#5-auth-module)
6. [User Module](#6-user-module)
7. [Exam Module](#7-exam-module)
8. [Session Module](#8-session-module)
9. [Proctoring Module](#9-proctoring-module)
10. [WebSocket Module](#10-websocket-module)
11. [Common / Shared](#11-common--shared)
12. [API Reference](#12-api-reference)
13. [Data Flow Diagrams](#13-data-flow-diagrams)
14. [Error Handling](#14-error-handling)
15. [Security Model](#15-security-model)
16. [Environment Variables](#16-environment-variables)

---

## 1. Project Overview

The **Proctor Backend** is a stateless REST API that:

- Manages users (students, examiners, admins) with JWT-based authentication.
- Lets examiners create and manage exams.
- Lets students start/end exam sessions.
- Receives webcam frames from students, forwards them to the Python AI service for face detection, persists proctoring events, and pushes real-time violation alerts to examiners over WebSocket.

It works alongside a **Python FastAPI AI service** (port 8000) that runs MediaPipe face detection.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client (Browser)                       │
│          REST (HTTP/JSON)       WebSocket (STOMP/SockJS)      │
└────────────┬─────────────────────────────┬───────────────────┘
             │                             │
             ▼                             ▼
┌────────────────────────┐     ┌───────────────────────┐
│  Spring Boot REST API  │     │  WebSocket Broker      │
│  (port 8080)           │     │  /topic/alerts/{examId}│
│                        │     └───────────────────────┘
│  ┌──────────────────┐  │
│  │  JwtAuthFilter   │  │  ← validates Bearer token on every request
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │  Controllers     │  │  ← AuthController, ExamController,
│  │                  │  │     SessionController, ProctoringController
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │  Service Layer   │  │  ← Business logic, transaction boundaries
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │  Repository Layer│  │  ← Spring Data JPA (PostgreSQL)
│  └──────────────────┘  │
└────────────┬───────────┘
             │
     ┌───────┴────────┐
     │                │
     ▼                ▼
┌─────────┐    ┌───────────────┐
│PostgreSQL│    │  Redis Cache  │
└─────────┘    └───────────────┘
             │
             ▼
┌────────────────────────┐
│ Python AI Service      │
│ (FastAPI, port 8000)   │
│  POST /infer/face      │
└────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Controller** | HTTP request/response mapping, input validation delegation, auth principal extraction |
| **Service (interface)** | Defines the business contract |
| **ServiceImpl** | Implements business logic, owns transactions (`@Transactional`) |
| **Repository** | Spring Data JPA CRUD + custom queries against PostgreSQL |
| **Config** | Spring beans: Security, JWT filter, WebSocket broker, Redis template, WebClient |
| **Common** | Shared DTOs (`ApiResponse`), enums (`Role`), custom exceptions, global error handler |

---

## 3. Package Structure

```
com.proctor.proctorbackend/
│
├── ProctorbackendApplication.java     ← Main entry point
│
├── auth/                              ← Registration, login, JWT
│   ├── AuthController.java
│   ├── AuthService.java               (interface)
│   ├── AuthServiceImpl.java
│   ├── JwtService.java
│   └── dto/
│       ├── AuthResponse.java
│       ├── LoginRequest.java
│       └── RegisterRequest.java
│
├── user/                              ← User entity + profile management
│   ├── User.java                      (JPA entity + UserDetails)
│   ├── UserRepository.java
│   ├── UserService.java               (interface)
│   ├── UserServiceImpl.java
│   ├── UserController.java
│   └── dto/
│       ├── UserDto.java
│       └── UpdateProfileRequest.java
│
├── exam/                              ← Exam CRUD
│   ├── Exam.java                      (JPA entity)
│   ├── ExamRepository.java
│   ├── ExamService.java               (interface)
│   ├── ExamServiceImpl.java
│   ├── ExamController.java
│   └── dto/
│       ├── ExamRequest.java
│       └── ExamResponse.java
│
├── session/                           ← Exam session lifecycle
│   ├── ExamSession.java               (JPA entity)
│   ├── SessionStatus.java             (enum: ACTIVE, COMPLETED, TERMINATED)
│   ├── SessionRepository.java
│   ├── SessionService.java            (interface)
│   ├── SessionServiceImpl.java
│   ├── SessionController.java
│   └── dto/
│       ├── SessionRequest.java
│       └── SessionResponse.java
│
├── proctoring/                        ← AI face detection + event logging
│   ├── ProctoringEvent.java           (JPA entity + EventType enum)
│   ├── ProctoringEventRepository.java
│   ├── ProctoringService.java         (interface)
│   ├── ProctoringServiceImpl.java
│   ├── ProctoringController.java
│   ├── AiServiceClient.java           ← WebClient wrapper for AI service
│   └── dto/
│       ├── FrameUploadRequest.java
│       ├── FaceInferenceResult.java
│       └── ProctoringEventResponse.java
│
├── websocket/                         ← STOMP WebSocket alerts
│   ├── AlertController.java
│   └── dto/
│       └── AlertMessage.java
│
├── config/                            ← Spring configuration beans
│   ├── SecurityConfig.java
│   ├── JwtAuthFilter.java
│   ├── WebSocketConfig.java
│   ├── RedisConfig.java
│   └── WebClientConfig.java
│
└── common/                            ← Shared utilities
    ├── enums/
    │   └── Role.java
    ├── response/
    │   └── ApiResponse.java
    └── exception/
        ├── GlobalExceptionHandler.java
        ├── BadRequestException.java
        ├── UnauthorizedException.java
        └── ResourceNotFoundException.java
```

---

## 4. Configuration Layer

### 4.1 SecurityConfig

**File:** `config/SecurityConfig.java`

Configures Spring Security for a stateless JWT-based API.

| Setting | Value | Why |
|---|---|---|
| CSRF | Disabled | Stateless REST API — no session cookies |
| Session policy | `STATELESS` | JWT carries all auth state |
| BCrypt strength | 12 | Balances security and speed |
| Public URLs | `/api/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**` | No token needed for login/register/docs |
| Method security | `@EnableMethodSecurity` | Enables `@PreAuthorize` on controllers |

```java
// All other endpoints require a valid JWT
.anyRequest().authenticated()
```

---

### 4.2 JwtAuthFilter

**File:** `config/JwtAuthFilter.java`  
**Extends:** `OncePerRequestFilter` — runs exactly once per HTTP request.

**Flow:**
```
Request arrives
    │
    ├─ No "Authorization: Bearer ..." header? → skip (pass through)
    │
    ├─ Extract JWT from header (substring after "Bearer ")
    ├─ extractUsername(jwt) → userEmail
    ├─ SecurityContext already has auth? → skip
    │
    ├─ Load UserDetails from DB by email
    ├─ isTokenValid(jwt, userDetails)?
    │       ├─ YES → set UsernamePasswordAuthenticationToken in SecurityContext
    │       └─ NO  → do nothing (request will fail authorization)
    │
    └─ Continue filter chain
```

---

### 4.3 WebSocketConfig

**File:** `config/WebSocketConfig.java`

| Setting | Value |
|---|---|
| STOMP endpoint | `/ws` (with SockJS fallback) |
| Broker prefix | `/topic` (for subscriptions) |
| App destination prefix | `/app` (for `@MessageMapping` methods) |
| Allowed origins | `*` (configure for production) |

**How examiners connect:**
```javascript
// Client-side example
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);
stompClient.connect({}, () => {
    stompClient.subscribe('/topic/alerts/42', (msg) => {
        console.log(JSON.parse(msg.body));
    });
});
```

---

### 4.4 RedisConfig

**File:** `config/RedisConfig.java`

Configures a `RedisTemplate<String, Object>` bean:
- **Keys** serialized as plain `String` (human-readable in Redis CLI).
- **Values** serialized as JSON via `GenericJackson2JsonRedisSerializer`.

---

### 4.5 WebClientConfig

**File:** `config/WebClientConfig.java`

Creates a `WebClient` bean pointing at `AI_SERVICE_URL` (e.g. `http://ai-service:8000`). Used by `AiServiceClient` to call the Python face detection endpoint.

---

## 5. Auth Module

### 5.1 Overview

Handles user registration and login. On success, returns a signed JWT that the client includes in every subsequent request as `Authorization: Bearer <token>`.

### 5.2 JwtService

**File:** `auth/JwtService.java`

Core JWT operations using the `io.jsonwebtoken` (JJWT) library.

| Method | Description |
|---|---|
| `generateToken(UserDetails)` | Creates a signed JWT with `sub=email`, `iat`, `exp` |
| `generateToken(extraClaims, UserDetails)` | Same but with additional custom claims |
| `extractUsername(token)` | Reads the `sub` claim (email) |
| `extractClaim(token, resolver)` | Generic claim extractor using a `Function<Claims, T>` |
| `isTokenValid(token, userDetails)` | Checks username match + not expired |

**Configuration (application.yml / env vars):**
```yaml
spring.security.jwt.secret: <base64-encoded-256-bit-secret>
spring.security.jwt.expiration-ms: 86400000   # 24 hours
```

**Signing algorithm:** HMAC-SHA (key derived from base64-decoded secret via `Keys.hmacShaKeyFor`).

---

### 5.3 AuthService / AuthServiceImpl

**Interface:** `AuthService`  
**Implementation:** `AuthServiceImpl`

#### `register(RegisterRequest)`
1. Check if email already exists → throw `BadRequestException` if so.
2. Build `User` entity with BCrypt-encoded password.
3. Save to DB.
4. Generate JWT.
5. Return `AuthResponse` (token + user info).

#### `login(LoginRequest)`
1. Call `authenticationManager.authenticate(...)` — Spring Security validates credentials. Throws `BadCredentialsException` on failure (caught by `GlobalExceptionHandler`).
2. Load user from DB.
3. Generate JWT.
4. Return `AuthResponse`.

---

### 5.4 DTOs

#### `RegisterRequest`
| Field | Type | Validation |
|---|---|---|
| `name` | String | `@NotBlank` |
| `email` | String | `@NotBlank`, `@Email` |
| `password` | String | `@NotBlank`, `@Size(min=8, max=128)` |
| `role` | Role | `@NotNull` — STUDENT / EXAMINER / ADMIN |

#### `LoginRequest`
| Field | Type | Validation |
|---|---|---|
| `email` | String | `@NotBlank`, `@Email` |
| `password` | String | `@NotBlank` |

#### `AuthResponse`
| Field | Type | Description |
|---|---|---|
| `token` | String | Signed JWT to use in Bearer header |
| `name` | String | User's display name |
| `email` | String | User's email |
| `role` | Role | STUDENT / EXAMINER / ADMIN |

---

### 5.5 Auth Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register new user, returns JWT |
| POST | `/api/auth/login` | None | Login, returns JWT |

**Example — Register:**
```json
POST /api/auth/register
{
  "name": "Ali Khan",
  "email": "ali@example.com",
  "password": "secret123",
  "role": "STUDENT"
}

// Response 201
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "name": "Ali Khan",
    "email": "ali@example.com",
    "role": "STUDENT"
  }
}
```

---

## 6. User Module

### 6.1 User Entity

**File:** `user/User.java`  
**Table:** `users`

Implements `UserDetails` so Spring Security can load it directly.

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `name` | VARCHAR | NOT NULL |
| `email` | VARCHAR | NOT NULL, UNIQUE |
| `password` | VARCHAR | NOT NULL (BCrypt hash) |
| `role` | VARCHAR | NOT NULL, enum stored as string |
| `created_at` | TIMESTAMP | Set on `@PrePersist`, not updatable |
| `updated_at` | TIMESTAMP | Updated on `@PrePersist` and `@PreUpdate` |

**UserDetails implementation:**
- `getUsername()` → returns `email` (Spring Security uses this as the principal name).
- `getAuthorities()` → returns `["ROLE_STUDENT"]` / `["ROLE_EXAMINER"]` / `["ROLE_ADMIN"]`.
- Account flags (`isEnabled`, `isAccountNonExpired`, etc.) all return `true` (extend if you need account suspension).

### 6.2 Role Enum

**File:** `common/enums/Role.java`

```
STUDENT   → can start/end sessions, submit frames
EXAMINER  → can create/update/delete exams, view session events
ADMIN     → all examiner permissions
```



---

## 7. Exam Module

### 7.1 Exam Entity

**File:** `exam/Exam.java`  
**Table:** `exams`

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `title` | VARCHAR | NOT NULL |
| `description` | VARCHAR(1000) | nullable |
| `duration_minutes` | INT | NOT NULL |
| `scheduled_at` | TIMESTAMP | NOT NULL |
| `created_by` | BIGINT | FK → users.id, NOT NULL |
| `created_at` | TIMESTAMP | Set on `@PrePersist`, not updatable |
| `updated_at` | TIMESTAMP | Updated on `@PrePersist` and `@PreUpdate` |

`createdBy` is a `@ManyToOne(fetch = FetchType.LAZY)` to `User` — fetched lazily to avoid N+1 queries when listing exams.

---

### 7.2 ExamService Operations

| Method | Access | Description |
|---|---|---|
| `createExam(request, email)` | EXAMINER, ADMIN | Creates exam, sets `createdBy` to calling user |
| `getExamById(id)` | Any authenticated | Returns single exam or throws `ResourceNotFoundException` |
| `getAllExams()` | Any authenticated | Returns all exams |
| `getMyExams(email)` | EXAMINER, ADMIN | Returns only exams created by caller |
| `updateExam(id, request, email)` | EXAMINER, ADMIN | Updates exam; only owner can update |
| `deleteExam(id, email)` | EXAMINER, ADMIN | Deletes exam; only owner can delete |

---

### 7.3 Exam Endpoints

| Method | URL | Role | Description |
|---|---|---|---|
| POST | `/api/exams` | EXAMINER, ADMIN | Create exam |
| GET | `/api/exams/{id}` | Any | Get exam by ID |
| GET | `/api/exams` | Any | Get all exams |
| GET | `/api/exams/my` | EXAMINER, ADMIN | Get my created exams |
| PUT | `/api/exams/{id}` | EXAMINER, ADMIN | Update exam |
| DELETE | `/api/exams/{id}` | EXAMINER, ADMIN | Delete exam |

**Example — Create Exam:**
```json
POST /api/exams
Authorization: Bearer <token>
{
  "title": "Data Structures Midterm",
  "description": "Covers arrays, linked lists, and trees",
  "durationMinutes": 90,
  "scheduledAt": "2026-09-01T10:00:00"
}

// Response 201
{
  "success": true,
  "message": "Exam created successfully",
  "data": {
    "id": 1,
    "title": "Data Structures Midterm",
    "durationMinutes": 90,
    "scheduledAt": "2026-09-01T10:00:00",
    "createdByName": "Prof. Raza"
  }
}
```

---

## 8. Session Module

### 8.1 ExamSession Entity

**File:** `session/ExamSession.java`  
**Table:** `exam_sessions`

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `exam_id` | BIGINT | FK → exams.id, NOT NULL |
| `student_id` | BIGINT | FK → users.id, NOT NULL |
| `status` | VARCHAR | NOT NULL — ACTIVE / COMPLETED / TERMINATED |
| `started_at` | TIMESTAMP | Set when session is started |
| `ended_at` | TIMESTAMP | Set when session is ended |
| `created_at` | TIMESTAMP | Set on `@PrePersist`, not updatable |

### 8.2 SessionStatus Enum

```
ACTIVE      → student is currently taking the exam
COMPLETED   → student ended the session normally
TERMINATED  → session was force-ended (admin/system action)
```

---

### 8.3 SessionService Operations

| Method | Access | Description |
|---|---|---|
| `startSession(request, email)` | STUDENT | Creates ACTIVE session. Blocks duplicate active sessions for same exam. |
| `endSession(id, email)` | STUDENT | Sets status=COMPLETED, records `endedAt`. Only session owner can end it. |
| `getSessionById(id)` | Any | Returns session or throws `ResourceNotFoundException` |
| `getMySessionsAsStudent(email)` | STUDENT | Returns all sessions for the calling student, newest first |
| `getSessionsByExam(examId, email)` | EXAMINER, ADMIN | Returns all sessions for a given exam |

**Duplicate session guard:**
```java
boolean alreadyActive = sessionRepository.existsByExamIdAndStudentIdAndStatus(
    exam.getId(), student.getId(), SessionStatus.ACTIVE);
if (alreadyActive) throw new BadRequestException("Active session already exists");
```

---

### 8.4 Session Endpoints

| Method | URL | Role | Description |
|---|---|---|---|
| POST | `/api/sessions/start` | STUDENT | Start a new exam session |
| PUT | `/api/sessions/{id}/end` | STUDENT | End an active session |
| GET | `/api/sessions/{id}` | Any | Get session by ID |
| GET | `/api/sessions/my` | STUDENT | Get my sessions |
| GET | `/api/sessions/exam/{examId}` | EXAMINER, ADMIN | Get all sessions for an exam |

---

## 9. Proctoring Module

### 9.1 Overview

The proctoring module is the core of the system. It:
1. Receives a base64-encoded webcam frame from the student.
2. Calls the **Python AI service** (`POST /infer/face`) via `AiServiceClient`.
3. Interprets the face count and creates a `ProctoringEvent`.
4. Saves the event to PostgreSQL.
5. If a violation is detected, pushes a real-time `AlertMessage` to examiners via WebSocket.

---

### 9.2 ProctoringEvent Entity

**File:** `proctoring/ProctoringEvent.java`  
**Table:** `proctoring_events`

| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `session_id` | BIGINT | FK → exam_sessions.id, NOT NULL |
| `event_type` | VARCHAR | NOT NULL — see EventType below |
| `details` | VARCHAR(500) | Human-readable description |
| `face_count` | INT | Number of faces detected by AI |
| `detected_at` | TIMESTAMP | Set on `@PrePersist`, not updatable |

#### EventType Enum (inner enum in ProctoringEvent)

| Value | Meaning | Triggers Alert? |
|---|---|---|
| `FACE_DETECTED` | Normal — exactly 1 face | No |
| `NO_FACE_DETECTED` | Student not visible | **Yes** |
| `MULTIPLE_FACES_DETECTED` | Possible cheating | **Yes** |

---

### 9.3 ProctoringServiceImpl — Frame Processing Flow

```
POST /api/proctor/frame
        │
        ▼
1. Load ExamSession by sessionId
        │
        ▼
2. Verify calling student owns the session
        │
        ▼
3. Verify session.status == ACTIVE
        │
        ▼
4. AiServiceClient.inferFace(frameBase64)
   → POST http://ai-service:8000/infer/face
   → Returns FaceInferenceResult { faceCount: N }
        │
        ▼
5. Determine EventType:
   faceCount == 0  → NO_FACE_DETECTED
   faceCount  > 1  → MULTIPLE_FACES_DETECTED
   faceCount == 1  → FACE_DETECTED
        │
        ▼
6. Persist ProctoringEvent to DB
        │
        ▼
7. If violation (not FACE_DETECTED):
   → Build AlertMessage
   → messagingTemplate.convertAndSend(
         "/topic/alerts/{examId}", alert)
        │
        ▼
8. Return ProctoringEventResponse
```

---

### 9.4 AiServiceClient

**File:** `proctoring/AiServiceClient.java`

Wraps the reactive `WebClient` call to the Python AI service in a blocking call (`.block()`), since `ProctoringServiceImpl` is not reactive.

**Resilience:** On any error (network failure, AI service down), it returns a fallback `FaceInferenceResult` with `faceCount=0` instead of breaking the proctoring flow. This means a transient AI failure logs a `NO_FACE_DETECTED` event — acceptable degraded behavior.

```java
.onErrorResume(ex -> {
    log.error("AI service call failed: {}", ex.getMessage());
    FaceInferenceResult fallback = new FaceInferenceResult();
    fallback.setFaceCount(0);
    return Mono.just(fallback);
})
```

---

### 9.5 Proctoring Endpoints

| Method | URL | Role | Description |
|---|---|---|---|
| POST | `/api/proctor/frame` | STUDENT | Submit webcam frame for analysis |
| GET | `/api/proctor/session/{sessionId}/events` | EXAMINER, ADMIN | Get all events for a session |

**Example — Submit Frame:**
```json
POST /api/proctor/frame
Authorization: Bearer <student-token>
{
  "sessionId": 5,
  "frameBase64": "/9j/4AAQSkZJRgABAQAAAQABAAD..."
}

// Response 200
{
  "success": true,
  "message": "Frame processed",
  "data": {
    "id": 101,
    "sessionId": 5,
    "eventType": "MULTIPLE_FACES_DETECTED",
    "details": "2 faces detected in frame",
    "faceCount": 2,
    "detectedAt": "2026-08-04T10:30:00"
  }
}
```

---

## 10. WebSocket Module

### 10.1 AlertController

**File:** `websocket/AlertController.java`

Handles STOMP messages. Examiners subscribe to `/topic/alerts/{examId}` to receive real-time violation alerts for that exam.

Alerts are **automatically pushed** by `ProctoringServiceImpl` using `SimpMessagingTemplate.convertAndSend(...)` whenever a violation event is detected.

The `@MessageMapping("/alerts/{examId}")` endpoint also allows **manual broadcast** — a client can send a message to `/app/alerts/{examId}` and it will be forwarded to all subscribers.

### 10.2 AlertMessage DTO

| Field | Type | Description |
|---|---|---|
| `sessionId` | Long | The session in which violation occurred |
| `studentName` | String | Student's display name |
| `eventType` | String | `NO_FACE_DETECTED` or `MULTIPLE_FACES_DETECTED` |
| `details` | String | Human-readable detail string |
| `timestamp` | LocalDateTime | Auto-set to `LocalDateTime.now()` on creation |

### 10.3 WebSocket Connection Guide

```
Endpoint:  ws://localhost:8080/ws  (with SockJS)
Protocol:  STOMP

Subscribe:  /topic/alerts/{examId}
Send to:    /app/alerts/{examId}   (optional manual broadcast)
```

---

## 11. Common / Shared

### 11.1 ApiResponse\<T\>

**File:** `common/response/ApiResponse.java`

All REST endpoints return this wrapper. `@JsonInclude(NON_NULL)` means `data` is omitted from the JSON when null (e.g. error responses).

```json
// Success with data
{ "success": true,  "message": "...", "data": { ... } }

// Success without data (e.g. delete)
{ "success": true,  "message": "Exam deleted" }

// Error
{ "success": false, "message": "Resource not found" }
```

**Static factory methods:**

| Method | Use case |
|---|---|
| `ApiResponse.success(message, data)` | Normal response with payload |
| `ApiResponse.success(message)` | Action confirmed, no payload |
| `ApiResponse.error(message)` | Error response |

---

### 11.2 Custom Exceptions

| Exception | HTTP Status | When thrown |
|---|---|---|
| `ResourceNotFoundException` | 404 | Entity not found by ID or email |
| `BadRequestException` | 400 | Business rule violation (duplicate session, email taken, etc.) |
| `UnauthorizedException` | 401 | Caller does not own the resource |

All three extend `RuntimeException`.

---

### 11.3 GlobalExceptionHandler

**File:** `common/exception/GlobalExceptionHandler.java`  
Annotated with `@RestControllerAdvice` — catches exceptions from all controllers.

| Exception caught | HTTP Status | Notes |
|---|---|---|
| `ResourceNotFoundException` | 404 | Logs at WARN level |
| `UnauthorizedException` | 401 | Logs at WARN level |
| `BadRequestException` | 400 | Logs at WARN level |
| `BadCredentialsException` | 401 | Returns generic message — does not reveal if email exists |
| `AccessDeniedException` | 403 | Returns "Access denied" |
| `MethodArgumentNotValidException` | 400 | Returns map of `{ fieldName: errorMessage }` |
| `Exception` (catch-all) | 500 | Logs full stack trace at ERROR level |

---

## 12. API Reference

### Base URL
```
http://localhost:8080
```

### Authentication
All endpoints except `/api/auth/**` require:
```
Authorization: Bearer <jwt-token>
```

### Complete Endpoint Table

| Method | URL | Role Required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, get JWT |
| GET | `/api/users/me` | Any | Get my profile |
| PUT | `/api/users/me` | Any | Update my profile |
| POST | `/api/exams` | EXAMINER, ADMIN | Create exam |
| GET | `/api/exams` | Any | List all exams |
| GET | `/api/exams/{id}` | Any | Get exam by ID |
| GET | `/api/exams/my` | EXAMINER, ADMIN | My created exams |
| PUT | `/api/exams/{id}` | EXAMINER, ADMIN | Update exam |
| DELETE | `/api/exams/{id}` | EXAMINER, ADMIN | Delete exam |
| POST | `/api/sessions/start` | STUDENT | Start exam session |
| PUT | `/api/sessions/{id}/end` | STUDENT | End exam session |
| GET | `/api/sessions/{id}` | Any | Get session |
| GET | `/api/sessions/my` | STUDENT | My sessions |
| GET | `/api/sessions/exam/{examId}` | EXAMINER, ADMIN | Sessions for exam |
| POST | `/api/proctor/frame` | STUDENT | Submit frame for AI analysis |
| GET | `/api/proctor/session/{id}/events` | EXAMINER, ADMIN | Get proctoring events |

### Swagger UI
```
http://localhost:8080/swagger-ui/index.html
```
All endpoints are documented with `@Tag`, `@Operation`, and `@SecurityRequirement` annotations. You can test authenticated endpoints directly from Swagger by clicking **Authorize** and entering your JWT.

---

## 13. Data Flow Diagrams

### 13.1 Registration & Login Flow

```
Client                  AuthController          AuthServiceImpl         DB
  │                          │                        │                  │
  │── POST /api/auth/register ──▶                     │                  │
  │                          │── register(request) ──▶│                  │
  │                          │                        │── existsByEmail? ▶│
  │                          │                        │◀── false ─────────│
  │                          │                        │── save(user) ────▶│
  │                          │                        │── generateToken() │
  │                          │◀── AuthResponse ───────│                  │
  │◀── 201 { token, ... } ───│                        │                  │
```

### 13.2 Frame Submission & Proctoring Alert Flow

```
Student Client          ProctoringController    ProctoringServiceImpl   AI Service   WebSocket
    │                          │                        │                   │            │
    │── POST /api/proctor/frame ▶                       │                   │            │
    │                          │── processFrame() ─────▶│                   │            │
    │                          │                        │── inferFace() ───▶│            │
    │                          │                        │◀── {faceCount:2} ─│            │
    │                          │                        │ determine MULTIPLE_FACES       │
    │                          │                        │── save event ──▶ DB            │
    │                          │                        │── convertAndSend() ───────────▶│
    │                          │                        │                   │   push alert│
    │                          │◀── ProctoringEventResponse                 │ to examiner │
    │◀── 200 { eventType, ... } │                        │                   │            │
```

---

## 14. Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Exam not found with id: 99"
}
```

### Validation Error Response (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "email": "Invalid email format",
    "password": "Password must be between 8 and 128 characters"
  }
}
```

### HTTP Status Code Reference

| Code | Meaning | When |
|---|---|---|
| 200 | OK | Successful GET / PUT |
| 201 | Created | Successful POST (register, create exam, start session) |
| 400 | Bad Request | Validation failure, business rule violation |
| 401 | Unauthorized | Invalid/missing JWT, bad credentials |
| 403 | Forbidden | Valid JWT but insufficient role |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Unexpected exception |

---

## 15. Security Model

### Role-Based Access Control

```
ADMIN
  └── Can do everything EXAMINER can do
  └── Can view all sessions / events

EXAMINER
  └── Create, update, delete own exams
  └── View sessions for their exams
  └── View proctoring events
  └── Subscribe to WebSocket alerts

STUDENT
  └── View all exams (read-only)
  └── Start / end exam sessions (own only)
  └── Submit webcam frames (own active session only)
  └── View own sessions
```

### JWT Token Security

- Signed with HMAC-SHA using a 256-bit+ base64-encoded secret.
- Contains: `sub` (email), `iat` (issued at), `exp` (expiry).
- Default expiry: 24 hours (configurable via `JWT_EXPIRATION_MS`).
- Stateless — no server-side session store needed.

### Password Security

- Stored as BCrypt hash with strength factor 12.
- Plain-text password is never logged or returned in any response.
- On invalid login, the error message is deliberately generic: *"Invalid email or password"* — prevents user enumeration.

---

## 16. Environment Variables

| Variable | Description | Example |
|---|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://host:5432/proctordb` |
| `SPRING_DATASOURCE_USERNAME` | DB username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | `secret` |
| `SPRING_DATA_REDIS_HOST` | Redis host | `redis.upstash.io` |
| `SPRING_DATA_REDIS_PORT` | Redis port | `6379` |
| `SPRING_DATA_REDIS_PASSWORD` | Redis auth password | `redispassword` |
| `JWT_SECRET` | Base64-encoded 256-bit secret for JWT signing | `dGhpcyBpcyBhIHN0cm9uZyBzZWNyZXQ=` |
| `JWT_EXPIRATION_MS` | JWT validity in milliseconds | `86400000` (24h) |
| `AI_SERVICE_URL` | Internal URL of the Python AI service | `http://ai-service:8000` |

> **Never commit `.env` to version control.** Use `.env.example` as a template.

---

*Generated: 2026-08-04 | Backend version: Spring Boot 3.x, Java 21*
