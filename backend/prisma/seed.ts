import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DevPulse database...');

  // Create default admin and demo user
  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@devpulse.io' },
    update: {},
    create: {
      name: 'Alex Developer',
      email: 'demo@devpulse.io',
      passwordHash,
      role: 'USER',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@devpulse.io' },
    update: {},
    create: {
      name: 'Sarah DevOps',
      email: 'admin@devpulse.io',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`👤 Users seeded: ${demoUser.email}, ${adminUser.email}`);

  // Create sample project
  const project1 = await prisma.project.create({
    data: {
      name: 'production-api',
      repositoryUrl: 'https://github.com/devpulse/production-api',
      userId: demoUser.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'frontend-dashboard',
      repositoryUrl: 'https://github.com/devpulse/frontend-dashboard',
      userId: demoUser.id,
    },
  });

  console.log(`📁 Projects seeded: ${project1.name}, ${project2.name}`);

  // Create sample builds
  const buildPassed = await prisma.build.create({
    data: {
      projectId: project1.id,
      commitHash: '7c9a21b',
      branch: 'main',
      status: 'SUCCESS',
      logs: `[12:40:01] Starting CI pipeline for commit 7c9a21b...
[12:40:03] git checkout refs/heads/main
[12:40:08] npm ci --prefer-offline
[12:40:15] npm run test
[12:40:22] PASS src/auth.test.ts
[12:40:25] PASS src/api.test.ts
[12:40:25] Test Suites: 2 passed, 2 total
[12:40:28] npm run build
[12:40:35] ✓ Build complete. Output saved to dist/
[12:40:35] Pipeline completed with exit code 0.`,
      duration: 34,
    },
  });

  const buildFailed = await prisma.build.create({
    data: {
      projectId: project1.id,
      commitHash: '8f42a1c',
      branch: 'main',
      status: 'FAILED',
      logs: `[12:41:02] Checking out commit 8f42a1c on branch main
[12:41:04] Installing dependencies...
[12:41:18] Running test suite...
[12:41:21] test/auth.test.ts ✓ (1.2s)
[12:41:23] test/database.test.ts ✗
[12:41:23] Error: Environment variable DATABASE_URL is not defined!
[12:41:23]     at connectToDatabase (src/config/database.ts:14:11)
[12:41:23]     at Object.<anonymous> (test/database.test.ts:5:18)
[12:41:23] 💥 Process exited with error code 1.
[12:41:23] Build failed.`,
      duration: 21,
    },
  });

  // Create sample AI Analysis for the failed build
  await prisma.analysis.create({
    data: {
      buildId: buildFailed.id,
      rootCause: 'Missing required environment variable DATABASE_URL',
      explanation: 'The test suite failed during database connection initialization because DATABASE_URL is missing in the CI execution context.',
      affectedArea: 'server/config/database.ts & test/database.test.ts',
      suggestedFix: 'Add DATABASE_URL to your GitHub Actions secrets or repository environment variables configuration.',
      confidence: 'High',
      limitations: 'Analysis is based solely on the provided terminal log stack trace output.',
    },
  });

  console.log(`🔨 Builds & AI analysis seeded.`);
  console.log('✅ Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
