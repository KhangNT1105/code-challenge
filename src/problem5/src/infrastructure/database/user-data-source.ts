import { User, CreateUserData, UpdateUserData, UserFilters } from '../../domain/entities/user';

export interface UserDataSource {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findAll(filters?: UserFilters): Promise<User[]>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  findByEmail(email: string): Promise<User | null>;
} 