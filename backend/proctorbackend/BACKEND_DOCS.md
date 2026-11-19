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
---

## 17. Multi-Tenant SaaS Migration Plan

> **Scope:** Expand the existing single-tenant exam proctoring system into a full multi-tenant SaaS product.
> This chapter documents every schema change, role strategy decision, package restructure, build order, and
> cache remediation needed. It is a migration plan — not a rewrite. Anything not mentioned here stays as-is.

---

### 17.1 Database Schema Migration

#### What Stays As-Is

The following tables require **zero structural changes** at this stage:

| Table | Reason |
|---|---|
| `questions` | Already scoped to an exam; org context flows through the exam |
| `answers` | Scoped to a session; org context flows through session → exam |
| `proctoring_events` | Scoped to a session |

#### 17.1.1 New Tables

**Migration file:** `V2__multi_tenant_foundation.sql`

```sql
-- ============================================================
-- V2__multi_tenant_foundation.sql
-- Multi-tenant SaaS foundation: new tables
-- ============================================================

-- -----------------------------------------------------------
-- ORGANIZATIONS
-- -----------------------------------------------------------
CREATE TABLE organizations (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    slug           VARCHAR(100) NOT NULL UNIQUE,   -- URL-safe identifier, e.g. "mit-eecs"
    plan           VARCHAR(50)  NOT NULL DEFAULT 'FREE', -- FREE | PRO | ENTERPRISE
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- -----------------------------------------------------------
-- SUBSCRIPTIONS  (lowest priority — scaffold now, fill later)
-- -----------------------------------------------------------
CREATE TABLE subscriptions (
    id                  BIGSERIAL   PRIMARY KEY,
    organization_id     BIGINT      NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan                VARCHAR(50) NOT NULL,                   -- FREE | PRO | ENTERPRISE
    status              VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | CANCELLED | PAST_DUE
    billing_cycle       VARCHAR(20) NOT NULL DEFAULT 'MONTHLY', -- MONTHLY | ANNUAL
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end   TIMESTAMPTZ NOT NULL,
    external_sub_id     VARCHAR(255),   -- Stripe / Razorpay subscription ID
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);

-- -----------------------------------------------------------
-- AUDIT_LOGS
-- -----------------------------------------------------------
CREATE TABLE audit_logs (
    id              BIGSERIAL    PRIMARY KEY,
    organization_id BIGINT       REFERENCES organizations(id) ON DELETE SET NULL,  -- NULL = platform-level action
    actor_id        BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,   -- e.g. EXAM_CREATED, USER_INVITED, SESSION_TERMINATED
    entity_type     VARCHAR(100),            -- e.g. Exam, User, ExamSession
    entity_id       BIGINT,
    metadata        JSONB,                   -- arbitrary extra context
    ip_address      INET,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org      ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_actor    ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created  ON audit_logs(created_at DESC);

-- -----------------------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------------------
CREATE TABLE notifications (
    id              BIGSERIAL    PRIMARY KEY,
    organization_id BIGINT       REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(100) NOT NULL,   -- e.g. VIOLATION_ALERT, EXAM_PUBLISHED, INVITE
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    related_entity_type VARCHAR(100),
    related_entity_id   BIGINT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_org       ON notifications(organization_id);
```

---

#### 17.1.2 Alter Existing Tables — Add `organization_id`

**Migration file:** `V3__add_organization_id_to_tenant_tables.sql`

