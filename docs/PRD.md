# Product Requirements Document (PRD)

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Stakeholders & User Personas](#4-stakeholders--user-personas)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [System Architecture](#8-system-architecture)
9. [Data Models & ERD](#9-data-models--erd)
10. [API Design](#10-api-design)
11. [Security Requirements](#11-security-requirements)
12. [Infrastructure & DevOps](#12-infrastructure--devops)
13. [Testing Strategy](#13-testing-strategy)
14. [Future Roadmap](#14-future-roadmap)
15. [Success Metrics](#15-success-metrics)
16. [Glossary](#16-glossary)

---

## 1. Executive Summary

**Job Search App** is a production-ready, full-featured RESTful (and GraphQL) API platform that connects job seekers with companies. It provides three distinct role-based experiences: **job seekers** who search and apply for positions, **HR managers** who post and manage listings and communicate with candidates, and **platform admins** who govern content and analytics.

The backend is built on Node.js/Express with MongoDB, Socket.IO real-time messaging, BullMQ background jobs, Redis caching, and Cloudinary file storage, all containerised with Docker.

---

## 2. Problem Statement

Job search platforms often present fragmented experiences: seekers lack real-time status updates on their applications; HR teams juggle multiple tools to post jobs, screen applicants, and communicate; admins have little visibility into platform health. Existing open-source solutions are either overly simplistic (no queuing, no real-time) or monolithic and hard to extend.

**Job Search App** addresses this by delivering a cohesive, security-hardened, production-quality platform that serves all three audiences from a single deployable service, with clean architecture that demonstrates modern backend engineering best practices.

---

## 3. Product Vision & Goals

### Vision

> Be the reference-quality open-source job platform backend: easy to run, hard to break, and a learning showcase for modern Node.js patterns.

### Business Goals

- Provide a complete hiring lifecycle from job discovery through offer.
- Enable companies to manage their employer brand through rich company profiles.
- Support real-time, chat-based recruiter–candidate communication.
- Offer HR teams automated Excel reporting for recruitment analytics.

### Technical Goals

- Demonstrate production-grade architecture: DAO/Repository pattern, DI container, layered services.
- Enforce security at every layer: JWT + OAuth, AES encryption, rate-limiting, Helmet headers, CodeQL-clean codebase.
- Achieve high test confidence: unit and integration tests with Jest and MongoDB in-memory server.
- Full observability: Winston structured logging and audit trails.
- Zero-downtime deployability: Docker multi-stage builds, CI/CD via GitHub Actions.

---

## 4. Stakeholders & User Personas

### 4.1 Personas

#### Persona A: Job Seeker (User)

- **Who:** A software engineer, recent graduate, or professional actively or passively seeking work.
- **Goals:** Find relevant jobs quickly, track applications, upload resume, communicate with recruiters.
- **Pain points:** No visibility into application status; can't chat with HR in-platform; manual resume uploads per application.
- **Technical comfort:** Medium–high; comfortable with web apps, expects fast responses.

#### Persona B: HR Manager / Recruiter

- **Who:** A talent acquisition specialist or hiring manager at a company.
- **Goals:** Post and manage job listings, receive and screen applications, move candidates through stages, generate reports.
- **Pain points:** Switching between email, spreadsheets, and ATS tools; no centralised candidate communication.
- **Technical comfort:** Medium; wants a clean dashboard-like API; uses Swagger docs to test endpoints.

#### Persona C: Platform Admin

- **Who:** The system owner or super-admin responsible for platform governance.
- **Goals:** Approve/ban companies and users, view cross-platform analytics, manage system integrity.
- **Pain points:** Lack of audit logs; no bulk operations; no insight into growth metrics.
- **Technical comfort:** High; comfortable with raw API calls and data exports.

#### Persona D: Developer / API Integrator

- **Who:** A front-end developer or third-party building a UI on top of the API.
- **Goals:** Discover endpoints quickly, test via Swagger, integrate real-time events.
- **Technical comfort:** High.

---

## 5. User Stories

### 5.1 Authentication & Account Management

| ID      | As a…                          | I want to…                                               | So that…                                         | Priority    |
| ------- | ------------------------------ | -------------------------------------------------------- | ------------------------------------------------ | ----------- |
| AUTH-01 | Visitor                        | Register with my email and password                      | I can create an account                          | Must Have   |
| AUTH-02 | Visitor                        | Register / log in with my Google account                 | I can join without a password                    | Must Have   |
| AUTH-03 | Registered user                | Verify my email via OTP                                  | My account is confirmed and active               | Must Have   |
| AUTH-04 | Registered user                | Log in with email + password and receive JWT tokens      | I can authenticate API requests                  | Must Have   |
| AUTH-05 | Authenticated user             | Refresh my access token using my refresh token           | I stay logged in without re-entering credentials | Must Have   |
| AUTH-06 | Authenticated user             | Log out and invalidate my session                        | My session is securely terminated                | Must Have   |
| AUTH-07 | User who forgot their password | Request a password-reset OTP via email                   | I can recover my account                         | Must Have   |
| AUTH-08 | User with a reset OTP          | Reset my password with the OTP                           | I regain access to my account                    | Must Have   |
| AUTH-09 | Authenticated user             | Change my password while logged in                       | I can update credentials at will                 | Should Have |
| AUTH-10 | User                           | Be automatically logged out after a period of inactivity | My account stays secure if I forget to log out   | Should Have |

### 5.2 User Profile Management

| ID      | As a…              | I want to…                                             | So that…                                                             | Priority    |
| ------- | ------------------ | ------------------------------------------------------ | -------------------------------------------------------------------- | ----------- |
| USER-01 | Job seeker         | View and edit my profile (name, bio, skills, location) | Recruiters see accurate information                                  | Must Have   |
| USER-02 | Job seeker         | Upload a profile photo                                 | My profile looks professional                                        | Should Have |
| USER-03 | Job seeker         | Upload / update my resume (PDF)                        | Employers can review it with my application                          | Must Have   |
| USER-04 | Job seeker         | Add and manage my technical skills list                | I am discoverable by skill-matching searches                         | Must Have   |
| USER-05 | Job seeker         | Set my preferred job types, locations, and salary      | I receive relevant recommendations                                   | Should Have |
| USER-06 | Authenticated user | View my own profile                                    | I can review my public information                                   | Must Have   |
| USER-07 | Authenticated user | Soft-delete my account                                 | My data is removed from public views without immediate hard-deletion | Should Have |
| USER-08 | Authenticated user | See my complete activity and application history       | I can track my career progress                                       | Should Have |
| USER-09 | Authenticated user | Update my mobile number (stored encrypted)             | My contact information is current and private                        | Should Have |

### 5.3 Job Discovery & Search

| ID        | As a…                     | I want to…                                                        | So that…                                                 | Priority     |
| --------- | ------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- | ------------ |
| SEARCH-01 | Job seeker                | Search jobs by keyword (title, description, skills)               | I find roles relevant to my background                   | Must Have    |
| SEARCH-02 | Job seeker                | Filter jobs by location, job type, experience level, salary range | I narrow results to what suits me                        | Must Have    |
| SEARCH-03 | Job seeker                | See full-text ranked results (title > skills > description)       | The most relevant results appear first                   | Must Have    |
| SEARCH-04 | Job seeker                | Browse all available job listings with pagination                 | I can scroll through listings without performance issues | Must Have    |
| SEARCH-05 | Job seeker                | View complete job details (requirements, benefits, company info)  | I understand the role before applying                    | Must Have    |
| SEARCH-06 | Job seeker                | View the company profile linked to a job                          | I can research the employer                              | Must Have    |
| SEARCH-07 | Job seeker                | Save a job to my favourites list                                  | I can return to it later                                 | Should Have  |
| SEARCH-08 | Job seeker                | Remove a job from my saved list                                   | I keep my favourites current                             | Should Have  |
| SEARCH-09 | Job seeker                | See "related jobs" on a job detail page                           | I discover similar opportunities                         | Nice to Have |
| SEARCH-10 | Visitor (unauthenticated) | Browse public job listings                                        | I can explore before registering                         | Should Have  |

### 5.4 Job Application

| ID     | As a…      | I want to…                                                          | So that…                                  | Priority    |
| ------ | ---------- | ------------------------------------------------------------------- | ----------------------------------------- | ----------- |
| APP-01 | Job seeker | Apply to a job with my resume and cover note                        | I submit my candidacy                     | Must Have   |
| APP-02 | Job seeker | Be prevented from applying to the same job twice                    | Duplicate applications are blocked        | Must Have   |
| APP-03 | Job seeker | View all my submitted applications and their statuses               | I track where I am in each process        | Must Have   |
| APP-04 | Job seeker | Withdraw an application                                             | I can remove a candidacy I no longer want | Should Have |
| APP-05 | Job seeker | Receive an email confirmation when I apply                          | I know my application was received        | Should Have |
| APP-06 | Job seeker | See timestamps on application status changes                        | I know when things moved                  | Should Have |
| APP-07 | Job seeker | Receive a real-time notification when my application status changes | I don't need to poll the platform         | Must Have   |
| APP-08 | Job seeker | See a history of status transitions for each application            | I have a full audit trail                 | Should Have |

### 5.5 Company Management

| ID      | As a…         | I want to…                                                         | So that…                                      | Priority    |
| ------- | ------------- | ------------------------------------------------------------------ | --------------------------------------------- | ----------- |
| COMP-01 | HR manager    | Create a company profile (name, industry, size, logo, description) | Candidates can research us                    | Must Have   |
| COMP-02 | HR manager    | Edit my company's profile information                              | We keep the profile accurate                  | Must Have   |
| COMP-03 | HR manager    | Upload a company logo to Cloudinary                                | The profile has a visual identity             | Should Have |
| COMP-04 | Company owner | Add or remove HR staff from my company                             | My team can manage listings                   | Must Have   |
| COMP-05 | Company owner | Soft-delete my company                                             | The company is hidden without data loss       | Should Have |
| COMP-06 | Job seeker    | View a public company profile                                      | I research potential employers                | Must Have   |
| COMP-07 | HR manager    | See all jobs posted under my company                               | I have an overview of our listings            | Must Have   |
| COMP-08 | Admin         | Approve or reject a company registration                           | Only legitimate companies are on the platform | Must Have   |
| COMP-09 | Admin         | Ban a company                                                      | A bad actor is blocked                        | Must Have   |

### 5.6 HR, Job & Application Management

| ID    | As a…      | I want to…                                                                          | So that…                                               | Priority    |
| ----- | ---------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------- |
| HR-01 | HR manager | Create a new job listing (title, description, type, skills, salary)                 | We attract candidates                                  | Must Have   |
| HR-02 | HR manager | Edit or close a job listing                                                         | We keep listings accurate or remove filled roles       | Must Have   |
| HR-03 | HR manager | Soft-delete a job listing                                                           | It disappears from public search without hard-deletion | Must Have   |
| HR-04 | HR manager | View all applications for a specific job                                            | I manage the applicant pool                            | Must Have   |
| HR-05 | HR manager | Update an applicant's status (pending → reviewed → shortlisted → accepted/rejected) | I move candidates through the pipeline                 | Must Have   |
| HR-06 | HR manager | Filter applicants by status                                                         | I focus on a specific pipeline stage                   | Should Have |
| HR-07 | HR manager | Download applicant data as an Excel report                                          | I share structured data with the team                  | Must Have   |
| HR-08 | HR manager | View a candidate's uploaded resume                                                  | I review their qualifications                          | Must Have   |
| HR-09 | HR manager | Communicate with a candidate via in-platform chat                                   | I avoid email for back-and-forth conversations         | Must Have   |
| HR-10 | HR manager | Receive a real-time notification when someone applies to my job                     | I respond promptly to new candidates                   | Should Have |
| HR-11 | HR manager | View all applications across all my company's jobs                                  | I have a bird's-eye view of all hiring activity        | Should Have |

### 5.7 Real-Time Chat

| ID      | As a…              | I want to…                                                  | So that…                                         | Priority     |
| ------- | ------------------ | ----------------------------------------------------------- | ------------------------------------------------ | ------------ |
| CHAT-01 | Authenticated user | Send a direct message to another user                       | I communicate in-platform                        | Must Have    |
| CHAT-02 | Authenticated user | Receive messages in real time via WebSocket                 | I get instant responses                          | Must Have    |
| CHAT-03 | Authenticated user | View my full conversation history with a contact            | I reference prior messages                       | Must Have    |
| CHAT-04 | HR manager         | Start a conversation linked to a specific company context   | Messages are contextually tied to a role/company | Should Have  |
| CHAT-05 | Authenticated user | See online/offline presence indicators                      | I know if my contact is available                | Nice to Have |
| CHAT-06 | Authenticated user | Receive chat messages even across multiple server instances | Horizontal scaling doesn't break chat            | Must Have    |

### 5.8 Notifications

| ID       | As a…              | I want to…                                                                    | So that…                          | Priority     |
| -------- | ------------------ | ----------------------------------------------------------------------------- | --------------------------------- | ------------ |
| NOTIF-01 | Job seeker         | Receive a real-time WebSocket notification when my application status changes | I know immediately                | Must Have    |
| NOTIF-02 | HR manager         | Receive a real-time notification when a new application arrives               | I respond quickly                 | Should Have  |
| NOTIF-03 | Authenticated user | Receive an email notification for important platform events                   | I stay informed even when offline | Should Have  |
| NOTIF-04 | Authenticated user | Control my notification preferences                                           | I avoid notification fatigue      | Nice to Have |

### 5.9 Admin Panel

| ID       | As a… | I want to…                                                           | So that…                            | Priority    |
| -------- | ----- | -------------------------------------------------------------------- | ----------------------------------- | ----------- |
| ADMIN-01 | Admin | View all registered users with pagination                            | I have an overview of the user base | Must Have   |
| ADMIN-02 | Admin | Ban or unban a user account                                          | I protect the community             | Must Have   |
| ADMIN-03 | Admin | View all companies on the platform                                   | I govern corporate accounts         | Must Have   |
| ADMIN-04 | Admin | Approve or reject a company                                          | Only verified companies post jobs   | Must Have   |
| ADMIN-05 | Admin | Ban a company                                                        | I remove bad actors                 | Must Have   |
| ADMIN-06 | Admin | View all job postings platform-wide                                  | I can moderate content              | Must Have   |
| ADMIN-07 | Admin | Delete any job posting that violates policy                          | I enforce platform rules            | Must Have   |
| ADMIN-08 | Admin | View platform-wide statistics (users, jobs, applications, companies) | I understand platform health        | Should Have |
| ADMIN-09 | Admin | View a full audit log of administrative actions                      | All changes are traceable           | Should Have |
| ADMIN-10 | Admin | Export platform data as Excel reports                                | I share analytics with stakeholders | Should Have |

### 5.10 Developer / API Consumer

| ID     | As a…     | I want to…                                                  | So that…                                                | Priority    |
| ------ | --------- | ----------------------------------------------------------- | ------------------------------------------------------- | ----------- |
| DEV-01 | Developer | Access interactive Swagger UI at `/api-docs`                | I explore and test all endpoints without external tools | Must Have   |
| DEV-02 | Developer | Query data via GraphQL endpoint at `/graphql`               | I fetch precisely what I need in one request            | Should Have |
| DEV-03 | Developer | Connect to real-time events via Socket.IO                   | I build a reactive UI                                   | Must Have   |
| DEV-04 | Developer | See consistent error response shapes with HTTP status codes | I handle errors predictably                             | Must Have   |
| DEV-05 | Developer | Access a health-check endpoint                              | I monitor service uptime                                | Should Have |

---

## 6. Functional Requirements

### 6.1 Authentication Module

- Email/password registration with bcryptjs (10 rounds) hashing.
- Email verification via time-limited OTP (stored in `User.OTP` array); expired OTPs purged by scheduled cleanup job.
- Google OAuth 2.0 login via Passport.js (`passport-google-oauth20`).
- JWT-based session management: short-lived access token + long-lived refresh token.
- Refresh token rotation on each use.
- Password reset flow: OTP generation → email delivery → OTP verification → password update.
- Account ban support via `bannedAt` field; banned users receive 403 on all authenticated routes.

### 6.2 User Module

- CRUD on user profile (name, bio, location, skills, mobile, resume, profile photo).
- Cloudinary integration for profile photo and resume uploads via Multer stream.
- Mobile numbers encrypted at rest using AES (`ENCRYPTION_KEY` + `ENCRYPTION_IV`).
- Soft delete: `deletedAt` timestamp; deleted users are excluded from queries but data is retained.
- Cascade on hard delete: removes all user applications and chat messages.

### 6.3 Company Module

- Company creation by any authenticated user (the creator becomes the owner).
- Company requires admin approval before jobs can be posted.
- Owner can assign/remove HR staff (array of User refs).
- Cloudinary-backed company logo upload.
- Soft delete with cascading job/application cleanup.
- Only owner can delete; HR can edit listings.

### 6.4 Job Module

- Full CRUD by HR staff of the associated company.
- Fields: `jobTitle`, `jobDescription`, `jobLocation`, `workingTime`, `seniorityLevel`, `technicalSkills`, `softSkills`, `salary`.
- Full-text search index: `jobTitle` (weight 10), `technicalSkills` (weight 5), `jobDescription` (weight 1).
- Filter support: location, working time, seniority, salary range, company.
- Soft delete; cascade deletes all associated applications.

### 6.5 Application Module

- Users submit application with reference to job; duplicate prevention via unique compound index on (`userId`, `jobId`).
- Application status lifecycle: `pending` → `reviewed` → `shortlisted` → `accepted` | `rejected`.
- HR can update status; status change triggers real-time notification to applicant.
- Excel report generation via ExcelJS (triggered async via BullMQ queue).
- Attachment: applicant resume (Cloudinary URL).

### 6.6 Chat Module

- Bidirectional messaging between any two authenticated users.
- Optional `companyId` context on a chat thread.
- Real-time delivery via Socket.IO.
- Multi-instance support via `@socket.io/redis-adapter` (Redis pub/sub).
- Persistent history stored in MongoDB.

### 6.7 Notification Module

- Socket.IO event emission for: new application received, application status changed.
- Email notification delivery via Nodemailer queued through BullMQ.
- Notification events broadcast only to the relevant authenticated socket.

### 6.8 Report Module

- HR can trigger an Excel export of applicants for a specific job.
- Report generation is asynchronous (BullMQ worker); result delivered via Socket.IO or email.
- Admin can trigger platform-wide reports.

### 6.9 Admin Module

- Full user list with pagination; search by name/email.
- Ban/unban user: sets `bannedAt` timestamp.
- Company approval workflow: pending → approved | rejected.
- Company ban.
- Platform statistics endpoint.
- Audit log access.

---

## 7. Non-Functional Requirements

### 7.1 Performance

- API response time: < 200ms for cached endpoints, < 500ms for database queries under normal load.
- Redis caching layer applied to frequently-read, slow-changing data (job listings, company profiles).
- BullMQ offloads email dispatch and report generation to background workers, keeping API response times low.
- Pagination mandatory on all list endpoints (default page size: 10).
- MongoDB indexes on high-frequency query fields: `jobTitle`, `companyId`, `userId`, `deletedAt`.
- Compression middleware enabled for response size reduction.

### 7.2 Scalability

- Stateless REST/GraphQL API: horizontally scalable via container replicas.
- Socket.IO Redis Adapter enables chat/notification delivery across multiple Node.js instances.
- BullMQ backed by Redis: workers can be scaled independently.

### 7.3 Availability

- Target: 99.5% uptime (Railway deployment).
- Docker health-checks configured.
- Graceful shutdown handling (SIGTERM/SIGINT) to drain in-flight requests.

### 7.4 Security

- HTTPS enforced in production.
- Helmet.js for security headers (XSS protection, HSTS, content-type sniffing prevention).
- CORS policy configured with explicit origin allowlist.
- Rate limiting: 15 requests / 15 minutes per IP (express-rate-limit).
- Input validation on all request bodies via Joi schemas.
- NoSQL injection prevention: sanitised inputs, no raw string interpolation in queries.
- Passwords never logged or returned in responses.
- JWT secrets stored in environment variables, never in source code.
- Cloudinary signed upload URLs; direct client uploads not permitted.

### 7.5 Maintainability

- Conventional Commits enforced via `commitlint` + Husky pre-commit hooks.
- ESLint + Prettier for consistent code style.
- Layered architecture: `Controller → Service → DAO`: each layer testable in isolation.
- Dependency injection container (`src/container.js`) for loosely coupled modules.
- Centralised message constants (`MSG` object): no magic strings in code.
- Swagger auto-generated from JSDoc annotations in controller files.

### 7.6 Observability

- Winston structured logging: request logs via Morgan + error/info logs via Winston.
- Audit logging for sensitive admin operations.
- Application version tracked in `package.json` (`version: 2.2.23`).

---

## 8. System Architecture

### 8.1 High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│   Web App  ·  Mobile App  ·  Swagger UI  ·  GraphQL Playground  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ HTTP / WebSocket
┌─────────────────────────────────▼───────────────────────────────┐
│                   Express.js Application Server                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  REST API     │  │  GraphQL API │  │ Socket.IO (WS API)   │  │
│  │  /api/v1/    │  │  /graphql    │  │ Real-time events     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                       │              │
│  ┌──────▼─────────────────▼───────────────────────▼──────────┐  │
│  │         Middleware Pipeline                                 │  │
│  │  Auth · Rate Limit · CORS · Helmet · Validation · Logger   │  │
│  └──────────────────────────┬──────────────────────────────── ┘  │
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │         DI Container → Controllers → Services → DAOs        │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
           ┌──────────────────┼───────────────────────┐
           │                  │                        │
  ┌────────▼──────┐  ┌────────▼───────┐  ┌───────────▼──────────┐
  │   MongoDB      │  │   Redis        │  │   Cloudinary         │
  │   (Atlas)      │  │  Cache + Queue │  │   File Storage       │
  │   Mongoose ODM │  │  BullMQ + WS   │  │   Images + Resumes   │
  └───────────────┘  └────────────────┘  └──────────────────────┘
           │
  ┌────────▼───────────────────────┐
  │  BullMQ Workers (background)   │
  │  · Email Queue (Nodemailer)    │
  │  · Report Queue (ExcelJS)      │
  └────────────────────────────────┘
```

### 8.2 Design Patterns Applied

| Pattern              | Usage                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| MVC                  | Controllers handle HTTP, Services contain business logic, Models define schema |
| DAO / Repository     | Each entity has a DAO abstracting Mongoose operations                          |
| Dependency Injection | `src/container.js` wires all DAOs, Services, and Controllers                   |
| Strategy Pattern     | Multiple auth strategies: JWT, Google OAuth (Passport.js)                      |
| Middleware Pattern   | Composable request/response pipeline                                           |
| Observer / Event     | Socket.IO event emission for real-time notifications                           |
| Queue / Worker       | BullMQ for async email and report tasks                                        |

### 8.3 Route Structure

```text
/api/auth/          → Authentication routes (register, login, OAuth, OTP)
/api/v1/users/      → User profile management
/api/v1/companies/  → Company CRUD and HR management
/api/v1/jobs/       → Job listings, search, and CRUD
/api/v1/applications/ → Application submission and management
/api/v1/chats/      → Chat history retrieval
/api/v1/admin/      → Admin operations
/graphql            → GraphQL API
/api-docs           → Swagger UI
```

---

## 9. Data Models & ERD

### 9.1 Entities

#### User

```text
User {
  _id           : ObjectId
  firstName     : String (required)
  lastName      : String (required)
  email         : String (unique, required)
  password      : String (hashed, bcryptjs)
  mobileNumber  : String (AES encrypted)
  role          : Enum [user, admin]
  profilePhoto  : { secure_url, public_id }   // Cloudinary
  resume        : { secure_url, public_id }    // Cloudinary
  skills        : [String]
  OTP           : [{ code, type, expiresAt }]  // confirmEmail | forgetPassword
  bannedAt      : Date
  deletedAt     : Date                          // soft delete
  provider      : Enum [local, google]
  googleId      : String
  createdAt     : Date
  updatedAt     : Date
}
```

#### Company

```text
Company {
  _id           : ObjectId
  companyName   : String (unique, required)
  description   : String
  industry      : String
  address       : String
  numberOfEmployees : String
  companyEmail  : String (unique)
  logo          : { secure_url, public_id }   // Cloudinary
  createdBy     : ObjectId → User             // owner
  HRs           : [ObjectId → User]
  isApproved    : Boolean (default: false)
  bannedAt      : Date
  deletedAt     : Date                         // soft delete
  createdAt     : Date
  updatedAt     : Date
}
```

#### Job

```text
Job {
  _id            : ObjectId
  jobTitle       : String (text-indexed, weight: 10)
  jobDescription : String (text-indexed, weight: 1)
  jobLocation    : String
  workingTime    : Enum [full-time, part-time]
  seniorityLevel : Enum [fresh, junior, mid-level, senior, team-lead, CTO]
  technicalSkills: [String] (text-indexed, weight: 5)
  softSkills     : [String]
  salary         : { min, max, currency }
  companyId      : ObjectId → Company
  addedBy        : ObjectId → User (HR)
  isVisible      : Boolean (default: true)
  deletedAt      : Date                        // soft delete
  createdAt      : Date
  updatedAt      : Date
}
```

#### Application

```text
Application {
  _id         : ObjectId
  jobId       : ObjectId → Job
  userId      : ObjectId → User
  resume      : { secure_url, public_id }      // Cloudinary
  status      : Enum [pending, reviewed, shortlisted, accepted, rejected]
  statusHistory : [{ status, changedAt, changedBy }]
  coverNote   : String
  createdAt   : Date
  updatedAt   : Date
  // Unique index: { userId, jobId }
}
```

#### Chat

```text
Chat {
  _id        : ObjectId
  senderId   : ObjectId → User
  receiverId : ObjectId → User
  companyId  : ObjectId → Company (optional)
  messages   : [{
    content   : String
    senderId  : ObjectId → User
    sentAt    : Date
  }]
  createdAt  : Date
  updatedAt  : Date
}
```

### 9.2 Key Relationships

```text
User ──(creates 1..*)──► Company     (createdBy)
User ──(assigned to *)──► Company    (HRs array)
Company ──(has 1..*)──► Job          (companyId)
User ──(submits 1..*)──► Application (userId)
Job ──(receives 1..*)──► Application (jobId)
User ──(participates)──► Chat        (senderId, receiverId)
Company ──(context)──► Chat          (companyId, optional)
```

### 9.3 Cascade Rules

| Deleted Entity | Cascades To                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| User           | All Applications where `userId` matches; all Chats where user is sender/receiver |
| Company        | All Jobs (→ their Applications); Company-context Chats                           |
| Job            | All Applications for that Job                                                    |

---

## 10. API Design

### 10.1 REST Endpoints Summary

#### Auth (`/api/auth`)

| Method | Path               | Description                | Auth        |
| ------ | ------------------ | -------------------------- | ----------- |
| POST   | `/signup`          | Register new user          | None        |
| POST   | `/signin`          | Login, receive JWT pair    | None        |
| GET    | `/google`          | Initiate Google OAuth      | None        |
| GET    | `/google/callback` | Google OAuth callback      | None        |
| POST   | `/verify-email`    | Verify email with OTP      | None        |
| POST   | `/forget-password` | Request password reset OTP | None        |
| POST   | `/reset-password`  | Reset password with OTP    | None        |
| POST   | `/refresh-token`   | Exchange refresh token     | Refresh JWT |
| POST   | `/logout`          | Invalidate session         | Access JWT  |

#### Users (`/api/v1/users`)

| Method | Path        | Description             | Auth |
| ------ | ----------- | ----------------------- | ---- |
| GET    | `/profile`  | Get own profile         | User |
| PUT    | `/profile`  | Update own profile      | User |
| DELETE | `/profile`  | Soft-delete own account | User |
| PUT    | `/password` | Change password         | User |
| POST   | `/resume`   | Upload resume           | User |
| POST   | `/photo`    | Upload profile photo    | User |

#### Companies (`/api/v1/companies`)

| Method | Path              | Description                 | Auth     |
| ------ | ----------------- | --------------------------- | -------- |
| POST   | `/`               | Create company              | User     |
| GET    | `/`               | List all approved companies | Public   |
| GET    | `/:id`            | Get company details         | Public   |
| PUT    | `/:id`            | Update company              | HR/Owner |
| DELETE | `/:id`            | Soft-delete company         | Owner    |
| POST   | `/:id/hr`         | Add HR staff                | Owner    |
| DELETE | `/:id/hr/:userId` | Remove HR staff             | Owner    |
| POST   | `/:id/logo`       | Upload company logo         | HR/Owner |

#### Jobs (`/api/v1/jobs`)

| Method | Path   | Description        | Auth   |
| ------ | ------ | ------------------ | ------ |
| POST   | `/`    | Create job listing | HR     |
| GET    | `/`    | Search/list jobs   | Public |
| GET    | `/:id` | Get job details    | Public |
| PUT    | `/:id` | Update job         | HR     |
| DELETE | `/:id` | Soft-delete job    | HR     |

#### Applications (`/api/v1/applications`)

| Method | Path                 | Description                  | Auth |
| ------ | -------------------- | ---------------------------- | ---- |
| POST   | `/`                  | Submit application           | User |
| GET    | `/my`                | Get my applications          | User |
| DELETE | `/:id`               | Withdraw application         | User |
| GET    | `/job/:jobId`        | Get all applications for job | HR   |
| PUT    | `/:id/status`        | Update application status    | HR   |
| GET    | `/job/:jobId/report` | Generate Excel report        | HR   |

#### Chats (`/api/v1/chats`)

| Method | Path       | Description            | Auth |
| ------ | ---------- | ---------------------- | ---- |
| GET    | `/`        | Get my conversations   | User |
| GET    | `/:userId` | Get messages with user | User |

#### Admin (`/api/v1/admin`)

| Method | Path                     | Description         | Auth  |
| ------ | ------------------------ | ------------------- | ----- |
| GET    | `/users`                 | List all users      | Admin |
| PUT    | `/users/:id/ban`         | Ban user            | Admin |
| PUT    | `/users/:id/unban`       | Unban user          | Admin |
| GET    | `/companies`             | List all companies  | Admin |
| PUT    | `/companies/:id/approve` | Approve company     | Admin |
| PUT    | `/companies/:id/reject`  | Reject company      | Admin |
| PUT    | `/companies/:id/ban`     | Ban company         | Admin |
| GET    | `/stats`                 | Platform statistics | Admin |
| GET    | `/audit`                 | Audit log           | Admin |

### 10.2 GraphQL API

- Endpoint: `POST /graphql`
- Authentication: Bearer JWT header
- Operations available: Queries for jobs, companies, users (read-optimised access pattern)

### 10.3 WebSocket Events (Socket.IO)

| Event                             | Direction | Payload                               | Description                      |
| --------------------------------- | --------- | ------------------------------------- | -------------------------------- |
| `connection`                      | C→S       | JWT token                             | Authenticate socket              |
| `message:send`                    | C→S       | `{ receiverId, content, companyId? }` | Send chat message                |
| `message:receive`                 | S→C       | `{ senderId, content, sentAt }`       | Receive chat message             |
| `notification:application_status` | S→C       | `{ applicationId, status }`           | Application status change        |
| `notification:new_application`    | S→C       | `{ applicationId, jobId }`            | New application received (to HR) |

### 10.4 Response Envelope

All REST responses follow a consistent envelope:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 422
}
```

---

## 11. Security Requirements

| Requirement        | Implementation                                                            |
| ------------------ | ------------------------------------------------------------------------- |
| Password Storage   | bcryptjs, 10 salt rounds                                                  |
| Transport Security | HTTPS (enforced in production via Railway/reverse proxy)                  |
| HTTP Headers       | Helmet.js (XSS, HSTS, no-sniff, referrer-policy)                          |
| API Rate Limiting  | 15 req / 15 min per IP (configurable)                                     |
| Authentication     | JWT access + refresh tokens; Google OAuth 2.0                             |
| Authorisation      | Role-based middleware (user / HR / admin); ownership checks               |
| Input Validation   | Joi schema validation on all incoming request bodies                      |
| NoSQL Injection    | Sanitised query construction; no raw string interpolation                 |
| Field Encryption   | Mobile numbers encrypted at rest with AES-256                             |
| File Upload Safety | Multer file type/size validation; Cloudinary signed URLs                  |
| Secrets Management | All secrets in `.env`; `.env.example` committed without values            |
| Logging            | Passwords and tokens never logged; Winston with sensitive field redaction |
| CORS               | Explicit origin allowlist; credentials mode configured                    |
| Account Suspension | `bannedAt` field; banned users blocked at middleware layer                |
| Audit Trail        | Admin actions logged with actor, timestamp, and affected entity           |

---

## 12. Infrastructure & DevOps

### 12.1 Technology Stack

| Layer                | Technology                                     |
| -------------------- | ---------------------------------------------- |
| Runtime              | Node.js 22+                                    |
| Framework            | Express.js 4.x                                 |
| Database             | MongoDB (Atlas) via Mongoose 8.x               |
| Cache / Queue Broker | Redis (ioredis)                                |
| Background Jobs      | BullMQ 5.x                                     |
| Real-time            | Socket.IO 4.x with Redis Adapter               |
| File Storage         | Cloudinary 2.x                                 |
| Email                | Nodemailer 8.x                                 |
| Auth                 | Passport.js, jsonwebtoken, google-auth-library |
| Data Export          | ExcelJS                                        |
| API Docs             | Swagger UI Express + swagger-autogen           |
| GraphQL              | graphql-http, graphql 15.x                     |
| Validation           | Joi 17.x                                       |
| Logging              | Winston, Morgan                                |
| Testing              | Jest 30, SuperTest, mongodb-memory-server      |
| Containerisation     | Docker + Docker Compose (dev and prod configs) |
| CI/CD                | GitHub Actions                                 |
| Deployment           | Railway                                        |

### 12.2 Docker Configuration

```bash
# Start development environment
docker compose -p job-search-dev \
  -f docker-compose.yml -f docker-compose.dev.yml \
  up --build -d

# Start production environment
docker compose -p job-search-prod \
  -f docker-compose.yml -f docker-compose.prod.yml \
  up --build -d
```

- `docker-compose.yml`: base service definitions (app, MongoDB, Redis)
- `docker-compose.dev.yml`: volume mounts, nodemon, debug ports
- `docker-compose.prod.yml`: multi-stage build, resource limits, health-checks

### 12.3 CI/CD Pipeline (GitHub Actions)

Triggered on: push/pull request to `main`.

```text
┌──────────────┐
│  Setup Job   │  → Install dependencies (node_modules cache)
└──────┬───────┘
       │ (parallel)
┌──────┴───────────────────────────────────────────┐
│  ESLint   │  Prettier   │  Commitlint  │  Tests  │
└───────────────────────────────────────────────────┘
```

- Action SHAs are pinned (security best practice).
- Minimal permissions per job.
- Test job runs unit + integration suites with MongoDB in-memory server.

### 12.4 Environment Variables

| Variable               | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `PORT`                 | HTTP server port                                      |
| `NODE_ENV`             | Environment mode (development/production)             |
| `MONGO_URL`            | MongoDB connection URI                                |
| `DB_NAME`              | MongoDB database name                                 |
| `ENCRYPTION_KEY`       | AES-256 key for field-level encryption                |
| `ENCRYPTION_IV`        | AES-256 IV                                            |
| `USER_EMAIL`           | Nodemailer sending address                            |
| `USER_PASS`            | Nodemailer SMTP password                              |
| `JWT_ACCESS_SECRET`    | JWT access token signing secret                       |
| `JWT_REFRESH_SECRET`   | JWT refresh token signing secret                      |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                                |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                            |
| `GOOGLE_CALLBACK_URL`  | Google OAuth redirect URI                             |
| `CLOUDINARY_NAME`      | Cloudinary cloud name                                 |
| `CLOUDINARY_KEY`       | Cloudinary API key                                    |
| `CLOUDINARY_SECRET`    | Cloudinary API secret                                 |
| `REDIS_URL`            | Redis connection URI (for BullMQ + Socket.IO adapter) |

---

## 13. Testing Strategy

### 13.1 Test Types

| Type              | Framework                                | Scope                                                      |
| ----------------- | ---------------------------------------- | ---------------------------------------------------------- |
| Unit Tests        | Jest                                     | Services, DAOs, utility functions: isolated with mocks     |
| Integration Tests | Jest + SuperTest + mongodb-memory-server | Full HTTP request/response cycle against in-memory MongoDB |

### 13.2 Test Scripts

```bash
npm test                    # Run all tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:coverage       # With coverage report
npm run test:watch          # Watch mode
```

### 13.3 Key Test Coverage Areas

- Authentication flows (register, login, OTP, OAuth)
- Authorization: role-based access control (user/HR/admin)
- Job CRUD and search
- Application submission and status updates
- Company management and approval workflow
- Rate limiting and input validation error responses
- Soft delete and cascade behaviour

### 13.4 Pre-commit Quality Gates (Husky)

1. ESLint with auto-fix
2. Prettier formatting check
3. Commitlint conventional commit validation

---

## 14. Future Roadmap

### Near-Term (v2.x)

| Feature                | Description                                                                                            | Priority |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| CV AI Analysis         | Upload CV → Anthropic API analysis → structured match score against job description, powered by BullMQ | High     |
| Job Recommendations    | Recommend jobs based on user skills and application history                                            | High     |
| Saved Jobs             | Explicit save/unsave endpoint with user-specific saved jobs feed                                       | Medium   |
| Advanced Notifications | User-configurable notification preferences; SMS via Twilio/Telnyx                                      | Medium   |
| Interview Scheduling   | HR books interview slot; candidate receives calendar invite                                            | Medium   |

### Mid-Term (v3.x)

| Feature                   | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| Company Reviews           | Job seekers rate and review companies after working or interviewing |
| Salary Benchmarking       | Anonymous salary data aggregation and display by role/location      |
| Multi-language Support    | Internationalised API response messages (i18n)                      |
| Mobile Push Notifications | Integration with FCM/APNs for mobile app clients                    |
| Activity Feed             | Notification history / activity hub endpoint                        |

### Long-Term

| Feature                      | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| Matching Engine              | ML-based candidate-to-job matching score               |
| Employer Analytics Dashboard | Funnel conversion rates, time-to-hire, source tracking |
| Subscription/Billing         | Premium HR tiers with higher job post limits           |
| Multi-tenant Support         | White-label API for enterprise clients                 |

---

## 15. Success Metrics

### Technical KPIs

| Metric                      | Target                      |
| --------------------------- | --------------------------- |
| API p95 response time       | < 500ms                     |
| Uptime                      | ≥ 99.5%                     |
| Test coverage               | ≥ 80%                       |
| CI pass rate                | ≥ 95% on `main` branch      |
| Zero critical CodeQL alerts | Maintained on every release |

### Product KPIs (Post-Launch)

| Metric                      | Description                                    |
| --------------------------- | ---------------------------------------------- |
| Registered Users            | Total accounts created                         |
| Active Job Listings         | Open listings at any time                      |
| Application Conversion Rate | Applications per job view                      |
| Time to First Application   | Elapsed time from job post to first submission |
| Chat Messages Sent          | Engagement indicator between seekers and HR    |
| Report Downloads            | HR adoption of analytics features              |

---

## 16. Glossary

| Term              | Definition                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| **DAO**           | Data Access Object: class that abstracts Mongoose database operations                                  |
| **DI Container**  | Dependency Injection Container (`src/container.js`) that wires app dependencies                        |
| **OTP**           | One-Time Password: 6-digit code for email verification or password reset                               |
| **Soft Delete**   | Marking a record as deleted via `deletedAt` timestamp without removing it from the database            |
| **BullMQ**        | Redis-backed job queue library for async background tasks                                              |
| **JWT**           | JSON Web Token: compact token format for stateless authentication                                      |
| **HR**            | Human Resources: a user role with company-scoped job and application management privileges             |
| **AES**           | Advanced Encryption Standard: symmetric encryption algorithm used for field-level encryption           |
| **Redis Adapter** | Socket.IO plugin that synchronises real-time events across multiple server instances via Redis pub/sub |
| **ExcelJS**       | Node.js library for programmatic Excel file generation                                                 |
| **GraphQL**       | Query language for APIs allowing clients to request exactly the data they need                         |
| **WebSocket**     | Full-duplex communication protocol over a single TCP connection; used by Socket.IO                     |
| **Cloudinary**    | Cloud-based media storage and transformation service                                                   |
