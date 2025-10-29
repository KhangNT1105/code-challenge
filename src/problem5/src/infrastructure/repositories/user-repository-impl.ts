import { UserRepository } from '../../domain/repositories/UserRepository';
import { User, CreateUserData, UpdateUserData, UserFilters } from '../../domain/entities/User';
import { UserDataSource } from '../database/user_data_source';

export class UserRepositoryImpl implements UserRepository {
  constructor(private dataSource: UserDataSource) {}

  create(data: CreateUserData) { return this.dataSource.create(data); }
  findById(id: string) { return this.dataSource.findById(id); }
  findAll(filters?: UserFilters) { return this.dataSource.findAll(filters); }
  update(id: string, data: UpdateUserData) { return this.dataSource.update(id, data); }
  delete(id: string) { return this.dataSource.delete(id); }
  findByEmail(email: string) { return this.dataSource.findByEmail(email); }
} 