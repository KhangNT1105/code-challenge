import { z } from 'zod';

// Create user validation schema
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  age: z.number().int().min(0, 'Age must be non-negative').max(150, 'Age too high'),
});

// Update user validation schema (all fields optional)
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(1, 'Name cannot be empty').max(255, 'Name too long').optional(),
  age: z.number().int().min(0, 'Age must be non-negative').max(150, 'Age too high').optional(),
});

// Query parameters validation schema
export const userFiltersSchema = z.object({
  email: z.string().optional(),
  name: z.string().optional(),
  minAge: z.coerce.number().int().min(0).optional(),
  maxAge: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ID parameter validation schema
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

// Response schemas
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  age: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const usersResponseSchema = z.array(userResponseSchema);

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

// Type exports
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type UserFiltersRequest = z.infer<typeof userFiltersSchema>;
export type IdParamRequest = z.infer<typeof idParamSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UsersResponse = z.infer<typeof usersResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>; 