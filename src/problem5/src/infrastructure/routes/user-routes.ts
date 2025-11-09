import { Router } from 'express';
import { UserController } from '../controllers/user-controller';
import { validateBody, validateQuery, validateParams } from '../middleware/validation-middleware';
import { createUserSchema, updateUserSchema, userFiltersSchema, idParamSchema } from '../validation/user-validation';

export const createUserRoutes = (userController: UserController): Router => {
  const router = Router();

  // Create a new user
  router.post(
    '/',
    validateBody(createUserSchema),
    userController.createUser
  );

  // Get all users with optional filters
  router.get(
    '/',
    validateQuery(userFiltersSchema),
    userController.getAllUsers
  );

  // Get user by ID
  router.get(
    '/:id',
    validateParams(idParamSchema),
    userController.getUserById
  );

  // Update user by ID
  router.put(
    '/:id',
    validateParams(idParamSchema),
    validateBody(updateUserSchema),
    userController.updateUser
  );

  // Delete user by ID
  router.delete(
    '/:id',
    validateParams(idParamSchema),
    userController.deleteUser
  );

  return router;
}; 