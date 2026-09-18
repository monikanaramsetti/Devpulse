import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ProjectController } from '../controllers/project.controller';
import { BuildController } from '../controllers/build.controller';
import { AnalysisController } from '../controllers/analysis.controller';
import { WebhookController } from '../controllers/webhook.controller';
import { DevController } from '../controllers/dev.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Auth routes
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticate, AuthController.me);

// Project routes
router.get('/projects', authenticate, ProjectController.getProjects);
router.post('/projects', authenticate, ProjectController.createProject);
router.get('/projects/:id', authenticate, ProjectController.getProjectById);
router.delete('/projects/:id', authenticate, ProjectController.deleteProject);

// Build routes
router.get('/projects/:id/builds', authenticate, BuildController.getBuildsForProject);
router.post('/projects/:id/builds', authenticate, BuildController.createBuild);
router.get('/builds/recent', authenticate, BuildController.getRecentBuilds);
router.get('/builds/:id', authenticate, BuildController.getBuildById);

// AI Analysis routes
router.post('/builds/:id/analyze', authenticate, AnalysisController.analyzeBuild);
router.get('/analyses/:buildId', authenticate, AnalysisController.getAnalysisByBuildId);

// Webhook & Dev simulation routes
router.post('/webhooks/github', WebhookController.handleGitHubWebhook);
router.post('/dev/build-events', DevController.triggerBuildEvent);

export default router;
