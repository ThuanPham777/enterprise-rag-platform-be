# Enterprise RAG Platform - Backend API

A comprehensive enterprise-grade backend API for managing documents, knowledge base, and AI-powered chat interactions using Retrieval-Augmented Generation (RAG). Built with NestJS, PostgreSQL, and integrated with AWS S3 for file storage and a Python-based RAG service for intelligent document querying.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Design](#database-design)
- [Permission & Role System](#permission--role-system)
- [Seeding Strategy](#seeding-strategy)
- [Error Handling & Logging](#error-handling--logging)

---

## 🎯 Project Overview

The Enterprise RAG Platform Backend is a robust API service designed to:

- **Document Management**: Upload, store, and manage enterprise documents with fine-grained access control
- **Knowledge Base**: Integrate with RAG service to ingest documents and make them searchable
- **AI Chat Interface**: Provide intelligent chat functionality that queries the knowledge base using user context
- **Access Control**: Implement role-based and department-based access rules for documents
- **File Storage**: Support AWS S3 for scalable file storage with presigned URLs

### Key Features

- 🔐 JWT-based authentication with refresh tokens
- 📄 Document upload and management with access rules
- 🤖 RAG-powered knowledge querying
- 💬 Chat interface with automatic RAG responses
- 👥 Role-based access control (RBAC)
- 🏢 Department and position-based permissions
- 📦 AWS S3 integration for file storage
- 📚 Comprehensive Swagger/OpenAPI documentation

---

## 🛠 Tech Stack

### Core Framework
- **NestJS** (v11.x) - Progressive Node.js framework
- **TypeScript** (v5.x) - Type-safe JavaScript
- **Express** - HTTP server framework

### Database & ORM
- **PostgreSQL** - Relational database
- **Prisma** (v7.x) - Next-generation ORM with type safety
- **@prisma/adapter-pg** - PostgreSQL adapter for Prisma

### Authentication & Security
- **@nestjs/jwt** - JWT token management
- **@nestjs/passport** - Authentication middleware
- **passport-jwt** - JWT strategy for Passport
- **bcrypt** - Password hashing

### File Storage
- **@aws-sdk/client-s3** - AWS S3 client
- **@aws-sdk/s3-request-presigner** - Presigned URL generation

### API Documentation
- **@nestjs/swagger** - OpenAPI/Swagger integration
- **swagger-ui-express** - Swagger UI interface

### Validation & Transformation
- **class-validator** - DTO validation
- **class-transformer** - Object transformation

### External Services
- **RAG Service** (Python FastAPI) - Document ingestion and querying
- **AWS S3** - Object storage for documents

---

## 📁 Project Structure

```
enterprise-rag-platform-be/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── decorators/          # Custom decorators (Permissions, Roles)
│   │   ├── dto/                 # Request/Response DTOs
│   │   ├── guards/              # Auth guards (JWT, Permissions, Roles)
│   │   ├── strategies/          # Passport strategies
│   │   ├── auth.controller.ts   # Auth endpoints
│   │   ├── auth.service.ts      # Auth business logic
│   │   └── auth.module.ts       # Auth module
│   │
│   ├── users/                   # User management
│   │   ├── dto/                 # User DTOs
│   │   ├── enums/               # User enums (status, etc.)
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── roles/                   # Role management
│   ├── permissions/             # Permission management
│   ├── departments/             # Department management
│   ├── positions/               # Position management
│   ├── user-profiles/           # User profile management
│   │
│   ├── documents/               # Document domain
│   │   ├── dto/                 # Document DTOs
│   │   ├── enums/               # DocumentStatus, FileType
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts # Document CRUD + RAG trigger
│   │   └── documents.module.ts
│   │
│   ├── uploads/                 # File upload module
│   │   ├── interfaces/          # Storage provider interface
│   │   ├── providers/           # S3StorageProvider
│   │   ├── services/            # FileValidationService
│   │   ├── dto/                 # Upload DTOs
│   │   ├── uploads.controller.ts
│   │   ├── uploads.service.ts
│   │   └── uploads.module.ts
│   │
│   ├── chats/                   # Chat & Message domain
│   │   ├── dto/                 # Chat/Message DTOs
│   │   ├── enums/               # MessageRole
│   │   ├── chats.controller.ts  # Chat CRUD
│   │   ├── chats.service.ts
│   │   ├── messages.controller.ts # Message endpoints
│   │   ├── messages.service.ts  # Message + RAG query
│   │   └── chats.module.ts
│   │
│   ├── rag/                     # RAG service client
│   │   ├── services/
│   │   │   └── rag-service.client.ts # RAG API client
│   │   └── rag.module.ts
│   │
│   ├── common/                  # Shared utilities
│   │   └── dtos/                # Common DTOs (ApiResponse, ErrorResponse)
│   │
│   ├── prisma/                  # Prisma service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Application entry point
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Database seeding script
│   └── migrations/              # Database migrations
│
├── generated/
│   └── prisma/                  # Generated Prisma client
│
├── test/                        # E2E tests
├── dist/                        # Compiled output
│
├── package.json
├── tsconfig.json
└── README.md
```

### Module Organization

Each domain follows NestJS best practices:
- **Controller**: Handles HTTP requests/responses
- **Service**: Contains business logic
- **Module**: Configures dependencies and exports
- **DTOs**: Request/Response data transfer objects
- **Enums**: Type-safe enumerations

---

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# ============================================
# Application
# ============================================
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ============================================
# Database
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/enterprise_rag?schema=public

# ============================================
# JWT Authentication
# ============================================
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ============================================
# AWS S3 Configuration
# ============================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# ============================================
# RAG Service
# ============================================
RAG_SERVICE_URL=http://localhost:8000
```

### Environment Variable Descriptions

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `3001` |
| `NODE_ENV` | Environment (development/production) | No | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | No | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | **Yes** | - |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | **Yes** | - |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | No | Uses `JWT_ACCESS_SECRET` |
| `JWT_ACCESS_EXPIRES` | Access token expiration | No | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token expiration | No | `7d` |
| `AWS_REGION` | AWS region for S3 | No | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | **Yes** (if using S3) | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | **Yes** (if using S3) | - |
| `AWS_S3_BUCKET_NAME` | S3 bucket name | **Yes** (if using S3) | - |
| `RAG_SERVICE_URL` | RAG service base URL | No | `http://localhost:8000` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.x or higher)
- **PostgreSQL** (v14.x or higher)
- **npm** or **yarn**
- **AWS Account** (for S3 storage, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd enterprise-rag-platform-be
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # Seed the database
   npm run seed
   # or
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

The API will be available at:
- **API**: `http://localhost:3001/api`
- **Swagger Docs**: `http://localhost:3001/docs`

### Available Scripts

```bash
# Development
npm run start:dev      # Start in watch mode
npm run start:debug    # Start in debug mode

# Production
npm run build          # Build for production
npm run start:prod     # Start production server

# Database
npx prisma generate    # Generate Prisma client
npx prisma migrate dev # Run migrations
npx prisma db seed     # Seed database
npx prisma studio      # Open Prisma Studio (database GUI)

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier

# Testing
npm run test           # Run unit tests
npm run test:e2e       # Run E2E tests
npm run test:cov       # Run tests with coverage
```

---

## 📚 API Documentation

### Swagger/OpenAPI

The API is fully documented using Swagger/OpenAPI. Access the interactive documentation at:

```
http://localhost:3001/docs
```

The Swagger UI provides:
- Complete API endpoint documentation
- Request/Response schemas
- Try-it-out functionality
- Authentication support (Bearer token)

### Authentication Flow

#### 1. Register (Optional - if enabled)

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }
}
```

#### 2. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "fullName": "John Doe",
      "roles": ["EMPLOYEE"],
      "permissions": ["VIEW_DOCUMENTS", "QUERY_KNOWLEDGE"]
    }
  }
}
```

**Note:** The `refreshToken` is also set as an HTTP-only cookie.

#### 3. Using Access Token

Include the access token in the Authorization header for protected endpoints:

```http
GET /api/documents
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4. Refresh Token

When the access token expires, use the refresh token to get a new one:

```http
POST /api/auth/refresh
Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "new-access-token...",
    "refreshToken": "new-refresh-token..."
  }
}
```

#### 5. Get Current User

```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "ACTIVE",
    "roles": ["EMPLOYEE"],
    "permissions": ["VIEW_DOCUMENTS", "QUERY_KNOWLEDGE"],
    "profile": {
      "department": "Engineering",
      "position": "Senior"
    }
  }
}
```

#### 6. Logout

```http
POST /api/auth/logout
Authorization: Bearer <access-token>
Cookie: refresh_token=<refresh-token>
```

---

### Main Modules & Features

#### 1. Authentication Module (`/api/auth`)

**Endpoints:**
- `POST /api/auth/register` - Register new user (if enabled)
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke tokens
- `GET /api/auth/me` - Get current user info

**Features:**
- JWT-based authentication
- Refresh token rotation
- Token revocation
- Password hashing with bcrypt

---

#### 2. Users Module (`/api/users`)

**Endpoints:**
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

**Permissions:**
- `MANAGE_USERS` - Required for all operations

---

#### 3. Documents Module (`/api/documents`)

**Endpoints:**
- `POST /api/documents` - Create document with access rules
- `GET /api/documents` - List all documents (filtered by access)
- `GET /api/documents/:id` - Get document by ID
- `DELETE /api/documents/:id` - Delete document

**Request Example (Create Document):**
```json
POST /api/documents
Authorization: Bearer <token>

