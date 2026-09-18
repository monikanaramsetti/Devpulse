import { prisma, safeDbCall, dbStore } from '../db/prisma';
import { config } from '../config';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class AnalysisService {
  static async analyzeBuild(buildId: string) {
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

        if (build.status !== 'FAILED') {
          throw new BadRequestError('Only failed builds can be analyzed');
        }

        if (build.analysis) {
          return build.analysis;
        }

        const payload = {
          buildId: build.id,
          commitHash: build.commitHash,
          branch: build.branch,
          status: build.status,
          logs: build.logs,
          changedFiles: [],
        };

        console.log(`[AnalysisService] Sending build ${buildId} to Python AI service at ${config.aiServiceUrl}/analyze-build...`);

        let result;
        try {
          const response = await fetch(`${config.aiServiceUrl}/analyze-build`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`AI service responded with HTTP status ${response.status}`);
          }

          result = await response.json();
        } catch (error: any) {
          console.warn('[AnalysisService] AI Service call failed or timed out. Falling back to local diagnostic agent parser:', error.message);
          result = this.generateFallbackAnalysis(build.logs);
        }

        const analysis = await prisma.analysis.create({
          data: {
            buildId: build.id,
            rootCause: result.rootCause || 'Unknown build failure cause',
            explanation: result.explanation || 'Detailed error logs were analyzed by the engine.',
            affectedArea: result.affectedArea || 'Build pipeline configuration or target module',
            suggestedFix: result.suggestedFix || 'Inspect log stack traces and verify configuration variables.',
            confidence: result.confidence || 'Medium',
            limitations: result.limitations || 'Analysis based strictly on available build terminal log output.',
          },
        });

        return analysis;
      },
      async () => {
        const build = dbStore.builds.get(buildId);
        if (!build) {
          throw new NotFoundError('Build not found');
        }
        if (build.status !== 'FAILED') {
          throw new BadRequestError('Only failed builds can be analyzed');
        }
        const existingAnalysis = dbStore.analyses.get(buildId);
        if (existingAnalysis) return existingAnalysis;

        const result = this.generateFallbackAnalysis(build.logs);
        const id = Math.random().toString(36).substring(2, 11);
        const analysis = {
          id,
          buildId: build.id,
          rootCause: result.rootCause,
          explanation: result.explanation,
          affectedArea: result.affectedArea,
          suggestedFix: result.suggestedFix,
          confidence: result.confidence,
          limitations: result.limitations,
          createdAt: new Date(),
        };

        dbStore.analyses.set(buildId, analysis);
        return analysis;
      }
    );
  }

  static async getAnalysisByBuildId(buildId: string) {
    return safeDbCall(
      async () => {
        const analysis = await prisma.analysis.findUnique({
          where: { buildId },
        });

        if (!analysis) {
          throw new NotFoundError('No analysis found for this build');
        }

        return analysis;
      },
      () => {
        const analysis = dbStore.analyses.get(buildId);
        if (!analysis) {
          throw new NotFoundError('No analysis found for this build');
        }
        return analysis;
      }
    );
  }

  private static generateFallbackAnalysis(logs: string) {
    let rootCause = 'Build execution failed during CI process';
    let affectedArea = 'CI Workflow / Test Runner';
    let explanation = 'The build terminal output ended with exit code 1 or test failures.';
    let suggestedFix = 'Check test runner configuration and environment variables.';
    let confidence = 'Medium';
    let limitations = 'Fallback heuristic analysis engine triggered due to AI service connection status.';

    if (logs.includes('DATABASE_URL') || logs.includes('database')) {
      rootCause = 'Missing or invalid DATABASE_URL environment variable';
      affectedArea = 'server/config/database.ts or CI Environment Variables';
      explanation = 'The application attempted to establish a database connection, but DATABASE_URL was not set or could not be reached.';
      suggestedFix = 'Add DATABASE_URL to your GitHub Actions repository secrets or application runtime configuration.';
      confidence = 'High';
    } else if (logs.includes('Cannot find module') || logs.includes('ModuleNotFoundError')) {
      rootCause = 'Unresolved dependency or missing package import';
      affectedArea = 'package.json / requirements.txt';
      explanation = 'A module requested in source code was not installed prior to execution.';
      suggestedFix = 'Run npm install / pip install and update your lock file in source control.';
      confidence = 'High';
    } else if (logs.includes('SyntaxError') || logs.includes('unexpected token')) {
      rootCause = 'Code syntax error or TypeScript compilation error';
      affectedArea = 'Source files in repository';
      explanation = 'The compiler encountered invalid syntax while parsing JavaScript or TypeScript code.';
      suggestedFix = 'Run npm run lint locally to highlight syntax or type mismatches before pushing.';
      confidence = 'High';
    }

    return {
      rootCause,
      explanation,
      affectedArea,
      suggestedFix,
      confidence,
      limitations,
    };
  }
}