```sql
-- ============================================================
-- V3__add_organization_id_to_tenant_tables.sql
-- Add organization_id FK to all tenant-scoped tables.
-- Uses a two-step approach:
--   Step 1: add column as nullable (safe for live data)
--   Step 2: backfill (set a default org for existing rows)
--   Step 3: add NOT NULL + FK constraint
-- ============================================================

-- You must insert a seed "default" org first if you have existing data:
-- INSERT INTO organizations (name, slug, plan) VALUES ('Default Org', 'default', 'PRO');
-- Then replace 1 below with the actual generated ID.

-- -----------------------------------------------------------
-- USERS — belongs to an org (SUPER_ADMIN users have NULL org)
-- -----------------------------------------------------------
ALTER TABLE users ADD COLUMN organization_id BIGINT;

UPDATE users SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL AND role <> 'SUPER_ADMIN';
UPDATE users SET organization_id = NULL WHERE role = 'SUPER_ADMIN' AND organization_id IS NOT NULL;

ALTER TABLE users
    ADD CONSTRAINT fk_users_org
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  ADD CONSTRAINT chk_users_org_role_alignment
  CHECK (
    (role = 'SUPER_ADMIN' AND organization_id IS NULL)
    OR (role <> 'SUPER_ADMIN' AND organization_id IS NOT NULL)
  );

CREATE INDEX idx_users_org ON users(organization_id);

-- -----------------------------------------------------------
-- EXAMS
-- -----------------------------------------------------------
ALTER TABLE exams ADD COLUMN organization_id BIGINT;

UPDATE exams e
SET organization_id = (
    SELECT u.organization_id FROM users u WHERE u.id = e.created_by
)
WHERE organization_id IS NULL;

ALTER TABLE exams
    ALTER COLUMN organization_id SET NOT NULL,
    ADD CONSTRAINT fk_exams_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_exams_org ON exams(organization_id);

-- -----------------------------------------------------------
-- EXAM_ASSIGNMENTS
-- -----------------------------------------------------------
ALTER TABLE exam_assignments ADD COLUMN organization_id BIGINT;

UPDATE exam_assignments ea
SET organization_id = (
    SELECT e.organization_id FROM exams e WHERE e.id = ea.exam_id
)
WHERE organization_id IS NULL;

ALTER TABLE exam_assignments
    ALTER COLUMN organization_id SET NOT NULL,
    ADD CONSTRAINT fk_assignments_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_assignments_org ON exam_assignments(organization_id);

-- -----------------------------------------------------------
-- EXAM_SESSIONS
-- -----------------------------------------------------------
ALTER TABLE exam_sessions ADD COLUMN organization_id BIGINT;

UPDATE exam_sessions es
SET organization_id = (
    SELECT e.organization_id FROM exams e WHERE e.id = es.exam_id
)
WHERE organization_id IS NULL;

ALTER TABLE exam_sessions
    ALTER COLUMN organization_id SET NOT NULL,
    ADD CONSTRAINT fk_sessions_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_sessions_org ON exam_sessions(organization_id);

-- -----------------------------------------------------------
-- VIOLATIONS
-- -----------------------------------------------------------
ALTER TABLE violations ADD COLUMN organization_id BIGINT;

UPDATE violations v
SET organization_id = (
    SELECT es.organization_id
    FROM exam_sessions es WHERE es.id = v.session_id
)
WHERE organization_id IS NULL;

ALTER TABLE violations
    ALTER COLUMN organization_id SET NOT NULL,
    ADD CONSTRAINT fk_violations_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_violations_org ON violations(organization_id);
```

---

#### 17.1.3 Role Column Migration

**Migration file:** `V4__expand_role_enum.sql`

```sql
-- ============================================================
-- V4__expand_role_enum.sql
-- Expand the role column to support the five new role values.
-- The column is VARCHAR(EnumType.STRING) in JPA, so no Postgres
-- TYPE alteration is needed — just make sure old EXAMINER rows
-- are remapped before the Java enum is updated.
-- ============================================================

-- Remap legacy EXAMINER → EXAM_CREATOR (closest semantic match).
-- ADMIN → ORG_ADMIN.
-- STUDENT stays STUDENT.
-- Manually promote any platform owner to SUPER_ADMIN after migration.

UPDATE users SET role = 'EXAM_CREATOR' WHERE role = 'EXAMINER';
UPDATE users SET role = 'ORG_ADMIN'    WHERE role = 'ADMIN';

-- Verify — should return 0 rows after migration:
-- SELECT * FROM users WHERE role NOT IN
--   ('SUPER_ADMIN','ORG_ADMIN','EXAM_CREATOR','PROCTOR','STUDENT');
```



---

### 17.2 Role Strategy: Enum vs Relational Table

#### Decision: Keep It as a Java Enum (Upgraded)

**Recommendation for a mostly-solo project: stay with the enum approach.** Here is the full trade-off analysis:

| Concern | Enum (VARCHAR column) | Relational `roles` table |
|---|---|---|
| **Complexity** | Low — one file to change | High — roles table, user_roles junction, extra joins everywhere |
| **Spring Security fit** | Native — `SimpleGrantedAuthority("ROLE_X")` maps directly | Requires a custom `GrantedAuthority` loader on every request |
| **Adding a new role** | Change the enum + one `UPDATE` SQL | Insert a DB row — no code change needed |
| **Permission granularity** | Role-level only | Can add per-role permission flags in DB |
| **Multi-role per user** | Not supported natively | Supported (one user can be ORG_ADMIN in org A, PROCTOR in org B) |
| **Solo project velocity** | Fast | Slower — needs role service, cache layer for role lookups |

