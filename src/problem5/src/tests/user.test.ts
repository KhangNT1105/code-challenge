import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserServiceImpl } from '../application/services/UserServiceImpl';
import { UserRepositoryImpl } from '../infrastructure/repositories/UserRepositoryImpl';
import { CreateUserData, UpdateUserData } from '../domain/entities/User';

// Mock the database connection for testing
jest.mock('../infrastructure/database/connection', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserServiceImpl;
  let userRepository: UserRepositoryImpl;

  beforeEach(() => {
    userRepository = new UserRepositoryImpl();
    userService = new UserServiceImpl(userRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData: CreateUserData = {
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
      };

      // Mock the repository response
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: userData.email,
        name: userData.name,
        age: userData.age,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(userRepository, 'create').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

      const result = await userService.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(userRepository.create).toHaveBeenCalledWith(userData);
    });

    it('should throw error if user with email already exists', async () => {
      const userData: CreateUserData = {
        email: 'existing@example.com',
        name: 'Test User',
        age: 25,
      };

      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: userData.email,
        name: 'Existing User',
        age: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(existingUser);

      await expect(userService.createUser(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('should throw error if age is invalid', async () => {
      const userData: CreateUserData = {
        email: 'test@example.com',
        name: 'Test User',
        age: -5,
      };

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

      await expect(userService.createUser(userData)).rejects.toThrow(
        'Age must be between 0 and 150'
      );
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

      const result = await userService.getUserById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      await expect(userService.getUserById('non-existent-id')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData: UpdateUserData = {
        name: 'Updated User',
        age: 26,
      };

      const updatedUser = {
        ...existingUser,
        ...updateData,
        updatedAt: new Date(),
      };

      jest.spyOn(userRepository, 'findById').mockResolvedValue(existingUser);
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userRepository, 'update').mockResolvedValue(updatedUser);

      const result = await userService.updateUser('123e4567-e89b-12d3-a456-426614174000', updateData);

      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated User',
      };

      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      await expect(userService.updateUser('non-existent-id', updateData)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(userRepository, 'findById').mockResolvedValue(existingUser);
      jest.spyOn(userRepository, 'delete').mockResolvedValue(true);

      await expect(userService.deleteUser('123e4567-e89b-12d3-a456-426614174000')).resolves.not.toThrow();
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      await expect(userService.deleteUser('non-existent-id')).rejects.toThrow(
        'User not found'
      );
    });
  });
}); 