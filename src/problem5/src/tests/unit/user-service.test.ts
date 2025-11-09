import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UserServiceImpl } from '../../application/services/user-service-impl';
import { UserRepository } from '../../domain/repositories/user-repository';
import { CreateUserData, UpdateUserData, User, UserFilters } from '../../domain/entities/user';

// Mock the UserRepository
const mockUserRepository: jest.Mocked<UserRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByEmail: jest.fn(),
};

describe('UserService', () => {
  let userService: UserServiceImpl;

  beforeEach(() => {
    userService = new UserServiceImpl(mockUserRepository);
    jest.clearAllMocks();
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

  describe('createUser', () => {
    const validUserData: CreateUserData = {
      email: 'test@example.com',
      name: 'Test User',
      age: 25,
    };

    it('should create a user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(validUserData);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validUserData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith(validUserData);
    });

    it('should throw error if user with email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(userService.createUser(validUserData)).rejects.toThrow(
        'User with this email already exists'
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validUserData.email);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if age is negative', async () => {
      const invalidUserData = { ...validUserData, age: -5 };
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.createUser(invalidUserData)).rejects.toThrow(
        'Age must be between 0 and 150'
      );

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if age is too high', async () => {
      const invalidUserData = { ...validUserData, age: 200 };
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.createUser(invalidUserData)).rejects.toThrow(
        'Age must be between 0 and 150'
      );

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if age is zero', async () => {
      const invalidUserData = { ...validUserData, age: 0 };
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.createUser(invalidUserData)).rejects.toThrow(
        'Age must be between 0 and 150'
      );

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById('non-existent-id')).rejects.toThrow(
        'User not found'
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('getAllUsers', () => {
    const mockUsers = [mockUser];

    it('should return all users with default filters', async () => {
      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
      });
    });

    it('should return users with custom filters', async () => {
      const filters: UserFilters = {
        email: 'test',
        minAge: 20,
        maxAge: 30,
        limit: 10,
        offset: 5,
      };

      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers(filters);

      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith({
        ...filters,
        limit: 10,
        offset: 5,
      });
    });

    it('should throw error if limit is too low', async () => {
      const filters: UserFilters = { limit: 0 };

      await expect(userService.getAllUsers(filters)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );

      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    });

    it('should throw error if limit is too high', async () => {
      const filters: UserFilters = { limit: 150 };

      await expect(userService.getAllUsers(filters)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );

      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    });

    it('should throw error if offset is negative', async () => {
      const filters: UserFilters = { offset: -5 };

      await expect(userService.getAllUsers(filters)).rejects.toThrow(
        'Offset must be non-negative'
      );

      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const updateData: UpdateUserData = {
      name: 'Updated User',
      age: 26,
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData, updatedAt: new Date() };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(mockUser.id, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, updateData);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.updateUser('non-existent-id', updateData)).rejects.toThrow(
        'User not found'
      );

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if email already exists for different user', async () => {
      const existingUser = { ...mockUser, id: 'different-id' };
      const updateDataWithEmail = { ...updateData, email: 'existing@example.com' };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(userService.updateUser(mockUser.id, updateDataWithEmail)).rejects.toThrow(
        'User with this email already exists'
      );

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should allow updating email to same email', async () => {
      const updateDataWithSameEmail = { ...updateData, email: mockUser.email };
      const updatedUser = { ...mockUser, ...updateDataWithSameEmail, updatedAt: new Date() };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser); // Same user
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(mockUser.id, updateDataWithSameEmail);

      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, updateDataWithSameEmail);
    });

    it('should throw error if age is invalid', async () => {
      const invalidUpdateData = { ...updateData, age: -5 };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(userService.updateUser(mockUser.id, invalidUpdateData)).rejects.toThrow(
        'Age must be between 0 and 150'
      );

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should handle empty update data', async () => {
      const emptyUpdateData: UpdateUserData = {};

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await userService.updateUser(mockUser.id, emptyUpdateData);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, emptyUpdateData);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(true);

      await expect(userService.deleteUser(mockUser.id)).resolves.not.toThrow();

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.deleteUser('non-existent-id')).rejects.toThrow(
        'User not found'
      );

      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error if delete operation fails', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(false);

      await expect(userService.deleteUser(mockUser.id)).rejects.toThrow(
        'Failed to delete user'
      );

      expect(mockUserRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });
  });
}); 