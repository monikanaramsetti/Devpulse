import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, safeDbCall, dbStore } from '../db/prisma';
import { config } from '../config';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

async function ensureSeedData() {
  if (dbStore.users.size === 0) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const demoId = 'user_demo_123';
    const adminId = 'user_admin_123';

    const demoUser = {
      id: demoId,
      name: 'Alex Developer',
      email: 'demo@devpulse.io',
      passwordHash,
      role: 'USER',
      createdAt: new Date(),
    };

    const adminUser = {
      id: adminId,
      name: 'Sarah DevOps',
      email: 'admin@devpulse.io',
      passwordHash,
      role: 'ADMIN',
      createdAt: new Date(),
    };

    dbStore.users.set(demoId, demoUser);
    dbStore.users.set(adminId, adminUser);

    // Seed sample projects
    const proj1Id = 'proj_prod_api_1';
    const proj2Id = 'proj_frontend_dash_2';

    const proj1 = {
      id: proj1Id,
      name: 'production-api',
      repositoryUrl: 'https://github.com/devpulse/production-api',
      userId: demoId,
      createdAt: new Date().toISOString(),
    };

    const proj2 = {
      id: proj2Id,
      name: 'frontend-dashboard',
      repositoryUrl: 'https://github.com/devpulse/frontend-dashboard',
      userId: demoId,
      createdAt: new Date().toISOString(),
    };

    dbStore.projects.set(proj1Id, proj1);
    dbStore.projects.set(proj2Id, proj2);

    // Seed sample builds
    const buildPassedId = 'build_7c9a21b';
    const buildFailedId = 'build_8f42a1c';

    const buildPassed = {
      id: buildPassedId,
      projectId: proj1Id,
      commitHash: '7c9a21b',
      branch: 'main',
      status: 'SUCCESS',
      logs: `[12:40:01] Starting CI pipeline for commit 7c9a21b...\n[12:40:03] git checkout refs/heads/main\n[12:40:08] npm ci --prefer-offline\n[12:40:15] npm run test\n[12:40:22] PASS src/auth.test.ts\n[12:40:25] PASS src/api.test.ts\n[12:40:25] Test Suites: 2 passed, 2 total\n[12:40:28] npm run build\n[12:40:35] ✓ Build complete. Output saved to dist/\n[12:40:35] Pipeline completed with exit code 0.`,
      duration: 34,
      project: proj1,
      createdAt: new Date(),
    };

    const buildFailed = {
      id: buildFailedId,
      projectId: proj1Id,
      commitHash: '8f42a1c',
      branch: 'main',
      status: 'FAILED',
      logs: `[12:41:02] Checking out commit 8f42a1c on branch main\n[12:41:04] Installing dependencies...\n[12:41:18] Running test suite...\n[12:41:21] test/auth.test.ts ✓ (1.2s)\n[12:41:23] test/database.test.ts ✗\n[12:41:23] Error: Environment variable DATABASE_URL is not defined!\n[12:41:23]     at connectToDatabase (src/config/database.ts:14:11)\n[12:41:23]     at Object.<anonymous> (test/database.test.ts:5:18)\n[12:41:23] 💥 Process exited with error code 1.\n[12:41:23] Build failed.`,
      duration: 21,
      project: proj1,
      createdAt: new Date(),
    };

    dbStore.builds.set(buildPassedId, buildPassed);
    dbStore.builds.set(buildFailedId, buildFailed);

    // Seed sample AI Analysis
    const analysisObj = {
      id: 'analysis_8f42a1c',
      buildId: buildFailedId,
      rootCause: 'Missing required environment variable DATABASE_URL',
      explanation: 'The test suite failed during database connection initialization because DATABASE_URL is missing in the CI execution context.',
      affectedArea: 'server/config/database.ts & test/database.test.ts',
      suggestedFix: 'Add DATABASE_URL to your GitHub Actions secrets or repository environment variables configuration.',
      confidence: 'High',
      limitations: 'Analysis is based solely on the provided terminal log stack trace output.',
      createdAt: new Date(),
    };

    dbStore.analyses.set(buildFailedId, analysisObj);
  }
}

export class AuthService {
  static async register(dto: RegisterDTO) {
    const emailLower = dto.email.toLowerCase();

    return safeDbCall(
      async () => {
        const existing = await prisma.user.findUnique({
          where: { email: emailLower },
        });

        if (existing) {
          throw new BadRequestError('User with this email already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dto.password, salt);
        const role = dto.role && ['ADMIN', 'USER'].includes(dto.role.toUpperCase()) ? dto.role.toUpperCase() : 'USER';

        const user = await prisma.user.create({
          data: {
            name: dto.name,
            email: emailLower,
            passwordHash,
            role,
          },
        });

        const token = this.generateToken(user.id, user.name, user.email, user.role);

        return {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
        };
      },
      async () => {
        await ensureSeedData();

        const existing = Array.from(dbStore.users.values()).find((u) => u.email === emailLower);
        if (existing) {
          throw new BadRequestError('User with this email already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dto.password, salt);
        const role = dto.role && ['ADMIN', 'USER'].includes(dto.role.toUpperCase()) ? dto.role.toUpperCase() : 'USER';

        const id = Math.random().toString(36).substring(2, 11);
        const user = {
          id,
          name: dto.name,
          email: emailLower,
          passwordHash,
          role,
          createdAt: new Date(),
        };

        dbStore.users.set(id, user);

        const token = this.generateToken(user.id, user.name, user.email, user.role);

        return {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
        };
      }
    );
  }

  static async login(dto: LoginDTO) {
    const emailLower = dto.email.toLowerCase();

    return safeDbCall(
      async () => {
        const user = await prisma.user.findUnique({
          where: { email: emailLower },
        });

        if (!user) {
          throw new UnauthorizedError('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
          throw new UnauthorizedError('Invalid email or password');
        }

        const token = this.generateToken(user.id, user.name, user.email, user.role);

        return {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
        };
      },
      async () => {
        await ensureSeedData();

        const user = Array.from(dbStore.users.values()).find((u) => u.email === emailLower);

        if (!user) {
          throw new UnauthorizedError('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
          throw new UnauthorizedError('Invalid email or password');
        }

        const token = this.generateToken(user.id, user.name, user.email, user.role);

        return {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
        };
      }
    );
  }

  static generateToken(id: string, name: string, email: string, role: string): string {
    return jwt.sign({ id, name, email, role }, config.jwtSecret, {
      expiresIn: '7d',
    });
  }
}
