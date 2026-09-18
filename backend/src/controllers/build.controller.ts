import { Request, Response, NextFunction } from 'express';
import { BuildService } from '../services/build.service';
import { BadRequestError } from '../utils/errors';

export class BuildController {
  static async getBuildsForProject(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const builds = await BuildService.getBuildsForProject(projectId);
      return res.status(200).json(builds);
    } catch (error) {
      next(error);
    }
  }

  static async createBuild(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { commitHash, branch, status, logs, duration } = req.body;

      if (!commitHash || !branch) {
        throw new BadRequestError('commitHash and branch are required');
      }

      const build = await BuildService.createBuild({
        projectId,
        commitHash,
        branch,
        status,
        logs,
        duration,
      });

      return res.status(201).json(build);
    } catch (error) {
      next(error);
    }
  }

  static async getBuildById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const build = await BuildService.getBuildById(id);
      return res.status(200).json(build);
    } catch (error) {
      next(error);
    }
  }

  static async getRecentBuilds(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const builds = await BuildService.getRecentBuilds(limit);
      return res.status(200).json(builds);
    } catch (error) {
      next(error);
    }
  }
}
