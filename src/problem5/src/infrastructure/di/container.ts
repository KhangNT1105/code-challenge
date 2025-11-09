import { UserRepository } from '../../domain/repositories/user-repository';
import { UserService } from '../../domain/services/user-service';
import { UserRepositoryImpl } from '../repositories/user-repository-impl';
import { UserServiceImpl } from '../../application/services/user-service-impl';
import { UserController } from '../controllers/user-controller';
import { UserDataSource } from '../database/user-data-source';
import { DrizzleUserDataSource } from '../database/drizzle-user-data-source';

export class Container {
  private static instance: Container;
  private services = new Map<string, any>();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private initializeServices(): void {
    // Data source layer (ORM abstraction)
    const userDataSource: UserDataSource = new DrizzleUserDataSource();
    this.services.set('UserDataSource', userDataSource);

    // Repository layer
    this.services.set('UserRepository', new UserRepositoryImpl(userDataSource));

    // Service layer
    const userRepository = this.get<UserRepository>('UserRepository');
    this.services.set('UserService', new UserServiceImpl(userRepository));

    // Controller layer
    const userService = this.get<UserService>('UserService');
    this.services.set('UserController', new UserController(userService));
  }

  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found in container`);
    }
    return service as T;
  }

  // Convenience methods for getting specific services
  getUserRepository(): UserRepository {
    return this.get<UserRepository>('UserRepository');
  }

  getUserService(): UserService {
    return this.get<UserService>('UserService');
  }

  getUserController(): UserController {
    return this.get<UserController>('UserController');
  }

  getUserDataSource(): UserDataSource {
    return this.get<UserDataSource>('UserDataSource');
  }
} 