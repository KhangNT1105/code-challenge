import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { createUserRoutes } from '../../infrastructure/routes/user-routes';
import { errorHandler, notFoundHandler } from '../../infrastructure/middleware/error-middleware';

// Mock the database connection
jest.mock('../../infrastructure/database/connection', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the UserRepository to control test data
jest.mock('../../infrastructure/repositories/UserRepositoryImpl');

describe('User Routes Integration Tests', () => {
  let app: express.Application;
  let mockUserRepository: any;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    age: 25,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock the container to return our test repository
    const mockContainer = {
      getUserController: jest.fn().mockReturnValue({
        createUser: jest.fn(),
        getUserById: jest.fn(),
        getAllUsers: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
      }),
    };

    jest.spyOn(Container, 'getInstance').mockReturnValue(mockContainer as any);

    // Set up routes
    const userController = mockContainer.getUserController();
    app.use('/api/v1/users', createUserRoutes(userController));

    // Set up error handling
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/users', () => {
    it('should create a user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        age: 30,
      };

      const mockController = Container.getInstance().getUserController();
      mockController.createUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
        message: 'User created successfully',
      });

      expect(mockController.createUser).toHaveBeenCalledWith(userData);
    });

    it('should return 400 for invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'Test User',
        age: 25,
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toBe('Invalid request body');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        email: 'test@example.com',
        // missing name and age
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should return 400 for invalid age', async () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        age: -5,
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should handle service errors', async () => {
      const userData = {
        email: 'existing@example.com',
        name: 'Test User',
        age: 25,
      };

      const mockController = Container.getInstance().getUserController();
      mockController.createUser.mockRejectedValue(new Error('User with this email already exists'));

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(500);

      expect(response.body.error).toBe('Application Error');
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  describe('GET /api/v1/users', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [mockUser];

      const mockController = Container.getInstance().getUserController();
      mockController.getAllUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/v1/users')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUsers,
        message: 'Users retrieved successfully',
        count: 1,
      });

      expect(mockController.getAllUsers).toHaveBeenCalledWith({});
    });

    it('should get users with filters', async () => {
      const mockUsers = [mockUser];
      const filters = {
        email: 'test',
        minAge: 20,
        limit: 10,
      };

      const mockController = Container.getInstance().getUserController();
      mockController.getAllUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/v1/users')
        .query(filters)
        .expect(200);

      expect(response.body.data).toEqual(mockUsers);
      expect(mockController.getAllUsers).toHaveBeenCalledWith({
        email: 'test',
        minAge: 20,
        limit: 10,
      });
    });

    it('should return 400 for invalid filter parameters', async () => {
      const invalidFilters = {
        minAge: 'invalid',
        limit: 150, // too high
      };

      const response = await request(app)
        .get('/api/v1/users')
        .query(invalidFilters)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by ID successfully', async () => {
      const mockController = Container.getInstance().getUserController();
      mockController.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get(`/api/v1/users/${mockUser.id}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
        message: 'User retrieved successfully',
      });

      expect(mockController.getUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-uuid')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toBe('Invalid path parameters');
    });

    it('should handle user not found', async () => {
      const mockController = Container.getInstance().getUserController();
      mockController.getUserById.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .get(`/api/v1/users/${mockUser.id}`)
        .expect(500);

      expect(response.body.error).toBe('Application Error');
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated User',
        age: 30,
      };

      const updatedUser = { ...mockUser, ...updateData };

      const mockController = Container.getInstance().getUserController();
      mockController.updateUser.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put(`/api/v1/users/${mockUser.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      });

      expect(mockController.updateUser).toHaveBeenCalledWith(mockUser.id, updateData);
    });

    it('should return 400 for invalid UUID', async () => {
      const updateData = { name: 'Updated User' };

      const response = await request(app)
        .put('/api/v1/users/invalid-uuid')
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        email: 'invalid-email',
        age: -5,
      };

      const response = await request(app)
        .put(`/api/v1/users/${mockUser.id}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should handle user not found', async () => {
      const updateData = { name: 'Updated User' };

      const mockController = Container.getInstance().getUserController();
      mockController.updateUser.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .put(`/api/v1/users/${mockUser.id}`)
        .send(updateData)
        .expect(500);

      expect(response.body.error).toBe('Application Error');
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user successfully', async () => {
      const mockController = Container.getInstance().getUserController();
      mockController.deleteUser.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/v1/users/${mockUser.id}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User deleted successfully',
      });

      expect(mockController.deleteUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .delete('/api/v1/users/invalid-uuid')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should handle user not found', async () => {
      const mockController = Container.getInstance().getUserController();
      mockController.deleteUser.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .delete(`/api/v1/users/${mockUser.id}`)
        .expect(500);

      expect(response.body.error).toBe('Application Error');
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('not found');
    });

    it('should handle unexpected errors', async () => {
      const mockController = Container.getInstance().getUserController();
      mockController.getAllUsers.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .get('/api/v1/users')
        .expect(500);

      expect(response.body.error).toBe('Application Error');
      expect(response.body.message).toBe('Unexpected error');
    });
  });
}); 