**For this project the enum wins.** The role set is small and well-defined (5 roles, unlikely to grow to 20+). The only genuine limitation is that a user cannot hold different roles in different organizations — but that is an advanced use case you do not need yet. If you ever need cross-org roles, the enum is easy to replace later because the role column is just a `VARCHAR`.

#### Updated `Role.java`

```java
// common/enums/Role.java
public enum Role {
    SUPER_ADMIN,   // Platform owner — manages orgs, billing, AI model versions
    ORG_ADMIN,     // Per-org admin — invites users, manages org settings
    EXAM_CREATOR,  // Creates question banks, exams, AI rules (replaces EXAMINER)
    PROCTOR,       // Monitors live sessions, acts on AI alerts
    STUDENT        // Takes exams — unchanged
}
```

The old `EXAMINER` value is removed. V4 migration SQL above backfills existing rows before the enum changes.

#### Updated `User.java` — add `organization_id`

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "organization_id")
private Organization organization;  // NULL only for SUPER_ADMIN
```

---

#### 17.2.1 JWT Claims Design

**Current token** carries only: `sub` (email), `iat`, `exp`.

**New token** must carry enough context so every request can be tenant-scoped without a DB round-trip.

| Claim | Type | Value | Why in token |
|---|---|---|---|
| `sub` | String | user email | Spring Security username — unchanged |
| `userId` | Long | `user.id` | Avoids DB lookup to get the numeric ID in services |
| `role` | String | `EXAM_CREATOR` | Authorization decisions in `@PreAuthorize` |
| `orgId` | Long | `organization.id` | Tenant scoping — set on every query |
| `orgSlug` | String | `"mit-eecs"` | Readable context for logs and audit entries |
| `iat` | Date | issued-at | Standard — unchanged |
| `exp` | Date | expiry | Standard — unchanged |

`SUPER_ADMIN` tokens set `orgId: null` and `orgSlug: null` — this is the signal that the caller has platform-level access.

#### Updated `JwtService.generateToken` call site (in `AuthServiceImpl`)

```java
// AuthServiceImpl.java — inside login() and register()
Map<String, Object> claims = new HashMap<>();
claims.put("userId",  user.getId());
claims.put("role",    user.getRole().name());
claims.put("orgId",   user.getOrganization() != null ? user.getOrganization().getId()   : null);
claims.put("orgSlug", user.getOrganization() != null ? user.getOrganization().getSlug() : null);
return jwtService.generateToken(claims, user);
```

#### Extracting claims in services (helper methods on `JwtService`)

```java
public Long extractOrgId(String token) {
    return extractClaim(token, claims -> {
        Object v = claims.get("orgId");
        return v != null ? Long.valueOf(v.toString()) : null;
    });
}

public String extractRole(String token) {
    return extractClaim(token, claims -> (String) claims.get("role"));
}

