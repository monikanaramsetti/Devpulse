import { prisma, safeDbCall, dbStore } from '../db/prisma';
import { NotFoundError } from '../utils/errors';
import { publishBuildEvent, CHANNELS } from '../redis/pubsub';

export interface CreateBuildDTO {
  projectId: string;
  commitHash: string;
  branch: string;
  status?: string;
  logs?: string;
  duration?: number;
}

export class BuildService {
  static async getBuildsForProject(projectId: string) {
    return safeDbCall(
      async () => {
        return prisma.build.findMany({
          where: { projectId },
          include: { analysis: true },
          orderBy: { createdAt: 'desc' },
        });
      },
      () => {
        return Array.from(dbStore.builds.values()).filter((b) => b.projectId === projectId);
      }
    );
  }

  static async getBuildById(buildId: string) {
    return safeDbCall(
      async () => {
        const build = await prisma.build.findUnique({
          where: { id: buildId },
          include: {
            project: true,
            analysis: true,
          },
        });

        if (!build) {
          throw new NotFoundError('Build not found');
        }

        return build;
      },
      () => {
        const build = dbStore.builds.get(buildId);
        if (!build) {
          throw new NotFoundError('Build not found');
        }
        const project = dbStore.projects.get(build.projectId);
        const analysis = dbStore.analyses.get(buildId);
        return {
          ...build,
          project,
          analysis,
        };
      }
    );
  }

  static async createBuild(dto: CreateBuildDTO) {
    return safeDbCall(
      async () => {
        const project = await prisma.project.findUnique({
          where: { id: dto.projectId },
        });

        if (!project) {
          throw new NotFoundError('Project not found');
        }

        const initialStatus = dto.status || 'RUNNING';
        const logs = dto.logs || `[${new Date().toISOString()}] Build initialized for commit ${dto.commitHash} on branch ${dto.branch}\n[${new Date().toISOString()}] Checkout repository ${project.repositoryUrl}...`;

        const build = await prisma.build.create({
          data: {
            projectId: dto.projectId,
            commitHash: dto.commitHash,
            branch: dto.branch,
            status: initialStatus,
            logs,
            duration: dto.duration || 0,
          },
          include: {
            project: true,
          },
        });

        await publishBuildEvent(CHANNELS.BUILD_CREATED, {
          buildId: build.id,
          projectId: build.projectId,
          projectName: project.name,
          status: build.status,
          commitHash: build.commitHash,
          branch: build.branch,
          duration: build.duration,
          createdAt: build.createdAt.toISOString(),
        });

        return build;
      },
      async () => {
        const project = dbStore.projects.get(dto.projectId);
        if (!project) {
          throw new NotFoundError('Project not found');
        }

        const id = Math.random().toString(36).substring(2, 11);
        const initialStatus = dto.status || 'RUNNING';
        const logs = dto.logs || `[${new Date().toISOString()}] Build initialized for commit ${dto.commitHash} on branch ${dto.branch}`;

        const build = {
          id,
          projectId: dto.projectId,
          commitHash: dto.commitHash,
          branch: dto.branch,
          status: initialStatus,
          logs,
          duration: dto.duration || 0,
          project,
          createdAt: new Date(),
        };

        dbStore.builds.set(id, build);

        await publishBuildEvent(CHANNELS.BUILD_CREATED, {
          buildId: build.id,
          projectId: build.projectId,
          projectName: project.name,
          status: build.status,
          commitHash: build.commitHash,
          branch: build.branch,
          duration: build.duration,
          createdAt: build.createdAt.toISOString(),
        });

        return build;
      }
    );
  }

  static async updateBuildStatus(buildId: string, status: string, logs?: string, duration?: number) {
    return safeDbCall(
      async () => {
        const existing = await prisma.build.findUnique({
          where: { id: buildId },
          include: { project: true },
        });

        if (!existing) {
          throw new NotFoundError('Build not found');
        }

        const updated = await prisma.build.update({
          where: { id: buildId },
          data: {
            status,
            ...(logs !== undefined && { logs }),
            ...(duration !== undefined && { duration }),
          },
          include: { project: true },
        });

        await publishBuildEvent(CHANNELS.BUILD_UPDATED, {
          buildId: updated.id,
          projectId: updated.projectId,
          projectName: updated.project.name,
          status: updated.status,
          commitHash: updated.commitHash,
          branch: updated.branch,
          duration: updated.duration,
          createdAt: updated.createdAt.toISOString(),
        });

        return updated;
      },
      async () => {
        const existing = dbStore.builds.get(buildId);
        if (!existing) {
          throw new NotFoundError('Build not found');
        }
        const updated = {
          ...existing,
          status,
          ...(logs !== undefined && { logs }),
          ...(duration !== undefined && { duration }),
        };
        dbStore.builds.set(buildId, updated);

        await publishBuildEvent(CHANNELS.BUILD_UPDATED, {
          buildId: updated.id,
          projectId: updated.projectId,
          projectName: updated.project?.name || 'Project',
          status: updated.status,
          commitHash: updated.commitHash,
          branch: updated.branch,
          duration: updated.duration,
          createdAt: updated.createdAt.toISOString ? updated.createdAt.toISOString() : new Date().toISOString(),
        });

        return updated;
      }
    );
  }

  static async getRecentBuilds(limit = 10) {
    return safeDbCall(
      async () => {
        return prisma.build.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { project: true },
        });
      },
      () => {
        return Array.from(dbStore.builds.values()).slice(0, limit);
      }
    );
  }
}
