import { Request, Response } from 'express';
import { UserService } from '../../domain/services/user-service';
import { CreateUserRequest, UpdateUserRequest, UserFiltersRequest, IdParamRequest } from '../validation/user-validation';
import { asyncHandler } from '../middleware/error-middleware';

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
    const filters = {
      ...(req.query.email && { email: req.query.email }),
      ...(req.query.name && { name: req.query.name }),
      ...(req.query.minAge !== undefined && { minAge: req.query.minAge }),
      ...(req.query.maxAge !== undefined && { maxAge: req.query.maxAge }),
      ...(req.query.limit !== undefined && { limit: req.query.limit }),
      ...(req.query.offset !== undefined && { offset: req.query.offset }),
    };
    const users = await this.userService.getAllUsers(filters);
    res.status(200).json({
      success: true,
      data: users,
      message: 'Users retrieved successfully',
      count: users.length,
    });
  });

  updateUser = asyncHandler(async (req: Request<IdParamRequest, {}, UpdateUserRequest>, res: Response) => {
    const updateData = {
      ...(req.body.email && { email: req.body.email }),
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.age !== undefined && { age: req.body.age }),
    };
    const user = await this.userService.updateUser(req.params.id, updateData);
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