public Long extractUserId(String token) {
    return extractClaim(token, claims -> Long.valueOf(claims.get("userId").toString()));
}
```

#### Updated `AuthResponse.java` DTO

Add `orgId` and `orgSlug` fields so the frontend stores the org context immediately after login:

```java
private Long   orgId;
private String orgSlug;
private String role;
```



---

### 17.3 Spring Boot Package Restructuring Plan

#### What Does NOT Move

The following packages are structurally unchanged. The only internal edits they need are the tenant-scoping additions noted inline:

| Package | Status | Internal Change Needed |
|---|---|---|
| `auth/` | **Stays** | `AuthServiceImpl` adds org claims to JWT; `RegisterRequest` gains `orgId` field |
| `session/` | **Stays** | Queries gain `organization_id` filter |
| `proctoring/` | **Stays** | No structural change |
| `websocket/` | **Stays** | No structural change |
| `config/` | **Stays** | `SecurityConfig` gains new role strings in `@PreAuthorize` patterns |
| `common/` | **Stays** | `Role.java` enum values updated |
| `question/` | **Stays** | No structural change |
| `answer/` | **Stays** | No structural change |
| `assignment/` | **Stays** | Queries gain `organization_id` filter |
| `violation/` | **Stays** | Queries gain `organization_id` filter |

---

#### New Packages (Net-New)

```
com.proctor.proctorbackend/
│
├── organization/                       ← NEW: org CRUD, member management
│   ├── Organization.java               (JPA entity — maps organizations table)
│   ├── OrganizationRepository.java
│   ├── OrganizationService.java        (interface)
│   ├── OrganizationServiceImpl.java
│   ├── OrganizationController.java
│   └── dto/
│       ├── OrganizationRequest.java
│       ├── OrganizationResponse.java
│       └── InviteMemberRequest.java    (email + role)
│
├── subscription/                       ← NEW (low priority — scaffold only at first)
│   ├── Subscription.java               (JPA entity)
│   ├── SubscriptionRepository.java
│   ├── SubscriptionService.java
│   ├── SubscriptionServiceImpl.java
│   └── dto/
│       ├── SubscriptionResponse.java
│       └── UpgradePlanRequest.java
│
├── audit/                              ← NEW: structured audit trail
│   ├── AuditLog.java                   (JPA entity — maps audit_logs table)
│   ├── AuditLogRepository.java
│   ├── AuditService.java               (interface — write-only from other services)
│   ├── AuditServiceImpl.java
│   ├── AuditController.java            (read endpoints for ORG_ADMIN / SUPER_ADMIN)
│   └── dto/
│       └── AuditLogResponse.java
│
├── notification/                       ← NEW: in-app notifications
│   ├── Notification.java               (JPA entity — maps notifications table)
│   ├── NotificationRepository.java
│   ├── NotificationService.java
│   ├── NotificationServiceImpl.java
│   ├── NotificationController.java
│   └── dto/
│       └── NotificationResponse.java
│
├── dashboard/                          ← NEW: aggregated stats per org/role
│   ├── DashboardController.java        (read-only — no entity, no repository)
│   └── dto/
│       ├── OrgDashboardResponse.java
│       └── SuperAdminDashboardResponse.java
│
└── storage/                            ← NEW: evidence/screenshot URL management
    ├── StorageService.java             (interface — wraps S3 / Supabase Storage)
    ├── StorageServiceImpl.java
    └── dto/
        └── UploadResponse.java
```

---

#### Modified Existing Packages — Summary of Changes

**`exam/Exam.java`** — add org relationship:
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "organization_id", nullable = false)
private Organization organization;
```

**`exam/ExamRepository.java`** — all finder methods gain an `organizationId` parameter:
```java
List<Exam> findByOrganizationId(Long organizationId);
List<Exam> findByCreatedByEmailAndOrganizationId(String email, Long organizationId);
```

**`exam/ExamServiceImpl.java`** — extract `orgId` from JWT principal (passed from controller) and filter every query:
```java
// Before (single-tenant):
examRepository.findAll();

// After (multi-tenant):
examRepository.findByOrganizationId(orgId);
```

**`session/ExamSession.java`** — same org FK added.

**`violation/Violation.java`** — same org FK added.

**`config/SecurityConfig.java`** — update `@PreAuthorize` role strings throughout all controllers:
```java
// Old
@PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")

// New
@PreAuthorize("hasAnyRole('EXAM_CREATOR','ORG_ADMIN','SUPER_ADMIN')")
```

**`common/enums/Role.java`** — replace the 3 old values with 5 new values (see §17.2).

**`auth/dto/RegisterRequest.java`** — add optional `orgId` (null for SUPER_ADMIN self-registration via a one-time setup endpoint):
```java
private Long orgId;   // required for all roles except SUPER_ADMIN
```



---

### 17.4 Recommended Build Order

The goal is to migrate the working core without breaking it at any intermediate step. Each phase ends in a working, deployable state.

---

#### Phase 0 — Flyway Setup (if not already in place)

Before any schema migration, add Flyway to `pom.xml` and rename your existing manual DDL as `V1__initial_schema.sql`. Everything runs in the `resources/db/migration/` directory from this point.

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

**Do this before Phase 1. The V2/V3/V4 files depend on it.**

---

#### Phase 1 — Schema Foundation (DB only, no Java changes yet)

Run V2, V3, V4 migrations in order. The app still starts with the old code because:
- V2 adds brand-new tables — no existing code breaks.
- V3 adds `organization_id` as **nullable first**, then backfills — existing JPA entities simply ignore the unknown column until you add the Java field.
- V4 renames role values — **this is the only risky step**: it must happen before the Java enum is updated, but existing tokens in Redis/DB still carry the old string values.

