import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        throw new BadRequestError('Name, email, and password are required');
      }

      const result = await AuthService.register({ name, email, password, role });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const result = await AuthService.login({ email, password });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return res.status(200).json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }
}
