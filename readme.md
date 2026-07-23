# Financial Planner API

A RESTful backend API for a personal financial planning application. The API provides user authentication, profile management, saving plans, expense tracking, and financial data management. It is built with Node.js, Express, PostgreSQL (Supabase), and follows a layered architecture to separate business logic from database operations.

---

# Features

## Authentication

- User registration
- User login
- JWT-based authentication
- Protected routes
- Current authenticated user endpoint

---

## User Management

- View user profile
- Update profile information
- Upload profile avatar to Supabase Storage
- Change password (in progress)

---

## Saving Plans

- Create saving plans
- Retrieve all saving plans
- Retrieve a single saving plan
- Update saving plans
- Delete saving plans

Each saving plan stores:

- Plan name
- Deposit amount
- Deposit frequency
- Duration
- Calculated withdrawal amount
- Status

---

## Expense Types

Organize expenses into reusable groups.

Example:

Food

```text
Breakfast
Lunch
Dinner
Snacks
```

Transportation

```text
Bus
Rickshaw
Fuel
Uber
```

Features:

- Create expense type
- Update expense type
- Delete expense type
- List expense types

---

## Expense Records

Track daily expenses.

Features:

- Create expense record
- Update expense record
- Delete expense record
- List expense records

Each record stores:

- Date
- Expense Type
- Total amount

---

## Avatar Upload

- Upload images using Multer
- Store files in Supabase Storage
- Store public URL in PostgreSQL

Supported image types:

- JPG
- PNG
- WEBP
- GIF

Maximum upload size:

```
5 MB
```

---

## Validation

Request validation is handled using **Zod**.

Invalid requests return structured validation errors before reaching the service layer.

---

## Error Handling

Centralized error handling using:

- AppError
- Async Handler
- Global Error Middleware

Provides consistent JSON responses.

Example:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed"
}
```

---

# Tech Stack

| Technology | Purpose |
|------------|----------|
| Node.js | Runtime |
| Express.js | REST API |
| PostgreSQL | Database |
| Supabase | Database & Storage |
| JWT | Authentication |
| bcrypt | Password Hashing |
| Zod | Validation |
| Multer | File Upload |
| UUID | File Naming |

---

# Project Structure

```
src
│
├── config
│   ├── database.js
│   ├── env.js
│   ├── jwt.js
│   └── supabase.js
│
├── constants
│   ├── httpStatus.js
│   └── messages.js
│
├── controllers
│
├── db
│
├── middlewares
│
├── repositories
│
├── routes
│
├── services
│
├── utils
│
├── validations
│
├── app.js
└── server.js
```

---

# Architecture

The project follows a layered architecture.

```
Client
    │
    ▼
Routes
    │
    ▼
Middleware
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
Database
```

## Responsibilities

### Routes

- Define API endpoints
- Apply middleware

### Middleware

- Authentication
- Validation
- Upload handling
- Error handling

### Controllers

- Receive requests
- Call services
- Return responses

Controllers do not contain business logic.

### Services

Business logic lives here.

Examples:

- Password hashing
- JWT generation
- Uploading avatars
- Business validations

### Repositories

Responsible only for database queries.

No business logic is placed here.

---

# Authentication

Authentication uses JSON Web Tokens (JWT).

Protected endpoints require:

```
Authorization: Bearer <token>
```

---

# API Endpoints

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current authenticated user |

---

## User

| Method | Endpoint |
|---------|----------|
| GET | /api/users/profile |
| PUT | /api/users/profile |
| PUT | /api/users/avatar |
| PUT | /api/users/change-password |

---

## Saving Plans

| Method | Endpoint |
|---------|----------|
| POST | /api/saving-plans |
| GET | /api/saving-plans |
| GET | /api/saving-plans/:id |
| PUT | /api/saving-plans/:id |
| DELETE | /api/saving-plans/:id |

---

## Expense Types

| Method | Endpoint |
|---------|----------|
| POST | /api/expense-types |
| GET | /api/expense-types |
| GET | /api/expense-types/:id |
| PUT | /api/expense-types/:id |
| DELETE | /api/expense-types/:id |

---

## Expense Records

| Method | Endpoint |
|---------|----------|
| POST | /api/expense-records |
| GET | /api/expense-records |
| GET | /api/expense-records/:id |
| PUT | /api/expense-records/:id |
| DELETE | /api/expense-records/:id |

---

# Environment Variables

Create a `.env` file in the project root.

```env
PORT=

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

JWT_SECRET=
JWT_EXPIRES_IN=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=
```

---

# Installation

Clone the repository.

```bash
git clone <repository-url>
```

Move into the project.

```bash
cd financial-planner-api
```

Install dependencies.

```bash
npm install
```

Create a `.env` file.

Start development server.

```bash
npm run dev
```

Production.

```bash
npm start
```

---

# Database

The application currently contains the following tables.

```
users

saving_plans

expense_types

expense_records
```

Future tables:

```
targets
```

---

# Response Format

Successful response

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Success",
    "data": {}
}
```

Error response

```json
{
    "success": false,
    "statusCode": 400,
    "message": "Something went wrong"
}
```

Validation error

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "field": "email",
            "message": "Invalid email"
        }
    ]
}
```

---

# File Upload

Avatar uploads use:

- Multer Memory Storage
- Supabase Storage

Files are uploaded directly from memory without being stored on the server filesystem.

---

# Security

Current security measures include:

- Password hashing using bcrypt
- JWT authentication
- Protected routes
- Input validation
- SQL parameterized queries
- Centralized error handling
- File type validation
- File size limit

---

# Current Limitations

The following features are not yet implemented.

- Dashboard analytics
- Monthly financial summaries
- Password reset
- Email verification
- Refresh tokens
- Pagination
- API rate limiting
- Swagger/OpenAPI documentation
- Automated tests

---

# Future Improvements

- Dashboard API
- Financial reports
- Goal tracking
- Monthly analytics
- Notification system
- Docker support
- CI/CD pipeline
- Unit testing
- Integration testing
- Redis caching

---

# License

This project is intended for educational and portfolio purposes.

---

# Author

**Mohiuddin Mohammad Sadik**

GitHub: https://github.com/dksaddy
