# Job Search App

The **Job Search App** is a web application designed to help users find jobs relevant to their domain or area of interest. The app provides a seamless experience for job seekers by offering features like filtering jobs, handling user and company data, and managing job applications. The application is built with a modular structure, making it easy to maintain and extend.s the database and follows a modular architecture.

## Features

- **Filter Jobs**: Users can filter job listings based on their preferences, such as job title, location, or industry.

- **User Data Management**: The app handles user data securely, allowing users to create profiles, update information, and manage job applications.

- **Company Data Management**: Companies can post job listings, manage their profiles, and view applications.

- **Job Application Management**: Users can apply to jobs, track their applications, and receive updates on their status.

- **Error Handling**: The app provides clear error messages for invalid inputs or actions.

- **Authentication and Authorization**: Secure user authentication and role-based access control (e.g., admin, user, company).

- **API Integration**: The app integrates with external APIs for features like OAuth (Google login) and email services.

<!-- ## Project Structure

```bash
src/
├── config
│   └── db.js                  # Database connection setup
├── controllers
│   ├── admin.controller.js      # Admin-related operations
│   ├── application.controller.js # Job application operations
│   ├── auth.controller.js       # Authentication operations
│   ├── company.controller.js    # Company operations
│   ├── job.controller.js        # Job management operations
│   └── user.controller.js       # User operations
├── index.js                    # Root file of the application
├── middlewares
│   ├── auth.js                 # Authentication middleware
│   ├── errorHandler.js         # Global error handler
│   ├── verifyAdminPermission.js # Middleware to verify admin access
│   └── verifyUserPermission.js  # Middleware to verify user access
├── models
│   ├── Application.js          # Job application model
│   ├── Attachments.js          # File attachments model
│   ├── Chat.js                 # Chat model
│   ├── Company.js              # Company model
│   ├── Job.js                  # Job model
│   ├── OtpSchema.js            # OTP storage model
│   └── User.js                 # User model
├── routes
│   ├── admin.routes.js         # Admin routes
│   ├── application.routes.js   # Application routes
│   ├── auth.routes.js          # Authentication routes
│   ├── company.routes.js       # Company routes
│   ├── job.routes.js           # Job routes
│   └── user.routes.js          # User routes
├── strategies
│   └── google-strategy.js      # Google authentication strategy
├── utils
│   ├── apiLimiter.js           # Rate limiting utility
│   ├── crypto.js               # Cryptographic utilities
│   ├── emailService.js         # Email sending service
│   ├── googleVerifyIdToken.js  # Google token verification
│   ├── imageStorage.js         # Image upload storage
│   ├── otpCleanup.js           # OTP cleanup script
│   ├── otpUtils.js             # OTP generation and verification
│   └── uploadImage.js          # Image upload handling
└── validations
    ├── admin.validation.js     # Admin request validation
    ├── auth.validation.js      # Authentication validation
    ├── company.validation.js   # Company request validation
    ├── job.validation.js       # Job request validation
    └── user.validation.js      # User request validation
``` -->

## Usage

- Users can register and log in via email/password or Google authentication.
- Companies can post job listings and manage applicants.
- Applicants can search for jobs, apply, and track their applications.
- Admins can oversee users, companies, and job postings.

## API Documentation

A Postman collection is available for testing API endpoints. You can import the collection into Postman for easy access to API requests.

You can find postman collections [_here_](./job-search-app.postman_collection.json)
