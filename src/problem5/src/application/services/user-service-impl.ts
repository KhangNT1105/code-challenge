import { UserService } from '../../domain/services/UserService';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { User, CreateUserData, UpdateUserData, UserFilters } from '../../domain/entities/User';

export class UserServiceImpl implements UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(data: CreateUserData): Promise<User> {
    // Business logic: Check if user with email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Business logic: Validate age
    if (data.age < 0 || data.age > 150) {
      throw new Error('Age must be between 0 and 150');
    }

    return await this.userRepository.create(data);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getAllUsers(filters?: UserFilters): Promise<User[]> {
    // Business logic: Set default pagination if not provided
    const defaultFilters: UserFilters = {
      limit: 50,
      offset: 0,
      ...filters,
    };

    // Business logic: Validate pagination limits
    if (defaultFilters.limit && (defaultFilters.limit < 1 || defaultFilters.limit > 100)) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (defaultFilters.offset && defaultFilters.offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    return await this.userRepository.findAll(defaultFilters);
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    // Business logic: Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Business logic: If email is being updated, check for uniqueness
    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(data.email);
      if (userWithEmail) {
        throw new Error('User with this email already exists');
      }
    }

    // Business logic: Validate age if being updated
    if (data.age !== undefined && (data.age < 0 || data.age > 150)) {
      throw new Error('Age must be between 0 and 150');
    }

    const updatedUser = await this.userRepository.update(id, data);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    // Business logic: Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete user');
    }
  }
} 