**Sequence:**
1. `V2__multi_tenant_foundation.sql` — run, verify tables exist.
2. `V3__add_organization_id_to_tenant_tables.sql` — run with existing data backfill.
3. `V4__expand_role_enum.sql` — run. Existing active JWTs will fail role checks until they expire (24h window). Plan this for off-peak or a maintenance window.

---

#### Phase 2 — Role + JWT Update (Java changes, no new endpoints)

Touches: `common/enums/Role.java`, `config/SecurityConfig.java` `@PreAuthorize` strings, `auth/JwtService.java`, `auth/AuthServiceImpl.java`, `auth/dto/AuthResponse.java`, `auth/dto/RegisterRequest.java`.

**Steps:**
1. Update `Role.java` enum to the five new values.
2. Update all `@PreAuthorize` annotations to use new role names.
3. Add `userId`, `role`, `orgId`, `orgSlug` claims to `JwtService.generateToken`.
4. Update `AuthResponse` DTO.
5. **Run all existing tests.** Auth still works; role-based routes still pass if you map the strings correctly.

This phase has no schema impact. It is safe to deploy standalone.

---

#### Phase 3 — Organization Entity + Tenant Scoping on Existing Modules

Touches: `organization/` (new package), `user/User.java`, `exam/Exam.java`, `session/ExamSession.java`, `violation/Violation.java`, `assignment/ExamAssignment.java`, and all their repositories/services.

**Steps:**
1. Create `Organization.java` JPA entity and `OrganizationRepository`.
2. Add `@ManyToOne organization` field to `User`, `Exam`, `ExamSession`, `Violation`, `ExamAssignment`.
3. Add `OrganizationController` with endpoints: create org, get org, list members, invite member, remove member.
4. Update every service method that returns a list to filter by `orgId` extracted from the JWT.
5. Update `ExamServiceImpl`, `SessionServiceImpl`, `ViolationServiceImpl`, `AssignmentServiceImpl` — all `findAll` calls become `findByOrganizationId`.

**Test checklist after this phase:**
- [ ] A user from Org A cannot see Org B's exams.
- [ ] A SUPER_ADMIN can see all exams (no org filter applied).
- [ ] Creating an exam auto-populates `organization_id` from the caller's JWT.

---

#### Phase 4 — Audit + Notification (supporting infrastructure)

Touches: `audit/` (new), `notification/` (new).

**Steps:**
1. Create `AuditLog.java` entity and `AuditService` with a single `log(...)` method.
2. Call `auditService.log(...)` inside `OrganizationServiceImpl`, `ExamServiceImpl`, and `SessionServiceImpl` for significant actions (exam created, session terminated, member invited).
3. Create `Notification.java` entity and `NotificationService`.
4. Replace the raw `SimpMessagingTemplate` broadcast in `ProctoringServiceImpl` with a call to `NotificationService.send(...)` — which persists the notification row AND pushes via WebSocket.

This phase is purely additive. Nothing existing breaks.

---

#### Phase 5 — Dashboard + Storage

Touches: `dashboard/` (new), `storage/` (new).

**Steps:**
1. Implement `DashboardController` — read-only aggregate queries (total sessions, violation counts, active exams per org).
2. Implement `StorageService` wrapping S3 or Supabase Storage for `evidence_url` on violations.

---

#### Phase 6 — Subscription / Billing (lowest priority)

Touches: `subscription/` (new).

**Steps:**
1. Scaffold `Subscription.java` entity (already created by V2 migration).
2. Implement `SubscriptionServiceImpl` — initially just reads the `plan` column, no payment gateway.
3. Wire plan limits (e.g. max students per org) once you integrate a payment provider (Stripe / Razorpay).

---

#### Phase Summary Table

| Phase | What Changes | Risk | Deploy Independently? |
|---|---|---|---|
| 0 | Add Flyway | Low | Yes |
| 1 | DB schema only (V2/V3/V4) | Medium (V4 role rename) | Yes — plan maintenance window for V4 |
| 2 | Role/JWT Java update | Low–Medium | Yes |
| 3 | Org entity + tenant scoping | High (touches all modules) | Yes, with thorough testing |
| 4 | Audit + Notification | Low (additive) | Yes |
| 5 | Dashboard + Storage | Low (additive) | Yes |
| 6 | Billing | Low (additive) | Yes |



---

### 17.5 Cache Key Collision Issue and Remediation

#### Current Caching Strategy (Single-Tenant)