{
  "title": "Leave Policy 2025",
  "filePath": "s3://company-docs/uploads/2025/03/uuid.pdf",
  "fileType": "PDF",
  "accessRules": {
    "roles": ["role-uuid-hr"],
    "departments": ["dept-uuid-hr"],
    "positions": ["position-uuid-manager"]
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Document created successfully",
  "data": {
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PROCESSING"
  }
}
```

**Features:**
- Transactional document creation
- Access rules with OR logic (user matches ANY rule → access granted)
- Automatic RAG ingestion trigger
- Document status management (PROCESSING → READY)

**Permissions:**
- `UPLOAD_DOCUMENTS` - Create documents
- `VIEW_DOCUMENTS` - View documents
- `DELETE_DOCUMENTS` - Delete documents

---

#### 4. Uploads Module (`/api/uploads`)

**Endpoints:**
- `POST /api/uploads` - Direct file upload (multipart/form-data)
- `POST /api/uploads/presigned-url` - Generate presigned upload URL
- `POST /api/uploads/download-url` - Generate presigned download URL
- `DELETE /api/uploads` - Delete file from storage

**Request Example (Direct Upload):**
```http
POST /api/uploads
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
folder: documents (optional)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "key": "documents/user-id/document_1234567890.pdf",
    "fileName": "document_1234567890.pdf",
    "size": 1024000,
    "mimeType": "application/pdf"
  }
}
```

**Features:**
- File validation (type, size, name sanitization)
- Support for presigned URLs (client-side upload)
- Direct upload (server-side upload)
- AWS S3 integration
- Abstract storage provider (easy to switch providers)

**Permissions:**
- `UPLOAD_DOCUMENTS` - Upload files

---

#### 5. Chats Module (`/api/chats`)

**Endpoints:**
- `POST /api/chats` - Create new chat
- `GET /api/chats` - Get all user chats
- `GET /api/chats/:id` - Get chat by ID
- `DELETE /api/chats/:id` - Delete chat

**Request Example (Create Chat):**
```json
POST /api/chats
Authorization: Bearer <token>

