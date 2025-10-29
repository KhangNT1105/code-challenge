# CRUD Backend API

A robust ExpressJS backend server built with TypeScript, featuring clean architecture, Zod validation, Drizzle ORM, and PostgreSQL. The application implements lazy loading and write-through caching strategies for optimal performance.

## 🏗️ Architecture

This project follows **Clean Architecture** principles with the following layers:

- **Domain Layer**: Entities, repositories interfaces, and business rules
- **Application Layer**: Use cases and business logic
- **Infrastructure Layer**: Database, external services, and frameworks
- **Presentation Layer**: Controllers, routes, and HTTP handling

## 🚀 Features

- ✅ **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- ✅ **TypeScript**: Full type safety throughout the application
- ✅ **Zod Validation**: Request/response validation with detailed error messages
- ✅ **Drizzle ORM**: Type-safe database operations with PostgreSQL
- ✅ **Clean Architecture**: Separation of concerns and dependency inversion
- ✅ **Caching Strategy**: Lazy loading + Write-through caching for performance
- ✅ **Error Handling**: Comprehensive error handling with proper HTTP status codes
- ✅ **Security**: Helmet.js for security headers, CORS configuration
- ✅ **Logging**: Morgan for HTTP request logging
- ✅ **Environment Configuration**: Environment-based configuration management

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd code-challenge/src/problem5
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your database configuration:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/crud_db
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE crud_db;
   ```

5. **Generate and run database migrations**
   ```bash
   npm run db:generate
   npm run db:push
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Database Operations
```bash
# Generate migrations
npm run db:generate

# Push schema changes to database
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Endpoints

#### 1. Create User
```http
POST /users
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "name": "John Doe",
  "age": 30
}
```

#### 2. Get All Users
```http
GET /users?email=john&minAge=25&limit=10&offset=0
```

**Query Parameters:**
- `email`: Filter by email (partial match)
- `name`: Filter by name (partial match)
- `minAge`: Minimum age filter
- `maxAge`: Maximum age filter
- `limit`: Number of results (1-100, default: 50)
- `offset`: Pagination offset (default: 0)

#### 3. Get User by ID
```http
GET /users/{id}
```

#### 4. Update User
```http
PUT /users/{id}
Content-Type: application/json

{
  "name": "John Smith",
  "age": 31
}
```

#### 5. Delete User
```http
DELETE /users/{id}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "age": 30,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

**Error Response:**
```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "statusCode": 400
}
```

## 🏗️ Project Structure

```
src/
├── domain/                    # Domain layer
│   ├── entities/             # Business entities
│   ├── repositories/         # Repository interfaces
│   └── services/             # Service interfaces
├── application/              # Application layer
│   └── services/             # Business logic implementation
├── infrastructure/           # Infrastructure layer
│   ├── database/             # Database configuration and schema
│   ├── repositories/         # Repository implementations
│   ├── controllers/          # HTTP controllers
│   ├── routes/               # Express routes
│   ├── middleware/           # Express middleware
│   ├── validation/           # Zod validation schemas
│   └── di/                   # Dependency injection container
└── index.ts                  # Application entry point
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |

### Database Configuration

The application uses Drizzle ORM with PostgreSQL. Key features:

- **Type-safe queries**: All database operations are type-safe
- **Migration management**: Automatic schema generation and migration
- **Connection pooling**: Optimized database connections
- **Caching**: In-memory cache with write-through strategy

## 🧪 Testing

The project includes comprehensive unit and integration tests with high coverage requirements.

### Test Structure
```
src/tests/
├── unit/                    # Unit tests for individual components
│   ├── UserService.test.ts  # Business logic tests
│   ├── UserRepository.test.ts # Repository and caching tests
│   ├── validation.test.ts   # Zod schema validation tests
│   └── middleware.test.ts   # Middleware function tests
├── integration/             # Integration tests
│   └── userRoutes.test.ts   # HTTP API endpoint tests
└── setup.ts                 # Test configuration
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI environment
npm run test:ci

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Test Coverage

The project maintains a minimum coverage threshold of 80% for:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Test Types

#### Unit Tests
- **UserService**: Tests business logic, validation, and error handling
- **UserRepository**: Tests database operations and caching behavior
- **Validation**: Tests Zod schemas for request/response validation
- **Middleware**: Tests validation and error handling middleware

#### Integration Tests
- **User Routes**: Tests complete HTTP API endpoints with supertest
- **Error Handling**: Tests error responses and status codes
- **Validation**: Tests request validation at the API level

### Test Features

- **Mocking**: Comprehensive mocking of database and external dependencies
- **Caching Tests**: Verification of lazy loading and write-through caching
- **Error Scenarios**: Testing of all error conditions and edge cases
- **Validation**: Testing of input validation and error responses
- **Performance**: Testing of caching behavior and database optimization

### Example Test Output

```bash
$ npm run test:coverage

 PASS  src/tests/unit/UserService.test.ts
 PASS  src/tests/unit/UserRepository.test.ts
 PASS  src/tests/unit/validation.test.ts
 PASS  src/tests/unit/middleware.test.ts
 PASS  src/tests/integration/userRoutes.test.ts

Test Suites: 5 passed, 5 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        3.245 s

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   85.23 |    82.14 |   87.50 |   85.23 |                  
----------|---------|----------|---------|---------|-------------------
```

## 📊 Performance Features

### Caching Strategy

1. **Lazy Loading**: Data is loaded from cache first, then database if not found
2. **Write-Through**: Cache is updated immediately after database writes
3. **In-Memory Cache**: Fast access to frequently requested data

### Database Optimization

- Connection pooling for efficient database connections
- Indexed queries for fast data retrieval
- Pagination support for large datasets
- Efficient filtering and sorting

## 🔒 Security

- **Helmet.js**: Security headers protection
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **Rate Limiting**: Built-in request limiting (can be extended)

## 🚀 Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set up proper CORS origins
4. Configure logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository. 