Your existing setup caches exam metadata only, bypassing cache for sessions, violations, and answers. The current key pattern (inferred from `@Cacheable` usage with Spring's default key generation) looks like:

```
exams::1          ← getExamById(1)
exams::SimpleKey  ← getAllExams()
```

This works fine in a single-tenant world because there is only one namespace.

---

#### The Collision Problem

Once you add `organization_id`, **the same exam `id` can exist in different organizations** — or more critically, **two different organizations' exam lists will collide on the same cache key**.

Consider this scenario:

```
Org A (id=1) — getAllExams() → cached under key "exams::SimpleKey"
Org B (id=2) — getAllExams() → gets Org A's cached data (WRONG!)
```

Even `getExamById(id)` is unsafe once org-level visibility rules apply: an ORG_ADMIN from Org B should not be able to read an exam from Org A, but if the object is already cached from a prior Org A request, the cache will return it.

This is **a data-leakage bug**, not just a correctness bug.

---

#### Remediation: Org-Scoped Cache Keys

The fix is to include `orgId` in every cache key for tenant-scoped data.

**Option A — Explicit key in `@Cacheable`:**

```java
// ExamServiceImpl.java

@Cacheable(value = "exams", key = "#orgId + ':' + #examId")
public ExamResponse getExamById(Long orgId, Long examId) { ... }

@Cacheable(value = "exams", key = "'list:' + #orgId")
public List<ExamResponse> getAllExams(Long orgId) { ... }

@CacheEvict(value = "exams", key = "'list:' + #orgId")
public ExamResponse createExam(Long orgId, ExamRequest request) { ... }
```

This produces Redis keys like:
```
exams::1:42      ← org 1, exam 42
exams::list:1    ← org 1 exam list
exams::list:2    ← org 2 exam list  (separate, no collision)
```

**Option B — Key prefix via `RedisCacheConfiguration`** (cleaner for many caches):

```java
// RedisConfig.java — add a CacheManager bean

@Bean
public CacheManager cacheManager(RedisConnectionFactory factory) {
    RedisCacheConfiguration defaults = RedisCacheConfiguration
        .defaultCacheConfig()
        .entryTtl(Duration.ofMinutes(30))
        .disableCachingNullValues();

    return RedisCacheManager.builder(factory)
        .cacheDefaults(defaults)
        .build();
}
```

Then in services, always pass `orgId` as part of the key expression (Option A above). The `CacheManager` bean is needed anyway to move from `RedisTemplate` to proper Spring Cache abstraction — it is worth adding now.

---

#### Eviction Strategy After Multi-Tenancy

`@CacheEvict` calls must also be org-scoped. Evicting `"exams::SimpleKey"` after creating an exam in Org A must NOT clear Org B's cached list.

```java
// Correct: evict only the affected org's list
@CacheEvict(value = "exams", key = "'list:' + #orgId")
public ExamResponse createExam(Long orgId, ExamRequest request) { ... }

// Wrong: this evicts ALL orgs' lists
@CacheEvict(value = "exams", allEntries = true)  // ← do not use this
public ExamResponse createExam(...) { ... }
```

---

#### What Does NOT Need Cache Changes

| Data | Cache status | Reason |
|---|---|---|
| `exam_sessions` | Already bypassed | Real-time, correct as-is |
| `violations` | Already bypassed | Real-time, correct as-is |
| `answers` | Already bypassed | Real-time, correct as-is |
| `proctoring_events` | Not cached | Correct |
| `audit_logs` | Do not cache | Write-heavy, query infrequently |
| `notifications` | Do not cache | Per-user, changes on every read (mark-as-read) |

Only exam metadata is cached. Keep it that way — just fix the key scoping.

---

#### SUPER_ADMIN Cache Consideration

`SUPER_ADMIN` queries return cross-org data (e.g., all exams across all orgs). **Do not cache SUPER_ADMIN aggregate queries** — the result set spans all tenants and would be enormous and quickly stale. Serve them directly from the database.

---

#### Summary of Cache Rule Changes

| Before (single-tenant) | After (multi-tenant) |
|---|---|
| `@Cacheable("exams")` — default key | `@Cacheable(value="exams", key="'list:'+#orgId")` |
| `@Cacheable("exams")` on `getById(id)` | `@Cacheable(value="exams", key="#orgId+':'+#id")` |
| `@CacheEvict(allEntries=true)` | `@CacheEvict(key="'list:'+#orgId")` |
| No `CacheManager` bean | Add `RedisCacheManager` bean with TTL config |