{
  "title": "Leave Policy Discussion" // optional
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "chatId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Leave Policy Discussion"
  }
}
```

**Features:**
- User can only access their own chats
- Chat includes message count
- Automatic cleanup of messages on chat deletion

**Permissions:**
- `QUERY_KNOWLEDGE` - Required for all chat operations

---

#### 6. Messages Module (`/api/messages`)

**Endpoints:**
- `POST /api/messages` - Send message and get RAG response
- `GET /api/messages/chat/:chatId` - Get all messages for a chat

**Request Example (Send Message):**
```json
POST /api/messages
Authorization: Bearer <token>

{
  "chatId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "What is the company leave policy?"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Message sent successfully",
  "data": {
    "userMessage": {
      "messageId": "550e8400-e29b-41d4-a716-446655440001",
      "role": "user",
      "content": "What is the company leave policy?"
    },
    "assistantMessage": {
      "messageId": "550e8400-e29b-41d4-a716-446655440002",
      "role": "assistant",
      "content": "According to company policy, employees are entitled to 12 days of annual leave..."
    }
  }
}
```

**Features:**
- Automatic RAG query when user sends message
- User context-based document filtering (department, position, roles)
- Stores both user and assistant messages
- Graceful error handling if RAG service fails

**Permissions:**
- `QUERY_KNOWLEDGE` - Required for all message operations

---

#### 7. Roles Module (`/api/roles`)

**Endpoints:**
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

**Permissions:**
- `MANAGE_ROLES` - Required for all operations

---

#### 8. Permissions Module (`/api/permissions`)

**Endpoints:**
- `GET /api/permissions` - List all permissions
- `POST /api/permissions` - Create permission

**Permissions:**
- `MANAGE_PERMISSIONS` - Required for all operations

---

#### 9. Departments Module (`/api/departments`)

**Endpoints:**
- `GET /api/departments` - List all departments
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

**Permissions:**
- `MANAGE_DEPARTMENTS` - Required for all operations

---

#### 10. Positions Module (`/api/positions`)

**Endpoints:**
- `GET /api/positions` - List all positions
- `POST /api/positions` - Create position
- `PUT /api/positions/:id` - Update position
- `DELETE /api/positions/:id` - Delete position

**Permissions:**
- `MANAGE_POSITIONS` - Required for all operations

---

#### 11. User Profiles Module (`/api/user-profiles`)

**Endpoints:**
- `GET /api/user-profiles` - List all profiles
- `GET /api/user-profiles/user/:userId` - Get profile by user ID
- `POST /api/user-profiles` - Create profile
- `PUT /api/user-profiles/:userId` - Update profile
- `DELETE /api/user-profiles/:userId` - Delete profile

**Permissions:**
- `MANAGE_USER_PROFILES` - Required for all operations

---

### API Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    // Detailed error information
  ]
}
```

