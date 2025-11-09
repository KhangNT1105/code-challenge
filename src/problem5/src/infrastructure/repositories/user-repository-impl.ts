import { UserRepository } from '../../domain/repositories/user-repository';
import { User, CreateUserData, UpdateUserData, UserFilters } from '../../domain/entities/user';
import { UserDataSource } from '../database/user-data-source';

export class UserRepositoryImpl implements UserRepository {
  constructor(private dataSource: UserDataSource) {}

  create(data: CreateUserData) { return this.dataSource.create(data); }
  findById(id: string) { return this.dataSource.findById(id); }
  findAll(filters?: UserFilters) { return this.dataSource.findAll(filters); }
  update(id: string, data: UpdateUserData) { return this.dataSource.update(id, data); }
  delete(id: string) { return this.dataSource.delete(id); }
  findByEmail(email: string) { return this.dataSource.findByEmail(email); }
} 