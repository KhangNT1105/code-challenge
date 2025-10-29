import { pgTable, uuid, varchar, integer, timestamp, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table schema
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  age: integer('age').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  name: z.string().min(1).max(255),
  age: z.number().int().min(0).max(150),
});

export const selectUserSchema = createSelectSchema(users);

export const updateUserSchema = insertUserSchema.partial();

export type User = z.infer<typeof selectUserSchema>;
export type CreateUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>; 