**HTTP Status Codes:**
- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🗄 Database Design

### Entity Relationship Diagram

```
┌─────────────┐
│   users     │
│─────────────│
│ id (PK)     │
│ email       │
│ password    │
│ full_name   │
│ status      │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐   ┌──────▼──────┐
│ user_roles  │   │user_profiles│
│─────────────│   │──────────────│
│ user_id (FK)│   │ user_id (PK) │
│ role_id (FK)│   │ dept_id (FK) │
└──────┬──────┘   │ position_id  │
       │          └──────────────┘
       │
┌──────▼──────┐
│   roles     │
│─────────────│
│ id (PK)     │
│ name        │
└──────┬──────┘
       │
       │
┌──────▼──────────────┐
│ role_permissions    │
│─────────────────────│
│ role_id (FK)        │
│ permission_id (FK)  │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  permissions        │
│─────────────────────│
│ id (PK)             │
│ code                │
│ description         │
└─────────────────────┘

┌─────────────┐
│ documents   │
│─────────────│
│ id (PK)     │
│ title       │
│ file_path   │
│ file_type   │
│ status      │
│ uploaded_by │
└──────┬──────┘
       │
       │
┌──────▼──────────────────┐
│ document_access_rules   │
│─────────────────────────│
│ id (PK)                 │
│ document_id (FK)         │
│ role_id (FK)             │
│ department_id (FK)       │
│ position_id (FK)         │
│ access_level             │
└──────────────────────────┘

┌─────────────┐
│   chats     │
│─────────────│
│ id (PK)     │
│ user_id (FK)│
│ title       │
└──────┬──────┘
       │
       │
┌──────▼──────┐
│  messages   │
│─────────────│
│ id (PK)     │
│ chat_id (FK)│
│ role        │
│ content     │
└─────────────┘
```

### Core Tables

#### 1. **users**
Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique user identifier |
| `email` | VARCHAR(255) | User email (unique) |
| `password_hash` | VARCHAR | Bcrypt hashed password |
| `full_name` | VARCHAR(255) | User's full name |
| `status` | VARCHAR(20) | User status (ACTIVE, INACTIVE, etc.) |
| `created_at` | TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### 2. **roles**
Defines system roles (ADMIN, EMPLOYEE, etc.).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique role identifier |
| `name` | VARCHAR(50) | Role name (unique) |
| `description` | VARCHAR | Role description |

#### 3. **permissions**
Defines system permissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique permission identifier |
| `code` | VARCHAR(100) | Permission code (unique) |
| `description` | VARCHAR | Permission description |

#### 4. **role_permissions**
Many-to-many relationship between roles and permissions.

| Column | Type | Description |
|--------|------|-------------|
| `role_id` | UUID (FK) | Reference to roles |
| `permission_id` | UUID (FK) | Reference to permissions |

#### 5. **user_roles**
Many-to-many relationship between users and roles.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID (FK) | Reference to users |
| `role_id` | UUID (FK) | Reference to roles |

