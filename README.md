# DevPulse — AI Build Failure Analyzer

> **Real-Time CI/CD Observability & Automated Build Diagnostics**

DevPulse is an interview-focused full-stack engineering tool designed to solve a core developer pain point: when a GitHub Actions or CI build fails, engineers have to manually parse thousands of lines of raw terminal logs to figure out what broke. DevPulse captures build events, streams live build status changes via Redis Pub/Sub and Socket.IO WebSockets, and uses an AI Log Diagnostic Engine to pinpoint probable root causes, affected code modules, and suggested code fixes.

---

## 🏗️ System Architecture Diagram

```text
React + TypeScript (Dashboard UI)
 ├── REST API HTTP Requests ─────────────────► Node.js + Express Server
 └── WebSocket Socket.IO Client ◄───┐                │
                                    │                ├──► PostgreSQL (Prisma ORM)
                                    │                │
                             [ Socket.IO ]           ├──► Redis Pub/Sub Channels
                                    ▲                │      (build.created / build.updated)
                                    │                │
                             Redis Subscriber ───────┴──► Python FastAPI AI Service
                                                                   │
                                                                   ▼
                                                          Log Analysis Agent / LLM
```

---

## ⚡ Core User & Event Flow

```text
GitHub Webhook / Dev Simulator
            ↓
   POST /api/webhooks/github
            ↓
Node.js validates request & stores Build in PostgreSQL
            ↓
Backend publishes event to Redis Pub/Sub ('build.updated')
            ↓
Socket.IO subscriber receives Redis message & broadcasts to React Dashboard
            ↓
UI updates real-time status (PENDING → RUNNING → FAILED) & ticking duration counter
            ↓
Developer clicks "Analyze with AI"
            ↓
Node.js proxies logs to Python FastAPI Service (POST /analyze-build)
            ↓
AI Agent parses stack trace, error signature, & affected files
            ↓
Returns structured diagnostic report (Root Cause, Affected Area, Explanation, Fix)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Socket.io-client, Lucide Icons | Responsive charcoal-themed engineering dashboard with real-time LIVE indicators |
| **Backend API** | Node.js, Express, TypeScript, JWT, bcryptjs, Zod | Clean REST API controllers, middleware, and error handling |
| **Database** | PostgreSQL, Prisma ORM | Relational data persistence with strict foreign key constraints |
| **Pub/Sub & Real-Time**| Redis Pub/Sub, Socket.IO WebSockets | Decoupled event-driven real-time build status broadcasting |
| **AI Microservice** | Python 3.11, FastAPI, Uvicorn, Pydantic, Gemini API | Log analysis agent with tool-assisted stack trace & error signature extraction |
| **DevOps** | Docker, Docker Compose, Nginx, GitHub Actions | Multi-container local execution and CI/CD workflow |

---

## 🗄️ Database Schema

### `User`
- `id`: String (UUID)
- `name`: String
- `email`: String (Unique)
- `passwordHash`: String
- `role`: String (`USER` | `ADMIN`)
- `createdAt`: DateTime

### `Project`
- `id`: String (UUID)
- `name`: String
- `repositoryUrl`: String
- `userId`: Foreign key -> `User.id`
- `createdAt`: DateTime

### `Build`
- `id`: String (UUID)
- `projectId`: Foreign key -> `Project.id`
- `commitHash`: String
- `branch`: String
- `status`: String (`PENDING` \| `RUNNING` \| `SUCCESS` \| `FAILED`)
- `logs`: Text
- `duration`: Int (Seconds)
- `createdAt`: DateTime

### `Analysis`
- `id`: String (UUID)
- `buildId`: Foreign key -> `Build.id` (Unique)
- `rootCause`: String
- `explanation`: String
- `affectedArea`: String
- `suggestedFix`: String
- `confidence`: String (`High` \| `Medium` \| `Low`)
- `limitations`: String
- `createdAt`: DateTime

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Create a new developer account
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/me` — Fetch current user profile

### Projects & Builds
- `GET /api/projects` — List user projects (or all projects for ADMIN)
- `POST /api/projects` — Connect a new repository project
- `GET /api/projects/:id` — Get project details and build execution history
- `DELETE /api/projects/:id` — Delete a project
- `GET /api/projects/:id/builds` — Get builds for a specific project
- `POST /api/projects/:id/builds` — Create a build entry
- `GET /api/builds/recent` — Fetch recent builds across projects
- `GET /api/builds/:id` — Get build details and terminal logs

### AI Diagnostics & Webhooks
- `POST /api/builds/:id/analyze` — Request AI build failure analysis
- `GET /api/analyses/:buildId` — Fetch stored analysis report
- `POST /api/webhooks/github` — Receive GitHub Actions webhook build events
- `POST /api/dev/build-events` — Dev endpoint to simulate real-time build events

---

## 🚀 Quick Start with Docker Compose

Run the entire full-stack application (PostgreSQL, Redis, Backend, FastAPI AI Service, Frontend) using Docker Compose:

```bash
docker compose up --build
```

Access services:
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api`
- **FastAPI AI Service**: `http://localhost:8000/docs`

---

## 🎯 Interview Deep Dive: "Why this Architecture?"

### 1. Why Redis Pub/Sub + Socket.IO?
> **Answer**: Decoupling the HTTP build ingestion layer from WebSocket client notification. When a webhook hits Express, publishing an event to Redis ensures horizontal scalability across multiple Node instance worker nodes, preventing single-point memory coupling.

### 2. Why a Python FastAPI Microservice for AI?
> **Answer**: Python is the native ecosystem for data analysis, regex log extraction tools, and LLM SDKs (such as Gemini/OpenAI). Keeping the AI diagnostic engine in a lightweight FastAPI microservice isolates heavy text processing from Node.js event-loop threads.

### 3. Why Prisma ORM with PostgreSQL?
> **Answer**: Relational integrity is essential for linking Builds to Projects and Users. Prisma provides type-safe query generation, migrations, and clean schema definitions without raw SQL boilerplate.

---

## 🧪 Testing

### Backend Integration Tests
```powershell
cd backend
npm test
```

### AI Service Diagnostic Tests
```powershell
cd ai-service
python -m pytest
```

*(Note for Windows PowerShell: Use `;` or separate lines instead of `&&` when chaining commands, e.g., `cd backend; npm test`)*
