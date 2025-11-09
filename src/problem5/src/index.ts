import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Container } from './infrastructure/di/container';
import { createUserRoutes } from './infrastructure/routes/user-routes';
import { errorHandler, notFoundHandler } from './infrastructure/middleware/error-middleware';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
const container = Container.getInstance();
const userController = container.getUserController();

app.use('/api/v1/users', createUserRoutes(userController));

// API documentation endpoint
app.get('/api/v1/docs', (req, res) => {
  res.json({
    message: 'CRUD API Documentation',
    version: '1.0.0',
    endpoints: {
      users: {
        'POST /api/v1/users': 'Create a new user',
        'GET /api/v1/users': 'Get all users with optional filters',
        'GET /api/v1/users/:id': 'Get user by ID',
        'PUT /api/v1/users/:id': 'Update user by ID',
        'DELETE /api/v1/users/:id': 'Delete user by ID',
      },
    },
    filters: {
      email: 'Filter by email (partial match)',
      name: 'Filter by name (partial match)',
      minAge: 'Filter by minimum age',
      maxAge: 'Filter by maximum age',
      limit: 'Limit number of results (1-100)',
      offset: 'Offset for pagination',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/v1/docs`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app; 