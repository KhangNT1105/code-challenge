import { User, CreateUserData, UpdateUserData, UserFilters } from '../entities/user';

export interface UserService {
  createUser(data: CreateUserData): Promise<User>;
  getUserById(id: string): Promise<User>;
  getAllUsers(filters?: UserFilters): Promise<User[]>;
  updateUser(id: string, data: UpdateUserData): Promise<User>;
  deleteUser(id: string): Promise<void>;
} 