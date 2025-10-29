export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  age: number;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  age?: number;
}

export interface UserFilters {
  email?: string;
  name?: string;
  minAge?: number;
  maxAge?: number;
  limit?: number;
  offset?: number;
} 