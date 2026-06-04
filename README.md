# Job Search App

A production-grade RESTful API for a job search platform built with **Node.js**, **Express**, and **MongoDB**. The platform connects job seekers with companies, offering real-time communication, async email processing, GraphQL support, and a full multi-role permission system.

## Features

### User Features

- Register and log in with **JWT** (access + refresh token rotation)
- **Google OAuth 2.0** sign-in
- OTP-based email verification and password reset
- Profile management with photo upload via **Cloudinary**
- **Resume upload** (PDF) stored on Cloudinary
- **Full-text job search** with weighted relevance scoring.
- Browse job listings and view company details
- Apply for jobs and track application history and status
- **Real-time chat with HR** via Socket.IO
- Soft account deletion

### HR Features

- Create & manage company profile (requires admin approval)
- Post, update, and delete job listings
- Review and filter incoming applications
- Update applicant status throughout the hiring pipeline
- **Export applicants to Excel report**
- Communicate with candidates via **real-time chat**

### Admin Features

- Approve or reject company registrations
- Ban and unban user accounts
- Soft-delete users, companies, and related data
- Full platform user management

## Tech Stack

**Runtime & Framework**: Node.js (ESM), Express.js

**Database**: MongoDB + Mongoose

**Auth & Security**: JWT (access + refresh tokens), Google OAuth 2.0, bcryptjs, Helmet, Joi, AES field-level encryption, rate limiting

**Real-time**: Socket.IO + Redis adapter (horizontally scalable)

**Queue & Background Jobs**: BullMQ + Redis (async email delivery)

**API**: REST, GraphQL, Swagger UI (OpenAPI 3.0)

**File Storage**: Cloudinary + Multer (photos, PDFs)

**Email**: Nodemailer via BullMQ queue

**Logging**: Winston

**Testing**: Jest + Supertest + mongodb-memory-server

**DevOps**: Docker + Docker Compose (multi-stage), GitHub Actions CI, Railway (deployment)

**Code Quality**: ESLint, Prettier, Husky

## Architecture

The project follows a layered **MVC + DAO/Repository** pattern with a manual **dependency injection container**.

```text
Request → Router → Controller → Service → DAO → MongoDB
```

### Key Design Patterns

- **DAO (Data Access Object)** — abstracts all database operations from business logic
- **Dependency Injection** — `src/container.js` wires DAOs → Services → Controllers
- **Strategy Pattern** — multiple auth strategies (JWT, Google OAuth) via Passport
- **Middleware Pipeline** — request validation, auth, rate limiting, error handling

### Three API Interfaces

1. **REST** — `/api/v1/` and `/api/auth/`, documented via OpenAPI 3.0
2. **GraphQL** — `/graphql`, type-safe queries and mutations
3. **WebSocket** — Socket.IO with JWT handshake authentication, Redis adapter for horizontal scaling

### Database Design

Five core entities: **User**, **Company**, **Job**, **Application**, **Chat**

- Soft deletes on User, Company, and Job (`deletedAt` timestamp)
- Cascading deletes: user deletion removes applications and chats; company deletion removes jobs and applications
- Full-text index on Job (`jobTitle`, `technicalSkills`, `jobDescription`) with weighted scoring
- OTP stored in Redis with TTL-based automatic expiry

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Copy `.env.example` file to your `.env` file and configure your variables
4. Start the server with `npm run start:dev`
5. The server will start on `http://localhost:3000`.

## Docker

The project includes a **multi-stage Dockerfile** (development + production) and Docker Compose configurations for both environments.

```bash
# Development
docker compose -p job-search-dev -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# Production
docker compose -p job-search-prod -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Stop
docker compose -p job-search-dev down
docker compose -p job-search-prod down

# View logs
docker compose -p job-search-dev logs -f
docker compose -p job-search-prod logs -f
```

Docker Compose spins up three services: **app**, **mongodb** (with healthcheck), and **redis** (with healthcheck). The app waits for both to be healthy before starting.

## Testing

The project uses **Jest** with **Supertest** for HTTP assertions and **mongodb-memory-server** for isolated in-memory database tests.

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## CI/CD

Two GitHub Actions pipelines keep the codebase stable.

### Test Pipeline (on push / PR)

Runs integration tests in a real environment — spins up a Redis service and executes tests serially (`--runInBand`) to avoid race conditions between test suites.

```bash
npm run test:integration -- --runInBand
```

### PR Validation Pipeline (on PR → `main`)

Two parallel jobs enforce standards before any code is merged:

| Job             | What it checks                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------- |
| **Branch name** | Must match `<type>(/issue-number)/description` — e.g. `feat/add_cv_upload` or `fix/123/login_bug` |
| **PR title**    | Must follow Conventional Commits — e.g. `feat: add CV upload endpoint`                            |

Valid branch prefixes: `feat`, `fix`, `build`, `chore`, `refactor`, `docs`, `perf`, `test`, `ci`

### Local Hooks (pre-commit)

**Husky** runs ESLint and Prettier before every commit, so nothing broken reaches CI.

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add cv analysis endpoint
fix: resolve OTP expiry race condition
chore: update dependencies
docs: update API documentation
refactor: extract auth logic into service layer
```

## Project Documentation

For more technical details, please refer to the following documentation:

- [Entity Relationship Diagram (ERD)](docs/ERD.md)
- [Project Architecture](docs/PROJECT_ARCH.md)
- [GitHub Flow](docs/GITHUB_FLOW.md)

## API Documentation

The API documentation is available via Swagger UI:

[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

You can explore all endpoints, schemas, and test the API directly from there.