#### 6. **departments**
Organizational departments.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique department identifier |
| `name` | VARCHAR(100) | Department name |
| `description` | VARCHAR | Department description |

#### 7. **positions**
Job positions with hierarchy levels.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique position identifier |
| `name` | VARCHAR(100) | Position name |
| `level` | INT | Hierarchy level (1-10) |

#### 8. **user_profiles**
Extended user information.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID (PK, FK) | Reference to users |
| `department_id` | UUID (FK) | Reference to departments |
| `position_id` | UUID (FK) | Reference to positions |
| `joined_at` | DATE | Employment start date |

#### 9. **documents**
Document metadata and file information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique document identifier |
| `title` | VARCHAR | Document title |
| `file_path` | VARCHAR | S3 path or file location |
| `file_type` | VARCHAR(50) | File type (PDF, DOCX, etc.) |
| `source_type` | VARCHAR(50) | Source type (UPLOAD, etc.) |
| `status` | VARCHAR(20) | Status (PROCESSING, READY, FAILED) |
| `uploaded_by` | UUID (FK) | Reference to users |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### 10. **document_access_rules**
Access control rules for documents (OR logic).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique rule identifier |
| `document_id` | UUID (FK) | Reference to documents |
| `role_id` | UUID (FK) | Reference to roles (optional) |
| `department_id` | UUID (FK) | Reference to departments (optional) |
| `position_id` | UUID (FK) | Reference to positions (optional) |
| `access_level` | VARCHAR(20) | Access level (READ, WRITE, etc.) |

**Access Logic:** User matches ANY rule → access granted

#### 11. **chats**
Chat sessions for users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique chat identifier |
| `user_id` | UUID (FK) | Reference to users (owner) |
| `title` | VARCHAR | Chat title (optional) |
| `created_at` | TIMESTAMP | Creation timestamp |

#### 12. **messages**
Messages within chats.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique message identifier |
| `chat_id` | UUID (FK) | Reference to chats |
| `role` | VARCHAR(10) | Message role (user, assistant) |
| `content` | TEXT | Message content |
| `created_at` | TIMESTAMP | Creation timestamp |

#### 13. **refresh_tokens**
Refresh token storage for authentication.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique token identifier |
| `user_id` | UUID (FK) | Reference to users |
| `token_hash` | VARCHAR | Hashed refresh token |
| `expires_at` | TIMESTAMP | Token expiration |
| `revoked_at` | TIMESTAMP | Revocation timestamp (if revoked) |
| `user_agent` | VARCHAR | Client user agent |
| `ip_address` | VARCHAR | Client IP address |

---

## 🔐 Permission & Role System

### Role-Based Access Control (RBAC)

The system implements a flexible RBAC model with the following components:

1. **Roles**: Group of permissions (e.g., ADMIN, EMPLOYEE)
2. **Permissions**: Granular access controls (e.g., `UPLOAD_DOCUMENTS`, `QUERY_KNOWLEDGE`)
3. **Role-Permission Mapping**: Many-to-many relationship
4. **User-Role Mapping**: Users can have multiple roles

### Default Roles

#### **ADMIN Role**
Full system access with all permissions:
- `MANAGE_USERS` - Create, update, delete users
- `MANAGE_ROLES` - Manage roles
- `MANAGE_PERMISSIONS` - Manage permissions
- `MANAGE_DEPARTMENTS` - Manage departments
- `MANAGE_POSITIONS` - Manage positions
- `MANAGE_USER_PROFILES` - Manage user profiles
- `UPLOAD_DOCUMENTS` - Upload documents
- `VIEW_DOCUMENTS` - View documents
- `DELETE_DOCUMENTS` - Delete documents
- `QUERY_KNOWLEDGE` - Query knowledge base via chat

#### **EMPLOYEE Role**
Basic employee permissions:
- `VIEW_DOCUMENTS` - View documents they have access to
- `QUERY_KNOWLEDGE` - Use chat to query knowledge base

### Permission List

| Permission Code | Description | Default Roles |
|----------------|-------------|---------------|
| `MANAGE_USERS` | Create, update, delete users | ADMIN |
| `MANAGE_ROLES` | Manage roles | ADMIN |
| `MANAGE_PERMISSIONS` | Manage permissions | ADMIN |
| `MANAGE_DEPARTMENTS` | Manage departments | ADMIN |
| `MANAGE_POSITIONS` | Manage positions | ADMIN |
| `MANAGE_USER_PROFILES` | Manage user profiles | ADMIN |
| `UPLOAD_DOCUMENTS` | Upload documents | ADMIN |
| `VIEW_DOCUMENTS` | View documents | ADMIN, EMPLOYEE |
| `DELETE_DOCUMENTS` | Delete documents | ADMIN |
| `QUERY_KNOWLEDGE` | Query knowledge base | ADMIN, EMPLOYEE |

