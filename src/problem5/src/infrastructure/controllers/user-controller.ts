import { Request, Response } from 'express';
import { UserService } from '../../domain/services/UserService';
import { CreateUserRequest, UpdateUserRequest, UserFiltersRequest, IdParamRequest } from '../validation/userValidation';
import { asyncHandler } from '../middleware/errorMiddleware';

export class UserController {
  constructor(private userService: UserService) {}

  createUser = asyncHandler(async (req: Request<{}, {}, CreateUserRequest>, res: Response) => {
    const user = await this.userService.createUser(req.body);
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  });

  getUserById = asyncHandler(async (req: Request<IdParamRequest>, res: Response) => {
    const user = await this.userService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
      message: 'User retrieved successfully',
    });
  });

  getAllUsers = asyncHandler(async (req: Request<{}, {}, {}, UserFiltersRequest>, res: Response) => {
    const users = await this.userService.getAllUsers(req.query);
    res.status(200).json({
      success: true,
      data: users,
      message: 'Users retrieved successfully',
      count: users.length,
    });
  });

  updateUser = asyncHandler(async (req: Request<IdParamRequest, {}, UpdateUserRequest>, res: Response) => {
    const user = await this.userService.updateUser(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  });

  deleteUser = asyncHandler(async (req: Request<IdParamRequest>, res: Response) => {
    await this.userService.deleteUser(req.params.id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  });
} 