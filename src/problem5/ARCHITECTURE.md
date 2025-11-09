# Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Project Structure](#project-structure)
4. [Layer Descriptions](#layer-descriptions)
5. [Data Flow](#data-flow)
6. [Technology Stack](#technology-stack)
7. [Design Patterns](#design-patterns)
8. [Error Handling](#error-handling)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)

---

## Overview

This is a **CRUD REST API** built with **TypeScript**, **Express.js**, and **PostgreSQL** following **Clean Architecture** principles. The application provides user management functionality with full CRUD operations, validation, error handling, and proper separation of concerns.

### Key Features
- ✅ Clean Architecture with clear separation of layers
- ✅ Type-safe with TypeScript
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Request validation with Zod
- ✅ Comprehensive error handling with proper HTTP status codes
- ✅ Dependency Injection pattern
- ✅ Repository pattern for data access
- ✅ Unit and integration tests
- ✅ RESTful API design

---

## Architecture Pattern

This project follows **Clean Architecture** (also known as Hexagonal Architecture or Ports and Adapters), organized into distinct layers:

```
┌─────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                  │
│  (Controllers, Routes, Database, Validation, Middleware) │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   Application Layer                      │
│              (Use Cases, Service Implementations)        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                     Domain Layer                         │
│     (Entities, Repository Interfaces, Business Rules)    │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rule
- **Domain Layer**: No dependencies on other layers (pure business logic)
- **Application Layer**: Depends only on Domain Layer
- **Infrastructure Layer**: Depends on Application and Domain Layers

---

## Project Structure

```
src/
├── domain/                      # Domain Layer (Core Business Logic)
│   ├── entities/                # Business entities
│   │   └── user.ts             # User entity with types
│   ├── repositories/            # Repository interfaces
│   │   └── user-repository.ts  # UserRepository interface
│   ├── services/                # Service interfaces
│   │   └── user-service.ts     # UserService interface
│   └── errors/                  # Custom error classes
│       └── app-errors.ts       # AppError, NotFoundError, etc.
│
├── application/                 # Application Layer (Use Cases)
│   └── services/               # Service implementations
│       └── user-service-impl.ts # UserService implementation
│
├── infrastructure/              # Infrastructure Layer (External Concerns)
│   ├── controllers/            # HTTP Controllers
│   │   └── user-controller.ts # UserController
│   ├── routes/                 # Route definitions
│   │   └── user-routes.ts     # User routes
│   ├── middleware/             # Express middleware
│   │   ├── error-middleware.ts       # Error handling
│   │   └── validation-middleware.ts  # Request validation
│   ├── validation/             # Validation schemas
│   │   └── user-validation.ts # Zod schemas
│   ├── database/               # Database related
│   │   ├── connection.ts      # Database connection
│   │   ├── schema.ts          # Drizzle schema
│   │   ├── user-data-source.ts        # DataSource interface
│   │   └── drizzle-user-data-source.ts # Drizzle implementation
│   ├── repositories/           # Repository implementations
│   │   └── user-repository-impl.ts # Repository implementation
│   └── di/                     # Dependency Injection
│       └── container.ts       # DI Container
│
├── tests/                      # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── setup.ts               # Test setup
│
├── index.ts                   # Application entry point
└── migrate.ts                 # Database migration script
```

---

## Layer Descriptions

### 1. Domain Layer (`src/domain/`)

**Purpose**: Contains pure business logic and rules, completely independent of frameworks and external concerns.

#### Components:

**Entities (`entities/user.ts`)**
- Define the core business objects
- Plain TypeScript interfaces with no dependencies
- Example: `User`, `CreateUserData`, `UpdateUserData`, `UserFilters`

**Repository Interfaces (`repositories/user-repository.ts`)**
- Define contracts for data access
- No implementation details
- Used by Application Layer

**Service Interfaces (`services/user-service.ts`)**
- Define business operation contracts
- Abstract the use cases

**Custom Errors (`errors/app-errors.ts`)**
- Business-specific error types
- HTTP status code mapping
- `NotFoundError` (404), `ConflictError` (409), `BadRequestError` (400), etc.

### 2. Application Layer (`src/application/`)

**Purpose**: Contains application-specific business rules and orchestrates the flow between domain and infrastructure.

#### Components:

**Service Implementations (`services/user-service-impl.ts`)**
- Implements business logic use cases
- Validates business rules (e.g., age constraints, email uniqueness)
- Orchestrates repository calls
- Throws domain errors with proper status codes

**Example Business Rules:**
```typescript
// Email uniqueness check (409 Conflict)
if (existingUser) {
  throw new ConflictError('User with this email already exists');
}

// Age validation (400 Bad Request)
if (data.age < 0 || data.age > 150) {
  throw new BadRequestError('Age must be between 0 and 150');
}

// User existence check (404 Not Found)
if (!user) {
  throw new NotFoundError('User not found');
}
```

### 3. Infrastructure Layer (`src/infrastructure/`)

**Purpose**: Contains all external concerns - HTTP, database, validation, etc.

#### Components:

**Controllers (`controllers/user-controller.ts`)**
- Handle HTTP requests/responses
- Call service methods
- Transform data for HTTP responses
- Use `asyncHandler` for error handling

**Routes (`routes/user-routes.ts`)**
- Define API endpoints
- Apply middleware (validation)
- Map HTTP methods to controller methods

**Middleware**
- `error-middleware.ts`: Global error handling, converts errors to HTTP responses
- `validation-middleware.ts`: Request validation using Zod schemas

**Validation (`validation/user-validation.ts`)**
- Zod schemas for request validation
- Validates: body, query params, path params
- Type-safe validation

**Database**
- `connection.ts`: PostgreSQL connection with Drizzle ORM
- `schema.ts`: Database table definitions
- `user-data-source.ts`: Interface for data operations
- `drizzle-user-data-source.ts`: Drizzle ORM implementation

**Repository Implementation (`repositories/user-repository-impl.ts`)**
- Implements repository interface
- Delegates to data source
- Acts as adapter between domain and database

**Dependency Injection (`di/container.ts`)**
- Singleton container pattern
- Manages object lifecycle
- Wires dependencies together

---

## Data Flow

### Example: Create User Request

```
1. HTTP Request
   POST /api/v1/users
   Body: { email, name, age }
         │
         ▼
2. Route Handler (user-routes.ts)
   - Applies validation middleware
         │
         ▼
3. Validation Middleware (validation-middleware.ts)
   - Validates with Zod schema
   - Returns 400 if invalid
         │
         ▼
4. Controller (user-controller.ts)
   - Extracts request data
   - Calls service method
         │
         ▼
5. Service (user-service-impl.ts)
   - Business logic validation
   - Checks email uniqueness (409 if exists)
   - Validates age range (400 if invalid)
   - Calls repository
         │
         ▼
6. Repository (user-repository-impl.ts)
   - Delegates to data source
         │
         ▼
7. Data Source (drizzle-user-data-source.ts)
   - Executes SQL via Drizzle ORM
   - Inserts into PostgreSQL
         │
         ▼
8. Response Flow (reverse)
   Database → Data Source → Repository → Service → Controller → HTTP Response
         │
         ▼
9. HTTP Response
   Status: 201 Created
   Body: { success, data, message }
```

### Error Flow

```
Service throws NotFoundError(404)
         │
         ▼
asyncHandler catches error
         │
         ▼
Error Middleware
         │
         ▼
HTTP Response with proper status code
{
  error: "Application Error",
  message: "User not found",
  statusCode: 404
}
```

---

## Technology Stack

### Core
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework

### Database
- **PostgreSQL** - Relational database
- **Drizzle ORM** - TypeScript ORM
- **postgres** - PostgreSQL client

### Validation
- **Zod** - Schema validation
- **drizzle-zod** - Drizzle + Zod integration

### Security & Middleware
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logger
- **dotenv** - Environment variables

### Development
- **tsx** - TypeScript execution
- **Jest** - Testing framework
- **ts-jest** - TypeScript Jest integration
- **supertest** - HTTP testing
- **ESLint** - Code linting

---

## Design Patterns

### 1. Repository Pattern
**Purpose**: Abstracts data access logic

```typescript
// Interface (Domain)
interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  // ...
}

// Implementation (Infrastructure)
class UserRepositoryImpl implements UserRepository {
  constructor(private dataSource: UserDataSource) {}
  // Delegates to data source
}
```

### 2. Dependency Injection
**Purpose**: Loose coupling, easy testing

```typescript
class Container {
  private static instance: Container;

  private initializeServices(): void {
    // Data source
    const userDataSource = new DrizzleUserDataSource();

    // Repository
    const userRepository = new UserRepositoryImpl(userDataSource);

    // Service
    const userService = new UserServiceImpl(userRepository);

    // Controller
    const userController = new UserController(userService);
  }
}
```

### 3. Factory Pattern
**Purpose**: Route creation

```typescript
export const createUserRoutes = (userController: UserController): Router => {
  const router = Router();

  router.post('/', validateBody(createUserSchema), userController.createUser);
  router.get('/:id', validateParams(idParamSchema), userController.getUserById);
  // ...

  return router;
};
```

### 4. Adapter Pattern
**Purpose**: Database abstraction

```typescript
// UserDataSource adapts Drizzle ORM to domain needs
class DrizzleUserDataSource implements UserDataSource {
  async create(data: CreateUserData): Promise<User> {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  }
}
```

### 5. Singleton Pattern
**Purpose**: Single DI container instance

```typescript
class Container {
  private static instance: Container;

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
}
```

---

## Error Handling

### Error Class Hierarchy

```
Error (Native)
  │
  └── AppError (Base)
       │
       ├── NotFoundError (404)
       ├── BadRequestError (400)
       ├── ConflictError (409)
       ├── UnauthorizedError (401)
       ├── ForbiddenError (403)
       └── InternalServerError (500)
```

### Error Handling Flow

1. **Service Layer**: Throws domain-specific errors
   ```typescript
   throw new NotFoundError('User not found');
   ```

2. **Controller Layer**: Uses `asyncHandler` wrapper
   ```typescript
   createUser = asyncHandler(async (req, res) => {
     // If error thrown, asyncHandler catches and passes to error middleware
   });
   ```

3. **Error Middleware**: Converts to HTTP response
   ```typescript
   errorHandler(error, req, res, next) {
     const statusCode = error.statusCode || 500;
     res.status(statusCode).json({
       error: 'Application Error',
       message: error.message,
       statusCode
     });
   }
   ```

### HTTP Status Code Mapping

| Error Type | Status Code | Use Case |
|-----------|-------------|----------|
| `BadRequestError` | 400 | Invalid input, validation errors |
| `UnauthorizedError` | 401 | Authentication required |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Resource already exists |
| `InternalServerError` | 500 | Unexpected errors |

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### Drizzle Schema

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  age: integer('age').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| `GET` | `/health` | Health check | 200 |
| `GET` | `/api/v1/docs` | API documentation | 200 |
| `POST` | `/api/v1/users` | Create user | 201, 400, 409 |
| `GET` | `/api/v1/users` | Get all users | 200, 400 |
| `GET` | `/api/v1/users/:id` | Get user by ID | 200, 400, 404 |
| `PUT` | `/api/v1/users/:id` | Update user | 200, 400, 404, 409 |
| `DELETE` | `/api/v1/users/:id` | Delete user | 200, 400, 404 |

### Request/Response Examples

**Create User**
```bash
POST /api/v1/users
Content-Type: application/json

{
  "email": "john@example.com",
  "name": "John Doe",
  "age": 30
}

# Response (201)
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "name": "John Doe",
    "age": 30,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

**Get Users with Filters**
```bash
GET /api/v1/users?email=john&minAge=25&maxAge=35&limit=10&offset=0

# Response (200)
{
  "success": true,
  "data": [...],
  "message": "Users retrieved successfully",
  "count": 5
}
```

**Error Response**
```bash
GET /api/v1/users/invalid-uuid

# Response (400)
{
  "error": "Validation Error",
  "message": "Invalid path parameters",
  "details": [
    {
      "field": "id",
      "message": "Invalid user ID format"
    }
  ],
  "statusCode": 400
}
```

---

## Query Filters

### Available Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `email` | string | Filter by email (partial match) | `?email=john` |
| `name` | string | Filter by name (partial match) | `?name=doe` |
| `minAge` | number | Minimum age | `?minAge=25` |
| `maxAge` | number | Maximum age | `?maxAge=35` |
| `limit` | number | Results per page (1-100) | `?limit=10` |
| `offset` | number | Pagination offset | `?offset=20` |

---

## Testing Strategy

### Test Levels

1. **Unit Tests** (`tests/unit/`)
   - Service business logic
   - Validation schemas
   - Middleware functions
   - Repository logic

2. **Integration Tests** (`tests/integration/`)
   - Full request/response cycle
   - Database operations
   - API endpoint testing

### Test Coverage Areas

- ✅ Service layer business rules
- ✅ Validation (Zod schemas)
- ✅ Error handling middleware
- ✅ Repository operations
- ✅ API endpoints (success & error cases)

### Running Tests

```bash
# All tests
yarn test

# Unit tests only
yarn test:unit

# Integration tests only
yarn test:integration

# Watch mode
yarn test:watch

# Coverage report
yarn test:coverage
```

---

## Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crud_db"

# Server
PORT=3000
NODE_ENV=development

# JWT (optional)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

---

## Development Workflow

### Setup

```bash
# Install dependencies
yarn install

# Setup database
yarn db:push

# Start development server
yarn dev
```

### Available Scripts

```bash
yarn build          # Compile TypeScript
yarn start          # Start production server
yarn dev            # Start development server with hot reload
yarn db:generate    # Generate migration files
yarn db:migrate     # Run migrations
yarn db:push        # Push schema to database
yarn db:studio      # Open Drizzle Studio
yarn test           # Run all tests
yarn lint           # Run ESLint
yarn lint:fix       # Fix linting issues
```

---

## Best Practices Implemented

### 1. Clean Architecture
- ✅ Clear separation of concerns
- ✅ Domain layer is framework-agnostic
- ✅ Dependency inversion principle

### 2. SOLID Principles
- ✅ Single Responsibility (each class has one job)
- ✅ Open/Closed (extensible without modification)
- ✅ Liskov Substitution (interfaces are interchangeable)
- ✅ Interface Segregation (small, focused interfaces)
- ✅ Dependency Inversion (depend on abstractions)

### 3. Type Safety
- ✅ TypeScript strict mode
- ✅ Runtime validation with Zod
- ✅ Type-safe database queries with Drizzle

### 4. Error Handling
- ✅ Custom error classes with HTTP status codes
- ✅ Centralized error middleware
- ✅ Proper error responses

### 5. Security
- ✅ Helmet for security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention (ORM)

### 6. Code Quality
- ✅ ESLint configuration
- ✅ Consistent naming conventions
- ✅ Comprehensive testing
- ✅ Documentation

---

## Future Enhancements

- [ ] Authentication & Authorization (JWT)
- [ ] Rate limiting
- [ ] API versioning
- [ ] Caching layer (Redis)
- [ ] Logging (Winston/Pino)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database migrations versioning
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Performance monitoring
- [ ] Audit logging

---

## Contributing

When contributing to this project, please maintain the architecture principles:

1. **Domain changes**: Update entities and interfaces in `domain/`
2. **Business logic**: Add to service implementations in `application/`
3. **External concerns**: Modify infrastructure layer in `infrastructure/`
4. **Tests**: Add corresponding tests for all changes
5. **Documentation**: Update this document for architectural changes

---

## License

MIT

---

## Contact & Support

For questions or issues, please refer to the project repository.