### Permission Enforcement

Permissions are enforced at multiple levels:

1. **Controller Level**: Using `@Permissions('PERMISSION_CODE')` decorator
2. **Guard Level**: `PermissionsGuard` checks user permissions
3. **Service Level**: Business logic can check permissions programmatically

**Example:**
```typescript
@Permissions('UPLOAD_DOCUMENTS')
@Post()
async createDocument(@Body() dto: CreateDocumentDto) {
  // Only users with UPLOAD_DOCUMENTS permission can access
}
```

### Document Access Rules

Documents use a separate access control system based on:
- **Roles**: Users with specific roles can access
- **Departments**: Users in specific departments can access
- **Positions**: Users with specific positions can access

**Access Logic:** OR logic - User matches ANY rule → access granted

**Example:**
```json
{
  "accessRules": {
    "roles": ["role-uuid-hr"],
    "departments": ["dept-uuid-hr"],
    "positions": ["position-uuid-manager"]
  }
}
```

A user will have access if they:
- Have the HR role, OR
- Are in the HR department, OR
- Have the Manager position

---

## 🌱 Seeding Strategy

The seed script (`prisma/seed.ts`) initializes the database with essential data for development and testing.

### Seeded Data

#### 1. **Permissions** (10 permissions)
All system permissions are created:
- `MANAGE_USERS`, `MANAGE_ROLES`, `MANAGE_PERMISSIONS`
- `MANAGE_DEPARTMENTS`, `MANAGE_POSITIONS`, `MANAGE_USER_PROFILES`
- `UPLOAD_DOCUMENTS`, `VIEW_DOCUMENTS`, `DELETE_DOCUMENTS`
- `QUERY_KNOWLEDGE`

#### 2. **Roles** (2 roles)
- **ADMIN**: System administrator with all permissions
- **EMPLOYEE**: Normal employee with basic permissions

#### 3. **Role-Permission Assignments**
- **ADMIN**: All permissions assigned
- **EMPLOYEE**: `VIEW_DOCUMENTS`, `QUERY_KNOWLEDGE` assigned

#### 4. **Admin User**
- **Email**: `admin@company.com`
- **Password**: `Admin@123`
- **Role**: ADMIN
- **Department**: Engineering
- **Position**: Director

#### 5. **Departments** (6 departments)
- Engineering
- Product
- Sales
- Marketing
- HR
- Finance

#### 6. **Positions** (10 positions)
- Intern (level 1)
- Junior (level 2)
- Mid-level (level 3)
- Senior (level 4)
- Lead (level 5)
- Principal (level 6)
- Manager (level 5)
- Senior Manager (level 6)
- Director (level 7)
- VP (level 8)

#### 7. **Employee Users** (~20 users)
Sample employees across different departments:
- Engineering: 6 employees (various positions)
- Product: 3 employees
- Sales: 4 employees
- Marketing: 3 employees
- HR: 2 employees
- Finance: 2 employees

**Default Password**: `Employee@123` (for all employees)

### Running the Seed

```bash
# Using npm script
npm run seed

# Using Prisma CLI
npx prisma db seed

# Direct execution
tsx prisma/seed.ts
```

### Seed Output

```
✅ Seed completed
   - 10 permissions
   - 2 roles
   - 1 admin user
   - 20 employee users
   - 6 departments
   - 10 positions
   - 21 user profiles
```

### Why This Seeding Strategy?

1. **Development**: Provides ready-to-use test data
2. **Testing**: Consistent test environment
3. **Demo**: Quick setup for demonstrations
4. **Onboarding**: New developers can start immediately
5. **Permissions**: Clear permission structure from the start

---

## ⚠️ Error Handling & Logging

### Error Handling Strategy

The application uses a consistent error handling approach:

#### 1. **HTTP Exception Classes**

NestJS provides built-in exception classes:
- `BadRequestException` (400) - Validation errors
- `UnauthorizedException` (401) - Authentication failures
- `ForbiddenException` (403) - Permission denied
- `NotFoundException` (404) - Resource not found
- `InternalServerErrorException` (500) - Server errors

