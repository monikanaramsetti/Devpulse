import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { ForbiddenError } from '../utils/errors';

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User context not found'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access denied. Requires one of roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
}
