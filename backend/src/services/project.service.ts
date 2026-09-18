import { prisma, safeDbCall, dbStore } from '../db/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export interface CreateProjectDTO {
  name: string;
  repositoryUrl: string;
  userId: string;
}

export class ProjectService {
  static async getProjects(userId: string, userRole: string) {
    return safeDbCall(
      async () => {
        if (userRole === 'ADMIN') {
          return prisma.project.findMany({
            include: {
              user: { select: { id: true, name: true, email: true } },
              builds: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
            orderBy: { createdAt: 'desc' },
          });
        }

        return prisma.project.findMany({
          where: { userId },
          include: {
            builds: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      },
      () => {
        const allProjects = Array.from(dbStore.projects.values());
        if (userRole === 'ADMIN') return allProjects;
        return allProjects.filter((p) => p.userId === userId);
      }
    );
  }

  static async createProject(dto: CreateProjectDTO) {
    return safeDbCall(
      async () => {
        return prisma.project.create({
          data: {
            name: dto.name,
            repositoryUrl: dto.repositoryUrl,
            userId: dto.userId,
          },
        });
      },
      () => {
        const id = Math.random().toString(36).substring(2, 11);
        const project = {
          id,
          name: dto.name,
          repositoryUrl: dto.repositoryUrl,
          userId: dto.userId,
          builds: [],
          createdAt: new Date(),
        };
        dbStore.projects.set(id, project);
        return project;
      }
    );
  }

  static async getProjectById(projectId: string, userId: string, userRole: string) {
    return safeDbCall(
      async () => {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            user: { select: { id: true, name: true, email: true } },
            builds: {
              orderBy: { createdAt: 'desc' },
              include: { analysis: true },
            },
          },
        });

        if (!project) {
          throw new NotFoundError('Project not found');
        }

        if (userRole !== 'ADMIN' && project.userId !== userId) {
          throw new ForbiddenError('You do not have permission to access this project');
        }

        return project;
      },
      () => {
        const project = dbStore.projects.get(projectId);
        if (!project) {
          throw new NotFoundError('Project not found');
        }
        if (userRole !== 'ADMIN' && project.userId !== userId) {
          throw new ForbiddenError('You do not have permission to access this project');
        }
        const projectBuilds = Array.from(dbStore.builds.values()).filter((b) => b.projectId === projectId);
        return {
          ...project,
          builds: projectBuilds,
        };
      }
    );
  }

  static async deleteProject(projectId: string, userId: string, userRole: string) {
    return safeDbCall(
      async () => {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        });

        if (!project) {
          throw new NotFoundError('Project not found');
        }

        if (userRole !== 'ADMIN' && project.userId !== userId) {
          throw new ForbiddenError('You do not have permission to delete this project');
        }

        return prisma.project.delete({
          where: { id: projectId },
        });
      },
      () => {
        const project = dbStore.projects.get(projectId);
        if (!project) {
          throw new NotFoundError('Project not found');
        }
        if (userRole !== 'ADMIN' && project.userId !== userId) {
          throw new ForbiddenError('You do not have permission to delete this project');
        }
        dbStore.projects.delete(projectId);
        return project;
      }
    );
  }
}