#### 2. **Global Exception Filter**

All exceptions are caught and formatted consistently:

```typescript
// Example error response
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

#### 3. **Validation Errors**

DTO validation errors are automatically formatted:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "property": "email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ]
}
```

### Logging

The application uses NestJS's built-in Logger:

#### Log Levels

- **LOG**: General information
- **ERROR**: Error messages
- **WARN**: Warning messages
- **DEBUG**: Debug information (development only)

#### Logging Examples

```typescript
// In services
private readonly logger = new Logger(ServiceName.name);

this.logger.log('Operation completed successfully');
this.logger.error('Operation failed', error);
this.logger.warn('Potential issue detected');
```

#### Log Output

```
[Nest] 12345  - 01/15/2024, 10:30:00 AM     LOG [DocumentsService] Document created: uuid-123
[Nest] 12345  - 01/15/2024, 10:30:01 AM   ERROR [RagServiceClient] Failed to query RAG service: Connection timeout
```

### Error Scenarios

#### 1. **Authentication Errors**

```json
// 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized",
  "errors": ["Invalid or expired token"]
}
```

#### 2. **Permission Errors**

```json
// 403 Forbidden
{
  "status": "error",
  "message": "Forbidden",
  "errors": ["Insufficient permissions: UPLOAD_DOCUMENTS required"]
}
```

#### 3. **Validation Errors**

```json
// 400 Bad Request
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "property": "filePath",
      "constraints": {
        "matches": "filePath must match /^s3:\\/\\// regular expression"
      }
    }
  ]
}
```

#### 4. **Not Found Errors**

```json
// 404 Not Found
{
  "status": "error",
  "message": "Document not found",
  "errors": []
}
```

#### 5. **RAG Service Errors**

When RAG service fails, the application:
- Logs the error
- Returns a default message to the user
- Does not fail the entire request
- Allows document creation to succeed even if RAG fails

---

## 🔄 Integration with RAG Service

The backend integrates with a Python-based RAG service for document ingestion and querying.

### RAG Service Endpoints

1. **POST /api/v1/ingest** - Ingest document (async)
2. **POST /api/v1/query** - Query knowledge base
3. **GET /api/v1/ingest/:documentId/status** - Check ingestion status
4. **DELETE /api/v1/ingest/:documentId** - Delete document from vector store

### Integration Flow

#### Document Ingestion
```
1. User uploads document → Backend stores in S3
2. Create document record → Status: PROCESSING
3. Download file from S3 to temp directory
4. Call RAG service /ingest endpoint
5. RAG service processes document (async)
6. Document status updated to READY (via callback or polling)
```

#### Chat Query
```
1. User sends message → Backend receives
2. Get user context (department, position, roles)
3. Call RAG service /query endpoint with:
   - Question
   - User context (for access filtering)
4. RAG service:
   - Embeds question
   - Searches vector store with access filters
   - Generates answer with LLM
5. Backend stores both user and assistant messages
6. Return response to user
```

---

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Test Structure

```
test/
├── app.e2e-spec.ts    # E2E tests
└── jest-e2e.json      # E2E test configuration
```

---

## 📦 Deployment

### Production Build

```bash
# Build
npm run build

# Start production server
npm run start:prod
```

### Environment Variables for Production

Ensure all environment variables are set:
- Use strong JWT secrets
- Configure production database
- Set up AWS S3 credentials
- Configure RAG service URL
- Set appropriate CORS origins

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

---

## 📄 License

This project is proprietary and confidential.

---

## 🆘 Support

For issues and questions:
- Check Swagger documentation: `http://localhost:3001/docs`
- Review logs for error details
- Contact the development team

---

## 📝 Additional Notes

### File Upload Flow

1. **Option 1: Direct Upload**
   - Client → Backend → S3
   - Simpler, but uses backend bandwidth

2. **Option 2: Presigned URL**
   - Client → Backend (get presigned URL)
   - Client → S3 (direct upload)
   - More efficient for large files

### S3 Path Format

Documents are stored with paths like:
```
s3://bucket-name/documents/user-id/filename.pdf
```

### RAG Service Communication

- Backend downloads S3 files to temp directory before sending to RAG service
- RAG service expects local file paths
- Temp files are cleaned up after processing

---

**Last Updated**: January 2025
