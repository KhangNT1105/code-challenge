import { describe, it, expect } from '@jest/globals';
import { 
  createUserSchema, 
  updateUserSchema, 
  userFiltersSchema, 
  idParamSchema,
  userResponseSchema,
  usersResponseSchema,
  errorResponseSchema
} from '../../infrastructure/validation/user-validation';

describe('Validation Schemas', () => {
  describe('createUserSchema', () => {
    it('should validate valid user data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'Test User',
        age: 25,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format');
      }
    });

    it('should reject empty name', () => {
      const invalidData = {
        email: 'test@example.com',
        name: '',
        age: 25,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    it('should reject name too long', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'a'.repeat(256),
        age: 25,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name too long');
      }
    });

    it('should reject negative age', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        age: -5,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Age must be non-negative');
      }
    });

    it('should reject age too high', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        age: 200,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Age too high');
      }
    });

    it('should reject non-integer age', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        age: 25.5,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Expected integer, received float');
      }
    });
  });

  describe('updateUserSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        email: 'updated@example.com',
        name: 'Updated User',
        age: 30,
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate partial update data', () => {
      const partialData = {
        name: 'Updated User',
      };

      const result = updateUserSchema.safeParse(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(partialData);
      }
    });

    it('should validate empty object', () => {
      const emptyData = {};

      const result = updateUserSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(emptyData);
      }
    });

    it('should reject invalid email in update', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'Updated User',
      };

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format');
      }
    });

    it('should reject empty name in update', () => {
      const invalidData = {
        name: '',
        age: 30,
      };

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name cannot be empty');
      }
    });
  });

  describe('userFiltersSchema', () => {
    it('should validate valid filters', () => {
      const validFilters = {
        email: 'test',
        name: 'user',
        minAge: 20,
        maxAge: 30,
        limit: 10,
        offset: 5,
      };

      const result = userFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validFilters);
      }
    });

    it('should validate empty filters', () => {
      const emptyFilters = {};

      const result = userFiltersSchema.safeParse(emptyFilters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(emptyFilters);
      }
    });

    it('should coerce string numbers to integers', () => {
      const filtersWithStrings = {
        minAge: '20',
        maxAge: '30',
        limit: '10',
        offset: '5',
      };

      const result = userFiltersSchema.safeParse(filtersWithStrings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          minAge: 20,
          maxAge: 30,
          limit: 10,
          offset: 5,
        });
      }
    });

    it('should reject negative minAge', () => {
      const invalidFilters = {
        minAge: -5,
      };

      const result = userFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Number must be greater than or equal to 0');
      }
    });

    it('should reject limit too high', () => {
      const invalidFilters = {
        limit: 150,
      };

      const result = userFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Number must be less than or equal to 100');
      }
    });
  });

  describe('idParamSchema', () => {
    it('should validate valid UUID', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';

      const result = idParamSchema.safeParse({ id: validId });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validId);
      }
    });

    it('should reject invalid UUID format', () => {
      const invalidId = 'invalid-uuid';

      const result = idParamSchema.safeParse({ id: invalidId });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid user ID format');
      }
    });

    it('should reject empty string', () => {
      const emptyId = '';

      const result = idParamSchema.safeParse({ id: emptyId });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid user ID format');
      }
    });
  });

  describe('userResponseSchema', () => {
    it('should validate valid user response', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      const result = userResponseSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUser);
      }
    });

    it('should reject user with missing required fields', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        // missing name and age
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = userResponseSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('usersResponseSchema', () => {
    it('should validate array of users', () => {
      const validUsers = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test1@example.com',
          name: 'Test User 1',
          age: 25,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'test2@example.com',
          name: 'Test User 2',
          age: 30,
          createdAt: new Date('2024-01-02T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
      ];

      const result = usersResponseSchema.safeParse(validUsers);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUsers);
      }
    });

    it('should validate empty array', () => {
      const emptyArray: any[] = [];

      const result = usersResponseSchema.safeParse(emptyArray);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(emptyArray);
      }
    });
  });

  describe('errorResponseSchema', () => {
    it('should validate valid error response', () => {
      const validError = {
        error: 'Validation Error',
        message: 'Invalid request data',
        statusCode: 400,
      };

      const result = errorResponseSchema.safeParse(validError);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validError);
      }
    });

    it('should reject error with missing fields', () => {
      const invalidError = {
        error: 'Validation Error',
        // missing message and statusCode
      };

      const result = errorResponseSchema.safeParse(invalidError);
      expect(result.success).toBe(false);
    });
  });
}); 