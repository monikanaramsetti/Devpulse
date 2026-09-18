import request from 'supertest';
import app from '../app';
import { disconnectRedis } from '../redis/pubsub';

afterAll(async () => {
  await disconnectRedis();
});

describe('DevPulse REST API Integration Suite', () => {
  let userToken: string;
  let projectId: string;
  let buildId: string;

  const testEmail = `test_${Date.now()}@devpulse.io`;

  describe('Authentication Endpoints', () => {
    it('POST /api/auth/register - Register new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Integration Tester',
          email: testEmail,
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      userToken = res.body.token;
    });

    it('POST /api/auth/login - Login user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('GET /api/auth/me - Protected route check', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testEmail);
    });

    it('GET /api/auth/me - Rejects request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Project & Build Endpoints', () => {
    it('POST /api/projects - Create project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'test-backend-api',
          repositoryUrl: 'https://github.com/devpulse/test-backend-api',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      projectId = res.body.id;
    });

    it('GET /api/projects - Get user projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('POST /api/dev/build-events - Trigger simulated build', async () => {
      const res = await request(app)
        .post('/api/dev/build-events')
        .send({
          projectId,
          status: 'FAILED',
          errorType: 'env_missing',
          branch: 'main',
        });

      expect(res.status).toBe(201);
      expect(res.body.build).toHaveProperty('id');
      buildId = res.body.build.id;
    });

    it('GET /api/builds/:id - Get build details', async () => {
      const res = await request(app)
        .get(`/api/builds/${buildId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(buildId);
    });

    it('POST /api/builds/:id/analyze - Trigger AI Build Analysis', async () => {
      // First update status to FAILED
      const res = await request(app)
        .post(`/api/builds/${buildId}/analyze`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rootCause');
      expect(res.body).toHaveProperty('suggestedFix');
    });
  });
});
