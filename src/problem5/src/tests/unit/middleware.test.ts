import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { z } from 'zod';
import { 
  validateBody, 
  validateQuery, 
  validateParams,
  validateRequest 
} from '../../infrastructure/middleware/validation-middleware';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
} from '../../infrastructure/middleware/error-middleware';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
  });

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('validateBody', () => {
    it('should pass valid data to next middleware', async () => {
      mockRequest.body = { name: 'Test', age: 25 };

      await validateBody(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({ name: 'Test', age: 25 });
    });

    it('should return 400 for invalid data', async () => {
      mockRequest.body = { name: '', age: -5 };

      await validateBody(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'age',
            message: expect.any(String),
          }),
        ]),
        statusCode: 400,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle ZodError properly', async () => {
      const zodError = new ZodError([
        { code: 'invalid_type', path: ['name'], message: 'Required', expected: 'string', received: 'undefined' },
      ]);

      jest.spyOn(testSchema, 'parseAsync').mockRejectedValue(zodError);

      await validateBody(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Required',
          }),
        ]),
        statusCode: 400,
      });
    });
  });

  describe('validateQuery', () => {
    it('should pass valid query parameters to next middleware', async () => {
      mockRequest.query = { name: 'Test', age: '25' };

      await validateQuery(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 400 for invalid query parameters', async () => {
      mockRequest.query = { name: '', age: '-5' };

      await validateQuery(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: expect.any(Array),
        statusCode: 400,
      });
    });
  });

  describe('validateParams', () => {
    it('should pass valid parameters to next middleware', async () => {
      mockRequest.params = { name: 'Test', age: '25' };

      await validateParams(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 400 for invalid parameters', async () => {
      mockRequest.params = { name: '', age: '-5' };

      await validateParams(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Invalid path parameters',
        details: expect.any(Array),
        statusCode: 400,
      });
    });
  });

  describe('validateRequest', () => {
    const fullSchema = z.object({
      body: testSchema,
      query: z.object({ filter: z.string().optional() }),
      params: z.object({ id: z.string() }),
    });

    it('should pass valid request data to next middleware', async () => {
      mockRequest.body = { name: 'Test', age: 25 };
      mockRequest.query = { filter: 'active' };
      mockRequest.params = { id: '123' };

      await validateRequest(fullSchema)(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 400 for invalid request data', async () => {
      mockRequest.body = { name: '', age: -5 };
      mockRequest.query = {};
      mockRequest.params = {};

      await validateRequest(fullSchema)(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: expect.any(Array),
        statusCode: 400,
      });
    });
  });
});

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/test',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle AppError with status code', () => {
      const appError: AppError = new Error('Custom error') as AppError;
      appError.statusCode = 404;
      appError.isOperational = true;

      errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Application Error',
        message: 'Custom error',
        statusCode: 404,
      });
    });

    it('should handle generic errors with 500 status', () => {
      const error = new Error('Internal server error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Internal server error',
        statusCode: 500,
      });
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Test error',
        statusCode: 500,
        stack: expect.any(String),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Test error',
        statusCode: 500,
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 error response', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Route GET /test not found',
        statusCode: 404,
      });
    });
  });

  describe('asyncHandler', () => {
    it('should call the handler function and pass through to next', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(handler).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch errors and pass them to next', async () => {
      const error = new Error('Handler error');
      const handler = jest.fn().mockRejectedValue(error);

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(handler).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous errors', async () => {
      const error = new Error('Sync error');
      const handler = jest.fn().mockImplementation(() => {
        throw error;
      });

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(handler).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
}); 