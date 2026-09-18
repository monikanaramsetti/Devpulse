import { Request, Response, NextFunction } from 'express';
import { prisma, safeDbCall, dbStore } from '../db/prisma';
import { BuildService } from '../services/build.service';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class WebhookController {
  static async handleGitHubWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body;

      const repositoryUrl = payload.repository?.html_url || payload.repositoryUrl || payload.repository;
      const commitHash = payload.head_commit?.id || payload.commitHash || payload.sha || '8f42a1b';
      const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : (payload.branch || 'main');
      const status = payload.status || (payload.conclusion === 'success' ? 'SUCCESS' : payload.conclusion === 'failure' ? 'FAILED' : 'FAILED');
      const logs = payload.logs || payload.buildLogs || `[${new Date().toISOString()}] GitHub Webhook event received for repository ${repositoryUrl}`;
      const duration = payload.duration || Math.floor(Math.random() * 45) + 15;

      if (!repositoryUrl) {
        throw new BadRequestError('Webhook missing repository information');
      }

      const project = await safeDbCall(
        async () => {
          return prisma.project.findFirst({
            where: {
              OR: [
                { repositoryUrl: repositoryUrl },
                { repositoryUrl: { contains: repositoryUrl } },
              ],
            },
          });
        },
        () => {
          return Array.from(dbStore.projects.values()).find(
            (p) => p.repositoryUrl === repositoryUrl || p.repositoryUrl.includes(repositoryUrl)
          );
        }
      );

      if (!project) {
        throw new NotFoundError(`No connected project found for repository '${repositoryUrl}'`);
      }

      const build = await BuildService.createBuild({
        projectId: project.id,
        commitHash: commitHash.slice(0, 7),
        branch,
        status,
        logs,
        duration,
      });

      console.log(`[GitHub Webhook] Processed build ${build.id} for project ${project.name} (Status: ${status})`);

      return res.status(200).json({
        message: 'GitHub webhook processed successfully',
        build,
      });
    } catch (error) {
      next(error);
    }
  }
}
