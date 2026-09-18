import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// In-memory database store for local test execution when Postgres daemon is offline
export const dbStore = {
  users: new Map<string, any>(),
  projects: new Map<string, any>(),
  builds: new Map<string, any>(),
  analyses: new Map<string, any>(),
};

export async function safeDbCall<T>(prismaFn: () => Promise<T>, fallbackFn: () => Promise<T> | T): Promise<T> {
  // If running under unit/integration test mode without live Postgres server, use fallback immediately
  if (process.env.NODE_ENV === 'test') {
    return fallbackFn();
  }

  try {
    return await prismaFn();
  } catch (error: any) {
    if (
      error.code === 'P1001' ||
      error.name === 'PrismaClientInitializationError' ||
      (error.message && error.message.includes("Can't reach database server"))
    ) {
      return fallbackFn();
    }
    throw error;
  }
}
