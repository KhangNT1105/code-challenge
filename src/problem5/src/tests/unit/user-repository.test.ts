import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl';
import { CreateUserData, UpdateUserData, User, UserFilters } from '../../domain/entities/User';

// Mock the database connection
jest.mock('../../infrastructure/database/connection', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the schema
jest.mock('../../infrastructure/database/schema', () => ({
  users: {
    id: { primaryKey: jest.fn() },
    email: { notNull: jest.fn() },
    name: { notNull: jest.fn() },
    age: { notNull: jest.fn() },
    createdAt: { defaultNow: jest.fn() },
    updatedAt: { defaultNow: jest.fn() },
  },
}));

describe('UserRepository', () => {
  let userRepository: UserRepositoryImpl;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = new UserRepositoryImpl();
    
    // Get the mocked db instance
    const { db } = require('../../infrastructure/database/connection');
    mockDb = db;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    age: 25,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockDbUser = {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    age: mockUser.age,
    created_at: mockUser.createdAt,
    updated_at: mockUser.updatedAt,
  };

  describe('create', () => {
    const createData: CreateUserData = {
      email: 'test@example.com',
      name: 'Test User',
      age: 25,
    };

    it('should create a user successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockDbUser]),
        }),
      });

      mockDb.insert.mockReturnValue(mockInsert);

      const result = await userRepository.create(createData);

      expect(result).toEqual(mockUser);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith({
        email: createData.email,
        name: createData.name,
        age: createData.age,
      });
    });

    it('should handle database errors', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      mockDb.insert.mockReturnValue(mockInsert);

      await expect(userRepository.create(createData)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return user from cache if available', async () => {
      // First, populate the cache
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockDbUser]),
        }),
      });
      mockDb.insert.mockReturnValue(mockInsert);
      await userRepository.create({ email: 'test@example.com', name: 'Test', age: 25 });

      // Clear the mock to ensure we're not hitting the database
      jest.clearAllMocks();

      const result = await userRepository.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockDb.select).not.toHaveBeenCalled(); // Should not hit database
    });

    it('should fetch from database if not in cache', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockDbUser]),
        }),
      });

      mockDb.select.mockReturnValue(mockSelect);

      const result = await userRepository.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.select.mockReturnValue(mockSelect);

      const result = await userRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    const mockUsers = [mockDbUser];

    it('should return all users without filters', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      mockDb.select.mockReturnValue(mockSelect);

      const result = await userRepository.findAll();

      expect(result).toEqual([mockUser]);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      const filters: UserFilters = {
        email: 'test',
        minAge: 20,
        maxAge: 30,
        limit: 10,
        offset: 5,
      };

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue(mockUsers),
              }),
            }),
          }),
        }),
      });

      mockDb.select.mockReturnValue(mockSelect);

      const result = await userRepository.findAll(filters);

      expect(result).toEqual([mockUser]);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle empty result set', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.select.mockReturnValue(mockSelect);

      const result = await userRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const updateData: UpdateUserData = {
      name: 'Updated User',
      age: 26,
    };

    it('should update user successfully', async () => {
      const updatedDbUser = { ...mockDbUser, ...updateData, updated_at: new Date() };
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedDbUser]),
          }),
        }),
      });

      mockDb.update.mockReturnValue(mockUpdate);

      const result = await userRepository.update(mockUser.id, updateData);

      expect(result).toEqual({
        ...mockUser,
        ...updateData,
        updatedAt: updatedDbUser.updated_at,
      });
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockDb.update.mockReturnValue(mockUpdate);

      const result = await userRepository.update('non-existent-id', updateData);

      expect(result).toBeNull();
    });

    it('should handle empty update data', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockDbUser]),
          }),
        }),
      });

      mockDb.update.mockReturnValue(mockUpdate);

      const result = await userRepository.update(mockUser.id, {});

      expect(result).toEqual(mockUser);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockDbUser]),
        }),
      });

      mockDb.delete.mockReturnValue(mockDelete);

      const result = await userRepository.delete(mockUser.id);

      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should return false if user not found', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.delete.mockReturnValue(mockDelete);

      const result = await userRepository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('findByEmail', () => {
    it('should return user from cache if available', async () => {
      // First, populate the cache
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockDbUser]),
        }),
      });
      mockDb.insert.mockReturnValue(mockInsert);
      await userRepository.create({ email: 'test@example.com', name: 'Test', age: 25 });

      // Clear the mock to ensure we're not hitting the database
      jest.clearAllMocks();

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockDb.select).not.toHaveBeenCalled(); // Should not hit database
    });

    it('should fetch from database if not in cache', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockDbUser]),
        }),
      });

      mockDb.select.mockReturnValue(mockSelect);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.select.mockReturnValue(mockSelect);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('caching behavior', () => {
    it('should cache user after findById', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockDbUser]),
        }),
      });

      mockDb.select.mockReturnValue(mockSelect);

      // First call should hit database
      const result1 = await userRepository.findById(mockUser.id);
      expect(result1).toEqual(mockUser);

      // Clear mock to verify second call doesn't hit database
      jest.clearAllMocks();

      // Second call should use cache
      const result2 = await userRepository.findById(mockUser.id);
      expect(result2).toEqual(mockUser);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should update cache after user update', async () => {
      // First create a user to populate cache
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockDbUser]),
        }),
      });
      mockDb.insert.mockReturnValue(mockInsert);
      await userRepository.create({ email: 'test@example.com', name: 'Test', age: 25 });

      // Update the user
      const updatedDbUser = { ...mockDbUser, name: 'Updated User' };
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedDbUser]),
          }),
        }),
      });
      mockDb.update.mockReturnValue(mockUpdate);

      await userRepository.update(mockUser.id, { name: 'Updated User' });

      // Clear mocks and verify cache is updated
      jest.clearAllMocks();

      const result = await userRepository.findById(mockUser.id);
      expect(result?.name).toBe('Updated User');
      expect(mockDb.select).not.toHaveBeenCalled(); // Should use cache
    });

    it('should remove from cache after user deletion', async () => {
      // First create a user to populate cache
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockDbUser]),
        }),
      });
      mockDb.insert.mockReturnValue(mockInsert);
      await userRepository.create({ email: 'test@example.com', name: 'Test', age: 25 });

      // Delete the user
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockDbUser]),
        }),
      });
      mockDb.delete.mockReturnValue(mockDelete);

      await userRepository.delete(mockUser.id);

      // Clear mocks and verify cache is cleared
      jest.clearAllMocks();

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });
      mockDb.select.mockReturnValue(mockSelect);

      const result = await userRepository.findById(mockUser.id);
      expect(result).toBeNull();
      expect(mockDb.select).toHaveBeenCalled(); // Should hit database
    });
  });
}); 