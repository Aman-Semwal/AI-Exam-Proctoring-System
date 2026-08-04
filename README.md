# AI Exam Proctoring System

An AI-powered exam proctoring system with a Spring Boot REST backend and a Python AI/ML service for real-time face detection.

## Project Structure

```
AI-Exam-Proctoring-System/
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
| REST API | Spring Boot 4.x, Java 21 |
| AI/ML Service | FastAPI, MediaPipe, OpenCV |
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
JWT_EXPIRATION_MS=86400000
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
| Python AI Service | http://localhost:8000 |
| AI Service Docs | http://localhost:8000/docs |

## API Endpoints

### AI Service
| Method | Endpoint | Description |
|---|---|---|
| POST | `/infer/face` | Detect faces in uploaded image |

## Environment Variables

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC connection URL |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL username |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password |
| `SPRING_DATA_REDIS_HOST` | Redis host |
| `SPRING_DATA_REDIS_PORT` | Redis port |
| `SPRING_DATA_REDIS_PASSWORD` | Redis password |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRATION_MS` | JWT expiry in milliseconds (default: 86400000 = 24h) |
| `AI_SERVICE_URL` | Internal URL for AI service |

# Sab stopped containers delete karo
docker container prune -f

# Sab unused images delete karo
docker image prune -af

# Build cache clear karo (sabse zyada space yahi leta hai)
docker builder prune -af

# Volumes bhi clear karo
docker volume prune -f
