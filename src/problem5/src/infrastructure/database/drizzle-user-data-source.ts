import { eq, and, gte, lte, ilike } from 'drizzle-orm';
import { db } from './connection';
import { users } from './schema';
import { UserDataSource } from './user-data-source';
import { User, CreateUserData, UpdateUserData, UserFilters } from '../../domain/entities/user';

export class DrizzleUserDataSource implements UserDataSource {
  async create(data: CreateUserData): Promise<User> {
    const result = await db.insert(users).values({
      email: data.email,
      name: data.name,
      age: data.age,
    }).returning();

    if (!result[0]) {
      throw new Error('Failed to create user');
    }

    return result[0];
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async findAll(filters?: UserFilters): Promise<User[]> {
    const conditions = [];

    if (filters?.email) {
      conditions.push(ilike(users.email, `%${filters.email}%`));
    }

    if (filters?.name) {
      conditions.push(ilike(users.name, `%${filters.name}%`));
    }

    if (filters?.minAge !== undefined) {
      conditions.push(gte(users.age, filters.minAge));
    }

    if (filters?.maxAge !== undefined) {
      conditions.push(lte(users.age, filters.maxAge));
    }

    let query = db.select().from(users);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const updateData: any = {};

    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.age !== undefined) updateData.age = data.age;

    updateData.updatedAt = new Date();

    const [user] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return user || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }
}
