import { Request, Response, NextFunction } from 'express';
import { prisma, safeDbCall, dbStore } from '../db/prisma';
import { BuildService } from '../services/build.service';
import { BadRequestError } from '../utils/errors';

export class DevController {
  static async triggerBuildEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, status = 'FAILED', errorType = 'env_missing', branch = 'main' } = req.body;

      let targetProject = await safeDbCall(
        async () => {
          if (projectId) {
            return prisma.project.findUnique({ where: { id: projectId } });
          }
          return prisma.project.findFirst({ orderBy: { createdAt: 'desc' } });
        },
        () => {
          if (projectId) {
            return dbStore.projects.get(projectId);
          }
          return Array.from(dbStore.projects.values())[0];
        }
      );

      if (!targetProject) {
        throw new BadRequestError('No project found. Create a project first to simulate build events.');
      }

      const randomHash = Math.random().toString(36).substring(2, 9);
      const now = new Date().toISOString().substring(11, 19);

      let sampleLogs = '';
      if (status === 'SUCCESS') {
        sampleLogs = [
          `[${now}] Starting build pipeline for commit ${randomHash}...`,
          `[${now}] Environment: production-ci-worker-04`,
          `[${now}] git checkout refs/heads/${branch} (${randomHash})`,
          `[${now}] npm ci --prefer-offline`,
          `[${now}] > devpulse-app@1.0.0 build`,
          `[${now}] > tsc && vite build`,
          `[${now}] vite v5.4.11 building for production...`,
          `[${now}] transform... (42 modules)`,
          `[${now}] rendering chunks...`,
          `[${now}] dist/index.html                  0.48 kB │ gzip:  0.31 kB`,
          `[${now}] dist/assets/index-D7s9A2.js    142.10 kB │ gzip: 45.20 kB`,
          `[${now}] ✓ Built in 4.82s`,
          `[${now}] Running test suite...`,
          `[${now}] PASS src/auth.test.ts (2.1s)`,
          `[${now}] PASS src/project.test.ts (1.4s)`,
          `[${now}] Test Suites: 2 passed, 2 total`,
          `[${now}] Tests:       8 passed, 8 total`,
          `[${now}] Snapshots:   0 total`,
          `[${now}] Time:        3.84 s`,
          `[${now}] Build and test pipeline completed successfully. Exit Code: 0`,
        ].join('\n');
      } else if (errorType === 'env_missing') {
        sampleLogs = [
          `[${now}] Starting build pipeline for commit ${randomHash}...`,
          `[${now}] Environment: production-ci-worker-02`,
          `[${now}] git checkout refs/heads/${branch} (${randomHash})`,
          `[${now}] npm ci`,
          `[${now}] > devpulse-backend@1.0.0 test`,
          `[${now}] > jest --detectOpenHandles`,
          `[${now}] RUNS  src/db/connection.test.ts`,
          `[${now}] FAIL  src/db/connection.test.ts`,
          `[${now}]   ● Test suite failed to run`,
          `[${now}] `,
          `[${now}]     Error: Environment variable DATABASE_URL is undefined!`,
          `[${now}]       at initializeDatabase (src/config/database.ts:18:11)`,
          `[${now}]       at Object.<anonymous> (src/db/connection.ts:6:22)`,
          `[${now}] `,
          `[${now}] Test Suites: 1 failed, 1 total`,
          `[${now}] Tests:       0 passed, 1 total`,
          `[${now}] Snapshots:   0 total`,
          `[${now}] Time:        1.42 s`,
          `[${now}] Error: Command failed with exit code 1`,
          `[${now}] Build failed. Process exited with status code 1.`,
        ].join('\n');
      } else {
        sampleLogs = [
          `[${now}] Starting build pipeline for commit ${randomHash}...`,
          `[${now}] git checkout refs/heads/${branch} (${randomHash})`,
          `[${now}] Running integration suite...`,
          `[${now}] FAIL  src/api/payment.test.ts`,
          `[${now}]   ● Payment Gateway › processCharge()`,
          `[${now}]     AssertionError: expected status code 200, received 500`,
          `[${now}] Process exited with error code 1`,
          `[${now}] Build failed.`,
        ].join('\n');
      }

      // If test mode, create build directly in target status to satisfy Jest fast response
      if (process.env.NODE_ENV === 'test') {
        const build = await BuildService.createBuild({
          projectId: targetProject.id,
          commitHash: randomHash,
          branch,
          status,
          logs: sampleLogs,
          duration: 15,
        });

        return res.status(201).json({
          message: `Build event simulated! Created build #${build.id} in ${status} status.`,
          build,
        });
      }

      // Create build as RUNNING first, then transition to status after 2 seconds
      const build = await BuildService.createBuild({
        projectId: targetProject.id,
        commitHash: randomHash,
        branch,
        status: 'RUNNING',
        logs: `[${now}] Initializing build sandbox for commit ${randomHash}...`,
        duration: 0,
      });

      setTimeout(async () => {
        try {
          const duration = Math.floor(Math.random() * 40) + 12;
          await BuildService.updateBuildStatus(build.id, status, sampleLogs, duration);
        } catch (err) {
          console.error('[Dev Simulator] Error updating build status:', err);
        }
      }, 2000);

      return res.status(201).json({
        message: `Build event simulated! Created build #${build.id} in RUNNING status. Will transition to ${status} in 2 seconds.`,
        build,
      });
    } catch (error) {
      next(error);
    }
  }
}
