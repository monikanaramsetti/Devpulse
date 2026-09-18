import { Request, Response, NextFunction } from 'express';
import { AnalysisService } from '../services/analysis.service';

export class AnalysisController {
  static async analyzeBuild(req: Request, res: Response, next: NextFunction) {
    try {
      const buildId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const analysis = await AnalysisService.analyzeBuild(buildId);
      return res.status(200).json(analysis);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalysisByBuildId(req: Request, res: Response, next: NextFunction) {
    try {
      const buildId = Array.isArray(req.params.buildId) ? req.params.buildId[0] : req.params.buildId;
      const analysis = await AnalysisService.getAnalysisByBuildId(buildId);
      return res.status(200).json(analysis);
    } catch (error) {
      next(error);
    }
  }
}
