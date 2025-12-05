# TaskFlow Pro

A production-like task management platform built with Node.js, Express, TypeScript, React, and Next.js.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🏗️ Architecture

This project follows a modular architecture inspired by NestJS, with clear separation of concerns:

- **Modules**: Feature-based organization (Auth, Users, Projects, Tasks, Reports)
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic
- **Repositories**: Database access layer
- **DTOs**: Request/response validation

## 🚀 Quick Start

### Prerequisites

- Node.js (LTS version - 18.x or higher)
- Docker and Docker Compose
- npm or yarn

### Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start infrastructure services (PostgreSQL + Redis):**
   ```bash
   cd docker
   docker-compose up -d
   ```
   
   This will start:
   - PostgreSQL on port 5432
   - Redis on port 6379

3. **Set up environment variables:**
   
   **Backend:**
   ```bash
   cd backend
   cp .env.sample .env
   ```
   
   Edit `backend/.env` and ensure:
   - `DATABASE_URL` points to your PostgreSQL instance
   - `JWT_SECRET` is set to a secure random string (use `openssl rand -base64 32` to generate)
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (optional, for OAuth)
   - `REDIS_HOST` and `REDIS_PORT` match your Redis instance
   - `FRONTEND_URL` is set to `http://localhost:3000`

   **Frontend:**
   ```bash
   cd frontend
   cp .env.sample .env.local
   ```
   
   Edit `frontend/.env.local` and set:
   - `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

4. **Run database migrations:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the backend (in one terminal):**
   ```bash
   npm run dev:backend
   ```
   
   The backend will run on `http://localhost:3001`

6. **Start the frontend (in another terminal):**
   ```bash
   npm run dev:frontend
   ```
   
   The frontend will run on `http://localhost:3000`

7. **Start the worker (optional, in another terminal):**
   ```bash
   npm run dev:worker
   ```
   
   This processes background jobs for report generation.

## 📁 Project Structure

```
taskflow-pro/
├── backend/          # Express + TypeScript backend
│   ├── src/
│   │   ├── modules/  # Feature modules (auth, users, projects, tasks, reports)
│   │   ├── common/   # Shared utilities (errors, middleware, logger)
│   │   ├── config/   # Configuration
│   │   └── infra/    # Infrastructure (DB, Redis, Workers)
│   ├── tests/        # Test files
│   ├── prisma/       # Prisma schema and migrations
│   └── package.json
├── frontend/         # Next.js 14 App Router frontend
│   ├── src/
│   │   ├── app/      # Next.js app router pages
│   │   └── lib/      # Utilities (API client, auth helpers)
│   └── package.json
├── docker/           # Docker Compose configuration
│   └── docker-compose.yml
└── README.md
```

## 🧪 Testing

Run backend tests:
```bash
cd backend
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📝 Features

### Authentication & Authorization
- ✅ JWT Authentication (access + refresh tokens)
- ✅ Google OAuth 2.0
- ✅ Token refresh mechanism
- ✅ Protected routes with middleware

### Project Management
- ✅ Create, read, update, delete projects
- ✅ Add/remove project members
- ✅ Soft delete projects
- ✅ Pagination and filtering

### Task Management
- ✅ Full CRUD operations for tasks
- ✅ Task status workflow (TODO → IN_PROGRESS → DONE)
- ✅ Task assignments
- ✅ Tags and due dates
- ✅ File attachments (metadata + URLs)
- ✅ Kanban-style board view

### Reports
- ✅ Generate weekly/monthly reports
- ✅ Background job processing with Worker Threads
- ✅ Redis queue for job management
- ✅ Project summary with caching

### Infrastructure
- ✅ Redis caching for expensive endpoints
- ✅ Rate limiting (global and per-endpoint)
- ✅ Security best practices (helmet, CORS, input validation)
- ✅ Structured logging with Pino
- ✅ Error handling middleware
- ✅ Event Loop demonstration endpoint (`/debug/event-loop`)

## 🔧 Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Redis (caching + rate limiting + job queue)
- JWT + OAuth 2.0 (Passport.js)
- Worker Threads for background processing
- Jest for testing

**Frontend:**
- Next.js 14 (App Router)
- React + TypeScript
- TailwindCSS
- Axios for API calls

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/google` - Google OAuth redirect
- `GET /api/auth/google/callback` - Google OAuth callback

### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile
- `GET /api/users` - List users (paginated)

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:memberId` - Remove member

### Tasks
- `GET /api/tasks/projects/:projectId/tasks` - List tasks in project
- `POST /api/tasks/projects/:projectId/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/attachments` - Add attachment
- `DELETE /api/tasks/:id/attachments/:attachmentId` - Remove attachment

### Reports
- `GET /api/reports/projects/:projectId/reports` - List reports
- `POST /api/reports/projects/:projectId/reports` - Generate report
- `GET /api/reports/:id` - Get report details
- `GET /api/reports/projects/:projectId/summary` - Get project summary (cached)

### Debug
- `GET /debug/event-loop` - Event Loop demonstration

## 🛠️ Development

### Database Management

Open Prisma Studio:
```bash
cd backend
npm run prisma:studio
```

Create a new migration:
```bash
cd backend
npm run prisma:migrate
```

### Environment Variables

See `backend/.env.example` and `frontend/.env.example` for required environment variables.

## 📄 License

MIT
