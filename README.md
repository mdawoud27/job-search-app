# Job Search App

A RESTful API for a job search platform built with Node.js, Express, and MongoDB. This application enables users to find jobs, companies to post positions, and administrators to manage the platform.

## Features

### User Features

- Browse and search available job listings
- Apply for jobs
- View job details and company information
- Manage application status and history
- Update personal profile and resume
- Save favorite job listings

### HR Features

- Post and manage job listings
- Review and manage applications
- Track applicant status throughout the hiring process
- Communicate with candidates
- Generate hiring reports
- Manage company profile and information

### Admin Features

- Manage users and their accounts
- Moderate job postings and applications
- View platform analytics and statistics
- Manage system configurations
- Monitor and maintain platform integrity
- Handle user disputes and support tickets


## Getting Started

1. Clone the repository
2. Install Dependencies with `npm install`
3. Copy `.env.example` file to your `.env` file and configure your variables
4. Start the server with `npm run start:dev`
5. The server will start on `http://localhost:3000`.

## Project Documentation

For more technical details, please refer to the following documentation:

- [Entity Relationship Diagram (ERD)](docs/ERD.md)
- [Project Architecture](docs/PROJECT_ARCH.md)
- [GitHub Flow](docs/GITHUB_FLOW.md)

## API Documentation

The API documentation is available via Swagger UI:

[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

You can explore all endpoints, schemas, and test the API directly from there.

## Docker

```bash
# Start dev
docker compose -p job-search-dev -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# Start prod
docker compose -p job-search-prod -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Stop dev
docker compose -p job-search-dev down

# Stop prod
docker compose -p job-search-prod down

# View logs
docker compose -p job-search-dev logs -f
docker compose -p job-search-prod logs -f
```
