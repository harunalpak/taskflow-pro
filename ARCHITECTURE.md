# TaskFlow Pro - Architecture & Technology Overview

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Design](#database-design)
7. [Authentication & Security](#authentication--security)
8. [Key Features & Techniques](#key-features--techniques)
9. [Infrastructure](#infrastructure)
10. [Development Workflow](#development-workflow)

## Project Overview

TaskFlow Pro is a production-like task management platform that demonstrates advanced Node.js development practices. The project showcases:

- **Modular Architecture**: NestJS-inspired structure with clear separation of concerns
- **Full-Stack TypeScript**: Type-safe development across backend and frontend
- **Modern React**: Next.js 14 App Router with server-side rendering capabilities
- **Production-Ready Features**: Authentication, authorization, caching, background jobs, and more

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | LTS | Runtime environment |
| **TypeScript** | 5.3+ | Type-safe JavaScript |
| **Express.js** | 4.18+ | Web framework |
| **Prisma** | 5.7+ | ORM and database toolkit |
| **PostgreSQL** | 15+ | Primary database |
| **Redis** | 7+ | Caching and rate limiting |
| **JWT** | jsonwebtoken | Authentication tokens |
| **Passport.js** | 0.7+ | OAuth 2.0 authentication |
| **Zod** | 3.22+ | Schema validation |
| **Pino** | 8.17+ | Structured logging |
| **Jest** | 29.7+ | Testing framework |
| **Day.js** | 1.11+ | Date manipulation |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.1+ | React framework with App Router |
| **React** | 18.2+ | UI library |
| **TypeScript** | 5.3+ | Type-safe JavaScript |
| **TailwindCSS** | 3.4+ | Utility-first CSS framework |
| **Axios** | 1.6+ | HTTP client |
| **Day.js** | 1.11+ | Date formatting |

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│                    (Next.js Frontend)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/HTTPS
                        │ REST API
┌───────────────────────▼─────────────────────────────────────┐
│                    Express.js Backend                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   Auth   │  │ Projects│  │  Tasks  │  │ Reports │      │
│  │  Module  │  │  Module │  │ Module  │  │ Module  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└───────┬──────────────┬──────────────┬──────────────┬────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │   Workers   │
│   Database   │  │   Cache &    │  │   Threads   │
│              │  │ Rate Limiting│  │             │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Backend Architecture

### Modular Structure (NestJS-Inspired)

The backend follows a modular architecture pattern inspired by NestJS, even though it uses Express.js:

```
backend/
├── src/
│   ├── modules/          # Feature modules
│   │   ├── auth/        # Authentication module
│   │   ├── users/       # User management
│   │   ├── projects/    # Project CRUD
│   │   ├── tasks/       # Task management
│   │   └── reports/     # Report generation
│   ├── common/          # Shared utilities
│   │   ├── errors.ts    # Custom error classes
│   │   ├── logger.ts    # Pino logger
│   │   └── middleware/  # Express middleware
│   ├── config/         # Configuration
│   └── infra/          # Infrastructure
│       ├── db/         # Prisma client
│       ├── redis/      # Redis client & cache
│       └── workers/    # Background workers
```

### Module Pattern

Each module follows a consistent structure:

```
module-name/
├── dto/              # Data Transfer Objects (Zod schemas)
├── repositories/     # Data access layer (Prisma)
├── services/         # Business logic
├── controllers/      # HTTP handlers
└── module.module.ts  # Module wiring
```

**Example Flow:**
```
HTTP Request
    ↓
Controller (validation)
    ↓
Service (business logic)
    ↓
Repository (database access)
    ↓
Prisma ORM
    ↓
PostgreSQL
```

### Key Design Patterns

1. **Dependency Injection**: Services depend on repositories, not direct database access
2. **Repository Pattern**: Encapsulates database queries
3. **DTO Pattern**: Validates and transforms data
4. **Middleware Pattern**: Cross-cutting concerns (auth, rate limiting, error handling)

## Frontend Architecture

### Next.js 14 App Router

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   ├── login/        # Auth pages
│   │   ├── dashboard/    # Dashboard
│   │   ├── projects/     # Project pages
│   │   └── tasks/         # Task detail pages
│   └── lib/              # Utilities
│       ├── api.ts        # Axios client
│       └── auth.ts       # Auth helpers
```

### Client-Side Features

- **Server Components**: Default in Next.js 14
- **Client Components**: Interactive UI with `'use client'`
- **API Integration**: Centralized Axios client with interceptors
- **Token Management**: Automatic token refresh on 401 errors
- **Error Handling**: Global error boundaries and user-friendly messages

## Database Design

### Prisma Schema

The database uses PostgreSQL with Prisma ORM. Key models:

- **User**: Authentication and profile data
- **Project**: Project management with soft deletes
- **Task**: Task management with status workflow
- **ProjectMember**: Many-to-many relationship
- **TaskTag**: Task categorization
- **TaskAttachment**: File metadata
- **Report**: Generated reports with JSON summaries
- **RefreshToken**: JWT refresh token management

### Relationships

```
User ──┬── owns ──► Project
       │
       ├── member of ──► ProjectMember ──► Project
       │
       ├── assigned to ──► Task
       │
       └── requests ──► Report

Project ──► Task ──┬──► TaskTag
                    │
                    └──► TaskAttachment
```

## Authentication & Security

### JWT Authentication

**Flow:**
1. User logs in → Backend validates credentials
2. Backend generates:
   - **Access Token**: Short-lived (15 minutes), contains user info
   - **Refresh Token**: Long-lived (7 days), stored in database
3. Frontend stores tokens in localStorage
4. Each request includes `Authorization: Bearer <token>` header
5. On 401 error, frontend automatically refreshes token

### OAuth 2.0 (Google)

**Flow:**
1. User clicks "Login with Google"
2. Redirects to Google OAuth consent screen
3. Google redirects back with authorization code
4. Backend exchanges code for user profile
5. Creates or links user account
6. Issues JWT tokens
7. Redirects to frontend with tokens

### Security Measures

- **Helmet.js**: Security headers (XSS protection, etc.)
- **CORS**: Configured for specific frontend origin
- **Rate Limiting**: 
  - Global: 1000 requests/15min (dev), 100 requests/15min (prod)
  - Auth endpoints: 50 requests/15min (dev), 5 requests/15min (prod)
- **Input Validation**: Zod schemas for all inputs
- **Password Hashing**: bcryptjs with salt rounds
- **SQL Injection Protection**: Prisma ORM parameterized queries

## Key Features & Techniques

### 1. Event Loop Demonstration

**Endpoint**: `GET /debug/event-loop`

Demonstrates Node.js Event Loop phases:
- Synchronous code execution
- `process.nextTick()` (highest priority)
- Promise microtasks
- `setTimeout()` (Timer phase)
- `setImmediate()` (Check phase)

**Purpose**: Educational endpoint to understand async behavior in Node.js

### 2. Background Job Processing

**Architecture:**
```
API Request (Generate Report)
    ↓
ReportService.create()
    ↓
Create DB Record (status: PENDING)
    ↓
Enqueue to Redis Queue
    ↓
Worker Process (worker.ts)
    ↓
Spawn Worker Thread
    ↓
Process Report (CPU-intensive)
    ↓
Update DB Record (status: COMPLETED)
```

**Technologies:**
- **Worker Threads**: Isolated CPU-intensive processing
- **Redis Queue**: Job queue management
- **Process Isolation**: Errors don't crash main process

### 3. Caching Strategy

**Cached Endpoints:**
- `GET /api/reports/projects/:id/summary` (60s TTL)

**Cache Service:**
- Redis-backed caching
- Automatic TTL management
- Cache invalidation on updates
- Fallback to database on cache miss

### 4. Error Handling

**Error Hierarchy:**
```
AppError (base)
├── ValidationError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
└── ConflictError (409)
```

**Flow:**
1. Service throws domain error
2. Controller catches (via asyncHandler)
3. Error middleware formats response
4. Structured logging (Pino)
5. User-friendly error message

### 5. Async/Await Best Practices

- All route handlers wrapped with `asyncHandler`
- Centralized error handling middleware
- Promise-based error propagation
- No callback hell

## Infrastructure

### Docker Compose

Services:
- **PostgreSQL**: Port 5432
- **Redis**: Port 6379

**Usage:**
```bash
cd docker
docker-compose up -d
```

### Redis Usage

1. **Caching**: Expensive query results
2. **Rate Limiting**: Request throttling store
3. **Job Queue**: Background job management
4. **Fallback**: Memory store if Redis unavailable

### Worker Threads

**Benefits:**
- Non-blocking: Main event loop stays responsive
- Isolated: Errors don't crash main process
- Parallel: Can process multiple jobs concurrently
- Resource Management: Better CPU utilization

## Development Workflow

### Backend Development

```bash
# Install dependencies
cd backend && npm install

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev

# Run tests
npm test

# Start worker
npm run worker
```

### Frontend Development

```bash
# Install dependencies
cd frontend && npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Database Management

```bash
# Prisma Studio (GUI)
npm run prisma:studio

# Create migration
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate
```

## Testing Strategy

### Unit Tests
- Service layer business logic
- Repository data access
- Utility functions

### Integration Tests
- Full request/response cycle
- Authentication flows
- Database operations

### Test Tools
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP endpoint testing
- **Test Database**: Isolated test environment

## Performance Optimizations

1. **Database Indexing**: Prisma automatically creates indexes
2. **Query Optimization**: Selective field fetching
3. **Pagination**: All list endpoints support skip/take
4. **Caching**: Redis for expensive operations
5. **Soft Deletes**: Faster than hard deletes, allows recovery

## Deployment Considerations

### Environment Variables

**Backend:**
- Database connection string
- JWT secrets
- OAuth credentials
- Redis configuration

**Frontend:**
- API base URL

### Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure production database
- [ ] Set up Redis cluster (if needed)
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting for production
- [ ] Set up SSL/TLS certificates
- [ ] Configure environment-specific settings

## Learning Outcomes

This project demonstrates:

✅ **Node.js Event Loop**: Deep understanding of async behavior  
✅ **Express.js REST API**: Full-featured API development  
✅ **Modular Architecture**: NestJS-inspired patterns  
✅ **Authentication**: JWT + OAuth 2.0  
✅ **Security**: Rate limiting, validation, error handling  
✅ **Background Processing**: Worker Threads  
✅ **Caching**: Redis optimization  
✅ **TypeScript**: Type-safe full-stack development  
✅ **Modern React**: Next.js 14 App Router  
✅ **Database Design**: Prisma ORM with PostgreSQL  

## Future Enhancements

Potential improvements:

- [ ] WebSocket/SSE for real-time updates
- [ ] File upload with S3 integration
- [ ] Email notifications
- [ ] Advanced caching strategies
- [ ] API documentation (OpenAPI/Swagger)
- [ ] GraphQL API layer
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Monitoring and APM integration

## Conclusion

TaskFlow Pro serves as a comprehensive example of modern full-stack development, showcasing production-ready patterns and best practices while remaining educational and maintainable.

