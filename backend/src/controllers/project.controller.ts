import { Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';

export class ProjectController {
  static async getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;
      const projects = await ProjectService.getProjects(userId, role);
      return res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  }

  static async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, repositoryUrl } = req.body;
      const userId = req.user!.id;

      if (!name || !repositoryUrl) {
        throw new BadRequestError('Project name and repositoryUrl are required');
      }

      const project = await ProjectService.createProject({ name, repositoryUrl, userId });
      return res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = req.user!.id;
      const role = req.user!.role;

      const project = await ProjectService.getProjectById(id, userId, role);
      return res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = req.user!.id;
      const role = req.user!.role;

      await ProjectService.deleteProject(id, userId, role);
      return res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
